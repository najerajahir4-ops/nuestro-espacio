import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function DELETE(request: Request, context: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await context.params;

    const media = await prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    if (media.userId !== session.userId) {
      return NextResponse.json({ error: 'No tienes permiso para borrar esto' }, { status: 403 });
    }

    await prisma.media.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete media error', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
