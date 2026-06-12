'use server';

import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

async function checkAdmin() {
  const user = await getUser();
  if (!user || user.role !== 'ADMIN') return null;
  return user;
}

export async function approveStudentAction(userId: string) {
  const admin = await checkAdmin();
  if (!admin) return { error: 'Unauthorized' };

  await prisma.user.update({
    where: { id: userId },
    data: { status: 'APPROVED' }
  });

  // Log Mock Welcome
  console.log(`[MOCK SMS/EMAIL] Welcome to ExamPortal! Your account has been approved by admin.`);

  revalidatePath('/dashboard/admin/approvals');
  return { success: true };
}

export async function approveAllStudentsAction() {
  const admin = await checkAdmin();
  if (!admin) return { error: 'Unauthorized' };

  await prisma.user.updateMany({
    where: { status: 'PENDING' },
    data: { status: 'APPROVED' }
  });

  console.log(`[MOCK SMS/EMAIL] Welcome to ExamPortal! Your accounts have been approved by admin.`);

  revalidatePath('/dashboard/admin/approvals');
  return { success: true };
}

export async function rejectStudentAction(userId: string) {
  const admin = await checkAdmin();
  if (!admin) return { error: 'Unauthorized' };

  await prisma.user.update({
    where: { id: userId },
    data: { status: 'REJECTED' }
  });

  revalidatePath('/dashboard/admin/approvals');
  return { success: true };
}

export async function createBatchAction(name: string) {
  const admin = await checkAdmin();
  if (!admin) return { error: 'Unauthorized' };

  if (!name.trim()) return { error: 'Batch name cannot be empty' };

  try {
    await prisma.batch.create({
      data: { name: name.trim() }
    });
    revalidatePath('/dashboard/admin/batches');
    return { success: true };
  } catch (e: any) {
    if (e?.code === 'P2002') return { error: 'Batch name must be unique' };
    return { error: 'An unexpected error occurred while creating batch' };
  }
}

export async function deleteBatchAction(batchId: string) {
  const admin = await checkAdmin();
  if (!admin) return { error: 'Unauthorized' };

  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  if (batch?.isDefault) return { error: 'Cannot delete default batch' };

  await prisma.batch.delete({ where: { id: batchId } });
  revalidatePath('/dashboard/admin/batches');
  return { success: true };
}

export async function getBatchesAction() {
  const admin = await checkAdmin();
  if (!admin) return [];
  return prisma.batch.findMany({ orderBy: { name: 'asc' } });
}

export async function approveNameChangeAction(requestId: string) {
  const admin = await checkAdmin();
  if (!admin) return { error: 'Unauthorized' };

  const req = await prisma.nameChangeRequest.findUnique({ where: { id: requestId } });
  if (!req) return { error: 'Not found' };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: req.userId },
      data: { firstName: req.newFirstName, lastName: req.newLastName }
    }),
    prisma.nameChangeRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED' }
    })
  ]);

  revalidatePath('/dashboard/admin/notifications');
  return { success: true };
}

export async function rejectNameChangeAction(requestId: string) {
  const admin = await checkAdmin();
  if (!admin) return { error: 'Unauthorized' };

  await prisma.nameChangeRequest.update({
    where: { id: requestId },
    data: { status: 'REJECTED' }
  });

  revalidatePath('/dashboard/admin/notifications');
  return { success: true };
}
