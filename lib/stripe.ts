import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-06-20',
  appInfo: {
    name: 'Tinaye-Hub',
    version: '1.0.0',
  },
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Creates a Stripe Checkout Session for the $1.00/month Micro-Subscription.
 * Enables accessible, low-friction monthly support for Zimbabwean families.
 */
export async function createMicroSubscriptionSession({
  userId,
  userEmail,
  stripeCustomerId,
}: {
  userId: string;
  userEmail: string;
  stripeCustomerId?: string | null;
}) {
  const lineItem = process.env.STRIPE_PRICE_ID_MICRO_1USD
    ? { price: process.env.STRIPE_PRICE_ID_MICRO_1USD, quantity: 1 }
    : {
        price_data: {
          currency: 'usd',
          unit_amount: 100, // $1.00 USD
          recurring: {
            interval: 'month' as const,
          },
          product_data: {
            name: 'Tinaye-Hub Family Access ($1/Month)',
            description: 'Full ZIMSEC Primary Shona curriculum, unlimited offline sync, and weekly parent analytics.',
          },
        },
        quantity: 1,
      };

  return stripe.checkout.sessions.create({
    customer: stripeCustomerId || undefined,
    customer_email: stripeCustomerId ? undefined : userEmail,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [lineItem],
    success_url: `${APP_URL}/parent/dashboard?session_id={CHECKOUT_SESSION_ID}&payment=success`,
    cancel_url: `${APP_URL}/parent/billing?payment=cancelled`,
    metadata: {
      userId,
      tier: 'MICRO_1USD',
      type: 'SUBSCRIPTION',
    },
    subscription_data: {
      metadata: {
        userId,
        tier: 'MICRO_1USD',
      },
    },
  });
}

/**
 * Creates a Pay-What-You-Want Donation Checkout Session.
 * Supports community sponsorship and scholarships for underprivileged students.
 */
export async function createDonationSession({
  userId,
  userEmail,
  amountInDollars,
  donorName,
  message,
}: {
  userId?: string;
  userEmail?: string;
  amountInDollars: number;
  donorName?: string;
  message?: string;
}) {
  const amountCents = Math.max(100, Math.round(amountInDollars * 100)); // Minimum $1.00

  return stripe.checkout.sessions.create({
    customer_email: userEmail || undefined,
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: amountCents,
          product_data: {
            name: `Tinaye-Hub Community Education Donation ($${(amountCents / 100).toFixed(2)})`,
            description: 'Voluntary contribution to subsidize open access, server costs, and offline learning in Zimbabwe.',
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${APP_URL}/donate/thank-you?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/donate?cancelled=true`,
    metadata: {
      userId: userId || 'ANONYMOUS',
      donorName: donorName || 'Anonymous Supporter',
      message: message || '',
      type: 'DONATION',
      amountCents: amountCents.toString(),
    },
  });
}
