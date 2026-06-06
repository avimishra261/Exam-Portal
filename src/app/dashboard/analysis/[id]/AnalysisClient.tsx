'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, Bookmark, Clock, User, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AnalysisClient({ submission }: { submission: any }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [showAllSolutions, setShowAllSolutions] = useState(false);

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

      {/* MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden bg-white">
        
        {/* LEFT PANE - QUESTION & OPTIONS */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Question Header */}
          <div className="p-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4 bg-gray-50">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-800">Question {currentIndex + 1}</h2>
              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-md">
                Beginner
              </span>
              <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded-md flex items-center">
                +{currentQuestion.maxMarks || 1}
              </span>
              <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-bold rounded-md flex items-center">
                -{currentQuestion.negativeMarks || 0}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <button className="flex items-center gap-1 hover:text-blue-600 transition">
                <Bookmark className="w-4 h-4" /> Bookmark
              </button>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> 
                <span className="font-medium">Time spent: -- min : -- sec</span>
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
                {currentAns?.numericAnswer !== undefined && currentAns?.numericAnswer !== null && (
                  <div className="flex items-center gap-4">
                    <div className={`flex-1 px-4 py-3 border rounded-sm text-xl bg-white
                      ${currentAns.numericAnswer === currentQuestion.correctNumeric 
                        ? 'border-[#28a745] text-[#28a745]' 
                        : 'border-[#e83e8c] text-[#e83e8c]'}`}>
                      {currentAns.numericAnswer}
                    </div>
                    <div className={`flex items-center gap-2 text-white px-4 py-2 rounded-r-md relative text-sm font-bold min-w-[160px]
                      ${currentAns.numericAnswer === currentQuestion.correctNumeric ? 'bg-[#28a745]' : 'bg-[#e83e8c]'}`}>
                      <div className={`absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rotate-45 rounded-sm
                        ${currentAns.numericAnswer === currentQuestion.correctNumeric ? 'bg-[#28a745]' : 'bg-[#e83e8c]'}`}></div>
                      {currentAns.numericAnswer === currentQuestion.correctNumeric ? <CheckCircle2 className="w-4 h-4 relative z-10" /> : <XCircle className="w-4 h-4 relative z-10" />}
                      <span className="relative z-10">My Answer</span>
                    </div>
                  </div>
                )}

                {/* Show Correct Answer */}
                {(showSolution || showAllSolutions) && (
                  <div className="flex items-center gap-4">
                    <div className="flex-1 px-4 py-3 border border-[#28a745] rounded-sm text-[#28a745] bg-white text-xl">
                      {currentQuestion.correctNumeric}
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
                {currentAns?.textAnswer && (
                  <div className="flex items-start gap-4">
                    <div className={`flex-1 px-4 py-3 border rounded-sm text-base bg-white border-blue-500 text-gray-800`}>
                      {currentAns.textAnswer}
                    </div>
                    <div className={`flex items-center gap-2 text-white px-4 py-2 rounded-r-md relative text-sm font-bold min-w-[160px] bg-blue-500 mt-2`}>
                      <div className={`absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rotate-45 rounded-sm bg-blue-500`}></div>
                      <User className="w-4 h-4 relative z-10" />
                      <span className="relative z-10">My Answer</span>
                    </div>
                  </div>
                )}
                {(showSolution || showAllSolutions) && currentQuestion.correctText && (
                  <div className="flex items-start gap-4">
                    <div className="flex-1 px-4 py-3 border border-[#28a745] rounded-sm text-gray-800 bg-white text-base whitespace-pre-wrap">
                      {currentQuestion.correctText}
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
            <p className="text-2xl font-bold text-gray-800">-- min : -- sec</p>
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
        
      </div>
    </div>
  );
}
