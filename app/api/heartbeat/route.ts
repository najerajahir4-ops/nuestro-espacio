import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// POST: Update lastSeen for the current user
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await prisma.user.update({
      where: { id: session.userId },
      data: { lastSeen: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update heartbeat' }, { status: 500 });
  }
}

// GET: Get the partner's status
export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Partner is the one who is NOT the current user
    const partner = await prisma.user.findFirst({
      where: { id: { not: session.userId } },
      select: { id: true, lastSeen: true, name: true, profilePic: true },
    });

    if (!partner) return NextResponse.json({ error: 'No partner found' }, { status: 404 });

    // Online if lastSeen is within 30 seconds
    const isOnline = partner.lastSeen 
      ? (new Date().getTime() - new Date(partner.lastSeen).getTime()) < 30000 
      : false;

    // Fetch the latest journal entry created by the partner
    const latestJournal = await prisma.journalEntry.findFirst({
      where: { userId: partner.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, content: true, type: true, createdAt: true }
    });

    return NextResponse.json({
      name: partner.name,
      isOnline,
      lastSeen: partner.lastSeen,
      profilePic: partner.profilePic,
      latestJournal
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get partner status' }, { status: 500 });
  }
}
