import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const events = await prisma.calendarEvent.findMany({
      orderBy: { date: 'asc' },
      include: {
        user: { select: { name: true, profilePic: true } }
      }
    });
    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await request.json();
    const { date, type, title, notes, category } = body;

    if (!date || !type) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const event = await prisma.calendarEvent.create({
      data: {
        date: new Date(date),
        type,
        title: title || null,
        notes: notes || null,
        category: category || null,
        userId: session.userId,
      },
      include: {
        user: { select: { name: true, profilePic: true } }
      }
    });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
