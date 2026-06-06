'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Calculator from './Calculator';
import ImageZoomModal from './ImageZoomModal';
import type { ExamForTestEngine, QuestionType } from '@/types';
import { QuestionStatus } from '@/types';

type AnswerValue = string | string[] | null;

export default function TestEngine({ 
  exam, 
  initialAnswers = {},
  initialTimeLeft,
  onSubmit 
}: { 
  exam: ExamForTestEngine;
  initialAnswers?: Record<string, AnswerValue>;
  initialTimeLeft?: number;
  onSubmit: (formData: FormData) => void;
}) {
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(initialTimeLeft ?? (exam.durationMinutes * 60));
  const [currentQIndex, setCurrentQIndex] = useState(0);
  
  // Answers state
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(initialAnswers);
  
  // Question status tracking
  const [qStatus, setQStatus] = useState<Record<string, QuestionStatus>>(() => {
    const initial: Record<string, QuestionStatus> = {};
    exam.questions.forEach((q, i) => {
      if (initialAnswers[q.id]) {
        initial[q.id] = QuestionStatus.ANSWERED;
      } else {
        initial[q.id] = i === 0 ? QuestionStatus.NOT_ANSWERED : QuestionStatus.NOT_VISITED;
      }
    });
    return initial;
  });

  const [calcOpen, setCalcOpen] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const isSubmitting = useRef(false);

  useEffect(() => {
    if (!started) return;
    if (timeLeft <= 0) {
      handleFinalSubmit();
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [started, timeLeft]);

  useEffect(() => {
    if (!started) return;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        alert("Warning! You switched tabs/windows. This violates test rules.");
      }
    };
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !isSubmitting.current) {
        pauseTest();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [started, answers, timeLeft]);

  const pauseTest = async () => {
    alert("You exited fullscreen mode. Your test has been paused. You can continue it from the dashboard.");
    try {
      await fetch('/api/tests/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: exam.id,
          timeLeft,
          answers,
          status: 'IN_PROGRESS'
        })
      });
    } catch (e) {
      console.error(e);
    }
    window.location.href = '/dashboard/tests';
  };

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
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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
          </ul>
        </div>
        <button onClick={startTest} className="mt-8 px-8 py-3 bg-[#1e73be] hover:bg-[#155a96] text-white font-bold rounded-lg shadow-sm transition w-full">
          I Understand, Start Test
        </button>
      </div>
    );
  }

  const currentQ = exam.questions[currentQIndex];

  // Specific GATE styling classes
  const answeredClass = "bg-[#5cb85c] text-white [clip-path:polygon(0_0,100%_0,100%_75%,50%_100%,0_75%)]";
  const notAnsweredClass = "bg-[#d9534f] text-white [clip-path:polygon(0_0,100%_0,100%_100%,50%_75%,0_100%)]";
  const notVisitedClass = "bg-[#f0f0f0] text-black border border-gray-300 rounded-sm";
  const markedClass = "bg-[#6a3fb5] text-white rounded-full";
  const markedAnsweredClass = "bg-[#6a3fb5] text-white rounded-full relative after:content-['✔'] after:absolute after:-bottom-1 after:-right-1 after:text-green-500 after:text-xs after:bg-white after:rounded-full after:w-3 after:h-3 after:flex after:items-center after:justify-center";

  const getPaletteClass = (status: QuestionStatus) => {
    switch(status) {
      case QuestionStatus.NOT_VISITED: return notVisitedClass;
      case QuestionStatus.NOT_ANSWERED: return notAnsweredClass;
      case QuestionStatus.ANSWERED: return answeredClass;
      case QuestionStatus.MARKED_FOR_REVIEW: return markedClass;
      case QuestionStatus.ANSWERED_AND_MARKED: return markedAnsweredClass;
      default: return notVisitedClass;
    }
  };
  return (
    <div ref={containerRef} className="flex flex-col h-screen bg-white text-gray-900 select-none font-sans overflow-hidden text-sm">
      
      {/* Top Banner */}
      <div className="h-14 flex justify-center items-center border-b border-gray-300 relative bg-white">
         <div className="text-xl font-bold text-gray-700 tracking-wider">GRADUATE APTITUDE TEST IN ENGINEERING (GATE)</div>
      </div>

      {/* Main Header (Blue) */}
      <div className="bg-[#2d7ba4] text-white flex justify-between items-center px-4 py-1.5 shadow-sm z-10">
        <div className="font-semibold text-sm">{exam.title}</div>
        <div className="flex gap-4 items-center">
          <button className="flex items-center gap-1 hover:text-gray-200">
            <span className="bg-white text-[#2d7ba4] rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">i</span> Instructions
          </button>
          <button className="flex items-center gap-1 hover:text-gray-200">
            <span className="bg-white text-[#2d7ba4] rounded-sm w-4 h-4 flex items-center justify-center text-[10px] font-bold">📄</span> Question Paper
          </button>
        </div>
      </div>

      {calcOpen && <Calculator onClose={() => setCalcOpen(false)} />}
      {zoomImage && <ImageZoomModal imageUrl={zoomImage} onClose={() => setZoomImage(null)} />}

      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Section - Question Area */}
        <div className="flex-1 flex flex-col border-r border-gray-300">
          
          {/* Sections & Time Header */}
          <div className="bg-white border-b border-gray-300 flex justify-between items-stretch">
             <div className="flex">
               <div className="bg-[#2d7ba4] text-white px-4 py-1.5 font-bold border-r border-gray-300 text-xs flex items-center">CS 1 Computer Science... <span className="ml-2 bg-blue-400 rounded-full w-4 h-4 inline-flex items-center justify-center text-white text-[10px]">i</span></div>
             </div>
             <div className="flex items-center px-4">
                <span className="font-semibold text-xs">Time Left : <span className="font-bold text-sm">{formatTime(timeLeft)}</span></span>
                <button onClick={() => setCalcOpen(!calcOpen)} className="ml-4 text-orange-500 hover:text-orange-600 text-xl" title="Open Calculator">🖩</button>
             </div>
          </div>

          {/* Question Details Header */}
          <div className="border-b border-gray-300 px-4 py-2 flex justify-between items-center bg-[#f9f9f9] text-xs">
             <span className="font-bold">Question Type: {currentQ.type}</span>
             <span className="text-gray-600">Marks for correct answer: <span className="text-green-600 font-bold">{currentQ.maxMarks}</span> | Negative Marks: <span className="text-red-600 font-bold">0</span></span>
          </div>

          {/* Question Content */}
          <div className="flex-1 overflow-y-auto p-4 bg-white">
             <h3 className="font-bold mb-4 border-b pb-2 border-gray-100">Question No. {currentQIndex + 1}</h3>
             
             <div className="text-sm leading-relaxed mb-6 font-serif" style={{ fontSize: '15px' }}>
               <p className="whitespace-pre-wrap">{currentQ.text}</p>
             </div>

             {currentQ.mediaUrl && (
              <div className="mb-6">
                <img 
                  src={currentQ.mediaUrl} 
                  alt="Question Media" 
                  className="max-w-full h-auto cursor-zoom-in hover:opacity-90"
                  style={{ maxHeight: '200px' }}
                  onClick={() => setZoomImage(currentQ.mediaUrl!)}
                />
              </div>
            )}

            <div className="space-y-3 font-serif">
              {currentQ.type === 'MCQ' && currentQ.options.map((opt) => (
                <label key={opt.id} className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="radio" 
                    name={`q_${currentQ.id}`} 
                    value={opt.id} 
                    checked={answers[currentQ.id] === opt.id}
                    onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                    className="mt-1" 
                  />
                  <span>{opt.text}</span>
                </label>
              ))}

              {currentQ.type === 'MSQ' && currentQ.options.map((opt) => {
                const currentVals = (answers[currentQ.id] as string[] | null) || [];
                return (
                  <label key={opt.id} className="flex items-start gap-3 cursor-pointer">
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
                      className="mt-1 rounded-sm" 
                    />
                    <span>{opt.text}</span>
                  </label>
                );
              })}

              {currentQ.type === 'NAT' && (
                <div className="max-w-sm mt-4">
                  <input 
                    type="number" 
                    step="any" 
                    value={answers[currentQ.id] || ''}
                    onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                    className="w-full px-3 py-1 border border-gray-400 focus:outline-none focus:border-blue-500" 
                  />
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="bg-white border-t border-gray-300 p-3 flex justify-between items-center text-sm">
             <div className="flex gap-2">
               <button onClick={markForReview} className="border border-gray-300 bg-white hover:bg-gray-50 px-4 py-1.5 rounded-sm">Mark for Review & Next</button>
               <button onClick={clearResponse} className="border border-gray-300 bg-white hover:bg-gray-50 px-4 py-1.5 rounded-sm">Clear Response</button>
             </div>
             <button onClick={saveAndNext} className="bg-[#1e73be] hover:bg-[#155a96] text-white px-6 py-1.5 rounded-sm shadow-sm font-semibold">Save & Next</button>
          </div>
        </div>

        {/* Right Section - Profile & Palette */}
        <div className="w-[280px] bg-[#eef5fb] flex flex-col z-10 text-xs">
          {/* Profile Area */}
          <div className="flex p-3 border-b border-gray-300 bg-white gap-3 items-center">
            <div className="w-14 h-14 bg-gray-200 rounded-sm flex items-center justify-center border border-gray-300">
               <span className="text-3xl text-gray-400">👤</span>
            </div>
            <div className="font-bold text-sm">John Smith</div>
          </div>
          
          {/* Legend Area */}
          <div className="p-3 bg-[#eef5fb]">
            <div className="grid grid-cols-2 gap-y-3 gap-x-1">
              <div className="flex items-center gap-1.5"><div className={`w-7 h-7 flex items-center justify-center ${answeredClass}`}>{Object.values(qStatus).filter(s => s===QuestionStatus.ANSWERED).length}</div> <span className="leading-tight">Answered</span></div>
              <div className="flex items-center gap-1.5"><div className={`w-7 h-7 flex items-center justify-center ${notAnsweredClass}`}>{Object.values(qStatus).filter(s => s===QuestionStatus.NOT_ANSWERED).length}</div> <span className="leading-tight">Not<br/>Answered</span></div>
              <div className="flex items-center gap-1.5"><div className={`w-7 h-7 flex items-center justify-center ${notVisitedClass}`}>{Object.values(qStatus).filter(s => s===QuestionStatus.NOT_VISITED).length}</div> <span className="leading-tight">Not<br/>Visited</span></div>
              <div className="flex items-center gap-1.5"><div className={`w-7 h-7 flex items-center justify-center ${markedClass}`}>{Object.values(qStatus).filter(s => s===QuestionStatus.MARKED_FOR_REVIEW).length}</div> <span className="leading-tight">Marked<br/>for Review</span></div>
              <div className="flex items-center gap-1.5 col-span-2"><div className={`w-7 h-7 flex items-center justify-center ${markedAnsweredClass}`}>{Object.values(qStatus).filter(s => s===QuestionStatus.ANSWERED_AND_MARKED).length}</div> <span className="leading-tight">Answered & Marked for<br/>Review (will also be<br/>evaluated)</span></div>
            </div>
          </div>

          <div className="bg-[#2d7ba4] text-white px-3 py-1 font-bold">General Aptitude</div>
          <div className="bg-blue-100 text-[#2d7ba4] px-3 py-1 font-bold text-[11px]">Choose a Question</div>

          {/* Palette Area */}
          <div className="p-3 flex-1 overflow-y-auto bg-white">
            <div className="flex flex-wrap gap-2">
              {exam.questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => navigateTo(i)}
                  className={`w-10 h-10 flex items-center justify-center font-bold relative transition ${getPaletteClass(qStatus[q.id])} ${currentQIndex === i ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="p-2 border-t border-gray-300 bg-white">
            <button 
              onClick={() => { if(confirm("Are you sure you want to submit the test?")) handleFinalSubmit() }}
              className="w-full bg-[#5bc0de] hover:bg-[#46b8da] text-white py-1.5 font-bold shadow-sm rounded-sm"
            >
              Submit
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
