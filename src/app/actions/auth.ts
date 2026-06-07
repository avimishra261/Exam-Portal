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

const otpStore = new Map<string, string>();

function isValidEmail(email: string) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) return false;
  const invalidDomains = ['.local', '.test', '.example', '.invalid', '.localhost'];
  return !invalidDomains.some(ext => email.toLowerCase().endsWith(ext));
}

export async function sendOtpAction(email: string) {
  if (!isValidEmail(email)) return { error: 'Please provide a valid email address (e.g., example@gmail.com).' };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: 'User already exists with this email.' };

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(email, otp);
  
  // MOCK SEND EMAIL
  console.log(`\n\n================================`);
  console.log(`[MOCK EMAIL] To: ${email}`);
  console.log(`Your ExamPortal Verification OTP is: ${otp}`);
  console.log(`================================\n\n`);
  
  return { success: true };
}

export async function registerAction(formData: FormData) {
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const mobile = formData.get('mobile') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const otp = formData.get('otp') as string;

  if (!email || !password || !firstName || !lastName || !mobile || !otp) {
    return { error: 'Missing fields' };
  }
  
  if (!isValidEmail(email)) return { error: 'Invalid email format' };

  if (otpStore.get(email) !== otp) {
    return { error: 'Invalid or expired OTP' };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: 'User already exists' };

  otpStore.delete(email);

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
