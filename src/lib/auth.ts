import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import prisma from './prisma';
import type { SessionPayload, SessionUser } from '@/types';

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET || '2ec26b1e47337370e97daed33b899f50609d08ff2236be27b10595cfc8b2a45d';
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set.');
  }
  return new TextEncoder().encode(secret);
};

export async function signToken(payload: { userId: string; role: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(getJwtSecretKey());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export async function getUser() {
  const session = await getSession();
  if (!session) return null;
  
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, isSuperAdmin: true }
  });
  
  return user;
}
