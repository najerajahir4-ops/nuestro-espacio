import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await context.params;

    const album = await prisma.album.findUnique({
      where: { id }
    });

    if (!album) {
      return NextResponse.json({ error: 'Álbum no encontrado' }, { status: 404 });
    }

    // Since onDelete is SetNull in the schema, deleting the album will not delete the media,
    // it will simply set their albumId to null (dissociating them).
    await prisma.album.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete album error', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await context.params;
    const { name, description, password } = await request.json();

    const album = await prisma.album.findUnique({
      where: { id }
    });

    if (!album) {
      return NextResponse.json({ error: 'Álbum no encontrado' }, { status: 404 });
    }

    const updated = await prisma.album.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        description: description !== undefined ? (description?.trim() || null) : undefined,
        password: password !== undefined ? (password || null) : undefined
      }
    });

    const { password: _, ...albumWithoutPassword } = updated;

    return NextResponse.json({ success: true, album: albumWithoutPassword });
  } catch (error) {
    console.error('Update album error', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

