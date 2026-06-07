import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { submitExamAction } from '@/app/actions/student';
import TestEngine from '@/components/TestEngine';

export default async function TakeTestPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) redirect('/login');

  const { id } = await params;

  const exam = await prisma.exam.findUnique({
    where: { id },
    include: { questions: { include: { options: true } } }
  });

  if (!exam) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-red-600 mb-2">Not Found</h2>
        <p className="text-gray-600">This test does not exist.</p>
      </div>
    );
  }

  // Admins cannot take tests
  if (user.role === 'ADMIN') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-amber-600 mb-2">Admin View Only</h2>
        <p className="text-gray-600 mb-4">Admins cannot take tests. You can only view the test structure.</p>
        <div className="text-left mt-6 space-y-4">
          <p className="text-sm font-semibold text-gray-700">Test: {exam.title}</p>
          <p className="text-sm text-gray-500">Duration: {exam.durationMinutes} minutes</p>
          <p className="text-sm text-gray-500">Questions: {exam.questions.length}</p>
          <div className="border-t pt-4 space-y-2">
            {exam.questions.map((q, i) => (
              <div key={q.id} className="text-sm text-gray-600">
                <span className="font-medium">Q{i + 1}.</span> {q.text} <span className="text-xs text-gray-400 uppercase">({q.type})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const completedSubmissionsCount = await prisma.submission.count({
    where: { examId: exam.id, userId: user.id, status: 'COMPLETED' }
  });

  const draftSubmission = await prisma.submission.findFirst({
    where: { examId: exam.id, userId: user.id, status: 'IN_PROGRESS' },
    include: { answers: true }
  });

  const initialAnswers: Record<string, any> = {};
  if (draftSubmission) {
    draftSubmission.answers.forEach(a => {
      if (a.selectedOptionIds) {
        const q = exam.questions.find(q => q.id === a.questionId);
        if (q?.type === 'MSQ') initialAnswers[a.questionId] = a.selectedOptionIds.split(',');
        else initialAnswers[a.questionId] = a.selectedOptionIds;
      } else if (a.numericAnswer !== null) {
        initialAnswers[a.questionId] = a.numericAnswer.toString();
      } else if (a.textAnswer !== null) {
        initialAnswers[a.questionId] = a.textAnswer;
      }
    });
  }

  const override = await prisma.attemptOverride.findUnique({
    where: {
      examId_userId: { examId: exam.id, userId: user.id }
    }
  });

  const allowedAttempts = override ? override.allowedAttempts : exam.maxAttempts;

  const currentAttemptNumber = completedSubmissionsCount + 1;
  const attemptSeed = `${user.id}_${exam.id}_${currentAttemptNumber}`;

  if (completedSubmissionsCount >= allowedAttempts && !draftSubmission) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-red-600 mb-2">Attempts Exhausted</h2>
        <p className="text-gray-600 mb-6">You have used all {allowedAttempts} attempt(s) for this test.</p>
        <a href="/dashboard/analysis" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700">View Analysis</a>
      </div>
    );
  }

  const submitAction = async (formData: FormData) => {
    'use server';
    await submitExamAction(id, formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col h-screen overflow-hidden">
      <TestEngine 
        exam={exam as any} 
        studentName={user.firstName ? `${user.firstName} ${user.lastName}` : user.email}
        initialAnswers={initialAnswers}
        initialTimeLeft={draftSubmission?.timeLeft ?? undefined}
        initialExitCount={draftSubmission?.fullscreenExitCount ?? 0}
        attemptSeed={attemptSeed}
        onSubmit={submitAction} 
      />
    </div>
  );
}
