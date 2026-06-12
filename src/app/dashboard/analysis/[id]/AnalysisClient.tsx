'use client';

import React, { useState, useTransition } from 'react';
import { CheckCircle2, XCircle, Bookmark, BookmarkCheck, Clock, User, ChevronLeft, ChevronRight, BarChart3, List, Trophy, Percent, Loader2 } from 'lucide-react';
import { toggleBookmarkAction } from '@/app/actions/student';

export default function AnalysisClient({ 
  submission, 
  leaderboard = [], 
  topScore = 0, 
  currentUserId = '' 
}: { 
  submission: any;
  leaderboard?: any[];
  topScore?: number;
  currentUserId?: string;
}) {
  const [activeTab, setActiveTab] = useState<'scorecard' | 'solutions' | 'leaderboard' | 'compare'>('scorecard');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [showAllSolutions, setShowAllSolutions] = useState(false);
  const [isPendingBookmark, startTransition] = useTransition();

  const handleBookmarkToggle = () => {
    if (!currentAns) return;
    startTransition(async () => {
      const res = await toggleBookmarkAction(currentAns.id, !currentAns.isBookmarked);
      if (res.success) {
        // Optimistically update the UI by mutating the local object (in a real app, use SWR/React Query or refresh)
        currentAns.isBookmarked = !currentAns.isBookmarked;
      }
    });
  };

  const questions = submission.exam.questions || [];
  const currentQuestion = questions[currentIndex];
  const answers = submission.answers || [];

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      if (!showAllSolutions) setShowSolution(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      if (!showAllSolutions) setShowSolution(false);
    }
  };

  const handleToggleSolution = () => {
    setShowSolution(!showSolution);
  };

  const getQuestionStatus = (qId: string) => {
    const ans = answers.find((a: any) => a.questionId === qId);
    if (!ans) return 'unattempted';
    
    // Check if unattempted conceptually (no option selected, no text typed)
    if (!ans.selectedOptionIds && !ans.numericAnswer && !ans.textAnswer) return 'unattempted';
    
    // Attempted. Check if marks > 0
    if ((ans.marksObtained || 0) > 0) return 'correct';
    return 'incorrect';
  };

  const currentAns = answers.find((a: any) => a.questionId === currentQuestion?.id);
  const currentStatus = currentQuestion ? getQuestionStatus(currentQuestion.id) : 'unattempted';
  
  // Calculate stats
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;
  questions.forEach((q: any) => {
    const s = getQuestionStatus(q.id);
    if (s === 'correct') correctCount++;
    else if (s === 'incorrect') incorrectCount++;
    else unattemptedCount++;
  });

  if (!currentQuestion) return <div>No questions found for this test.</div>;

  const totalDurationSeconds = (submission.exam?.durationMinutes || 0) * 60;
  const timeSpentSeconds = submission.timeLeft !== undefined && submission.timeLeft !== null
    ? Math.max(0, totalDurationSeconds - submission.timeLeft)
    : totalDurationSeconds; // If no timeLeft, assume full duration was used
    
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')} min : ${s.toString().padStart(2, '0')} sec`;
  };

  return (
    <div className="flex flex-col h-full font-sans">
      {/* TOP HEADER */}
      <header className="bg-blue-600 text-white p-3 flex justify-between items-center shadow-md z-10 shrink-0">
        <div className="flex items-center gap-4">
          <a href="/dashboard/tests" className="flex items-center gap-1 bg-blue-700 hover:bg-blue-800 px-3 py-1.5 rounded-lg text-sm font-medium transition border border-blue-500">
            <ChevronLeft className="w-4 h-4" /> Back
          </a>
          <div className="font-semibold text-lg">{submission.exam.title}</div>
        </div>
        <div className="flex items-center gap-2 bg-blue-700 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-500">
          <User className="w-4 h-4" />
          <span>{submission.user.name || submission.user.email}</span>
        </div>
      </header>

      {/* TABS */}
      <div className="bg-white border-b border-gray-200 px-4 flex gap-8 shrink-0">
        <button 
          onClick={() => setActiveTab('scorecard')} 
          className={`py-3 font-medium text-sm border-b-2 flex items-center gap-2 transition ${activeTab === 'scorecard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <BarChart3 className="w-4 h-4" /> Score Card
        </button>
        <button 
          onClick={() => setActiveTab('solutions')} 
          className={`py-3 font-medium text-sm border-b-2 flex items-center gap-2 transition ${activeTab === 'solutions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <List className="w-4 h-4" /> Solutions & Report
        </button>
        <button 
          onClick={() => setActiveTab('leaderboard')} 
          className={`py-3 font-medium text-sm border-b-2 flex items-center gap-2 transition ${activeTab === 'leaderboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <Trophy className="w-4 h-4" /> Leaderboard
        </button>
        <button 
          onClick={() => setActiveTab('compare')} 
          className={`py-3 font-medium text-sm border-b-2 flex items-center gap-2 transition ${activeTab === 'compare' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <Percent className="w-4 h-4" /> Compare with Topper
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden bg-gray-50">
        
        {activeTab === 'solutions' && (
          <>
          {/* LEFT PANE - QUESTION & OPTIONS */}
          <div className="flex-1 flex flex-col overflow-y-auto bg-white border-r border-gray-200">
          {/* Question Header */}
          <div className="p-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4 bg-gray-50">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-800">Question {currentIndex + 1}</h2>
              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-md">
                {currentQuestion.type}
              </span>
              <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded-md flex items-center">
                +{currentQuestion.maxMarks || 1}
              </span>
              <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-bold rounded-md flex items-center">
                -{currentQuestion.negativeMarks || 0}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <button 
                onClick={handleBookmarkToggle}
                disabled={isPendingBookmark || !currentAns}
                className={`flex items-center gap-1 transition disabled:opacity-50 ${currentAns?.isBookmarked ? 'text-blue-600 font-bold' : 'hover:text-blue-600'}`}
              >
                {isPendingBookmark ? <Loader2 className="w-4 h-4 animate-spin" /> : currentAns?.isBookmarked ? <BookmarkCheck className="w-4 h-4 fill-current" /> : <Bookmark className="w-4 h-4" />}
                {currentAns?.isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </button>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> 
                <span className="font-medium">Question Time: {currentAns?.timeSpent ? formatTime(currentAns.timeSpent) : '0:00'}</span>
              </div>
            </div>
          </div>

          {/* Question Body */}
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="text-gray-800 text-base md:text-lg mb-8 leading-relaxed whitespace-pre-wrap">
              {currentQuestion.text}
            </div>

            {/* Options */}
            {(currentQuestion.type === 'MCQ' || currentQuestion.type === 'MSQ') && (
              <div className="space-y-4 max-w-3xl">
                {currentQuestion.options.map((opt: any, idx: number) => {
                  const selectedIds = currentAns?.selectedOptionIds ? currentAns.selectedOptionIds.split(',') : [];
                  const isSelected = selectedIds.includes(opt.id);
                  const isCorrect = opt.isCorrect;
                  const showAsCorrect = (showSolution || showAllSolutions) && isCorrect;
                  const showAsWrong = isSelected && !isCorrect;

                  let borderClass = "border-gray-300";
                  let bgClass = "bg-white hover:bg-gray-50";
                  
                  if (showAsCorrect) {
                    borderClass = "border-green-500";
                    bgClass = "bg-green-50";
                  } else if (showAsWrong) {
                    borderClass = "border-red-500";
                    bgClass = "bg-red-50";
                  } else if (isSelected) {
                    borderClass = "border-blue-500";
                    bgClass = "bg-blue-50";
                  }

                  return (
                    <div key={opt.id} className={`flex items-start p-4 rounded-xl border-2 transition-all ${borderClass} ${bgClass}`}>
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold mr-4 ${showAsCorrect ? 'border-green-500 bg-green-500 text-white' : showAsWrong ? 'border-red-500 bg-red-500 text-white' : isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-400 text-gray-500'}`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <div className="flex-1 text-gray-700 pt-1">
                        {opt.text}
                      </div>
                      
                      {/* Status Badges */}
                      <div className="flex items-center gap-2">
                         {isSelected && !showAsCorrect && !showAsWrong && (
                            <span className="text-xs font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded-md">My Answer</span>
                         )}
                         {showAsWrong && (
                            <div className="flex items-center gap-1 text-red-600 bg-red-100 px-2 py-1 rounded-md">
                              <XCircle className="w-4 h-4" />
                              <span className="text-xs font-bold">My Answer</span>
                            </div>
                         )}
                         {showAsCorrect && isSelected && (
                            <div className="flex items-center gap-1 text-green-700 bg-green-100 px-2 py-1 rounded-md">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-xs font-bold">My Answer</span>
                            </div>
                         )}
                         {showAsCorrect && !isSelected && (
                            <div className="flex items-center gap-1 text-green-700 bg-green-100 px-2 py-1 rounded-md">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-xs font-bold">Correct Answer</span>
                            </div>
                         )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* NAT Rendering */}
            {currentQuestion.type === 'NAT' && (
              <div className="space-y-6 max-w-2xl mt-4">
                
                {/* Show User's Answer */}
                <div className="flex items-center gap-4">
                  <div className={`flex-1 px-4 py-3 border rounded-sm text-xl bg-white
                    ${currentAns?.numericAnswer === currentQuestion.correctNumeric 
                      ? 'border-[#28a745] text-[#28a745]' 
                      : currentAns?.numericAnswer !== undefined && currentAns?.numericAnswer !== null
                        ? 'border-[#e83e8c] text-[#e83e8c]'
                        : 'border-gray-400 text-gray-500'}`}>
                    {currentAns?.numericAnswer !== undefined && currentAns?.numericAnswer !== null ? currentAns.numericAnswer : <span className="text-gray-400 italic text-sm">Not attempted</span>}
                  </div>
                  <div className={`flex items-center gap-2 text-white px-4 py-2 rounded-r-md relative text-sm font-bold min-w-[160px]
                    ${currentAns?.numericAnswer === currentQuestion.correctNumeric ? 'bg-[#28a745]' : currentAns?.numericAnswer !== undefined && currentAns?.numericAnswer !== null ? 'bg-[#e83e8c]' : 'bg-gray-400'}`}>
                    <div className={`absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rotate-45 rounded-sm
                      ${currentAns?.numericAnswer === currentQuestion.correctNumeric ? 'bg-[#28a745]' : currentAns?.numericAnswer !== undefined && currentAns?.numericAnswer !== null ? 'bg-[#e83e8c]' : 'bg-gray-400'}`}></div>
                    {currentAns?.numericAnswer === currentQuestion.correctNumeric ? <CheckCircle2 className="w-4 h-4 relative z-10" /> : <User className="w-4 h-4 relative z-10" />}
                    <span className="relative z-10">My Answer</span>
                  </div>
                </div>

                {/* Show Correct Answer */}
                {(showSolution || showAllSolutions) && (
                  <div className="flex items-center gap-4">
                    <div className="flex-1 px-4 py-3 border border-[#28a745] rounded-sm text-[#28a745] bg-white text-xl">
                      {currentQuestion.correctNumeric ?? "N/A"}
                    </div>
                    <div className="flex items-center gap-2 text-white bg-[#28a745] px-4 py-2 rounded-r-md relative text-sm font-bold min-w-[160px]">
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#28a745] rotate-45 rounded-sm"></div>
                      <CheckCircle2 className="w-4 h-4 relative z-10" />
                      <span className="relative z-10">Correct Answer</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Descriptive Rendering */}
            {currentQuestion.type === 'DESCRIPTIVE' && (
              <div className="space-y-6 max-w-2xl mt-4">
                
                <div className="flex items-start gap-4">
                  <div className={`flex-1 px-4 py-3 border rounded-sm text-base bg-white ${currentAns?.textAnswer ? 'border-blue-500 text-gray-800' : 'border-gray-400 text-gray-400'}`}>
                    {currentAns?.textAnswer || <span className="italic">No answer provided</span>}
                  </div>
                  <div className={`flex items-center gap-2 text-white px-4 py-2 rounded-r-md relative text-sm font-bold min-w-[160px] ${currentAns?.textAnswer ? 'bg-blue-500' : 'bg-gray-400'} mt-2`}>
                    <div className={`absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rotate-45 rounded-sm ${currentAns?.textAnswer ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                    <User className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">My Answer</span>
                  </div>
                </div>

                {(showSolution || showAllSolutions) && (
                  <div className="flex items-start gap-4">
                    <div className="flex-1 px-4 py-3 border border-[#28a745] rounded-sm text-gray-800 bg-white text-base whitespace-pre-wrap">
                      {currentQuestion.correctText || currentQuestion.explanation || "No correct answer or rubric provided for this question."}
                    </div>
                    <div className="flex items-center gap-2 text-white bg-[#28a745] px-4 py-2 rounded-r-md relative text-sm font-bold min-w-[160px] mt-2">
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#28a745] rotate-45 rounded-sm"></div>
                      <CheckCircle2 className="w-4 h-4 relative z-10" />
                      <span className="relative z-10">Rubric / Correct</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Explanation Section */}
            {(showSolution || showAllSolutions) && currentQuestion.explanation && (
              <div className="mt-8 p-5 bg-blue-50 rounded-xl border border-blue-100">
                <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <span>💡</span> Explanation
                </h4>
                <div className="text-blue-800 whitespace-pre-wrap text-sm leading-relaxed">
                  {currentQuestion.explanation}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 font-medium transition"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex === questions.length - 1}
                className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 font-medium transition"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="rounded text-blue-600 w-4 h-4 focus:ring-blue-500"
                  checked={showAllSolutions}
                  onChange={(e) => setShowAllSolutions(e.target.checked)}
                />
                Show All Solutions
              </label>
              
              {!showAllSolutions && (
                <button
                  onClick={handleToggleSolution}
                  className="px-6 py-2 bg-[#2196f3] hover:bg-[#1e88e5] text-white font-semibold rounded-lg shadow-sm transition"
                >
                  {showSolution ? 'Hide Solution' : 'Show Solution'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANE - QUESTION PALETTE */}
        <div className="w-80 border-l border-gray-200 bg-[#f8f9fa] flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-200 text-center bg-white">
            <p className="text-sm text-gray-500 font-medium mb-1">Time Spent on Test</p>
            <p className="text-2xl font-bold text-gray-800">{formatTime(timeSpentSeconds)}</p>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Question Palette</h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q: any, idx: number) => {
                const status = getQuestionStatus(q.id);
                const isActive = idx === currentIndex;
                
                let btnClass = "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"; // unattempted
                if (status === 'correct') btnClass = "border-green-500 bg-green-500 text-white";
                else if (status === 'incorrect') btnClass = "border-red-500 bg-red-500 text-white";

                if (status === 'unattempted') {
                    // special styling for unattempted
                    btnClass = "border-gray-300 bg-gray-100 text-gray-600";
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      if (!showAllSolutions) setShowSolution(false);
                    }}
                    className={`w-full aspect-square flex items-center justify-center rounded-md font-bold text-sm transition-all ${btnClass} ${isActive ? 'ring-2 ring-blue-600 ring-offset-2' : ''}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-8 space-y-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
              <h4 className="font-bold text-xs uppercase text-gray-500 tracking-wider">Legend</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
                  <span className="text-gray-700">{correctCount} Correct</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
                  <span className="text-gray-700">{incorrectCount} Incorrect</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-gray-300 bg-gray-100 rounded-sm"></div>
                  <span className="text-gray-700">{unattemptedCount} Unattempted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        </>
        )}

        {/* SCORE CARD TAB */}
        {activeTab === 'scorecard' && (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto space-y-8">
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Performance Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 flex flex-col items-center justify-center text-center">
                    <span className="text-blue-600 font-bold text-sm uppercase tracking-wider mb-2">Total Score</span>
                    <span className="text-4xl font-extrabold text-blue-900">{submission.score} <span className="text-xl text-blue-500 font-medium">/ {submission.maxScore}</span></span>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-6 border border-purple-100 flex flex-col items-center justify-center text-center">
                    <span className="text-purple-600 font-bold text-sm uppercase tracking-wider mb-2">Accuracy</span>
                    <span className="text-4xl font-extrabold text-purple-900">
                      {correctCount + incorrectCount > 0 ? Math.round((correctCount / (correctCount + incorrectCount)) * 100) : 0}%
                    </span>
                  </div>
                  <div className="bg-green-50 rounded-xl p-6 border border-green-100 flex flex-col items-center justify-center text-center">
                    <span className="text-green-600 font-bold text-sm uppercase tracking-wider mb-2">Attempt Rate</span>
                    <span className="text-4xl font-extrabold text-green-900">
                      {Math.round(((correctCount + incorrectCount) / questions.length) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Question Breakdown</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100">
                      <div className="flex items-center gap-2 text-green-700 font-medium"><CheckCircle2 className="w-5 h-5" /> Correct</div>
                      <span className="font-bold text-green-800 text-lg">{correctCount}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                      <div className="flex items-center gap-2 text-red-700 font-medium"><XCircle className="w-5 h-5" /> Incorrect</div>
                      <span className="font-bold text-red-800 text-lg">{incorrectCount}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 text-gray-600 font-medium"><div className="w-5 h-5 border-2 border-gray-400 rounded-sm"></div> Unattempted</div>
                      <span className="font-bold text-gray-800 text-lg">{unattemptedCount}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Accuracy Breakdown</h3>
                  <div className="flex items-center justify-center h-48 bg-white rounded-xl">
                    {(() => {
                      const totalQ = questions.length || 1;
                      const correctPct = (correctCount / totalQ) * 100;
                      const incorrectPct = (incorrectCount / totalQ) * 100;
                      const unattemptedPct = (unattemptedCount / totalQ) * 100;
                      return (
                        <div 
                          className="relative w-40 h-40 rounded-full shadow-inner"
                          style={{
                            background: `conic-gradient(
                              #22c55e 0% ${correctPct}%, 
                              #ef4444 ${correctPct}% ${correctPct + incorrectPct}%, 
                              #e5e7eb ${correctPct + incorrectPct}% 100%
                            )`
                          }}
                        >
                          <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]">
                            <div className="text-center">
                              <span className="block text-2xl font-bold text-gray-800">
                                {correctCount + incorrectCount > 0 ? Math.round((correctCount / (correctCount + incorrectCount)) * 100) : 0}%
                              </span>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5 block">Accuracy</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex justify-center gap-4 mt-4 text-xs font-medium text-gray-600">
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-sm"></div> Correct</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> Incorrect</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-200 rounded-sm border border-gray-300"></div> Unattempted</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* LEADERBOARD TAB */}
        {activeTab === 'leaderboard' && (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800">Test Leaderboard</h2>
                  <p className="text-gray-500 text-sm mt-1">See how you rank against other aspirants.</p>
                </div>
                {leaderboard.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No submissions yet.</div>
                ) : (
                  <table className="w-full text-left">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rank</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {leaderboard.map((lb: any) => (
                        <tr key={lb.userId} className={`${lb.userId === currentUserId ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {lb.rank === 1 && <Trophy className="w-5 h-5 text-yellow-500 mr-2" />}
                              {lb.rank === 2 && <Trophy className="w-5 h-5 text-gray-400 mr-2" />}
                              {lb.rank === 3 && <Trophy className="w-5 h-5 text-amber-600 mr-2" />}
                              <span className={`font-bold ${lb.rank <= 3 ? 'text-gray-900' : 'text-gray-600'}`}>#{lb.rank}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                {lb.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-900">{lb.name} {lb.userId === currentUserId && '(You)'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-bold text-gray-900">{lb.score}</span>
                            <span className="text-gray-400 text-sm ml-1">/ {lb.maxScore}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* COMPARE TAB */}
        {activeTab === 'compare' && (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Compare with Topper</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="border border-blue-200 bg-blue-50 rounded-xl p-6 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                    <h4 className="font-bold text-blue-800 mb-2">Your Score</h4>
                    <span className="text-5xl font-black text-blue-600">{submission.score}</span>
                  </div>
                  <div className="border border-yellow-200 bg-yellow-50 rounded-xl p-6 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500"></div>
                    <h4 className="font-bold text-yellow-800 mb-2">Topper's Score</h4>
                    <span className="text-5xl font-black text-yellow-600">{topScore}</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                   <h4 className="font-bold text-gray-800 mb-4">Detailed Breakdown coming soon...</h4>
                   <p className="text-gray-600">The detailed subject-wise and question-wise comparison with the topper will be available here.</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
