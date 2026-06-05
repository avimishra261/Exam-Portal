import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function TestsPage() {
  const user = await getUser();
  if (!user) redirect('/login');

  const now = new Date();

  const allExams = await prisma.exam.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { questions: true } } }
  });

  const submissions = await prisma.submission.findMany({
    where: { userId: user.id }
  });

  const takenExamIds = new Set(submissions.map(s => s.examId));

  // Categorize tests
  const active: typeof allExams = [];
  const upcoming: typeof allExams = [];
  const completed: typeof allExams = [];
  const missed: typeof allExams = [];

  for (const exam of allExams) {
    if (takenExamIds.has(exam.id)) {
      completed.push(exam);
      continue;
    }

    if (!exam.startTime || !exam.endTime) {
      // Tests without scheduling are always active
      active.push(exam);
      continue;
    }

    if (exam.startTime > now) {
      const daysUntil = (exam.startTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      if (daysUntil <= (exam.upcomingDays || 10)) {
        upcoming.push(exam);
      }
      // else: too far in the future, don't show
    } else if (exam.endTime > now) {
      active.push(exam);
    } else {
      // Past deadline and not taken
      missed.push(exam);
    }
  }

  const tabs = [
    { label: 'Active', tests: active, color: 'blue', emptyMsg: 'No active tests right now.' },
    { label: 'Upcoming', tests: upcoming, color: 'amber', emptyMsg: 'No upcoming tests.' },
    { label: 'Completed', tests: completed, color: 'green', emptyMsg: 'You haven\'t completed any tests yet.' },
    { label: 'Missed', tests: missed, color: 'red', emptyMsg: 'No missed tests. Great job!' },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-800">Tests</h2>
        <p className="text-gray-500 mt-1">Browse all available tests organized by status.</p>
      </div>

      {tabs.map(tab => (
        <div key={tab.label}>
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-lg font-semibold text-gray-800">{tab.label}</h3>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-${tab.color}-100 text-${tab.color}-700`}>
              {tab.tests.length}
            </span>
          </div>

          {tab.tests.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
              <p className="text-gray-400 text-sm">{tab.emptyMsg}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tab.tests.map(ex => (
                <div key={ex.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition">
                  <h4 className="text-base font-semibold text-gray-800 mb-1">{ex.title}</h4>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{ex.description || 'No description.'}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                    <span>{ex.durationMinutes} mins</span>
                    <span>{ex._count.questions} Qs</span>
                  </div>
                  {ex.startTime && (
                    <p className="text-xs text-gray-400 mb-3">
                      {tab.label === 'Active' && `Ends: ${ex.endTime?.toLocaleDateString()}`}
                      {tab.label === 'Upcoming' && `Starts: ${ex.startTime.toLocaleDateString()}`}
                      {tab.label === 'Missed' && `Ended: ${ex.endTime?.toLocaleDateString()}`}
                    </p>
                  )}
                  <div className="flex justify-end">
                    {tab.label === 'Active' && user.role === 'STUDENT' && (
                      <Link href={`/dashboard/tests/${ex.id}`} className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
                        Take Test
                      </Link>
                    )}
                    {tab.label === 'Completed' && (
                      <span className="px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-lg">
                        ✓ Completed
                      </span>
                    )}
                    {tab.label === 'Upcoming' && (
                      <span className="px-3 py-1.5 bg-amber-50 text-amber-700 text-sm font-medium rounded-lg">
                        Starts Soon
                      </span>
                    )}
                    {tab.label === 'Missed' && (
                      <span className="px-3 py-1.5 bg-red-50 text-red-700 text-sm font-medium rounded-lg">
                        Missed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
