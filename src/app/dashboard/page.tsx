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

  const allSubmissions = await prisma.submission.findMany({
    where: { userId: user.id }
  });

  const completedSubmissions = allSubmissions.filter(s => s.status === 'COMPLETED');
  const inProgressMap = new Set(allSubmissions.filter(s => s.status === 'IN_PROGRESS').map(s => s.examId));

  const submissionsByExam: Record<string, number> = {};
  completedSubmissions.forEach(s => {
    submissionsByExam[s.examId] = (submissionsByExam[s.examId] || 0) + 1;
  });

  const overrides = await prisma.attemptOverride.findMany({
    where: { userId: user.id }
  });
  const overrideMap = new Map(overrides.map(o => [o.examId, o.allowedAttempts]));

  // Active tests: started and not ended, not fully taken
  const activeTests = allExams.filter(e => {
    if (e.isDraft) return false;
    if (e.startTime && e.startTime > now) return false;
    if (e.endTime && e.endTime < now) return false;

    const attemptsTaken = submissionsByExam[e.id] || 0;
    const allowedAttempts = overrideMap.has(e.id) ? overrideMap.get(e.id)! : e.maxAttempts;
    const hasAttemptsLeft = attemptsTaken < allowedAttempts;

    return hasAttemptsLeft || inProgressMap.has(e.id);
  });

  // Upcoming tests
  const upcomingTests = allExams.filter(e => {
    if (!e.startTime) return false;
    const daysUntil = (e.startTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return e.startTime > now && daysUntil <= (e.upcomingDays || 10);
  });

  const totalTests = submissions.length;
  const avgScore = totalTests > 0
    ? (submissions.reduce((sum, s) => sum + (s.score || 0), 0) / totalTests).toFixed(2)
    : '—';

  // Fetch bookmarked questions for this user
  const bookmarkedAnswers = await prisma.submissionAnswer.findMany({
    where: {
      submission: { userId: user.id },
      isBookmarked: true,
    },
    include: { question: true, submission: { include: { exam: true } } },
    orderBy: { submission: { submittedAt: 'desc' } },
    take: 5
  });

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
                  <p className="font-bold text-blue-600">{sub.score !== null ? sub.score.toFixed(2) : 'N/A'} pts</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Bookmarked Questions Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Recent Bookmarks</h3>
          <p className="text-sm text-gray-500 font-medium">Your saved questions for review</p>
        </div>
        {bookmarkedAnswers.length === 0 ? (
          <p className="text-sm text-gray-500">You haven't bookmarked any questions yet. You can bookmark questions from the analysis page after completing a test.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {bookmarkedAnswers.map((ans, i) => (
              <li key={ans.id} className="py-4">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{ans.submission.exam.title}</p>
                  <Link href={`/dashboard/analysis/${ans.submissionId}`} className="text-xs text-blue-600 hover:underline">View in Analysis &rarr;</Link>
                </div>
                <div className="text-sm text-gray-800 line-clamp-2" dangerouslySetInnerHTML={{ __html: ans.question.text }} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
