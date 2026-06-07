'use server';

import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { signToken } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) return { error: 'Missing fields' };

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { error: 'Invalid credentials' };

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return { error: 'Invalid credentials' };

    const token = await signToken({ userId: user.id, role: user.role });
    
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/'
    });

    return { success: true, role: user.role };
  } catch (error: any) {
    console.error('Login Error:', error);
    return { error: 'Internal server error. Please try again.' };
  }
}

export async function registerAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) return { error: 'Missing fields' };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: 'User already exists' };

  const hashedPassword = await bcrypt.hash(password, 10);
  
  // As per requirements: "In registration phase you cannot allow to register as an admin"
  // Everyone who registers from outside becomes a STUDENT
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: 'STUDENT'
    }
  });

  const token = await signToken({ userId: user.id, role: user.role });
  
  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24, // 1 day
    path: '/'
  });

  return { success: true };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  redirect('/login');
}
