import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Fetch all albums in the DB (since kenny and ashley share the same app database)
    const albums = await prisma.album.findMany({
      include: {
        user: {
          select: { name: true }
        },
        media: {
          orderBy: { date: 'desc' },
          take: 1, // Get the latest uploaded media as cover
          select: { url: true, type: true }
        },
        _count: {
          select: { media: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, albums });
  } catch (error) {
    console.error('Fetch albums error', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { name, description } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'El nombre del álbum es requerido' }, { status: 400 });
    }

    const album = await prisma.album.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        userId: session.userId
      }
    });

    return NextResponse.json({ success: true, album });
  } catch (error) {
    console.error('Create album error', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
