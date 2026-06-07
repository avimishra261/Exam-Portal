'use server';

import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function updateMobileAction(mobile: string) {
  const user = await getUser();
  if (!user) return { error: 'Unauthorized' };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { mobile }
    }),
    prisma.adminLog.create({
      data: {
        userId: user.id,
        message: `User updated their mobile number to ${mobile}`
      }
    })
  ]);

  revalidatePath('/dashboard/settings');
  return { success: true };
}

export async function updatePasswordAction(newPassword: string) {
  const user = await getUser();
  if (!user) return { error: 'Unauthorized' };

  if (newPassword.length < 6) return { error: 'Password must be at least 6 characters' };

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    }),
    prisma.adminLog.create({
      data: {
        userId: user.id,
        message: `User changed their password.`
      }
    })
  ]);

  revalidatePath('/dashboard/settings');
  return { success: true };
}

export async function requestNameChangeAction(firstName: string, lastName: string) {
  const user = await getUser();
  if (!user) return { error: 'Unauthorized' };

  const existingRequest = await prisma.nameChangeRequest.findFirst({
    where: { userId: user.id, status: 'PENDING' }
  });

  if (existingRequest) {
    return { error: 'You already have a pending name change request.' };
  }

  await prisma.$transaction([
    prisma.nameChangeRequest.create({
      data: {
        userId: user.id,
        newFirstName: firstName,
        newLastName: lastName
      }
    }),
    prisma.adminLog.create({
      data: {
        userId: user.id,
        message: `User requested a name change to ${firstName} ${lastName}`
      }
    })
  ]);

  revalidatePath('/dashboard/settings');
  return { success: true };
}
