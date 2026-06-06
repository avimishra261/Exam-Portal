import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import AnalysisClient from './AnalysisClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DetailedAnalysisPage({ params }: PageProps) {
  const resolvedParams = await params;
  const user = await getUser();
  if (!user) redirect('/login');

  const submission = await prisma.submission.findUnique({
    where: { id: resolvedParams.id },
    include: {
      user: true,
      exam: {
        include: {
          questions: {
            include: {
              options: true
            },
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      },
      answers: true
    }
  });

  if (!submission) {
    notFound();
  }

  // Security check: only admin or the student who took the test can view it
  if (user.role !== 'ADMIN' && submission.userId !== user.id) {
    redirect('/dashboard/analysis');
  }

  // Fetch Leaderboard
  const allSubmissions = await prisma.submission.findMany({
    where: { examId: submission.examId, status: 'COMPLETED' },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: [
      { score: 'desc' },
      { submittedAt: 'asc' }
    ]
  });

  const topScore = allSubmissions.length > 0 ? (allSubmissions[0].score || 0) : 0;
  
  // Create leaderboard array, handling anonymous if needed
  let rank = 1;
  const leaderboard = allSubmissions.map((sub, index) => {
    const score = sub.score || 0;
    const prevScore = index > 0 ? (allSubmissions[index - 1].score || 0) : 0;
    
    if (index > 0 && score < prevScore) {
      rank = index + 1;
    }
    return {
      rank,
      userId: sub.userId,
      name: submission.exam.leaderboardAnonymous && sub.userId !== user.id 
        ? 'Anonymous Student' 
        : (sub.user.name || sub.user.email),
      score: score,
      maxScore: sub.maxScore,
    };
  });

  const serializedSubmission = {
    ...submission,
    submittedAt: submission.submittedAt.toISOString(),
    exam: {
      ...submission.exam,
      startTime: submission.exam.startTime?.toISOString() || null,
      endTime: submission.exam.endTime?.toISOString() || null,
      createdAt: submission.exam.createdAt.toISOString(),
    },
    user: {
      id: submission.user.id,
      email: submission.user.email,
      name: submission.user.name,
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#f0f2f5] overflow-hidden">
      <AnalysisClient 
        submission={serializedSubmission as any} 
        leaderboard={leaderboard}
        topScore={topScore}
        currentUserId={user.id}
      />
    </div>
  );
}
