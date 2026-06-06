'use server';

import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'dummy' });

export async function submitExamAction(examId: string, formData: FormData) {
  const user = await getUser();
  if (!user) return { error: 'Unauthorized' };

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { questions: { include: { options: true } } }
  });

  if (!exam) return { error: 'Exam not found' };

  // Check attempt limit
  const pastSubmissionsCount = await prisma.submission.count({
    where: { examId, userId: user.id }
  });

  const override = await prisma.attemptOverride.findUnique({
    where: {
      examId_userId: { examId, userId: user.id }
    }
  });

  const allowedAttempts = override ? override.allowedAttempts : exam.maxAttempts;

  if (pastSubmissionsCount >= allowedAttempts) {
    return { error: 'You have exhausted all attempts for this test' };
  }

  let totalScore = 0;
  let maxScore = 0;
  const answersToCreate = [];

  for (const q of exam.questions) {
    let qScore = 0;
    let selectedOptionIds = null;
    let numericAnswer = null;
    let textAnswer = null;
    const maxMarks = q.maxMarks || 1;
    maxScore += maxMarks;

    if (q.type === 'MCQ') {
      const selectedId = formData.get(`q_${q.id}`) as string;
      selectedOptionIds = selectedId || null;
      if (selectedId) {
        const opt = q.options.find(o => o.id === selectedId);
        if (opt && opt.isCorrect) {
          qScore = maxMarks;
        } else {
          qScore = -(maxMarks / 3.0);
        }
      }
    } 
    else if (q.type === 'MSQ') {
      const selectedIds = formData.getAll(`q_${q.id}`) as string[];
      selectedOptionIds = selectedIds.join(',') || null;
      const correctOptionIds = q.options.filter(o => o.isCorrect).map(o => o.id);
      
      // MSQ requires all correct options and no incorrect options
      if (selectedIds.length > 0 && selectedIds.length === correctOptionIds.length && selectedIds.every(id => correctOptionIds.includes(id))) {
        qScore = maxMarks;
      }
    }
    else if (q.type === 'NAT') {
      const val = formData.get(`q_${q.id}`) as string;
      if (val !== null && val !== '') {
        const num = parseFloat(val);
        numericAnswer = num;
        if (num === q.correctNumeric) qScore = maxMarks;
      }
    }
    else if (q.type === 'DESCRIPTIVE') {
      const txt = formData.get(`q_${q.id}`) as string;
      if (txt) {
        textAnswer = txt;
        
        // Auto-grade via Gemini if API key is present
        if (process.env.GEMINI_API_KEY) {
          try {
            const prompt = `You are an expert examiner.
Question: ${q.text}
Maximum Marks: ${maxMarks}
Correct Answer / Rubric: ${q.correctText || 'No rubric provided, use your best judgment based on the question.'}

Student's Answer: ${txt}

Evaluate the student's answer. If it's an exact match or the core idea matches perfectly, award ${maxMarks} marks. If it's partially correct, award partial marks. If completely wrong, award 0.
Return ONLY a single number representing the marks awarded (e.g., 2.5, 0, ${maxMarks}). Do not include any other text.`;
            
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
            });
            const num = parseFloat(response.text?.trim() || '0');
            if (!isNaN(num)) {
              qScore = Math.min(Math.max(num, 0), maxMarks); // Clamp between 0 and maxMarks
            }
          } catch (e) {
            console.error('AI grading failed', e);
            qScore = 0;
          }
        } else {
          // Fallback if no API key
          qScore = 0; 
        }
      }
    }

    totalScore += qScore;
    answersToCreate.push({
      questionId: q.id,
      selectedOptionIds,
      numericAnswer,
      textAnswer,
      marksObtained: qScore
    });
  }

  await prisma.submission.create({
    data: {
      examId,
      userId: user.id,
      score: totalScore,
      maxScore: maxScore,
      answers: {
        create: answersToCreate
      }
    }
  });

  redirect('/dashboard/analysis');
}
