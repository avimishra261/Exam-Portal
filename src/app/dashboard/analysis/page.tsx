import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import PieChart from '@/components/PieChart';
import AIInsights from '@/components/AIInsights';

export default async function AnalysisPage() {
  const user = await getUser();
  if (!user) redirect('/login');

  // For admin: show all submissions grouped by test. For student: only their own.
  const whereClause = user.role === 'ADMIN' ? {} : { userId: user.id };

  const submissions = await prisma.submission.findMany({
    where: whereClause,
    include: {
      exam: { include: { questions: true } },
      user: true,
      answers: { include: { question: { include: { options: true } } } }
    },
    orderBy: { submittedAt: 'desc' }
  });

  if (submissions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-gray-800">Analysis</h2>
          <p className="text-gray-500 mt-1">Detailed per-test performance analysis.</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-400">No tests have been taken yet. Take a test to see analysis here.</p>
          <Link href="/dashboard/tests" className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700">
            Browse Tests
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-800">Analysis</h2>
        <p className="text-gray-500 mt-1">
          {user.role === 'ADMIN'
            ? 'Detailed per-test analysis across all students.'
            : 'Detailed per-test analysis of your performance.'}
        </p>
      </div>

      {user.role !== 'ADMIN' && <AIInsights />}

      {submissions.map(sub => {
        const score = sub.score || 0;
        const maxScore = sub.maxScore || 1;
        const percentage = Math.round((Math.max(score, 0) / maxScore) * 100);

        // Stats for Pie Chart (Count based)
        let correctCount = 0;
        let wrongCount = 0;
        let unattemptedCount = 0;

        // Breakdown by question type (Marks based)
        const typeMap: Record<string, { totalMarks: number; obtainedMarks: number }> = {};
        
        for (const ans of sub.answers) {
          const qType = ans.question.type;
          const maxQMarks = ans.question.maxMarks || 1;
          const obtainedQMarks = ans.marksObtained || 0;

          if (!typeMap[qType]) typeMap[qType] = { totalMarks: 0, obtainedMarks: 0 };
          typeMap[qType].totalMarks += maxQMarks;
          typeMap[qType].obtainedMarks += Math.max(0, obtainedQMarks); // Don't show negative marks in type progress bar

          // For pie chart count:
          // Unattempted: null answers or empty arrays
          if (ans.selectedOptionIds === null && ans.numericAnswer === null && !ans.textAnswer) {
            unattemptedCount++;
          } else if (obtainedQMarks > 0) {
            correctCount++;
          } else {
            wrongCount++;
          }
        }

        const pieSegments = [
          { label: 'Correct', value: correctCount, color: '#22c55e' },
          { label: 'Wrong', value: wrongCount, color: '#ef4444' },
          { label: 'Unattempted', value: unattemptedCount, color: '#e5e7eb' },
        ];

        return (
          <div key={sub.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{sub.exam.title}</h3>
                {user.role === 'ADMIN' && (
                  <p className="text-sm font-medium text-blue-600 mt-1">Student: {sub.user.email}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Submitted: {new Date(sub.submittedAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">{percentage}%</p>
                <p className="text-sm font-medium text-gray-600">Marks: {score.toFixed(2)} / {maxScore}</p>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="flex flex-col items-center justify-center border-r border-gray-100 pr-0 lg:pr-8">
                <h4 className="font-bold text-gray-700 mb-6">Question Status</h4>
                <PieChart segments={pieSegments} size={180} />
              </div>
              
              <div className="col-span-1 lg:col-span-2">
                <h4 className="font-bold text-gray-700 mb-6">Type-wise Marks Breakdown</h4>
                <div className="space-y-5">
                  {Object.entries(typeMap).map(([type, data]) => {
                    const pct = data.totalMarks > 0 ? Math.round((data.obtainedMarks / data.totalMarks) * 100) : 0;
                    return (
                      <div key={type}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-semibold text-gray-600 uppercase">{type}</span>
                          <span className="text-gray-500">{data.obtainedMarks.toFixed(1)} / {data.totalMarks} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-blue-500' : 'bg-amber-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Detailed Analysis Link */}
            <div className="border-t border-gray-100 bg-gray-50 p-4 flex justify-center">
              <Link
                href={`/dashboard/analysis/${sub.id}`}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition shadow-sm"
              >
                View Detailed Analysis
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
