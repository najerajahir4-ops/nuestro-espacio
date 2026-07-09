import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const entries = await prisma.journalEntry.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, colorTheme: true, profilePic: true } }
      }
    });

    const messages = await prisma.message.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { name: true, colorTheme: true, profilePic: true } }
      }
    });

    return NextResponse.json({ success: true, entries, messages });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

import { uploadFile } from '@/lib/uploadService';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const contentType = request.headers.get('content-type') || '';
    
    let content = '';
    let mediaUrl: string | null = null;
    let type = 'text';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      content = formData.get('content') as string || '';
      const file = formData.get('file') as File | null;

      if (file) {
        mediaUrl = await uploadFile(file);
        type = 'image';
      }
    } else {
      const body = await request.json();
      content = body.content || '';
    }

    if (!content && !mediaUrl) {
      return NextResponse.json({ error: 'El mensaje no puede estar vacío' }, { status: 400 });
    }

    const entry = await prisma.journalEntry.create({
      data: {
        content,
        type,
        mediaUrl,
        userId: session.userId,
      },
      include: {
        user: { select: { name: true, colorTheme: true, profilePic: true } }
      }
    });

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error('Error creating journal entry', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
