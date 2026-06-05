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

            {/* Per-Question Breakdown */}
            <div className="border-t border-gray-100 bg-gray-50">
              <details className="group">
                <summary className="p-4 text-sm font-bold text-blue-600 cursor-pointer hover:bg-blue-50 transition list-none flex justify-center">
                  View Question-by-Question Details ▼
                </summary>
                <div className="p-6 pt-2 space-y-3 bg-white">
                  {sub.answers.map((ans, i) => {
                    const obtained = ans.marksObtained || 0;
                    const max = ans.question.maxMarks || 1;
                    const isCorrect = obtained > 0;
                    const isNegative = obtained < 0;

                    let yourAnswer = '—';
                    let correctAnswer = '—';

                    if (ans.question.type === 'MCQ') {
                      const correctOpt = ans.question.options.find(o => o.isCorrect);
                      const selectedOpt = ans.question.options.find(o => o.id === ans.selectedOptionIds);
                      yourAnswer = selectedOpt?.text || '(none)';
                      correctAnswer = correctOpt?.text || '—';
                    } else if (ans.question.type === 'MSQ') {
                      const selectedIds = (ans.selectedOptionIds || '').split(',').filter(Boolean);
                      yourAnswer = selectedIds.map(sid => ans.question.options.find(o => o.id === sid)?.text).filter(Boolean).join(', ') || '(none)';
                      correctAnswer = ans.question.options.filter(o => o.isCorrect).map(o => o.text).join(', ');
                    } else if (ans.question.type === 'NAT') {
                      yourAnswer = ans.numericAnswer?.toString() || '(none)';
                      correctAnswer = ans.question.correctNumeric?.toString() || '—';
                    } else if (ans.question.type === 'DESCRIPTIVE') {
                      yourAnswer = ans.textAnswer || '(none)';
                      correctAnswer = ans.question.correctText || 'AI Graded based on Rubric';
                    }

                    return (
                      <div key={ans.id} className={`flex flex-col md:flex-row gap-4 p-4 rounded-lg border ${isCorrect ? 'border-green-200 bg-green-50/30' : isNegative ? 'border-red-200 bg-red-50/30' : 'border-gray-200 bg-gray-50/50'}`}>
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${isCorrect ? 'bg-green-100 text-green-700' : isNegative ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-500'}`}>
                            Q{i + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-2">{ans.question.text}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                              <p className="text-gray-600">Your answer:<br/><span className="font-medium text-gray-900">{yourAnswer}</span></p>
                              {!isCorrect && ans.question.type !== 'DESCRIPTIVE' && (
                                <p className="text-green-700">Correct Answer:<br/><span className="font-medium">{correctAnswer}</span></p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className={`flex-shrink-0 text-right md:text-center px-4 py-2 rounded-lg border ${isCorrect ? 'bg-green-100 border-green-200 text-green-800' : isNegative ? 'bg-red-100 border-red-200 text-red-800' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                          <p className="text-[10px] uppercase font-bold tracking-wider mb-1">Marks</p>
                          <p className="text-lg font-black">{obtained > 0 ? '+' : ''}{obtained.toFixed(2)}</p>
                          <p className="text-[10px] text-gray-500">out of {max}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            </div>
          </div>
        );
      })}
    </div>
  );
}
