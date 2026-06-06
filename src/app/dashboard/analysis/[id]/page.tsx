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

  // Serialize dates to avoid passing Date objects to client component
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
      email: submission.user.email,
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#f0f2f5] overflow-hidden">
      <AnalysisClient submission={serializedSubmission as any} />
    </div>
  );
}
