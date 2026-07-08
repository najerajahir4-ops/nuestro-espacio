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
