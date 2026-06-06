import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AIInsights from '@/components/AIInsights';
import PieChart from '@/components/PieChart';

export default async function ReportsPage() {
  const user = await getUser();
  if (!user) redirect('/login');

  const whereClause = user.role === 'ADMIN' ? {} : { userId: user.id };

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

  // Cumulative stats
  const totalTests = submissions.length;
  
  let totalScoreObtained = 0;
  let totalMaxScore = 0;
  
  let totalCorrectAnswers = 0;
  let totalWrongAnswers = 0;
  let totalUnattempted = 0;

  // Per-type cumulative (marks based)
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
      typeStats[qType].obtainedMarks += Math.max(0, obtained); // Non-negative for progress bar

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

  // Score trend data
  const scoreTrend = await Promise.all(submissions.map(async s => {
    const score = Math.max(0, s.score || 0);
    const max = s.maxScore || 1;
    
    // Calculate rank
    const higherScoresCount = await prisma.submission.count({
      where: {
        examId: s.examId,
        status: 'COMPLETED',
        score: { gt: score }
      }
    });
    
    const sameScoreEarlierCount = await prisma.submission.count({
      where: {
        examId: s.examId,
        status: 'COMPLETED',
        score: score,
        submittedAt: { lt: s.submittedAt }
      }
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

  // Best and worst
  const bestTest = scoreTrend.reduce((best, curr) => curr.pct > best.pct ? curr : best, scoreTrend[0]);
  const worstTest = scoreTrend.reduce((worst, curr) => curr.pct < worst.pct ? curr : worst, scoreTrend[0]);

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
        <p className="text-gray-500 mt-1">
          {user.role === 'ADMIN'
            ? 'Cumulative performance report across all students and tests.'
            : 'Your cumulative performance across all tests combined.'}
        </p>
      </div>

      {user.role !== 'ADMIN' && <AIInsights />}

      {/* Summary Cards */}
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

        {/* Type-wise Accuracy */}
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

      {/* Highlights */}
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

      {/* Score Trend Table */}
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
                    <a href={`/dashboard/analysis/${s.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                      View Analysis
                    </a>
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
