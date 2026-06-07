import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import BatchesClient from './BatchesClient';

export default async function BatchesPage() {
  const user = await getUser();
  if (!user || user.role !== 'ADMIN') redirect('/dashboard');

  const batches = await prisma.batch.findMany({
    include: {
      _count: {
        select: { users: true, exams: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Manage Batches</h2>
          <p className="text-gray-500">Create batches and assign them to students and exams.</p>
        </div>
      </div>
      
      <BatchesClient batches={batches} />
    </div>
  );
}
