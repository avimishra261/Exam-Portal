'use server';

import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
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
  const shuffleQuestions = formData.get('shuffleQuestions') === 'true';
  const questionsJson = formData.get('questions') as string;
  const batchIdsStr = formData.get('batchIds') as string;

  if (!title || !duration || !questionsJson) return { error: 'Missing required fields' };

  let questionsData: QuestionInput[];
  try {
    questionsData = JSON.parse(questionsJson);
  } catch {
    return { error: 'Invalid questions data' };
  }

  try {
    const exam = await prisma.exam.create({
      data: {
        title,
        description,
        durationMinutes: duration,
        startTime: startTimeStr ? new Date(startTimeStr) : null,
        endTime: endTimeStr ? new Date(endTimeStr) : null,
        upcomingDays,
        fullscreenChances,
        shuffleQuestions,
        createdById: user.id,
        batches: {
          connect: batchIdsStr ? JSON.parse(batchIdsStr).map((id: string) => ({ id })) : []
        },
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

                const buffer = Buffer.from(await file.arrayBuffer());
                const mimeType = file.type || 'image/png';
                mediaUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
              }
            }

            const parsedMaxMarks = parseFloat(q.maxMarks as unknown as string);
            const parsedCorrectNumeric = q.type === 'NAT' && q.correctNumeric !== undefined && q.correctNumeric !== null 
              ? parseFloat(q.correctNumeric as unknown as string) 
              : null;

            return {
              text: q.text,
              type: q.type,
              section: q.section || 'General',
              mediaUrl,
              maxMarks: isNaN(parsedMaxMarks) ? 1 : parsedMaxMarks,
              correctNumeric: parsedCorrectNumeric !== null && !isNaN(parsedCorrectNumeric) ? parsedCorrectNumeric : null,
              correctText: q.type === 'DESCRIPTIVE' ? q.correctText : null,
              explanation: q.explanation || null,
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

export async function grantAttemptOverrideAction(userId: string, examId: string, allowedAttempts: number, durationOverride: number | null) {
  const currentUser = await getUser();
  if (!currentUser || currentUser.role !== 'ADMIN') return { error: 'Unauthorized' };

  if (allowedAttempts < 1) return { error: 'Attempts must be at least 1' };

  try {
    await prisma.attemptOverride.upsert({
      where: {
        examId_userId: { examId, userId }
      },
      update: { allowedAttempts, durationOverride: durationOverride ?? null },
      create: { examId, userId, allowedAttempts, durationOverride: durationOverride ?? null }
    });

    revalidatePath('/dashboard/admin/users');
    revalidatePath('/dashboard/admin/tests');
    return { success: true };
  } catch (error) {
    console.error('Failed to grant attempt override:', error instanceof Error ? error.message : error);
    return { error: 'Failed to update attempts' };
  }
}

export async function deleteTestAction(examId: string) {
  const user = await getUser();
  if (!user || user.role !== 'ADMIN') return { error: 'Unauthorized' };

  await prisma.exam.delete({ where: { id: examId } });
  revalidatePath('/dashboard/admin/tests');
  return { success: true };
}

export async function reopenTestAction(examId: string) {
  const user = await getUser();
  if (!user || user.role !== 'ADMIN') return { error: 'Unauthorized' };

  // Set endTime to null to reopen
  await prisma.exam.update({
    where: { id: examId },
    data: { endTime: null }
  });
  revalidatePath('/dashboard/admin/tests');
  return { success: true };
}

export async function toggleTestDraftStatusAction(examId: string, isDraft: boolean) {
  const user = await getUser();
  if (!user || user.role !== 'ADMIN') return { error: 'Unauthorized' };

  await prisma.exam.update({
    where: { id: examId },
    data: { isDraft }
  });
  revalidatePath('/dashboard/admin/tests');
  return { success: true };
}

export async function bulkUploadTextAction(formData: FormData) {
  const user = await getUser();
  if (!user || user.role !== 'ADMIN') return { error: 'Unauthorized' };

  const text = formData.get('content') as string;
  const batchIdsStr = formData.get('batchIds') as string;
  if (!text) return { error: 'No content provided' };

  const tests = text.split('TEST_START').filter(t => t.trim().length > 0);
  let count = 0;
  
  for (const t of tests) {
    if (!t.includes('TEST_END')) continue;
    const content = t.split('TEST_END')[0].trim();
    const lines = content.split('\n').map(l => l.trim());
    
    let title = 'Bulk Uploaded Test';
    let duration = 60;
    
    // Parse header
    let i = 0;
    while(i < lines.length && lines[i] !== '') {
      if (lines[i].startsWith('Title:')) title = lines[i].substring(6).trim();
      if (lines[i].startsWith('Duration:')) duration = parseInt(lines[i].substring(9).trim(), 10) || 60;
      i++;
    }
    
    type ParsedQuestion = { text: string; type: string; maxMarks: number; options: { text: string; isCorrect: boolean }[]; correctNumeric?: number; correctText?: string; };
    const questions: ParsedQuestion[] = [];
    let currentQ: ParsedQuestion | null = null;
    
    for (; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('Q:')) {
        if (currentQ) questions.push(currentQ);
        currentQ = { text: line.substring(2).trim(), type: 'MCQ', maxMarks: 1, options: [] };
      } else if (currentQ) {
        if (line.startsWith('Type:')) currentQ.type = line.substring(5).trim();
        else if (line.startsWith('Marks:')) currentQ.maxMarks = parseFloat(line.substring(6).trim());
        else if (line.startsWith('Answer:')) currentQ.correctNumeric = parseFloat(line.substring(7).trim());
        else if (line.startsWith('Rubric:')) currentQ.correctText = line.substring(7).trim();
        else if (line.match(/^[A-Z*]+\)/)) {
          const isCorrect = line.startsWith('*');
          const optText = line.substring(line.indexOf(')') + 1).trim();
          currentQ.options.push({ text: optText, isCorrect });
        }
      }
    }
    if (currentQ) questions.push(currentQ);
    
    if (questions.length > 0) {
      await prisma.exam.create({
        data: {
          title,
          durationMinutes: duration,
          isDraft: true,
          createdById: user.id,
          batches: {
            connect: batchIdsStr ? JSON.parse(batchIdsStr).map((id: string) => ({ id })) : []
          },
          questions: {
            create: questions.map(q => ({
              text: q.text,
              type: q.type,
              maxMarks: isNaN(q.maxMarks) ? 1 : q.maxMarks,
              correctNumeric: q.correctNumeric || null,
              correctText: q.correctText || null,
              options: ['MCQ', 'MSQ'].includes(q.type) ? {
                create: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect }))
              } : undefined
            }))
          }
        }
      });
      count++;
    }
  }
  
  revalidatePath('/dashboard/admin/tests');
  return { success: true, count };
}

