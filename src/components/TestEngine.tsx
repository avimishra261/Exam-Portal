'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Calculator from './Calculator';
import ImageZoomModal from './ImageZoomModal';
import type { ExamForTestEngine, QuestionType } from '@/types';
import { QuestionStatus } from '@/types';

type AnswerValue = string | string[] | null;

export default function TestEngine({ 
  exam, 
  onSubmit 
}: { 
  exam: ExamForTestEngine;
  onSubmit: (formData: FormData) => void;
}) {
  const [started, setStarted] = useState(false);
  const [fullscreenExits, setFullscreenExits] = useState(0);
  const [timeLeft, setTimeLeft] = useState(exam.durationMinutes * 60);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  
  // Answers state — maps questionId to selected value(s)
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  
  // Question status tracking
  const [qStatus, setQStatus] = useState<Record<string, QuestionStatus>>(() => {
    const initial: Record<string, QuestionStatus> = {};
    exam.questions.forEach((q, i) => initial[q.id] = i === 0 ? QuestionStatus.NOT_ANSWERED : QuestionStatus.NOT_VISITED);
    return initial;
  });

  const [calcOpen, setCalcOpen] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const isSubmitting = useRef(false);
  // Use a ref to track exits so event handlers always see the latest value (no stale closure)
  const fullscreenExitsRef = useRef(0);

  // Auto submit when time is up or exits exceeded
  useEffect(() => {
    if (!started) return;

    if (timeLeft <= 0 || fullscreenExits >= exam.fullscreenChances) {
      handleFinalSubmit();
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [started, timeLeft, fullscreenExits, exam.fullscreenChances]);

  // Visibility change listener for tab switching — uses ref to avoid stale closure
  useEffect(() => {
    if (!started) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        fullscreenExitsRef.current += 1;
        setFullscreenExits(fullscreenExitsRef.current);
        alert(`Warning! You switched tabs/windows. Exits left: ${exam.fullscreenChances - fullscreenExitsRef.current}`);
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        fullscreenExitsRef.current += 1;
        setFullscreenExits(fullscreenExitsRef.current);
        alert(`Warning! You exited fullscreen. Exits left: ${exam.fullscreenChances - fullscreenExitsRef.current}`);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [started, exam.fullscreenChances]);

  const startTest = async () => {
    try {
      if (containerRef.current?.requestFullscreen) {
        await containerRef.current.requestFullscreen();
      }
      setStarted(true);
    } catch (e) {
      alert("Fullscreen is required to start the test. Please allow fullscreen permissions.");
    }
  };

  const handleFinalSubmit = () => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    
    // Build FormData
    const formData = new FormData();
    for (const q of exam.questions) {
      const val = answers[q.id];
      if (val === undefined || val === null || val === '') continue;

      if (q.type === 'MSQ' && Array.isArray(val)) {
        val.forEach(v => formData.append(`q_${q.id}`, v));
      } else {
        formData.append(`q_${q.id}`, val.toString());
      }
    }
    
    onSubmit(formData);
  };

  const handleAnswerChange = (qId: string, val: AnswerValue) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const navigateTo = (index: number) => {
    const prevQId = exam.questions[currentQIndex].id;
    if (qStatus[prevQId] === QuestionStatus.NOT_VISITED) {
      updateStatus(prevQId, hasAnswer(prevQId) ? QuestionStatus.ANSWERED : QuestionStatus.NOT_ANSWERED);
    }
    
    setCurrentQIndex(index);
    const currQId = exam.questions[index].id;
    if (qStatus[currQId] === QuestionStatus.NOT_VISITED) {
      updateStatus(currQId, QuestionStatus.NOT_ANSWERED);
    }
  };

  const updateStatus = (qId: string, status: QuestionStatus) => {
    setQStatus(prev => ({ ...prev, [qId]: status }));
  };

  const hasAnswer = (qId: string) => {
    const val = answers[qId];
    if (val === undefined || val === null || val === '') return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  };

  const saveAndNext = () => {
    const qId = exam.questions[currentQIndex].id;
    updateStatus(qId, hasAnswer(qId) ? QuestionStatus.ANSWERED : QuestionStatus.NOT_ANSWERED);
    if (currentQIndex < exam.questions.length - 1) {
      navigateTo(currentQIndex + 1);
    }
  };

  const clearResponse = () => {
    const qId = exam.questions[currentQIndex].id;
    const newAnswers = { ...answers };
    delete newAnswers[qId];
    setAnswers(newAnswers);
    updateStatus(qId, QuestionStatus.NOT_ANSWERED);
  };

  const markForReview = () => {
    const qId = exam.questions[currentQIndex].id;
    updateStatus(qId, hasAnswer(qId) ? QuestionStatus.ANSWERED_AND_MARKED : QuestionStatus.MARKED_FOR_REVIEW);
    if (currentQIndex < exam.questions.length - 1) {
      navigateTo(currentQIndex + 1);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: QuestionStatus) => {
    switch(status) {
      case QuestionStatus.NOT_VISITED: return 'bg-gray-200 text-gray-800';
      case QuestionStatus.NOT_ANSWERED: return 'bg-red-500 text-white';
      case QuestionStatus.ANSWERED: return 'bg-green-500 text-white';
      case QuestionStatus.MARKED_FOR_REVIEW: return 'bg-purple-500 text-white';
      case QuestionStatus.ANSWERED_AND_MARKED: return 'bg-purple-700 text-white relative after:content-["✔"] after:absolute after:-bottom-1 after:-right-1 after:text-green-400 after:text-xs';
      default: return 'bg-gray-200';
    }
  };

  // Intro Screen
  if (!started) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{exam.title}</h2>
        <div className="space-y-4 text-left bg-blue-50 p-6 rounded-lg text-sm text-blue-900">
          <p><strong>Duration:</strong> {exam.durationMinutes} Minutes</p>
          <p><strong>Total Questions:</strong> {exam.questions.length}</p>
          <ul className="list-disc pl-5 space-y-2 mt-4">
            <li>The test will open in <strong>Fullscreen mode</strong>.</li>
            <li>Switching tabs, opening other windows, or exiting fullscreen will result in a warning.</li>
            <li>You are allowed exactly <strong>{exam.fullscreenChances} exits</strong>. Exceeding this limit will auto-submit your test.</li>
            <li>A virtual scientific calculator is provided in the top menu.</li>
            <li>Images can be zoomed by clicking on them.</li>
          </ul>
        </div>
        <button 
          onClick={startTest}
          className="mt-8 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition w-full"
        >
          I Understand, Start Test
        </button>
      </div>
    );
  }

  const currentQ = exam.questions[currentQIndex];

  return (
    <div ref={containerRef} className="flex flex-col h-screen bg-white text-gray-900 select-none">
      {/* Header */}
      <header className="bg-gray-900 text-white px-4 py-3 flex justify-between items-center shadow-md">
        <div className="text-lg font-bold truncate pr-4">{exam.title}</div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setCalcOpen(!calcOpen)}
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 px-3 py-1.5 rounded text-sm font-medium transition"
          >
            🖩 Calculator
          </button>
          <div className={`font-mono text-xl font-bold ${timeLeft < 300 ? 'text-red-400' : 'text-green-400'}`}>
            ⏱ {formatTime(timeLeft)}
          </div>
          <button 
            onClick={() => { if(confirm("Are you sure you want to submit the test?")) handleFinalSubmit() }}
            className="bg-green-600 hover:bg-green-500 px-4 py-1.5 rounded font-bold transition"
          >
            Submit Test
          </button>
        </div>
      </header>

      {calcOpen && <Calculator onClose={() => setCalcOpen(false)} />}
      {zoomImage && <ImageZoomModal imageUrl={zoomImage} onClose={() => setZoomImage(null)} />}

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content (Left) */}
        <div className="flex-1 flex flex-col border-r border-gray-300 bg-gray-50">
          {/* Question Header */}
          <div className="bg-white px-6 py-3 border-b border-gray-200 flex justify-between items-center">
            <span className="font-bold text-lg">Question {currentQIndex + 1}</span>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
              {currentQ.type}
            </span>
          </div>

          {/* Question Body */}
          <div className="flex-1 overflow-y-auto p-6 text-base">
            <p className="whitespace-pre-wrap mb-6 text-gray-800 font-medium leading-relaxed">{currentQ.text}</p>
            
            {currentQ.mediaUrl && (
              <div className="mb-6">
                <img 
                  src={currentQ.mediaUrl} 
                  alt="Question Media" 
                  className="max-w-full h-auto rounded border border-gray-300 cursor-zoom-in hover:opacity-90 transition shadow-sm"
                  style={{ maxHeight: '300px' }}
                  onClick={() => setZoomImage(currentQ.mediaUrl!)}
                />
                <p className="text-xs text-gray-400 mt-1 italic">Click image to zoom</p>
              </div>
            )}

            <div className="space-y-4">
              {currentQ.type === 'MCQ' && currentQ.options.map((opt, i) => (
                <label key={opt.id} className="flex items-center gap-3 p-3 bg-white rounded border border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition">
                  <input 
                    type="radio" 
                    name={`q_${currentQ.id}`} 
                    value={opt.id} 
                    checked={answers[currentQ.id] === opt.id}
                    onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                    className="w-5 h-5 text-blue-600" 
                  />
                  <span>{String.fromCharCode(65 + i)}. {opt.text}</span>
                </label>
              ))}

              {currentQ.type === 'MSQ' && currentQ.options.map((opt, i) => {
                const currentVals = (answers[currentQ.id] as string[] | null) || [];
                return (
                  <label key={opt.id} className="flex items-center gap-3 p-3 bg-white rounded border border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition">
                    <input 
                      type="checkbox" 
                      value={opt.id} 
                      checked={currentVals.includes(opt.id)}
                      onChange={(e) => {
                        const newVals = e.target.checked 
                          ? [...currentVals, opt.id] 
                          : currentVals.filter((v: string) => v !== opt.id);
                        handleAnswerChange(currentQ.id, newVals);
                      }}
                      className="w-5 h-5 text-blue-600 rounded" 
                    />
                    <span>{String.fromCharCode(65 + i)}. {opt.text}</span>
                  </label>
                );
              })}

              {currentQ.type === 'NAT' && (
                <div className="p-4 bg-white border border-gray-200 rounded max-w-sm">
                  <input 
                    type="number" 
                    step="any" 
                    value={answers[currentQ.id] || ''}
                    onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                    placeholder="Enter your numeric answer..." 
                    className="w-full bg-gray-50 px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900" 
                  />
                </div>
              )}

              {currentQ.type === 'DESCRIPTIVE' && (
                <div className="bg-white border border-gray-200 rounded">
                  <textarea 
                    value={answers[currentQ.id] || ''}
                    onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                    placeholder="Type your descriptive answer here..." 
                    rows={8} 
                    className="w-full bg-gray-50 px-4 py-3 border-none rounded focus:ring-0 focus:bg-white text-gray-900 resize-y" 
                  />
                </div>
              )}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="bg-white border-t border-gray-200 p-4 flex justify-between items-center">
            <div className="flex gap-3">
              <button onClick={markForReview} className="px-5 py-2 rounded bg-purple-100 hover:bg-purple-200 text-purple-800 font-semibold text-sm border border-purple-200 transition">
                Mark for Review & Next
              </button>
              <button onClick={clearResponse} className="px-5 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-sm border border-gray-300 transition">
                Clear Response
              </button>
            </div>
            <button onClick={saveAndNext} className="px-8 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow transition">
              Save & Next
            </button>
          </div>
        </div>

        {/* Sidebar Palette (Right) */}
        <div className="w-72 bg-white flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.1)] z-10">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">Legend</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2"><span className="w-5 h-5 flex items-center justify-center rounded bg-green-500 text-white text-[10px]">{Object.values(qStatus).filter(s => s===QuestionStatus.ANSWERED || s===QuestionStatus.ANSWERED_AND_MARKED).length}</span> Answered</div>
              <div className="flex items-center gap-2"><span className="w-5 h-5 flex items-center justify-center rounded bg-red-500 text-white text-[10px]">{Object.values(qStatus).filter(s => s===QuestionStatus.NOT_ANSWERED).length}</span> Not Answered</div>
              <div className="flex items-center gap-2"><span className="w-5 h-5 flex items-center justify-center rounded bg-gray-200 text-gray-800 text-[10px]">{Object.values(qStatus).filter(s => s===QuestionStatus.NOT_VISITED).length}</span> Not Visited</div>
              <div className="flex items-center gap-2"><span className="w-5 h-5 flex items-center justify-center rounded bg-purple-500 text-white text-[10px]">{Object.values(qStatus).filter(s => s===QuestionStatus.MARKED_FOR_REVIEW).length}</span> Marked</div>
            </div>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">Question Palette</h3>
            <div className="grid grid-cols-4 gap-2">
              {exam.questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => navigateTo(i)}
                  className={`w-10 h-10 rounded font-bold text-sm flex items-center justify-center ${getStatusColor(qStatus[q.id])} ${currentQIndex === i ? 'ring-2 ring-offset-2 ring-blue-600' : ''}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
