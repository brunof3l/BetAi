import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

function generateTempPassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@$!%*?&';
  let pwd = '';
  for (let i = 0; i < length; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  return pwd;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const emailRaw: unknown = body?.email;
    if (typeof emailRaw !== 'string') {
      return NextResponse.json({ error: 'Invalid payload: email required' }, { status: 400 });
    }
    const email = emailRaw.toLowerCase().trim();
    if (!email) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ message: 'User already exists' }, { status: 200 });
    }

    const tempPassword = generateTempPassword(12);
    const hashed = await bcrypt.hash(tempPassword, 10);

    const user = await prisma.user.create({
      data: { email, password: hashed },
    });

    console.log(`📧 Enviando email para ${email} com a senha ${tempPassword}`);

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (err) {
    console.error('Kirvano webhook error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}