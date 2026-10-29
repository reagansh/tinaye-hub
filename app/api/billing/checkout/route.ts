import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { createMicroSubscriptionSession, createDonationSession } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const body = await req.json();
    const { type, amountInDollars, donorName, message } = body;

    // 1. $1.00/Month Micro-Subscription
    if (type === 'MICRO_1USD') {
      if (!session || !session.userId) {
        return NextResponse.json(
          { error: 'Authentication required to subscribe to micro-tier.' },
          { status: 401 }
        );
      }

      const user = await db.user.findUnique({
        where: { id: session.userId },
      });

      if (!user) {
        return NextResponse.json({ error: 'User account not found.' }, { status: 404 });
      }

      const checkoutSession = await createMicroSubscriptionSession({
        userId: user.id,
        userEmail: user.email,
        stripeCustomerId: user.stripeCustomerId,
      });

      return NextResponse.json({ url: checkoutSession.url });
    }

    // 2. Pay-What-You-Want Community Donation
    if (type === 'DONATION') {
      const parsedAmount = parseFloat(amountInDollars);
      if (isNaN(parsedAmount) || parsedAmount < 1.0) {
        return NextResponse.json(
          { error: 'Donation amount must be at least $1.00 USD.' },
          { status: 400 }
        );
      }

      const checkoutSession = await createDonationSession({
        userId: session?.userId,
        userEmail: session?.email,
        amountInDollars: parsedAmount,
        donorName: donorName || (session?.firstName ? `${session.firstName} ${session.lastName}` : undefined),
        message,
      });

      return NextResponse.json({ url: checkoutSession.url });
    }

    return NextResponse.json(
      { error: 'Invalid checkout type specified. Must be MICRO_1USD or DONATION.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[API:Checkout:Error]', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to initiate checkout session.' },
      { status: 500 }
    );
  }
}
