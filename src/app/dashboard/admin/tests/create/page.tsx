'use client';

import { useState } from 'react';
import { createExamAction } from '@/app/actions/admin';
import { useRouter } from 'next/navigation';

type QType = 'MCQ' | 'MSQ' | 'NAT' | 'DESCRIPTIVE';

interface Option {
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  type: QType;
  text: string;
  mediaFile?: File | null;
  options: Option[];
  correctNumeric?: string;
  correctText?: string;
  explanation?: string;
  maxMarks: string;
}

export default function CreateTestPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('60');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [upcomingDays, setUpcomingDays] = useState('10');
  const [fullscreenChances, setFullscreenChances] = useState('5');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);

  const addQuestion = (type: QType) => {
    setQuestions([
      ...questions,
      {
        id: Date.now().toString(),
        type,
        text: '',
        maxMarks: '1',
        options: type === 'MCQ' || type === 'MSQ' ? [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ] : []
      }
    ]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const addOption = (qId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        return { ...q, options: [...q.options, { text: '', isCorrect: false }] };
      }
      return q;
    }));
  };

  const updateOption = (qId: string, optIndex: number, text: string, isCorrect: boolean, isMCQ: boolean) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        const newOptions = q.options.map((opt, i) => {
          if (i === optIndex) return { text, isCorrect };
          if (isMCQ && isCorrect) return { ...opt, isCorrect: false };
          return opt;
        });
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (questions.length === 0) return alert('Add at least one question');
    
    setSaving(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('duration', duration);
    formData.append('startTime', startTime);
    formData.append('endTime', endTime);
    formData.append('upcomingDays', upcomingDays);
    formData.append('fullscreenChances', fullscreenChances);

    const questionsPayload = questions.map((q) => {
      const qPayload: any = { ...q, mediaFileId: q.mediaFile ? q.id : null };
      if (q.mediaFile) {
        formData.append(`media_${q.id}`, q.mediaFile);
      }
      delete qPayload.mediaFile;
      return qPayload;
    });

    formData.append('questions', JSON.stringify(questionsPayload));

    const res = await createExamAction(formData);
    setSaving(false);
    
    if (res?.error) {
      alert(res.error);
    } else {
      router.push('/dashboard/tests');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Create New Test</h2>
        <form id="test-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" rows={2} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <input required type="number" min="1" value={duration} onChange={e => setDuration(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upcoming Window (days before start to show in &quot;Upcoming&quot;)
            </label>
            <input type="number" min="1" value={upcomingDays} onChange={e => setUpcomingDays(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" />
            <p className="text-xs text-gray-400 mt-1">Default: 10 days. The test appears in &quot;Upcoming&quot; when it&apos;s within this many days of starting.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fullscreen Exits Allowed
            </label>
            <input type="number" min="1" value={fullscreenChances} onChange={e => setFullscreenChances(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" />
            <p className="text-xs text-gray-400 mt-1">Default: 5 exits. Test auto-submits if user exceeds this limit.</p>
          </div>
        </form>
      </div>

      {questions.map((q, index) => (
        <div key={q.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg text-gray-800">Q{index + 1}. ({q.type})</h3>
            <button type="button" onClick={() => removeQuestion(q.id)} className="text-red-500 text-sm font-medium hover:underline">Remove</button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Question Text</label>
              <textarea required form="test-form" value={q.text} onChange={e => updateQuestion(q.id, { text: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white" rows={2} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Optional Media (Image)</label>
                <input type="file" accept="image/*" onChange={e => updateQuestion(q.id, { mediaFile: e.target.files?.[0] || null })} className="text-sm text-gray-600" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Max Marks</label>
                <input required form="test-form" type="number" step="0.5" min="0.5" value={q.maxMarks} onChange={e => updateQuestion(q.id, { maxMarks: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white" />
              </div>
            </div>

            {(q.type === 'MCQ' || q.type === 'MSQ') && (
              <div className="space-y-2 mt-4 bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Options (Select the correct {q.type === 'MCQ' ? 'one' : 'ones'})</p>
                {q.options.map((opt, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-3">
                    <input 
                      type={q.type === 'MCQ' ? 'radio' : 'checkbox'} 
                      name={`correct_${q.id}`} 
                      checked={opt.isCorrect} 
                      onChange={e => updateOption(q.id, oIndex, opt.text, e.target.checked, q.type === 'MCQ')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <input 
                      required form="test-form" 
                      value={opt.text} 
                      onChange={e => updateOption(q.id, oIndex, e.target.value, opt.isCorrect, q.type === 'MCQ')}
                      placeholder={`Option ${oIndex + 1}`} 
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded focus:ring-blue-500 text-gray-900 bg-white"
                    />
                  </div>
                ))}
                <button type="button" onClick={() => addOption(q.id)} className="text-sm text-blue-600 font-medium mt-2 hover:underline">+ Add Option</button>
              </div>
            )}

            {q.type === 'NAT' && (
              <div className="mt-4">
                <label className="block text-sm text-gray-600 mb-1">Correct Numeric Answer</label>
                <input required form="test-form" type="number" step="any" value={q.correctNumeric || ''} onChange={e => updateQuestion(q.id, { correctNumeric: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white" />
              </div>
            )}

            {q.type === 'DESCRIPTIVE' && (
              <div className="mt-4">
                <label className="block text-sm text-gray-600 mb-1">Correct Answer / Grading Rubric (for reference)</label>
                <textarea form="test-form" value={q.correctText || ''} onChange={e => updateQuestion(q.id, { correctText: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white" rows={2} />
              </div>
            )}

            <div className="mt-4">
              <label className="block text-sm text-gray-600 mb-1">Explanation / Reasoning (Optional)</label>
              <textarea form="test-form" value={q.explanation || ''} onChange={e => updateQuestion(q.id, { explanation: e.target.value })} placeholder="Explain why the answer is correct..." className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white" rows={2} />
              <p className="text-xs text-gray-400 mt-1">This will be shown to the student in the analysis report after the test.</p>
            </div>
          </div>
        </div>
      ))}

      <div className="flex gap-3">
        <button type="button" onClick={() => addQuestion('MCQ')} className="flex-1 py-3 bg-white border border-blue-200 text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition text-sm">+ MCQ</button>
        <button type="button" onClick={() => addQuestion('MSQ')} className="flex-1 py-3 bg-white border border-blue-200 text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition text-sm">+ MSQ</button>
        <button type="button" onClick={() => addQuestion('NAT')} className="flex-1 py-3 bg-white border border-blue-200 text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition text-sm">+ NAT</button>
        <button type="button" onClick={() => addQuestion('DESCRIPTIVE')} className="flex-1 py-3 bg-white border border-blue-200 text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition text-sm">+ Descriptive</button>
      </div>

      <div className="pt-6 border-t border-gray-200 flex justify-end">
        <button form="test-form" type="submit" disabled={saving} className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50">
          {saving ? 'Saving...' : 'Publish Test'}
        </button>
      </div>
    </div>
  );
}
