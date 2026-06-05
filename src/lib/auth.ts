import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import prisma from './prisma';

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET || 'super-secret-key-for-local-dev';
  return new TextEncoder().encode(secret);
};

export async function signToken(payload: { userId: string; role: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(getJwtSecretKey());
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return payload as { userId: string; role: string };
  } catch (error) {
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
    select: { id: true, email: true, role: true, isSuperAdmin: true }
  });
  
  return user;
}
