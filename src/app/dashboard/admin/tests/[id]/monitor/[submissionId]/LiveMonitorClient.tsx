'use client';

import React, { useEffect, useState } from 'react';
import { getLiveSubmissionAction } from '@/app/actions/admin';
import { User, Clock, AlertTriangle } from 'lucide-react';

export default function LiveMonitorClient({ submissionId }: { submissionId: string }) {
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchLive = async () => {
    const data = await getLiveSubmissionAction(submissionId);
    setSubmission(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLive();
    // Poll every 5 seconds to get live updates
    const interval = setInterval(fetchLive, 5000);
    return () => clearInterval(interval);
  }, [submissionId]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading live view...</div>;
  if (!submission) return <div className="p-8 text-center text-red-500">Failed to load submission.</div>;

  const { exam, user, answers } = submission;

  const getAnswerForQuestion = (qId: string) => {
    return answers.find((a: any) => a.questionId === qId);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4">
      <div className="bg-indigo-600 text-white rounded-xl shadow-md p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
            LIVE: {exam.title}
          </h2>
          <p className="text-indigo-200 mt-1 flex items-center gap-2">
            <User className="w-4 h-4"/> {user.name || user.email}
          </p>
        </div>
        <div className="flex gap-6 text-sm font-medium bg-indigo-700/50 p-3 rounded-lg border border-indigo-500">
          <div className="flex flex-col">
            <span className="text-indigo-200 text-xs">Time Left</span>
            <span className="text-xl flex items-center gap-1">
              <Clock className="w-4 h-4"/> {submission.timeLeft ? Math.floor(submission.timeLeft / 60) + 'm' : 'N/A'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-indigo-200 text-xs">Fullscreen Exits</span>
            <span className={`text-xl flex items-center gap-1 ${submission.fullscreenExitCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
              <AlertTriangle className="w-4 h-4"/> {submission.fullscreenExitCount}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-indigo-200 text-xs">Status</span>
            <span className={`text-xl ${submission.status === 'COMPLETED' ? 'text-green-400' : 'text-yellow-400'}`}>
              {submission.status}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-8">
        {exam.questions.map((q: any, i: number) => {
          const ans = getAnswerForQuestion(q.id);
          
          return (
            <div key={q.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
              <div className="flex gap-3 mb-3">
                <span className="font-bold text-gray-800 shrink-0">Q{i + 1}.</span>
                <div className="text-gray-800 whitespace-pre-wrap">{q.text}</div>
              </div>
              <div className="pl-8">
                {q.type === 'MCQ' || q.type === 'MSQ' ? (
                  <div className="space-y-2">
                    {q.options.map((opt: any) => {
                      const isSelected = ans?.selectedOptionIds?.includes(opt.id);
                      return (
                        <div key={opt.id} className={`p-3 rounded-lg border text-sm ${isSelected ? 'bg-indigo-50 border-indigo-500 font-medium text-indigo-900' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                          {opt.text} {isSelected && <span className="float-right text-indigo-600 font-bold">(Selected)</span>}
                        </div>
                      );
                    })}
                  </div>
                ) : q.type === 'NAT' ? (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-600">Answer:</span>
                    <div className={`px-4 py-2 rounded-lg border font-mono text-sm ${ans?.numericAnswer !== undefined && ans?.numericAnswer !== null ? 'bg-indigo-50 border-indigo-500 text-indigo-900' : 'bg-gray-100 border-gray-300 text-gray-400 italic'}`}>
                      {ans?.numericAnswer !== undefined && ans?.numericAnswer !== null ? ans.numericAnswer : 'Not attempted'}
                    </div>
                  </div>
                ) : q.type === 'DESCRIPTIVE' ? (
                  <div className="space-y-2">
                    <span className="text-sm font-bold text-gray-600">Typed Response:</span>
                    <div className={`w-full p-3 rounded-lg border whitespace-pre-wrap text-sm ${ans?.textAnswer ? 'bg-indigo-50 border-indigo-500 text-indigo-900' : 'bg-gray-100 border-gray-300 text-gray-400 italic'}`}>
                      {ans?.textAnswer || 'Not attempted'}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
