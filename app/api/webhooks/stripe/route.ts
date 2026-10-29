import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import Stripe from 'stripe';
import { SubscriptionStatus, SubscriptionTier } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    console.error('[StripeWebhook:Error] Missing signature or webhook secret.');
    return NextResponse.json({ error: 'Webhook configuration error' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`[StripeWebhook:SignatureFailed] ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      // 1. Checkout completed (First time subscription checkout or one-time donation)
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};
        const userId = metadata.userId;

        if (metadata.type === 'DONATION') {
          // Record Pay-What-You-Want Donation
          await db.donation.create({
            data: {
              userId: userId !== 'ANONYMOUS' ? userId : null,
              stripePaymentIntentId: session.payment_intent as string,
              amountCents: session.amount_total || 100,
              currency: session.currency || 'usd',
              donorName: metadata.donorName,
              message: metadata.message,
            },
          });
          console.log(`[StripeWebhook] Recorded donation of $${((session.amount_total || 0) / 100).toFixed(2)}`);
        } else if (metadata.type === 'SUBSCRIPTION' && userId) {
          // Update Stripe customer ID on user
          if (session.customer) {
            await db.user.update({
              where: { id: userId },
              data: {
                stripeCustomerId: session.customer as string,
                subscriptionTier: SubscriptionTier.MICRO_1USD,
              },
            });
          }
          console.log(`[StripeWebhook] Activated Micro-Subscription for user ${userId}`);
        }
        break;
      }

      // 2. Subscription Created or Updated
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        const user = await db.user.findUnique({
          where: { stripeCustomerId: customerId },
        });

        if (user) {
          const statusMap: Record<string, SubscriptionStatus> = {
            active: SubscriptionStatus.ACTIVE,
            past_due: SubscriptionStatus.PAST_DUE,
            canceled: SubscriptionStatus.CANCELED,
            incomplete: SubscriptionStatus.INCOMPLETE,
            trialing: SubscriptionStatus.TRIALING,
          };

          const status = statusMap[sub.status] || SubscriptionStatus.ACTIVE;
          const currentPeriodStart = new Date(sub.current_period_start * 1000);
          const currentPeriodEnd = new Date(sub.current_period_end * 1000);

          await db.subscription.upsert({
            where: { stripeSubscriptionId: sub.id },
            create: {
              userId: user.id,
              stripeSubscriptionId: sub.id,
              stripePriceId: sub.items.data[0]?.price.id,
              status,
              tier: SubscriptionTier.MICRO_1USD,
              amountCents: sub.items.data[0]?.price.unit_amount || 100,
              currency: sub.currency,
              currentPeriodStart,
              currentPeriodEnd,
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            },
            update: {
              status,
              currentPeriodStart,
              currentPeriodEnd,
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            },
          });

          // Ensure user's active tier reflects subscription status
          const effectiveTier = status === SubscriptionStatus.ACTIVE ? SubscriptionTier.MICRO_1USD : SubscriptionTier.FREE;
          await db.user.update({
            where: { id: user.id },
            data: { subscriptionTier: effectiveTier },
          });

          console.log(`[StripeWebhook] Updated subscription ${sub.id} to status ${status} for user ${user.id}`);
        }
        break;
      }

      // 3. Subscription Deleted/Canceled
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        const user = await db.user.findUnique({
          where: { stripeCustomerId: customerId },
        });

        if (user) {
          await db.subscription.updateMany({
            where: { stripeSubscriptionId: sub.id },
            data: { status: SubscriptionStatus.CANCELED },
          });

          await db.user.update({
            where: { id: user.id },
            data: { subscriptionTier: SubscriptionTier.FREE },
          });

          console.log(`[StripeWebhook] Canceled subscription ${sub.id} for user ${user.id}`);
        }
        break;
      }

      // 4. Invoices
      case 'invoice.payment_succeeded': {
        console.log(`[StripeWebhook] Invoice payment succeeded: ${(event.data.object as any).id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        console.warn(`[StripeWebhook] Invoice payment failed for customer ${customerId}`);
        break;
      }

      default:
        console.log(`[StripeWebhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error(`[StripeWebhook:ExecutionError] ${err.message}`);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
