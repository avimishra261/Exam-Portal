import { getUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Link from 'next/link';

export default async function DashboardHome() {
  const user = await getUser();
  if (!user) return null;

  const now = new Date();

  const allExams = await prisma.exam.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const submissions = await prisma.submission.findMany({
    where: { userId: user.id },
    include: { exam: true },
    orderBy: { submittedAt: 'desc' },
    take: 5
  });

  const takenIds = new Set(submissions.map(s => s.examId));

  // Active tests: started and not ended, not taken
  const activeTests = allExams.filter(e => {
    if (!e.startTime || !e.endTime) return false;
    return e.startTime <= now && e.endTime > now && !takenIds.has(e.id);
  });

  // Upcoming tests
  const upcomingTests = allExams.filter(e => {
    if (!e.startTime) return false;
    const daysUntil = (e.startTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return e.startTime > now && daysUntil <= (e.upcomingDays || 10);
  });

  const totalTests = submissions.length;
  const avgScore = totalTests > 0
    ? (submissions.reduce((sum, s) => sum + (s.score || 0), 0) / totalTests).toFixed(1)
    : '—';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Welcome back, {user.firstName ? `${user.firstName} ${user.lastName}` : user.email}!</h2>
        <p className="text-gray-500">Here is your recent activity overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Tests</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{activeTests.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Upcoming</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{upcomingTests.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tests Taken</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{totalTests}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Avg Score</p>
          <p className="text-3xl font-bold text-purple-600 mt-1">{avgScore}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Tests */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Active Tests</h3>
            <Link href="/dashboard/tests" className="text-sm text-blue-600 font-medium">View All</Link>
          </div>
          {activeTests.length === 0 ? (
            <p className="text-sm text-gray-500">No active tests right now.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {activeTests.slice(0, 5).map(ex => (
                <li key={ex.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">{ex.title}</p>
                    <p className="text-xs text-gray-500">{ex.durationMinutes} mins</p>
                  </div>
                  {user.role === 'STUDENT' && (
                    <Link href={`/dashboard/tests/${ex.id}`} className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100">
                      Take Test
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Scores */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Recent Scores</h3>
            <Link href="/dashboard/analysis" className="text-sm text-blue-600 font-medium">View Analysis</Link>
          </div>
          {submissions.length === 0 ? (
            <p className="text-sm text-gray-500">You haven&apos;t taken any tests yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {submissions.map(sub => (
                <li key={sub.id} className="py-3 flex justify-between items-center">
                  <p className="font-medium text-gray-800">{sub.exam.title}</p>
                  <p className="font-bold text-blue-600">{sub.score} pts</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
