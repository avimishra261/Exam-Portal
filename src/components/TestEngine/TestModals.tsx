import { ExamForTestEngine } from '@/types';

interface TestModalsProps {
  showQuestionPaper: boolean;
  setShowQuestionPaper: (show: boolean) => void;
  showInstructions: boolean;
  setShowInstructions: (show: boolean) => void;
  showSubmitModal: boolean;
  setShowSubmitModal: (show: boolean) => void;
  exam: ExamForTestEngine;
  sections: string[];
  handleFinalSubmit: () => void;
}

export default function TestModals({
  showQuestionPaper, setShowQuestionPaper, showInstructions, setShowInstructions, showSubmitModal, setShowSubmitModal, exam, sections, handleFinalSubmit
}: TestModalsProps) {
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
                      <div className="font-bold mb-2 text-black text-sm">Q.{localIdx + 1} ({q.type}) - Max Marks: {q.maxMarks}</div>
                      <div className="text-base text-black font-semibold whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: q.text }}></div>
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
          <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full text-base text-black">
            <h3 className="text-2xl font-bold mb-4">Please read the instructions carefully</h3>
            <ul className="list-disc pl-5 space-y-3 mb-6 font-medium">
              <li>Total duration of the examination is <strong>{exam.durationMinutes} minutes</strong>.</li>
              <li>The clock will be set at the server. The countdown timer in the top right corner of screen will display the remaining time available for you to complete the examination.</li>
              <li>When the timer reaches zero, the examination will end by itself. You will not be required to end or submit your examination.</li>
              <li>You are allowed a maximum of <strong>{exam.fullscreenChances} warnings</strong> for exiting fullscreen or switching tabs. Exceeding this will automatically submit your test.</li>
            </ul>
            <h4 className="text-xl font-bold mt-8 mb-2">Navigating to a Question</h4>
            <ul className="list-disc pl-5 space-y-2 font-medium">
              <li>Click on the question number in the Question Palette at the right of your screen to go to that numbered question directly.</li>
              <li>Click on <strong>Save & Next</strong> to save your answer for the current question and then go to the next question.</li>
              <li>Click on <strong>Mark for Review & Next</strong> to save your answer for the current question, mark it for review, and then go to the next question.</li>
            </ul>
          </div>
        </div>
      )}

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
    </>
  );
}
