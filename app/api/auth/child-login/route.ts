import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, verifyPin, generateToken, COOKIE_NAME } from '@/lib/auth';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Parent authentication required.' }, { status: 401 });
    }

    const { childId, pin } = await req.json();

    if (!childId) {
      return NextResponse.json({ error: 'childId is required.' }, { status: 400 });
    }

    // Verify child belongs to this authenticated parent
    const child = await db.childProfile.findFirst({
      where: {
        id: childId,
        parentId: session.userId,
      },
    });

    if (!child) {
      return NextResponse.json({ error: 'Child profile not found under this account.' }, { status: 404 });
    }

    // If child has a PIN configured, verify it
    if (child.pinHash) {
      if (!pin) {
        return NextResponse.json({ error: 'PIN_REQUIRED', message: 'A 4-digit PIN is required to access this profile.' }, { status: 403 });
      }
      const isPinValid = await verifyPin(pin, child.pinHash);
      if (!isPinValid) {
        return NextResponse.json({ error: 'INVALID_PIN', message: 'Incorrect PIN entered.' }, { status: 403 });
      }
    }

    // Issue child context token
    const token = generateToken({
      userId: session.userId,
      email: session.email,
      role: Role.CHILD,
      activeChildId: child.id,
      firstName: child.displayName,
    });

    const response = NextResponse.json({
      success: true,
      child: {
        id: child.id,
        displayName: child.displayName,
        gradeLevel: child.gradeLevel,
        avatarId: child.avatarId,
        currentStreak: child.currentStreak,
        totalXp: child.totalXp,
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error('[API:ChildLogin:Error]', error);
    return NextResponse.json({ error: 'Failed to switch child profile.' }, { status: 500 });
  }
}
