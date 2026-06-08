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

    if (user.status === 'PENDING') {
      return { error: 'Account pending admin approval. Please wait.' };
    }
    if (user.status === 'REJECTED') {
      return { error: 'Account has been rejected by admin.' };
    }

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

async function isValidEmail(email: string) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) return false;
  
  const domain = email.split('@')[1];
  try {
    const dns = require('dns');
    const { promisify } = require('util');
    const resolveMx = promisify(dns.resolveMx);
    const addresses = await resolveMx(domain);
    return addresses && addresses.length > 0;
  } catch (e) {
    return false;
  }
}

export async function registerAction(formData: FormData) {
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const mobile = formData.get('mobile') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password || !firstName || !lastName || !mobile) {
    return { error: 'Missing fields' };
  }
  
  const isValid = await isValidEmail(email);
  if (!isValid) return { error: 'Invalid email format or domain does not exist' };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: 'User already exists' };

  const hashedPassword = await bcrypt.hash(password, 10);
  
  const defaultBatch = await prisma.batch.findFirst({ where: { isDefault: true }});
  
  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      mobile,
      email,
      password: hashedPassword,
      role: 'STUDENT',
      status: 'PENDING',
      batchId: defaultBatch?.id
    }
  });

  // Do NOT sign them in automatically. They must wait for approval.
  return { success: true, pending: true };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  redirect('/login');
}
