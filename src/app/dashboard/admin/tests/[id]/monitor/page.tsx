import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function MonitorTestPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user || user.role !== 'ADMIN') redirect('/dashboard');

  const resolvedParams = await params;

  const exam = await prisma.exam.findUnique({
    where: { id: resolvedParams.id },
    include: {
      submissions: {
        where: { status: 'IN_PROGRESS' },
        include: { user: true }
      }
    }
  });

  if (!exam) return <div>Test not found</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Live Monitor: {exam.title}</h2>
          <p className="text-gray-500 mt-1">Students currently taking this test. (Refresh to update)</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-6">
        {exam.submissions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No students are currently taking this test.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exam.submissions.map(sub => (
              <div key={sub.id} className="border border-indigo-100 rounded-xl p-4 bg-indigo-50">
                <p className="font-bold text-indigo-900">{sub.user.firstName ? `${sub.user.firstName} ${sub.user.lastName}` : sub.user.email}</p>
                <p className="text-sm text-indigo-700">{sub.user.email}</p>
                <div className="mt-2 text-xs text-indigo-600 font-medium flex justify-between">
                  <span>Started: {new Date(sub.submittedAt).toLocaleTimeString()}</span>
                  <span>Time Left: {sub.timeLeft ? Math.floor(sub.timeLeft / 60) + 'm' : 'N/A'}</span>
                </div>
                <div className="mt-1 flex justify-between items-center">
                  <div className="text-xs text-red-600 font-medium">
                    Fullscreen Exits: {sub.fullscreenExitCount}
                  </div>
                  <a href={`/dashboard/admin/tests/${resolvedParams.id}/monitor/${sub.id}`} target="_blank" rel="noopener noreferrer" className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700">
                    View Live
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
