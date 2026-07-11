import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';
import { encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { colorTheme, name, bio } = await request.json();

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: {
        colorTheme: colorTheme !== undefined ? colorTheme : undefined,
        name: name !== undefined ? name : undefined,
        bio: bio !== undefined ? bio : undefined,
      }
    });

    // Update session
    const sessionData = { 
      userId: user.id, 
      username: user.username, 
      name: user.name, 
      colorTheme: user.colorTheme, 
      profilePic: user.profilePic,
      bio: user.bio 
    };
    const sessionToken = await encrypt(sessionData);

    const cookieStore = await cookies();
    cookieStore.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return NextResponse.json({ success: true, user: sessionData });
  } catch (error) {
    console.error('Error updating user', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