export async function banStudentAction(examId: string, userId: string, ban: boolean) {
  const user = await getUser();
  if (!user || user.role !== 'ADMIN') return { error: 'Unauthorized' };

  if (ban) {
    await prisma.bannedStudent.upsert({
      where: { examId_userId: { examId, userId } },
      update: {},
      create: { examId, userId }
    });
  } else {
    await prisma.bannedStudent.deleteMany({
      where: { examId, userId }
    });
  }
  revalidatePath('/dashboard/admin/tests');
  return { success: true };
}

export async function hideAndEditDatesAction(examId: string, isDraft: boolean, startTimeStr?: string | null, endTimeStr?: string | null) {
  const user = await getUser();
  if (!user || user.role !== 'ADMIN') return { error: 'Unauthorized' };

  try {
    const dataToUpdate: Record<string, unknown> = { isDraft };
    if (startTimeStr !== undefined) dataToUpdate.startTime = startTimeStr ? new Date(startTimeStr) : null;
    if (endTimeStr !== undefined) dataToUpdate.endTime = endTimeStr ? new Date(endTimeStr) : null;

    await prisma.exam.update({
      where: { id: examId },
      data: dataToUpdate
    });
    revalidatePath('/dashboard/admin/tests');
    return { success: true };
  } catch {
    return { error: 'Failed to update test' };
  }
}

export async function searchStudentsAction(query: string) {
  const user = await getUser();
  if (!user || user.role !== 'ADMIN') return { error: 'Unauthorized' };

  if (!query || query.length < 2) return { students: [] };

  try {
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        OR: [
          { email: { contains: query } },
          { firstName: { contains: query } },
          { lastName: { contains: query } }
        ]
      },
      take: 10,
      select: { id: true, firstName: true, lastName: true, email: true }
    });
    return { students };
  } catch {
    return { error: 'Failed to search students' };
  }
}

export async function reopenForStudentAction(examId: string, userId: string, endTimeStr?: string | null) {
  const user = await getUser();
  if (!user || user.role !== 'ADMIN') return { error: 'Unauthorized' };

  try {
    // 1. Delete their existing submission so they can start fresh
    await prisma.submission.deleteMany({
      where: { examId, userId }
    });

    // 2. Grant an attempt override with optionally a new extended deadline
    const endTimeOverride = endTimeStr ? new Date(endTimeStr) : null;
    
    await prisma.attemptOverride.upsert({
      where: { examId_userId: { examId, userId } },
      update: { allowedAttempts: 1, endTimeOverride },
      create: { examId, userId, allowedAttempts: 1, endTimeOverride }
    });

    revalidatePath('/dashboard/admin/tests');
    return { success: true };
  } catch (err) {
    console.error('Reopen for student error:', err);
    return { error: 'Failed to reopen test for the student' };
  }
}

export async function getLiveSubmissionAction(submissionId: string) {
  const user = await getUser();
  if (!user || user.role !== 'ADMIN') return null;

  try {
    const sub = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        exam: {
          include: {
            questions: { include: { options: true } }
          }
        },
        answers: true
      }
    });
    return sub;
  } catch {
    return null;
  }
}
