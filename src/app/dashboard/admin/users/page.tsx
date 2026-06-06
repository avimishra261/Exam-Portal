import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import UserTable from './UserTable';

export default async function ManageUsersPage() {
  const currentUser = await getUser();
  if (!currentUser || currentUser.role !== 'ADMIN') redirect('/dashboard');

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });

  // Serialize dates for client component
  const serializedUsers = users.map(u => ({
    id: u.id,
    email: u.email,
    role: u.role,
    isSuperAdmin: u.isSuperAdmin,
    createdAt: u.createdAt.toISOString()
  }));

  const exams = await prisma.exam.findMany({ select: { id: true, title: true, maxAttempts: true } });
  const overrides = await prisma.attemptOverride.findMany();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Manage Users</h2>
      <p className="text-gray-500 mb-6">View and manage all registered users. Actions are role-restricted.</p>

      <UserTable
        users={serializedUsers}
        currentUser={{
          id: currentUser.id,
          role: currentUser.role,
          isSuperAdmin: currentUser.isSuperAdmin
        }}
        exams={exams}
        overrides={overrides}
      />
    </div>
  );
}
