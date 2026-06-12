import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AIInsights from '@/components/AIInsights';
import PieChart from '@/components/PieChart';

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const currentTab = resolvedSearchParams?.tab || 'test';
  const user = await getUser();
  if (!user) redirect('/login');

  const isAdmin = user.role === 'ADMIN';

  // --- TAB: BATCH-WISE (Admin only) ---
  if (isAdmin && currentTab === 'batch') {
    const batches = await prisma.batch.findMany({
      include: {
        users: {
          include: {
            submissions: { where: { status: 'COMPLETED' } }
          }
        }
      }
    });

    const batchStats = batches.map(b => {
      let totalScore = 0;
      let totalMax = 0;
      let testsTaken = 0;
      b.users.forEach(u => {
        u.submissions.forEach(s => {
          totalScore += Math.max(0, s.score || 0);
          totalMax += (s.maxScore || 1);
          testsTaken++;
        });
      });
      const accuracy = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
      return { id: b.id, name: b.name, studentsCount: b.users.length, testsTaken, accuracy };
    }).sort((a, b) => b.accuracy - a.accuracy);

    return (
      <div className="space-y-6 pb-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
          <p className="text-gray-500 mt-1">Batch-wise performance analysis.</p>
          <div className="flex space-x-4 mt-6 border-b border-gray-100">
            <Link href="?tab=test" className="pb-3 text-sm font-semibold border-b-2 border-transparent text-gray-500 hover:text-gray-800">Test-wise</Link>
            <Link href="?tab=batch" className="pb-3 text-sm font-semibold border-b-2 border-blue-600 text-blue-600">Batch-wise</Link>
            <Link href="?tab=student" className="pb-3 text-sm font-semibold border-b-2 border-transparent text-gray-500 hover:text-gray-800">Student-wise</Link>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs font-bold uppercase tracking-wider">
                <th className="p-4 border-b border-gray-200">Batch Name</th>
                <th className="p-4 border-b border-gray-200">Students</th>
                <th className="p-4 border-b border-gray-200">Tests Taken</th>
                <th className="p-4 border-b border-gray-200">Avg Accuracy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {batchStats.map(b => (
                <tr key={b.id} className="hover:bg-gray-50/50 transition">
                  <td className="p-4 font-bold text-gray-900">{b.name}</td>
                  <td className="p-4 text-gray-600">{b.studentsCount}</td>
                  <td className="p-4 text-gray-600">{b.testsTaken}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${b.accuracy >= 70 ? 'bg-green-100 text-green-700' : b.accuracy >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {b.accuracy}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- TAB: STUDENT-WISE (Admin only) ---
  if (isAdmin && currentTab === 'student') {
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: {
        submissions: { where: { status: 'COMPLETED' } },
        batch: true
      }
    });

    const studentStats = students.map(u => {
      let totalScore = 0;
      let totalMax = 0;
      let testsTaken = u.submissions.length;
      u.submissions.forEach(s => {
        totalScore += Math.max(0, s.score || 0);
        totalMax += (s.maxScore || 1);
      });
      const accuracy = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
      return { id: u.id, name: u.firstName ? `${u.firstName} ${u.lastName}` : u.email, batch: u.batch?.name || 'None', testsTaken, totalScore, accuracy };
    }).sort((a, b) => b.accuracy - a.accuracy);

    return (
      <div className="space-y-6 pb-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
          <p className="text-gray-500 mt-1">Student-wise performance analysis.</p>
          <div className="flex space-x-4 mt-6 border-b border-gray-100">
            <Link href="?tab=test" className="pb-3 text-sm font-semibold border-b-2 border-transparent text-gray-500 hover:text-gray-800">Test-wise</Link>
            <Link href="?tab=batch" className="pb-3 text-sm font-semibold border-b-2 border-transparent text-gray-500 hover:text-gray-800">Batch-wise</Link>
            <Link href="?tab=student" className="pb-3 text-sm font-semibold border-b-2 border-blue-600 text-blue-600">Student-wise</Link>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs font-bold uppercase tracking-wider">
                <th className="p-4 border-b border-gray-200">Student Name</th>
                <th className="p-4 border-b border-gray-200">Batch</th>
                <th className="p-4 border-b border-gray-200">Tests Taken</th>
                <th className="p-4 border-b border-gray-200">Total Marks</th>
                <th className="p-4 border-b border-gray-200">Avg Accuracy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {studentStats.map(s => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition">
                  <td className="p-4 font-bold text-gray-900">{s.name}</td>
                  <td className="p-4 text-gray-600">{s.batch}</td>
                  <td className="p-4 text-gray-600">{s.testsTaken}</td>
                  <td className="p-4 text-gray-600">{s.totalScore.toFixed(1)}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${s.accuracy >= 70 ? 'bg-green-100 text-green-700' : s.accuracy >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {s.accuracy}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- TAB: TEST-WISE (Default & Student View) ---
  const whereClause = isAdmin ? {} : { userId: user.id };

  const submissions = await prisma.submission.findMany({
    where: whereClause,
    include: {
      exam: { include: { questions: true } },
      user: true,
      answers: { include: { question: { include: { options: true } } } }
    },
    orderBy: { submittedAt: 'asc' }
  });

  if (submissions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
          <p className="text-gray-500 mt-1">Cumulative performance across all tests.</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-400">No data available yet. Complete some tests to see your cumulative report.</p>
        </div>
      </div>
    );
  }

  const totalTests = submissions.length;
  let totalScoreObtained = 0;
  let totalMaxScore = 0;
  let totalCorrectAnswers = 0;
  let totalWrongAnswers = 0;
  let totalUnattempted = 0;
  const typeStats: Record<string, { totalMarks: number; obtainedMarks: number }> = {};
  
  for (const sub of submissions) {
    totalScoreObtained += Math.max(0, sub.score || 0);
    totalMaxScore += (sub.maxScore || 1);

    for (const ans of sub.answers) {
      const qType = ans.question.type;
      const obtained = ans.marksObtained || 0;
      const maxMarks = ans.question.maxMarks || 1;

      if (!typeStats[qType]) typeStats[qType] = { totalMarks: 0, obtainedMarks: 0 };
      typeStats[qType].totalMarks += maxMarks;
      typeStats[qType].obtainedMarks += Math.max(0, obtained);

      if (ans.selectedOptionIds === null && ans.numericAnswer === null && !ans.textAnswer) {
        totalUnattempted++;
      } else if (obtained > 0) {
        totalCorrectAnswers++;
      } else {
        totalWrongAnswers++;
      }
    }
  }

  const overallAccuracy = totalMaxScore > 0 ? Math.round((totalScoreObtained / totalMaxScore) * 100) : 0;

  const pieSegments = [
    { label: 'Correct', value: totalCorrectAnswers, color: '#22c55e' },
    { label: 'Wrong', value: totalWrongAnswers, color: '#ef4444' },
    { label: 'Unattempted', value: totalUnattempted, color: '#e5e7eb' },
  ];

  const scoreTrend = await Promise.all(submissions.map(async s => {
    const score = Math.max(0, s.score || 0);
    const max = s.maxScore || 1;
    
    const higherScoresCount = await prisma.submission.count({
      where: { examId: s.examId, status: 'COMPLETED', score: { gt: score } }
    });
    const sameScoreEarlierCount = await prisma.submission.count({
      where: { examId: s.examId, status: 'COMPLETED', score: score, submittedAt: { lt: s.submittedAt } }
    });
    const rank = higherScoresCount + sameScoreEarlierCount + 1;

    return {
      id: s.id,
      title: s.exam.title,
      score: score,
      total: max,
      pct: Math.round((score / max) * 100),
      date: s.submittedAt,
      rank
    };
  }));

  const bestTest = scoreTrend.reduce((best, curr) => curr.pct > best.pct ? curr : best, scoreTrend[0]);
  const worstTest = scoreTrend.reduce((worst, curr) => curr.pct < worst.pct ? curr : worst, scoreTrend[0]);

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
        <p className="text-gray-500 mt-1">
          {isAdmin ? 'Cumulative performance report across all students and tests.' : 'Your cumulative performance across all tests combined.'}
        </p>
        
        {isAdmin && (
          <div className="flex space-x-4 mt-6 border-b border-gray-100">
            <Link href="?tab=test" className="pb-3 text-sm font-semibold border-b-2 border-blue-600 text-blue-600">Test-wise</Link>
            <Link href="?tab=batch" className="pb-3 text-sm font-semibold border-b-2 border-transparent text-gray-500 hover:text-gray-800">Batch-wise</Link>
            <Link href="?tab=student" className="pb-3 text-sm font-semibold border-b-2 border-transparent text-gray-500 hover:text-gray-800">Student-wise</Link>
          </div>
        )}
      </div>

      {!isAdmin && <AIInsights />}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
          <p className="text-xs font-semibold text-gray-400 uppercase">Tests Taken</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{totalTests}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
          <p className="text-xs font-semibold text-gray-400 uppercase">Total Marks</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{totalMaxScore}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
          <p className="text-xs font-semibold text-gray-400 uppercase">Marks Obtained</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{totalScoreObtained.toFixed(1)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
          <p className="text-xs font-semibold text-gray-400 uppercase">Overall Accuracy</p>
          <p className="text-3xl font-bold text-purple-600 mt-1">{overallAccuracy}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 w-full text-left">Overall Responses</h3>
          <PieChart segments={pieSegments} size={220} />
        </div>

        <div className="col-span-1 lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Accuracy by Question Type</h3>
          <div className="space-y-6">
            {Object.entries(typeStats).map(([type, data]) => {
              const pct = data.totalMarks > 0 ? Math.round((data.obtainedMarks / data.totalMarks) * 100) : 0;
              return (
                <div key={type}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-bold text-gray-700 uppercase">{type}</span>
                    <span className="text-sm font-medium text-gray-500">{data.obtainedMarks.toFixed(1)} / {data.totalMarks} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-blue-500' : 'bg-amber-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">Best Performance</p>
              <p className="text-xl font-bold text-green-900">{bestTest.title}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-green-700">{bestTest.pct}%</p>
              <p className="text-sm font-medium text-green-800">{bestTest.score.toFixed(1)} / {bestTest.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">Needs Improvement</p>
              <p className="text-xl font-bold text-red-900">{worstTest.title}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-red-700">{worstTest.pct}%</p>
              <p className="text-sm font-medium text-red-800">{worstTest.score.toFixed(1)} / {worstTest.total}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Score Trend</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs font-bold uppercase tracking-wider">
                <th className="p-4 border-b border-gray-200 rounded-tl-lg">#</th>
                <th className="p-4 border-b border-gray-200">Test</th>
                <th className="p-4 border-b border-gray-200">Rank</th>
                <th className="p-4 border-b border-gray-200">Marks</th>
                <th className="p-4 border-b border-gray-200">Accuracy</th>
                <th className="p-4 border-b border-gray-200 w-1/4">Progress</th>
                <th className="p-4 border-b border-gray-200">Date</th>
                <th className="p-4 border-b border-gray-200 rounded-tr-lg">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {scoreTrend.map((s, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition">
                  <td className="p-4 text-sm font-medium text-gray-500">{i + 1}</td>
                  <td className="p-4 text-sm font-bold text-gray-900">{s.title}</td>
                  <td className="p-4 text-sm font-bold text-blue-600">#{s.rank}</td>
                  <td className="p-4 text-sm font-medium text-gray-700">{s.score.toFixed(1)} / {s.total}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold ${s.pct >= 70 ? 'bg-green-100 text-green-700' : s.pct >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {s.pct}%
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${s.pct >= 70 ? 'bg-green-500' : s.pct >= 40 ? 'bg-blue-500' : 'bg-amber-500'}`}
                        style={{ width: `${s.pct}%` }}
                      />
                    </div>
                  </td>
                  <td className="p-4 text-xs font-medium text-gray-400">{new Date(s.date).toLocaleDateString()}</td>
                  <td className="p-4">
                    <Link href={`/dashboard/analysis/${s.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                      View Analysis
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
