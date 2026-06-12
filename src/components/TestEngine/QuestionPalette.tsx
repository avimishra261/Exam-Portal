import { QuestionStatus } from '@/types';

interface QuestionPaletteProps {
  studentName: string;
  activeSection: string;
  shuffledQuestions: any[];
  currentQIndex: number;
  qStatus: Record<string, QuestionStatus>;
  navigateTo: (index: number) => void;
  setShowSubmitModal: (show: boolean) => void;
}

export default function QuestionPalette({
  studentName, activeSection, shuffledQuestions, currentQIndex, qStatus, navigateTo, setShowSubmitModal
}: QuestionPaletteProps) {
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
    <div className="w-[300px] bg-[#eef5fb] flex flex-col z-10 border-l border-[#ccc]">
      <div className="flex p-3 bg-white border-b border-[#a0a0a0] gap-4 items-center h-20 shadow-sm">
        <div className="w-[60px] h-[60px] bg-gray-200 rounded overflow-hidden border border-gray-400">
           <div className="w-full h-full bg-gradient-to-b from-[#ccc] to-[#888] flex items-center justify-center">
             <div className="w-8 h-8 bg-[#f5f5f5] rounded-full mt-2 opacity-80" />
           </div>
        </div>
        <div className="font-bold text-[16px] text-black truncate flex-1">{studentName}</div>
      </div>
      
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

      <div className="p-3 flex-1 overflow-y-auto bg-[#eef5fb]">
        <div className="flex flex-wrap gap-2.5">
          {shuffledQuestions.map((q, i) => {
            if ((q.section || 'General') !== activeSection) return null;
            const localIdx = shuffledQuestions.filter(sq => (sq.section || 'General') === activeSection).findIndex(sq => sq.id === q.id);
            return (
              <button
                key={q.id}
                onClick={() => navigateTo(i)}
                className={`w-10 h-9 flex items-center justify-center font-bold text-[13px] shadow-sm relative transition ${getPaletteClass(qStatus[q.id])} ${currentQIndex === i ? 'ring-[3px] ring-black border border-black z-10 scale-110' : ''}`}
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
  );
}
