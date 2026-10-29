import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, hashPin, assertParent } from '@/lib/auth';

export async function GET(_req: NextRequest) {
  try {
    const session = await getSession();
    assertParent(session);

    const children = await db.childProfile.findMany({
      where: { parentId: session.userId },
      orderBy: { gradeLevel: 'asc' },
      include: {
        masteryRecords: {
          select: {
            masteryLevel: true,
            masteryScore: true,
            competency: { select: { code: true, nameShona: true } },
          },
        },
      },
    });

    return NextResponse.json({ children });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    assertParent(session);

    const body = await req.json();
    const { displayName, gradeLevel, avatarId = 'shumba', pin } = body;

    if (!displayName || !gradeLevel) {
      return NextResponse.json(
        { error: 'displayName and gradeLevel (1–7) are required.' },
        { status: 400 }
      );
    }

    const parsedGrade = parseInt(gradeLevel, 10);
    if (parsedGrade < 1 || parsedGrade > 7) {
      return NextResponse.json(
        { error: 'Grade level must be between 1 and 7 (ZIMSEC Primary).' },
        { status: 400 }
      );
    }

    let pinHash: string | null = null;
    if (pin && typeof pin === 'string' && pin.trim().length === 4) {
      pinHash = await hashPin(pin.trim());
    }

    const child = await db.childProfile.create({
      data: {
        parentId: session.userId,
        displayName: displayName.trim(),
        gradeLevel: parsedGrade,
        avatarId,
        pinHash,
      },
    });

    return NextResponse.json({ success: true, child }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create child profile' }, { status: 500 });
  }
}
