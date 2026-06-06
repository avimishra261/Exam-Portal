import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LiveMonitorClient from './LiveMonitorClient';

export default async function LiveMonitorDetailedPage({ params }: { params: Promise<{ id: string, submissionId: string }> }) {
  const user = await getUser();
  if (!user || user.role !== 'ADMIN') redirect('/dashboard');

  const resolvedParams = await params;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Live Student Monitor</h2>
          <p className="text-gray-500 mt-1">Viewing a live feed of the student's current test attempt. Updates every 5 seconds.</p>
        </div>
        <a href={`/dashboard/admin/tests/${resolvedParams.id}/monitor`} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-bold transition">
          Back to Student List
        </a>
      </div>
      
      <LiveMonitorClient submissionId={resolvedParams.submissionId} />
    </div>
  );
}
