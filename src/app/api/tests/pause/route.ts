import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { examId, timeLeft, answers, status, isExitFullscreen } = body;

    if (!examId) {
      return NextResponse.json({ error: 'Missing examId' }, { status: 400 });
    }

    // Check if there's an existing IN_PROGRESS submission
    const existingDraft = await prisma.submission.findFirst({
      where: {
        examId,
        userId: user.id,
        status: 'IN_PROGRESS'
      }
    });

    let submissionId;

    if (existingDraft) {
      // Update existing
      await prisma.submission.update({
        where: { id: existingDraft.id },
        data: { 
          timeLeft, 
          status: status || 'IN_PROGRESS',
          fullscreenExitCount: isExitFullscreen ? existingDraft.fullscreenExitCount + 1 : existingDraft.fullscreenExitCount
        }
      });
      submissionId = existingDraft.id;

      // Delete old answers for this draft
      await prisma.submissionAnswer.deleteMany({
        where: { submissionId: existingDraft.id }
      });
    } else {
      // Create new draft
      const newDraft = await prisma.submission.create({
        data: {
          examId,
          userId: user.id,
          timeLeft,
          status: status || 'IN_PROGRESS',
          fullscreenExitCount: isExitFullscreen ? 1 : 0
        }
      });
      submissionId = newDraft.id;
    }

    // Save the new answers
    const answersData = [];
    for (const [qId, val] of Object.entries(answers)) {
      if (val === undefined || val === null || val === '') continue;
      
      let selectedOptionIds = null;
      let textAnswer = null;
      let numericAnswer = null;

      if (Array.isArray(val)) {
        selectedOptionIds = val.join(',');
      } else if (typeof val === 'string' && val.trim().length > 0) {
        // We need to know the question type to know if this is a numeric answer, text answer, or an option ID.
        // It's safer to fetch the questions, but for simplicity we can just try to parse numeric, or assume it's text/option based on how TestEngine submits.
        // Since we are just pausing, we don't calculate marks here. We just need to persist the values.
        
        // Let's just persist all non-array string values in textAnswer and numericAnswer as fallback
        // We will do a proper grading on final submit anyway.
      }
    }

    // Actually, to make pause/resume flawless without grading logic on the backend yet,
    // let's fetch the questions to know their types
    const questions = await prisma.question.findMany({
      where: { examId }
    });
    
    const qMap = new Map();
    questions.forEach(q => qMap.set(q.id, q));

    for (const [qId, val] of Object.entries(answers)) {
      if (val === undefined || val === null || val === '') continue;
      const q = qMap.get(qId);
      if (!q) continue;

      let selectedOptionIds = null;
      let numericAnswer = null;
      let textAnswer = null;

      if (q.type === 'MCQ') {
        selectedOptionIds = val as string;
      } else if (q.type === 'MSQ' && Array.isArray(val)) {
        selectedOptionIds = val.join(',');
      } else if (q.type === 'NAT') {
        numericAnswer = parseFloat(val as string);
      } else if (q.type === 'DESCRIPTIVE') {
        textAnswer = val as string;
      }

      answersData.push({
        submissionId,
        questionId: qId,
        selectedOptionIds,
        numericAnswer,
        textAnswer,
      });
    }

    if (answersData.length > 0) {
      await prisma.submissionAnswer.createMany({
        data: answersData
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving paused test:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
