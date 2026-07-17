import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';
import { uploadFile } from '@/lib/uploadService';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const contentType = request.headers.get('content-type') || '';
    
    let url = '';
    let type = 'image';
    let description = '';
    let dateStr = '';
    let albumId = '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      url = body.url;
      type = body.type || 'image';
      description = body.description || '';
      dateStr = body.date;
      albumId = body.albumId || '';
    } else {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      description = formData.get('description') as string || '';
      dateStr = formData.get('date') as string || '';
      albumId = formData.get('albumId') as string || '';

      if (!file) {
        return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
      }

      type = file.type.startsWith('video/') ? 'video' : 'image';
      url = await uploadFile(file);
    }

    if (!url) {
      return NextResponse.json({ error: 'No se recibió la URL del archivo' }, { status: 400 });
    }

    const media = await prisma.media.create({
      data: {
        url,
        type,
        description,
        date: dateStr ? new Date(dateStr) : new Date(),
        userId: session.userId,
        albumId: albumId || null
      }
    });

    return NextResponse.json({ success: true, media });
  } catch (error) {
    console.error('Error al guardar archivo:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
