import VirtualNumpad from '../VirtualNumpad';
import { AnswerValue } from './types';

interface QuestionAreaProps {
  currentQIndex: number;
  currentQ: any;
  answers: Record<string, AnswerValue>;
  handleAnswerChange: (qId: string, val: AnswerValue) => void;
  setZoomImage: (url: string) => void;
  markForReview: () => void;
  clearResponse: () => void;
  saveAndNext: () => void;
}

export default function QuestionArea({
  currentQIndex, currentQ, answers, handleAnswerChange, setZoomImage, markForReview, clearResponse, saveAndNext
}: QuestionAreaProps) {
  return (
    <div className="flex-1 flex flex-col border-r border-[#a0a0a0] bg-white">
      <div className="border-b border-[#a0a0a0] px-4 py-1.5 flex justify-between items-center bg-white text-[13px] text-black">
         <span className="font-bold text-[14px]">Question Type: {currentQ.type}</span>
         <span className="text-gray-700">Marks for correct answer: <span className="text-green-600 font-bold">{currentQ.maxMarks}</span> | Negative Marks: <span className="text-red-600 font-bold">2/3</span></span>
      </div>

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
          {currentQ.type === 'MCQ' && currentQ.options.map((opt: any) => (
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

          {currentQ.type === 'MSQ' && currentQ.options.map((opt: any) => {
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

      <div className="bg-white border-t border-[#a0a0a0] p-3 flex justify-between items-center">
         <div className="flex gap-3">
           <button onClick={markForReview} className="border border-[#888] bg-white hover:bg-gray-100 text-[#333] px-4 py-1.5 text-[13px] font-bold shadow-sm">Mark for Review & Next</button>
           <button onClick={clearResponse} className="border border-[#888] bg-white hover:bg-gray-100 text-[#333] px-4 py-1.5 text-[13px] font-bold shadow-sm">Clear Response</button>
         </div>
         <button onClick={saveAndNext} className="bg-[#1e73be] hover:bg-[#155a96] border border-[#155a96] text-white px-6 py-1.5 font-bold shadow-sm text-[13px]">Save & Next</button>
      </div>
    </div>
  );
}
