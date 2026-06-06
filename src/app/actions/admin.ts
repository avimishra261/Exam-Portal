'use server';

import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import type { QuestionInput } from '@/types';

// Allowed MIME types for question media uploads
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Sanitize a filename: remove path separators and special characters,
 * keeping only alphanumeric characters, dots, hyphens, and underscores.
 */
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
}

export async function createExamAction(formData: FormData) {
  const user = await getUser();
  if (!user || user.role !== 'ADMIN') return { error: 'Unauthorized' };

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const duration = parseInt(formData.get('duration') as string, 10);
  const startTimeStr = formData.get('startTime') as string;
  const endTimeStr = formData.get('endTime') as string;
  const upcomingDays = parseInt(formData.get('upcomingDays') as string, 10) || 10;
  const fullscreenChances = parseInt(formData.get('fullscreenChances') as string, 10) || 5;
  const questionsJson = formData.get('questions') as string;

  if (!title || !duration || !questionsJson) return { error: 'Missing required fields' };

  let questionsData: QuestionInput[];
  try {
    questionsData = JSON.parse(questionsJson);
  } catch {
    return { error: 'Invalid questions data' };
  }

  try {
    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const exam = await prisma.exam.create({
      data: {
        title,
        description,
        durationMinutes: duration,
        startTime: startTimeStr ? new Date(startTimeStr) : null,
        endTime: endTimeStr ? new Date(endTimeStr) : null,
        upcomingDays,
        fullscreenChances,
        createdById: user.id,
        questions: {
          create: await Promise.all(questionsData.map(async (q: QuestionInput) => {
            let mediaUrl = null;
            if (q.mediaFileId) {
              const file = formData.get(`media_${q.mediaFileId}`) as File;
              if (file && file.size > 0) {
                // Validate file type
                if (!ALLOWED_MIME_TYPES.includes(file.type)) {
                  throw new Error(`Invalid file type: ${file.type}. Only images are allowed.`);
                }
                // Validate file size
                if (file.size > MAX_FILE_SIZE) {
                  throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum is 5MB.`);
                }

                const bytes = await file.arrayBuffer();
                const buffer = Buffer.from(bytes);
                const filename = `${Date.now()}_${sanitizeFilename(file.name)}`;
                const filepath = join(uploadsDir, filename);
                await writeFile(filepath, buffer);
                mediaUrl = `/uploads/${filename}`;
              }
            }

            const parsedMaxMarks = parseFloat(q.maxMarks as unknown as string);
            const parsedCorrectNumeric = q.type === 'NAT' && q.correctNumeric !== undefined && q.correctNumeric !== null 
              ? parseFloat(q.correctNumeric as unknown as string) 
              : null;

            return {
              text: q.text,
              type: q.type,
              mediaUrl,
              maxMarks: isNaN(parsedMaxMarks) ? 1 : parsedMaxMarks,
              correctNumeric: parsedCorrectNumeric !== null && !isNaN(parsedCorrectNumeric) ? parsedCorrectNumeric : null,
              correctText: q.type === 'DESCRIPTIVE' ? q.correctText : null,
              options: ['MCQ', 'MSQ'].includes(q.type) ? {
                create: q.options.map((opt) => ({
                  text: opt.text,
                  isCorrect: opt.isCorrect
                }))
              } : undefined
            };
          }))
        }
      }
    });

    return { success: true, examId: exam.id };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create test';
    console.error('Create exam error:', message);
    return { error: message };
  }
}

export async function makeAdminAction(userId: string) {
  const currentUser = await getUser();
  if (!currentUser || currentUser.role !== 'ADMIN') return { error: 'Unauthorized' };

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { error: 'User not found' };
  if (target.role === 'ADMIN') return { error: 'User is already an admin' };

  await prisma.user.update({
    where: { id: userId },
    data: { role: 'ADMIN' }
  });

  revalidatePath('/dashboard/admin/users');
  return { success: true };
}

export async function demoteAdminAction(userId: string) {
  const currentUser = await getUser();
  // Only super admin can demote other admins
  if (!currentUser || !currentUser.isSuperAdmin) return { error: 'Only the Super Admin can demote admins' };

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { error: 'User not found' };
  if (target.isSuperAdmin) return { error: 'Cannot demote the Super Admin' };
  if (target.role !== 'ADMIN') return { error: 'User is not an admin' };

  await prisma.user.update({
    where: { id: userId },
    data: { role: 'STUDENT' }
  });

  revalidatePath('/dashboard/admin/users');
  return { success: true };
}

export async function deleteUserAction(userId: string) {
  const currentUser = await getUser();
  if (!currentUser || currentUser.role !== 'ADMIN') return { error: 'Unauthorized' };

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { error: 'User not found' };

  // Prevent deleting yourself
  if (target.id === currentUser.id) return { error: 'Cannot delete yourself' };

  // Regular admins can only delete students
  if (target.role === 'ADMIN' && !currentUser.isSuperAdmin) {
    return { error: 'Only Super Admin can remove other admins' };
  }

  // Nobody can delete the super admin
  if (target.isSuperAdmin) return { error: 'Cannot delete the Super Admin' };

  await prisma.user.delete({ where: { id: userId } });

  revalidatePath('/dashboard/admin/users');
  return { success: true };
}

export async function resetPasswordAction(userId: string, newPassword: string) {
  const currentUser = await getUser();
  if (!currentUser || currentUser.role !== 'ADMIN') return { error: 'Unauthorized' };

  if (!newPassword || newPassword.length < 6) return { error: 'Password must be at least 6 characters' };

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { error: 'User not found' };

  // Regular admins can only reset student passwords
  if (target.role === 'ADMIN' && !currentUser.isSuperAdmin) {
    return { error: 'Only Super Admin can reset admin passwords' };
  }

  if (target.isSuperAdmin && target.id !== currentUser.id) {
    return { error: 'Cannot reset Super Admin password' };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });

  revalidatePath('/dashboard/admin/users');
  return { success: true };
}

export async function updateEmailAction(userId: string, newEmail: string) {
  const currentUser = await getUser();
  if (!currentUser || currentUser.role !== 'ADMIN') return { error: 'Unauthorized' };

  if (!newEmail || !newEmail.includes('@')) return { error: 'Invalid email' };

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { error: 'User not found' };

  // Check if email already taken
  const emailTaken = await prisma.user.findUnique({ where: { email: newEmail } });
  if (emailTaken) return { error: 'Email already in use' };

  await prisma.user.update({
    where: { id: userId },
    data: { email: newEmail }
  });

  revalidatePath('/dashboard/admin/users');
  return { success: true };
}

export async function grantAttemptOverrideAction(userId: string, examId: string, allowedAttempts: number) {
  const currentUser = await getUser();
  if (!currentUser || currentUser.role !== 'ADMIN') return { error: 'Unauthorized' };

  if (allowedAttempts < 1) return { error: 'Attempts must be at least 1' };

  try {
    await prisma.attemptOverride.upsert({
      where: {
        examId_userId: { examId, userId }
      },
      update: { allowedAttempts },
      create: { examId, userId, allowedAttempts }
    });

    revalidatePath('/dashboard/admin/users');
    revalidatePath('/dashboard/admin/tests');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to grant attempt override:', error.message);
    return { error: 'Failed to update attempts' };
  }
}
