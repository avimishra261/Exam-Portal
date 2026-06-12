import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import UserTable from '../../users/UserTable';

export default async function BatchDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await getUser();
  if (!user || user.role !== 'ADMIN') redirect('/dashboard');

  const batch = await prisma.batch.findUnique({
    where: { id: resolvedParams.id }
  });

  if (!batch) redirect('/dashboard/admin/batches');

  const users = await prisma.user.findMany({
    where: { batchId: batch.id },
    orderBy: { createdAt: 'desc' }
  });

  const serializedUsers = users.map(u => ({
    id: u.id,
    email: u.email,
    role: u.role,
    isSuperAdmin: u.isSuperAdmin,
    createdAt: u.createdAt.toISOString()
  }));

  const exams = await prisma.exam.findMany({ select: { id: true, title: true, maxAttempts: true } });
  const overrides = await prisma.attemptOverride.findMany();
  const bannedStudents = await prisma.bannedStudent.findMany();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/dashboard/admin/batches" className="text-gray-400 hover:text-gray-600 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </Link>
          <h2 className="text-2xl font-bold text-gray-800">Batch: {batch.name}</h2>
          {batch.isDefault && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Default</span>}
        </div>
        <p className="text-gray-500 ml-10">Manage users enrolled in this batch.</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Enrolled Students ({users.length})</h3>
        {users.length === 0 ? (
          <p className="text-gray-500 text-sm">No students currently enrolled in this batch.</p>
        ) : (
          <UserTable
            users={serializedUsers}
            currentUser={{
              id: user.id,
              role: user.role,
              isSuperAdmin: user.isSuperAdmin
            }}
            exams={exams}
            overrides={overrides}
            bannedStudents={bannedStudents}
          />
        )}
      </div>
    </div>
  );
}
