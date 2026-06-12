'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Calculator as CalcIcon } from 'lucide-react';
import Calculator from './Calculator';
import ImageZoomModal from './ImageZoomModal';
import VirtualNumpad from './VirtualNumpad';
import type { ExamForTestEngine, QuestionType } from '@/types';
import { QuestionStatus } from '@/types';

type AnswerValue = string | string[] | null;

export default function TestEngine({ 
  exam, 
  studentName = 'Student',
  initialAnswers = {},
  initialTimeLeft,
  initialExitCount = 0,
  attemptSeed,
  onSubmit 
}: { 
  exam: ExamForTestEngine;
  studentName?: string;
  initialAnswers?: Record<string, AnswerValue>;
  initialTimeLeft?: number;
  initialExitCount?: number;
  attemptSeed?: string;
  onSubmit: (formData: FormData) => void;
}) {
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(initialTimeLeft ?? (exam.durationMinutes * 60));
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [exitCount, setExitCount] = useState(initialExitCount || 0);
  const [isFullscreenError, setIsFullscreenError] = useState(false);
  const [warningReason, setWarningReason] = useState("");
  
  // Answers state
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(initialAnswers);
  const [questionTimes, setQuestionTimes] = useState<Record<string, number>>({});
  
  const sections = useMemo(() => {
    const s = new Set<string>();
    exam.questions.forEach(q => s.add(q.section || 'General'));
    return Array.from(s);
  }, [exam.questions]);

  const [activeSection, setActiveSection] = useState<string>(sections[0] || 'General');
  const [showQuestionPaper, setShowQuestionPaper] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  
  const shuffledQuestions = useMemo(() => {
    if (!exam.shuffleQuestions) return exam.questions;
    if (!attemptSeed) return exam.questions;
    function stringToSeed(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
        }
        return hash;
    }
    function mulberry32(a: number) {
        return function() {
          var t = a += 0x6D2B79F5;
          t = Math.imul(t ^ t >>> 15, t | 1);
          t ^= t + Math.imul(t ^ t >>> 7, t | 61);
          return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
    }
    
    const rng = mulberry32(stringToSeed(attemptSeed));
    const grouped: Record<string, typeof exam.questions> = {};
    sections.forEach(s => grouped[s] = []);
    exam.questions.forEach(q => {
      const sec = q.section || 'General';
      if (grouped[sec]) grouped[sec].push(q);
      else {
        grouped[sec] = [q];
      }
    });

    const finalArr: typeof exam.questions = [];
    sections.forEach(sec => {
      const sectionQuestions = [...grouped[sec]];
      for (let i = sectionQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [sectionQuestions[i], sectionQuestions[j]] = [sectionQuestions[j], sectionQuestions[i]];
      }
      finalArr.push(...sectionQuestions);
    });
    
    return finalArr;
  }, [exam.questions, attemptSeed, sections]);

  const activeSectionIndices = useMemo(() => {
    const indices: number[] = [];
    shuffledQuestions.forEach((q, idx) => {
      if ((q.section || 'General') === activeSection) indices.push(idx);
    });
    return indices;
  }, [shuffledQuestions, activeSection]);

  // Question status tracking
  const [qStatus, setQStatus] = useState<Record<string, QuestionStatus>>(() => {
    const initial: Record<string, QuestionStatus> = {};
    shuffledQuestions.forEach((q, i) => {
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
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const isSubmitting = useRef(false);

  useEffect(() => {
    if (!started || isFullscreenError) return;
    if (timeLeft <= 0) {
      handleFinalSubmit();
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
      
      // Increment time for the current question
      const currentQId = shuffledQuestions[currentQIndex]?.id;
      if (currentQId) {
        setQuestionTimes(prev => ({
          ...prev,
          [currentQId]: (prev[currentQId] || 0) + 1
        }));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [started, timeLeft, currentQIndex, shuffledQuestions, isFullscreenError]);

  useEffect(() => {
    if (!started) return;
    
    const preventScroll = (e: WheelEvent) => {
      e.preventDefault();
    };
    const preventKeys = (e: KeyboardEvent) => {
      if (e.key === "F11" || e.key === "Escape") return;
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('keydown', preventKeys, { passive: false });
    
    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmitting.current) {
        pauseTest(true);
      }
    };
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !isSubmitting.current) {
        pauseTest(false);
      }
    };
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("contextmenu", preventContextMenu);
    return () => {
      window.removeEventListener('wheel', preventScroll);
      window.removeEventListener('keydown', preventKeys);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("contextmenu", preventContextMenu);
    };
  }, [started, answers, timeLeft, exitCount, isFullscreenError]);

  async function pauseTest(isTabSwitch = false) {
    if (isFullscreenError) return; // Already in error state
    
    const newExitCount = exitCount + 1;
    setExitCount(newExitCount);
    
    if (newExitCount > exam.fullscreenChances) {
      alert(`You have exceeded the allowed warnings (${exam.fullscreenChances}). Your test will be auto-submitted.`);
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      handleFinalSubmit();
      return;
    }

    const reason = isTabSwitch ? "switched tabs/windows" : "exited fullscreen mode";
    setWarningReason(reason);
    setIsFullscreenError(true);

    try {
      await fetch('/api/tests/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: exam.id,
          timeLeft,
          answers,
          questionTimes,
          status: 'IN_PROGRESS',
          isExitFullscreen: true
        })
      });
    } catch {
      console.error('pauseTest failed');
    }
  }

  const resumeFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      setIsFullscreenError(false);
      setWarningReason("");
    } catch (e) {
      alert("Fullscreen is required to continue. Please allow fullscreen permissions.");
    }
  };

  const startTest = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      setStarted(true);
      // Immediately register the session so live monitoring works
      fetch('/api/tests/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: exam.id,
          timeLeft: initialTimeLeft ?? (exam.durationMinutes * 60),
          answers,
          questionTimes,
          status: 'IN_PROGRESS',
          isExitFullscreen: false
        })
      }).catch(console.error);
    } catch (e) {
      alert("Fullscreen is required to start the test. Please allow fullscreen permissions.");
    }
  };

  function handleFinalSubmit() {
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    const formData = new FormData();
    for (const q of shuffledQuestions) {
      const val = answers[q.id];
      const time = questionTimes[q.id] || 0;
      formData.append(`time_${q.id}`, time.toString());
      if (val === undefined || val === null || val === '') continue;
      if (q.type === 'MSQ' && Array.isArray(val)) {
        val.forEach(v => formData.append(`q_${q.id}`, v));
      } else {
        formData.append(`q_${q.id}`, val.toString());
      }
    }
    onSubmit(formData);
  }

  const handleAnswerChange = (qId: string, val: AnswerValue) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const navigateTo = (index: number) => {
    const prevQId = shuffledQuestions[currentQIndex].id;
    if (qStatus[prevQId] === QuestionStatus.NOT_VISITED) {
      updateStatus(prevQId, hasAnswer(prevQId) ? QuestionStatus.ANSWERED : QuestionStatus.NOT_ANSWERED);
    }
    setCurrentQIndex(index);
    const currQ = shuffledQuestions[index];
    setActiveSection(currQ.section || 'General');
    if (qStatus[currQ.id] === QuestionStatus.NOT_VISITED) {
      updateStatus(currQ.id, QuestionStatus.NOT_ANSWERED);
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
    const qId = shuffledQuestions[currentQIndex].id;
    updateStatus(qId, hasAnswer(qId) ? QuestionStatus.ANSWERED : QuestionStatus.NOT_ANSWERED);
    if (currentQIndex < shuffledQuestions.length - 1) {
      navigateTo(currentQIndex + 1);
    } else {
      navigateTo(0);
    }
  };

  const clearResponse = () => {
    const qId = shuffledQuestions[currentQIndex].id;
    const newAnswers = { ...answers };
    delete newAnswers[qId];
    setAnswers(newAnswers);
    updateStatus(qId, QuestionStatus.NOT_ANSWERED);
  };

  const markForReview = () => {
    const qId = shuffledQuestions[currentQIndex].id;
    updateStatus(qId, hasAnswer(qId) ? QuestionStatus.ANSWERED_AND_MARKED : QuestionStatus.MARKED_FOR_REVIEW);
    if (currentQIndex < shuffledQuestions.length - 1) {
      navigateTo(currentQIndex + 1);
    } else {
      navigateTo(0);
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
          <p><strong>Total Questions:</strong> {shuffledQuestions.length}</p>
          <ul className="list-disc pl-5 space-y-2 mt-4">
            <li>The test will open in <strong>Fullscreen mode</strong>.</li>
            <li>Switching tabs, opening other windows, or exiting fullscreen will result in a warning.</li>
            <li>You have currently used <strong>{exitCount} / {exam.fullscreenChances} exits</strong>. Exceeding this limit will auto-submit your test.</li>
          </ul>
        </div>
        <button onClick={startTest} className="mt-8 px-8 py-3 bg-[#1e73be] hover:bg-[#155a96] text-white font-bold rounded-lg shadow-sm transition w-full">
          {Object.keys(answers).length > 0 ? "I Understand, Continue Test" : "I Understand, Start Test"}
        </button>
      </div>
    );
  }

  if (isFullscreenError) {
    return (
      <div className="fixed inset-0 z-[9999] bg-red-600 flex items-center justify-center p-8 text-center font-sans">
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-lg w-full text-gray-800">
          <h2 className="text-3xl font-bold text-red-600 mb-4">Warning!</h2>
          <p className="text-lg mb-6">
            You {warningReason}. This is a violation of the test rules.
          </p>
          <p className="text-md mb-8 font-medium bg-red-50 p-4 rounded-lg border border-red-200">
            Warning: {exitCount} / {exam.fullscreenChances} exits used.
            <br/>
            If you exceed the limit, your test will be auto-submitted immediately.
          </p>
          <button 
            onClick={resumeFullscreen}
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-lg shadow-md transition"
          >
            Acknowledge & Resume Fullscreen
          </button>
        </div>
      </div>
    );
  }

  const currentQ = shuffledQuestions[currentQIndex];

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
    <>
      {showQuestionPaper && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col h-screen text-[13px] font-sans">
          <div className="h-14 bg-[#2f3136] text-white flex justify-between items-center px-6 shadow-md">
            <h2 className="text-xl font-bold">Question Paper</h2>
            <button onClick={() => setShowQuestionPaper(false)} className="text-white hover:text-red-400 font-bold text-lg cursor-pointer">Close X</button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full">
            {sections.map(sec => (
              <div key={sec} className="mb-10">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">{sec}</h3>
                {exam.questions.map((q) => {
                  if ((q.section || 'General') !== sec) return null;
                  const localIdx = exam.questions.filter(sq => (sq.section || 'General') === sec).findIndex(sq => sq.id === q.id);
                  return (
                    <div key={q.id} className="mb-8 bg-gray-50 p-6 border rounded-lg">
                      <div className="font-bold mb-2">Q.{localIdx + 1} ({q.type}) - Max Marks: {q.maxMarks}</div>
                      <div className="text-base whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: q.text }}></div>
                      {q.mediaUrl && <img src={q.mediaUrl} alt="Question" className="max-h-80 mt-4 object-contain" />}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
      {showInstructions && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col h-screen text-[13px] font-sans">
          <div className="h-14 bg-[#2f3136] text-white flex justify-between items-center px-6 shadow-md">
            <h2 className="text-xl font-bold">Instructions</h2>
            <button onClick={() => setShowInstructions(false)} className="text-white hover:text-red-400 font-bold text-lg cursor-pointer">Close X</button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full text-base">
            <h3 className="text-2xl font-bold mb-4">Please read the instructions carefully</h3>
            <ul className="list-disc pl-5 space-y-3 mb-6">
              <li>Total duration of the examination is <strong>{exam.durationMinutes} minutes</strong>.</li>
              <li>The clock will be set at the server. The countdown timer in the top right corner of screen will display the remaining time available for you to complete the examination.</li>
              <li>When the timer reaches zero, the examination will end by itself. You will not be required to end or submit your examination.</li>
              <li>You are allowed a maximum of <strong>{exam.fullscreenChances} warnings</strong> for exiting fullscreen or switching tabs. Exceeding this will automatically submit your test.</li>
            </ul>
            <h4 className="text-xl font-bold mt-8 mb-2">Navigating to a Question</h4>
            <ul className="list-disc pl-5 space-y-2">
              <li>Click on the question number in the Question Palette at the right of your screen to go to that numbered question directly.</li>
              <li>Click on <strong>Save & Next</strong> to save your answer for the current question and then go to the next question.</li>
              <li>Click on <strong>Mark for Review & Next</strong> to save your answer for the current question, mark it for review, and then go to the next question.</li>
            </ul>
          </div>
        </div>
      )}
      <div className="lg:hidden fixed inset-0 z-[100] flex items-center justify-center p-8 text-center bg-gray-50">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 max-w-sm">
          <h2 className="text-xl font-bold text-red-600 mb-2">Desktop Required</h2>
          <p className="text-gray-600 mb-6">This test can only be taken on a desktop or laptop computer. Please switch devices to continue.</p>
          <a href="/dashboard/tests" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">Back to Dashboard</a>
        </div>
      </div>
      <div ref={containerRef} className="hidden lg:flex flex-col h-screen bg-[#f1f1f1] text-[#333] select-none font-sans overflow-hidden text-[13px]">
      
      {/* Top Banner */}
      <div className="h-14 flex justify-between items-center border-b border-[#a0a0a0] relative bg-white px-6 shadow-sm">
         <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-transparent rounded-full flex items-center justify-center border border-transparent font-bold text-[10px]"></div>
         </div>
         <div className="flex-1 flex justify-center text-[#2d228f] font-bold text-lg tracking-wide uppercase">
            ExamPortal
         </div>
      </div>

      {/* Main Header (Dark Gray) */}
      <div className="bg-[#333333] text-white flex justify-between items-center px-4 py-1.5 z-10 border-b border-[#222]">
        <div className="font-bold text-[#ffeb3b] text-[13px]">{exam.title}</div>
        <div className="flex gap-4 items-center">
          <button onClick={() => setShowInstructions(true)} className="flex items-center gap-1.5 hover:text-gray-300">
            <span className="bg-[#4b8df8] text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">i</span> Instructions
          </button>
          <button onClick={() => setShowQuestionPaper(true)} className="flex items-center gap-1.5 hover:text-gray-300">
            <span className="bg-[#5cb85c] text-white rounded-sm w-4 h-4 flex items-center justify-center text-[10px] font-bold">📄</span> Question Paper
          </button>
        </div>
      </div>

      {calcOpen && <Calculator onClose={() => setCalcOpen(false)} />}
      {zoomImage && <ImageZoomModal imageUrl={zoomImage} onClose={() => setZoomImage(null)} />}

      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Section - Question Area */}
        <div className="flex-1 flex flex-col border-r border-[#a0a0a0] bg-white">
          
          {/* Sections & Time Header */}
          <div className="bg-[#f0f0f0] border-b border-[#a0a0a0] flex justify-between items-stretch">
             <div className="flex mt-1">
               {sections.map(sec => (
                 <div 
                   key={sec}
                   onClick={() => {
                     setActiveSection(sec);
                     const firstIdx = shuffledQuestions.findIndex(q => (q.section || 'General') === sec);
                     if (firstIdx !== -1) navigateTo(firstIdx);
                   }}
                   className={`px-4 py-1.5 font-bold border-r border-t border-l border-[#a0a0a0] text-[12px] flex items-center truncate max-w-[200px] cursor-pointer ${activeSection === sec ? 'bg-white text-[#333] shadow-[0_-2px_0_#4b8df8]' : 'bg-[#0073b2] text-white'}`}
                 >
                   {sec} <span className="ml-2 bg-[#4b8df8] rounded-full w-3.5 h-3.5 inline-flex items-center justify-center text-white text-[9px]">i</span>
                 </div>
               ))}
             </div>
             <div className="flex items-center px-4 bg-white border-l border-[#a0a0a0] ml-auto">
                <span className="font-bold text-[13px] text-black mr-6">Time Left : {formatTime(timeLeft)}</span>
                <button onClick={() => setCalcOpen(!calcOpen)} className="text-gray-600 hover:text-gray-900" title="Open Calculator">
                  <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center shadow-sm border border-gray-300">
                    <CalcIcon className="w-4 h-4 text-gray-700" />
                  </div>
                </button>
             </div>
          </div>

          {/* Question Details Header */}
          <div className="border-b border-[#a0a0a0] px-4 py-1.5 flex justify-between items-center bg-white text-[13px] text-black">
             <span className="font-bold text-[14px]">Question Type: {currentQ.type}</span>
             <span className="text-gray-700">Marks for correct answer: <span className="text-green-600 font-bold">{currentQ.maxMarks}</span> | Negative Marks: <span className="text-red-600 font-bold">2/3</span></span>
          </div>

          {/* Question Content */}
          <div className="flex-1 overflow-y-auto p-4 bg-white relative">
             <h3 className="font-bold text-black text-[15px] mb-4">Question No. {currentQIndex + 1}</h3>
             
             <div className="text-[15px] leading-relaxed mb-6 font-serif text-black border-t border-gray-200 pt-4">
               <p className="whitespace-pre-wrap">{currentQ.text}</p>
             </div>

             {currentQ.mediaUrl && (
              <div className="mb-6">
                <img 
                  src={currentQ.mediaUrl} 
                  alt="Question Media" 
                  className="max-w-full h-auto cursor-zoom-in hover:opacity-90 border border-gray-200"
                  style={{ maxHeight: '200px' }}
                  onClick={() => setZoomImage(currentQ.mediaUrl!)}
                />
              </div>
            )}

            <div className="space-y-4 font-serif text-black text-[15px]">
              {currentQ.type === 'MCQ' && currentQ.options.map((opt) => (
                <label key={opt.id} className="flex items-start gap-3 cursor-pointer group">
                  <input 
                    type="radio" 
                    name={`q_${currentQ.id}`} 
                    value={opt.id} 
                    checked={answers[currentQ.id] === opt.id}
                    onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                    className="mt-1 w-4 h-4" 
                  />
                  <span className="group-hover:text-blue-700">{opt.text}</span>
                </label>
              ))}

              {currentQ.type === 'MSQ' && currentQ.options.map((opt) => {
                const currentVals = (answers[currentQ.id] as string[] | null) || [];
                return (
                  <label key={opt.id} className="flex items-start gap-3 cursor-pointer group">
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
                      className="mt-1 w-4 h-4 rounded-sm" 
                    />
                    <span className="group-hover:text-blue-700">{opt.text}</span>
                  </label>
                );
              })}

              {currentQ.type === 'NAT' && (
                <div className="max-w-sm mt-4 flex gap-8 items-start">
                  <div className="flex-1">
                    <input 
                      type="text" 
                      value={(answers[currentQ.id] as string) || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-[#888] bg-[#f9f9f9] focus:outline-none text-xl tracking-wider font-mono rounded-sm shadow-inner" 
                      placeholder=""
                    />
                  </div>
                  <VirtualNumpad 
                    value={(answers[currentQ.id] as string) || ''} 
                    onChange={(val) => handleAnswerChange(currentQ.id, val)}
                  />
                </div>
              )}

              {currentQ.type === 'DESCRIPTIVE' && (
                <div className="mt-4">
                  <textarea 
                    value={(answers[currentQ.id] as string) || ''}
                    onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                    className="w-full h-40 px-3 py-2 border border-[#888] bg-white shadow-inner focus:outline-none focus:border-blue-500 rounded-sm font-sans text-sm"
                    placeholder="Type your answer here..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="bg-white border-t border-[#a0a0a0] p-3 flex justify-between items-center">
             <div className="flex gap-3">
               <button onClick={markForReview} className="border border-[#888] bg-white hover:bg-gray-100 text-[#333] px-4 py-1.5 text-[13px] font-bold shadow-sm">Mark for Review & Next</button>
               <button onClick={clearResponse} className="border border-[#888] bg-white hover:bg-gray-100 text-[#333] px-4 py-1.5 text-[13px] font-bold shadow-sm">Clear Response</button>
             </div>
             <button onClick={saveAndNext} className="bg-[#1e73be] hover:bg-[#155a96] border border-[#155a96] text-white px-6 py-1.5 font-bold shadow-sm text-[13px]">Save & Next</button>
          </div>
        </div>

        {/* Right Section - Profile & Palette */}
        <div className="w-[300px] bg-[#eef5fb] flex flex-col z-10 border-l border-[#ccc]">
          {/* Profile Area */}
          <div className="flex p-3 bg-white border-b border-[#a0a0a0] gap-4 items-center h-20 shadow-sm">
            <div className="w-[60px] h-[60px] bg-gray-200 rounded overflow-hidden border border-gray-400">
               {/* using an iconic default user silhouette as in screenshot */}
               <div className="w-full h-full bg-gradient-to-b from-[#ccc] to-[#888] flex items-center justify-center">
                 <div className="w-8 h-8 bg-[#f5f5f5] rounded-full mt-2 opacity-80" />
               </div>
            </div>
            <div className="font-bold text-[16px] text-black truncate flex-1">{studentName}</div>
          </div>
          
          {/* Legend Area */}
          <div className="p-3 bg-white border-b border-[#a0a0a0]">
            <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-[11px] text-black">
              <div className="flex items-center gap-2"><div className={`w-[30px] h-[26px] flex items-center justify-center text-[11px] ${answeredClass}`}>{Object.values(qStatus).filter(s => s===QuestionStatus.ANSWERED).length}</div> <span className="leading-tight">Answered</span></div>
              <div className="flex items-center gap-2"><div className={`w-[30px] h-[26px] flex items-center justify-center text-[11px] ${notAnsweredClass}`}>{Object.values(qStatus).filter(s => s===QuestionStatus.NOT_ANSWERED).length}</div> <span className="leading-tight">Not<br/>Answered</span></div>
              <div className="flex items-center gap-2"><div className={`w-[30px] h-[26px] flex items-center justify-center text-[11px] ${notVisitedClass}`}>{Object.values(qStatus).filter(s => s===QuestionStatus.NOT_VISITED).length}</div> <span className="leading-tight">Not<br/>Visited</span></div>
              <div className="flex items-center gap-2"><div className={`w-[30px] h-[30px] flex items-center justify-center text-[11px] ${markedClass}`}>{Object.values(qStatus).filter(s => s===QuestionStatus.MARKED_FOR_REVIEW).length}</div> <span className="leading-tight">Marked<br/>for Review</span></div>
              <div className="flex items-center gap-2 col-span-2 mt-1"><div className={`w-[30px] h-[30px] flex items-center justify-center text-[11px] ${markedAnsweredClass}`}>{Object.values(qStatus).filter(s => s===QuestionStatus.ANSWERED_AND_MARKED).length}</div> <span className="leading-tight">Answered & Marked for<br/>Review (will also be<br/>evaluated)</span></div>
            </div>
          </div>

          <div className="bg-[#0073b2] text-white px-3 py-1.5 font-bold text-[13px] border-b border-[#005a8f] shadow-sm truncate">{activeSection}</div>
          <div className="bg-[#eef5fb] text-black px-3 py-2 font-bold text-[12px]">Choose a Question</div>

          {/* Palette Area */}
          <div className="p-3 flex-1 overflow-y-auto bg-[#eef5fb]">
            <div className="flex flex-wrap gap-2.5">
              {shuffledQuestions.map((q, i) => {
                if ((q.section || 'General') !== activeSection) return null;
                const localIdx = shuffledQuestions.filter(sq => (sq.section || 'General') === activeSection).findIndex(sq => sq.id === q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => navigateTo(i)}
                    className={`w-10 h-9 flex items-center justify-center font-bold text-[13px] shadow-sm relative transition ${getPaletteClass(qStatus[q.id])} ${currentQIndex === i ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
                  >
                    {localIdx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-[#c0d0e0] border-t border-[#a0a0a0] flex justify-center">
            <button 
              onClick={() => setShowSubmitModal(true)}
              className="bg-[#5bc0de] border border-[#46b8da] text-white py-1.5 px-8 text-[13px] font-bold shadow-sm rounded-sm hover:bg-[#46b8da]"
            >
              Submit
            </button>
          </div>
        </div>

      </div>

      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center font-sans">
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-sm w-full border border-gray-300">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Submit Test?</h2>
            <p className="text-sm text-gray-600 mb-6">Are you sure you want to submit the test? You won't be able to change your answers after submission.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-bold rounded-md"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowSubmitModal(false);
                  handleFinalSubmit();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-md"
              >
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
