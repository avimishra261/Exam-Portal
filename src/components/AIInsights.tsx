'use client';

import { useState, useEffect } from 'react';

export default function AIInsights() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ai-insights')
      .then(res => res.json())
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 animate-pulse">
        <div className="h-6 bg-blue-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-blue-100 rounded w-full"></div>
          <div className="h-4 bg-blue-100 rounded w-5/6"></div>
          <div className="h-4 bg-blue-100 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  if (!data?.insights) {
    return (
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-center text-gray-500">
        {data?.message || 'No AI Insights available at the moment.'}
      </div>
    );
  }

  const { strengths = [], weaknesses = [], recommendation = '' } = data.insights;

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">✨</span>
        <h3 className="text-xl font-bold text-gray-800">AI Performance Insights</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> Strengths
          </h4>
          <ul className="space-y-2">
            {strengths.map((s: string, i: number) => (
              <li key={i} className="text-sm text-green-700 leading-relaxed">• {s}</li>
            ))}
          </ul>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
          <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span> Areas to Improve
          </h4>
          <ul className="space-y-2">
            {weaknesses.map((w: string, i: number) => (
              <li key={i} className="text-sm text-red-700 leading-relaxed">• {w}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-indigo-50 p-5 rounded-lg border border-indigo-100">
        <h4 className="font-bold text-indigo-900 mb-2">Recommendation</h4>
        <p className="text-indigo-800 text-sm leading-relaxed">{recommendation}</p>
      </div>
    </div>
  );
}
