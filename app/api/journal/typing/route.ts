import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    // Buscar si la pareja (el otro usuario) está escribiendo
    // Solo consideramos que está escribiendo si updatedAt fue hace menos de 4 segundos
    const fourSecondsAgo = new Date(Date.now() - 4000);
    
    const partnerTyping = await prisma.typingStatus.findFirst({
      where: {
        userId: { not: session.userId },
        isTyping: true,
        updatedAt: { gte: fourSecondsAgo }
      }
    });

    return NextResponse.json({ isTyping: !!partnerTyping });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { isTyping } = await request.json();

    await prisma.typingStatus.upsert({
      where: { userId: session.userId },
      update: { isTyping, updatedAt: new Date() },
      create: { userId: session.userId, isTyping }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
