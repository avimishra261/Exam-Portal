'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Calculator from '../Calculator';
import ImageZoomModal from '../ImageZoomModal';
import type { ExamForTestEngine } from '@/types';
import { QuestionStatus } from '@/types';
import { AnswerValue } from './types';
import TestHeader from './TestHeader';
import QuestionArea from './QuestionArea';
import QuestionPalette from './QuestionPalette';
import TestModals from './TestModals';

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
    if (isFullscreenError) return; 
    
    const newExitCount = exitCount + 1;
    setExitCount(newExitCount);
    
    if (newExitCount > exam.fullscreenChances) {
      alert(`You have exceeded the allowed warnings (${exam.fullscreenChances}). Your test will be auto-submitted.`);
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
      alert(`Warning: You ${isTabSwitch ? 'switched tabs' : 'exited fullscreen'}. The test portal will now close. You have ${exam.fullscreenChances - newExitCount} chances left.`);
      window.location.href = '/dashboard/tests';
    } catch {
      console.error('pauseTest failed');
      window.location.href = '/dashboard/tests';
    }
  }

  const resumeFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        try {
          if ('keyboard' in navigator && (navigator as any).keyboard?.lock) {
            await (navigator as any).keyboard.lock(['Escape', 'F11']);
          }
        } catch (e) {
          console.warn('Keyboard lock not supported', e);
        }
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
        try {
          if ('keyboard' in navigator && (navigator as any).keyboard?.lock) {
            await (navigator as any).keyboard.lock(['Escape', 'F11']);
          }
        } catch (e) {
          console.warn('Keyboard lock not supported', e);
        }
      }
      setStarted(true);
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

  const handleFinalSubmit = async () => {
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
    try {
      await onSubmit(formData);
      window.location.href = '/dashboard/analysis';
    } catch (err) {
      console.error(err);
      isSubmitting.current = false;
      alert("Failed to submit the test. Please try again.");
    }
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

  if (!started) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center max-w-lg mx-auto mt-20">
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

  return (
    <>
      <TestModals 
        showQuestionPaper={showQuestionPaper}
        setShowQuestionPaper={setShowQuestionPaper}
        showInstructions={showInstructions}
        setShowInstructions={setShowInstructions}
        showSubmitModal={showSubmitModal}
        setShowSubmitModal={setShowSubmitModal}
        exam={exam}
        sections={sections}
        handleFinalSubmit={handleFinalSubmit}
      />
      
      <div className="lg:hidden fixed inset-0 z-[100] flex items-center justify-center p-8 text-center bg-gray-50">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 max-w-sm">
          <h2 className="text-xl font-bold text-red-600 mb-2">Desktop Required</h2>
          <p className="text-gray-600 mb-6">This test can only be taken on a desktop or laptop computer. Please switch devices to continue.</p>
          <a href="/dashboard/tests" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">Back to Dashboard</a>
        </div>
      </div>
      
      <div ref={containerRef} className="hidden lg:flex flex-col h-screen bg-[#f1f1f1] text-[#333] select-none font-sans overflow-hidden text-[13px]">
        <TestHeader 
          exam={exam}
          sections={sections}
          activeSection={activeSection}
          timeLeft={timeLeft}
          formatTime={formatTime}
          calcOpen={calcOpen}
          setCalcOpen={setCalcOpen}
          setShowInstructions={setShowInstructions}
          setShowQuestionPaper={setShowQuestionPaper}
          onSectionClick={(sec) => {
            setActiveSection(sec);
            const firstIdx = shuffledQuestions.findIndex(q => (q.section || 'General') === sec);
            if (firstIdx !== -1) navigateTo(firstIdx);
          }}
        />

        {calcOpen && <Calculator onClose={() => setCalcOpen(false)} />}
        {zoomImage && <ImageZoomModal imageUrl={zoomImage} onClose={() => setZoomImage(null)} />}

        <div className="flex flex-1 overflow-hidden">
          <QuestionArea 
            currentQIndex={currentQIndex}
            currentQ={shuffledQuestions[currentQIndex]}
            answers={answers}
            handleAnswerChange={handleAnswerChange}
            setZoomImage={setZoomImage}
            markForReview={markForReview}
            clearResponse={clearResponse}
            saveAndNext={saveAndNext}
          />

          <QuestionPalette 
            studentName={studentName}
            activeSection={activeSection}
            shuffledQuestions={shuffledQuestions}
            currentQIndex={currentQIndex}
            qStatus={qStatus}
            navigateTo={navigateTo}
            setShowSubmitModal={setShowSubmitModal}
          />
        </div>
      </div>
    </>
  );
}
