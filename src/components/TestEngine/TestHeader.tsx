import { Calculator as CalcIcon } from 'lucide-react';
import { ExamForTestEngine } from '@/types';

interface TestHeaderProps {
  exam: ExamForTestEngine;
  sections: string[];
  activeSection: string;
  timeLeft: number;
  formatTime: (seconds: number) => string;
  calcOpen: boolean;
  setCalcOpen: (open: boolean) => void;
  setShowInstructions: (show: boolean) => void;
  setShowQuestionPaper: (show: boolean) => void;
  onSectionClick: (sec: string) => void;
}

export default function TestHeader({
  exam, sections, activeSection, timeLeft, formatTime, calcOpen, setCalcOpen, setShowInstructions, setShowQuestionPaper, onSectionClick
}: TestHeaderProps) {
  return (
    <>
      <div className="h-14 flex justify-between items-center border-b border-[#a0a0a0] relative bg-white px-6 shadow-sm">
         <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-transparent rounded-full flex items-center justify-center border border-transparent font-bold text-[10px]"></div>
         </div>
         <div className="flex-1 flex justify-center text-[#2d228f] font-bold text-lg tracking-wide uppercase">
            ExamPortal
         </div>
      </div>

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

      <div className="bg-[#f0f0f0] border-b border-[#a0a0a0] flex justify-between items-stretch">
         <div className="flex mt-1">
           {sections.map(sec => (
             <div 
               key={sec}
               onClick={() => onSectionClick(sec)}
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
    </>
  );
}
