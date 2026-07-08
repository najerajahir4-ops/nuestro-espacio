import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const entries = await prisma.journalEntry.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, colorTheme: true, profilePic: true } }
      }
    });

    const messages = await prisma.message.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { name: true, colorTheme: true, profilePic: true } }
      }
    });

    return NextResponse.json({ success: true, entries, messages });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { content, date } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'El contenido no puede estar vacío' }, { status: 400 });
    }

    const entry = await prisma.journalEntry.create({
      data: {
        content,
        date: date ? new Date(date) : new Date(),
        userId: session.userId,
      },
      include: {
        user: { select: { name: true, colorTheme: true } }
      }
    });

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error('Error creating journal entry', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
