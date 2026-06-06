import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminTestsClient from './AdminTestsClient';

export default async function AdminTestsPage() {
  const user = await getUser();
  if (!user || user.role !== 'ADMIN') redirect('/dashboard');

  const tests = await prisma.exam.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { questions: true, submissions: true }
      }
    }
  });

  const serializedTests = tests.map(t => ({
    id: t.id,
    title: t.title,
    isDraft: t.isDraft,
    startTime: t.startTime ? t.startTime.toISOString() : null,
    endTime: t.endTime ? t.endTime.toISOString() : null,
    durationMinutes: t.durationMinutes,
    questionsCount: t._count.questions,
    submissionsCount: t._count.submissions
  }));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manage Tests</h2>
          <p className="text-gray-500 mt-1">Create, edit, upload and manage all tests.</p>
        </div>
      </div>
      <AdminTestsClient initialTests={serializedTests} />
    </div>
  );
}
