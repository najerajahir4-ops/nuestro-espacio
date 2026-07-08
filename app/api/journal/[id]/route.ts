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

    const entry = await prisma.journalEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    if (entry.userId !== session.userId) {
      return NextResponse.json({ error: 'No tienes permiso para borrar esto' }, { status: 403 });
    }

    await prisma.journalEntry.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete journal error', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await context.params;
    const { content } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'El contenido no puede estar vacío' }, { status: 400 });
    }

    const entry = await prisma.journalEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    if (entry.userId !== session.userId) {
      return NextResponse.json({ error: 'No tienes permiso para editar esto' }, { status: 403 });
    }

    const updatedEntry = await prisma.journalEntry.update({
      where: { id },
      data: { content },
      include: {
        user: {
          select: { name: true, colorTheme: true, profilePic: true }
        }
      }
    });

    return NextResponse.json({ success: true, entry: updatedEntry });
  } catch (error) {
    console.error('Update journal error', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
