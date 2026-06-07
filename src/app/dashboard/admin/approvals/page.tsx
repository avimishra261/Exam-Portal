import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ApprovalsClient from './ApprovalsClient';

export default async function ApprovalsPage() {
  const user = await getUser();
  if (!user || user.role !== 'ADMIN') redirect('/dashboard');

  const pendingStudents = await prisma.user.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Student Approvals</h2>
          <p className="text-gray-500">Review and approve new student registrations.</p>
        </div>
      </div>
      
      <ApprovalsClient students={pendingStudents} />
    </div>
  );
}
