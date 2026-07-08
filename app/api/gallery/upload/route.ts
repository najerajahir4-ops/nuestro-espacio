import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';
import { uploadFile } from '@/lib/uploadService';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string;
    const dateStr = formData.get('date') as string;

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
    }

    const type = file.type.startsWith('video/') ? 'video' : 'image';
    const url = await uploadFile(file);

    const media = await prisma.media.create({
      data: {
        url,
        type,
        description,
        date: dateStr ? new Date(dateStr) : new Date(),
        userId: session.userId,
      }
    });

    return NextResponse.json({ success: true, media });
  } catch (error) {
    console.error('Error al subir archivo', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
