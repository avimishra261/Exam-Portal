import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import NotificationsClient from './NotificationsClient';

export default async function NotificationsPage() {
  const user = await getUser();
  if (!user || user.role !== 'ADMIN') redirect('/dashboard');

  const pendingRequests = await prisma.nameChangeRequest.findMany({
    where: { status: 'PENDING' },
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });

  const logs = await prisma.adminLog.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-12">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Name Change Requests</h2>
        <p className="text-gray-500 mb-6">Review and approve name change requests from students.</p>
        <NotificationsClient requests={pendingRequests} />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Admin Logs</h2>
        <p className="text-gray-500 mb-6">Recent activity logs (e.g. mobile/password changes by students).</p>
        
        <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto border border-gray-200">
          {logs.length === 0 ? (
            <p className="text-gray-500 text-sm">No recent logs.</p>
          ) : (
            <ul className="space-y-3">
              {logs.map(log => (
                <li key={log.id} className="text-sm">
                  <span className="text-gray-500 font-mono text-xs mr-3">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                  <span className="font-medium text-gray-800">
                    {log.user?.email || 'Unknown User'}
                  </span>
                  <span className="text-gray-600 ml-2">
                    {log.message}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
