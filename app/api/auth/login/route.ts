import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { username, password, rememberMe = true } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Faltan credenciales' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);

    if (!validPassword) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // Create session
    const sessionData = { userId: user.id, username: user.username, name: user.name, colorTheme: user.colorTheme, profilePic: user.profilePic };
    const sessionToken = await encrypt(sessionData);

    const cookieStore = await cookies();
    cookieStore.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: rememberMe ? 60 * 60 * 24 * 30 : undefined, // 30 days if checked, else session cookie
      path: '/',
    });

    return NextResponse.json({ success: true, user: sessionData });
  } catch (error) {
    console.error('Login error', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
