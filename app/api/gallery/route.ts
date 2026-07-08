import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const media = await prisma.media.findMany({
      orderBy: { date: 'desc' },
      include: {
        user: {
          select: { name: true, colorTheme: true }
        }
      }
    });
    return NextResponse.json({ success: true, media });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
