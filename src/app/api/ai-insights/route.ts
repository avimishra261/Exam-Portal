import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'dummy' });

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const submissions = await prisma.submission.findMany({
      where: { userId: user.id },
      include: {
        exam: true,
        answers: {
          include: {
            question: true
          }
        }
      },
      orderBy: { submittedAt: 'asc' }
    });

    if (submissions.length === 0) {
      return NextResponse.json({ insights: null, message: "Take some tests to get AI insights!" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        insights: {
          strengths: ['Keep taking tests!'],
          weaknesses: ['Add GEMINI_API_KEY to see real AI insights'],
          recommendation: 'Configure your environment variables.'
        }
      });
    }

    // Compile data for Gemini
    const testScores = submissions.map(s => `Test "${s.exam.title}": ${s.score} / ${s.maxScore || '?'}`).join('\\n');
    
    const typeStats: Record<string, { correct: number, total: number }> = {
      'MCQ': { correct: 0, total: 0 },
      'MSQ': { correct: 0, total: 0 },
      'NAT': { correct: 0, total: 0 },
      'DESCRIPTIVE': { correct: 0, total: 0 }
    };

    submissions.forEach(sub => {
      sub.answers.forEach(ans => {
        const type = ans.question.type;
        const max = ans.question.maxMarks || 1;
        const obtained = ans.marksObtained || 0;
        
        typeStats[type].total += max;
        typeStats[type].correct += Math.max(0, obtained);
      });
    });

    const typeSummary = Object.entries(typeStats)
      .map(([type, stats]) => `${type}: ${stats.correct.toFixed(2)} out of ${stats.total} possible marks`)
      .join('\\n');

    const prompt = `You are an expert academic counselor analyzing a student's performance.
Here is the student's test history:
${testScores}

Here is their performance breakdown by question type (marks obtained vs possible):
${typeSummary}

Based on this data, provide a structured JSON response with exactly three keys:
1. "strengths": An array of 1 to 3 short sentences highlighting what they do well.
2. "weaknesses": An array of 1 to 3 short sentences highlighting areas for improvement.
3. "recommendation": A short 2-3 sentence personalized study recommendation.

DO NOT output markdown formatting like \`\`\`json. ONLY output the raw JSON object.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const jsonStr = response.text?.replace(/^```json/g, '').replace(/```$/g, '').trim() || '{}';
    const insights = JSON.parse(jsonStr);

    return NextResponse.json({ insights });

  } catch (error) {
    console.error('Error generating AI insights:', error);
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
  }
}
