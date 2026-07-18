import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const albumId = searchParams.get('albumId');
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    const where: any = {};

    if (albumId) {
      const album = await prisma.album.findUnique({
        where: { id: albumId }
      });

      if (!album) {
        return NextResponse.json({ error: 'Álbum no encontrado' }, { status: 404 });
      }

      if (album.password) {
        const password = searchParams.get('password');
        if (password !== album.password) {
          return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
        }
      }

      where.albumId = albumId;
    }

    if (startDateStr || endDateStr) {
      where.date = {};
      if (startDateStr) {
        where.date.gte = new Date(startDateStr);
      }
      if (endDateStr) {
        where.date.lte = new Date(endDateStr);
      }
    }

    const media = await prisma.media.findMany({
      where,
      take: limit,
      orderBy: [
        { isPinned: 'desc' },
        { date: 'desc' }
      ],
      select: {
        id: true,
        url: true,
        type: true,
        description: true,
        date: true,
        albumId: true,
        isPinned: true,
        user: {
          select: { name: true, colorTheme: true }
        }
      }
    });
    return NextResponse.json({ success: true, media });
  } catch (error) {
    console.error('Fetch gallery error', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
