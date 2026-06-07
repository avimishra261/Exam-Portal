import re

with open("src/components/TestEngine.tsx", "r") as f:
    code = f.read()

# 1. Imports
code = code.replace("import { useState, useEffect, useRef, useCallback, useMemo } from 'react';",
"import { useState, useEffect, useRef, useCallback, useMemo } from 'react';")

# 2. Add sections, activeSection, sectionQuestionsIndices, showQuestionPaper states
state_insertion = """  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(initialAnswers);
  
  const sections = useMemo(() => {
    const s = new Set<string>();
    exam.questions.forEach(q => s.add(q.section || 'General'));
    return Array.from(s);
  }, [exam.questions]);

  const [activeSection, setActiveSection] = useState<string>(sections[0] || 'General');
  const [showQuestionPaper, setShowQuestionPaper] = useState(false);
"""
code = code.replace("  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(initialAnswers);", state_insertion)

# 3. Update shuffledQuestions logic
shuffled_old = """  const shuffledQuestions = useMemo(() => {
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
    const newArr = [...exam.questions];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  }, [exam.questions, attemptSeed]);"""

shuffled_new = """  const shuffledQuestions = useMemo(() => {
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
  }, [shuffledQuestions, activeSection]);"""

code = code.replace(shuffled_old, shuffled_new)

# 4. navigateTo updating activeSection
nav_old = """  const navigateTo = (index: number) => {
    const prevQId = shuffledQuestions[currentQIndex].id;
    if (qStatus[prevQId] === QuestionStatus.NOT_VISITED) {
      updateStatus(prevQId, hasAnswer(prevQId) ? QuestionStatus.ANSWERED : QuestionStatus.NOT_ANSWERED);
    }
    setCurrentQIndex(index);
    const currQId = shuffledQuestions[index].id;
    if (qStatus[currQId] === QuestionStatus.NOT_VISITED) {
      updateStatus(currQId, QuestionStatus.NOT_ANSWERED);
    }
  };"""
nav_new = """  const navigateTo = (index: number) => {
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
  };"""
code = code.replace(nav_old, nav_new)

# 5. wheel and keydown events
effect_old = """  useEffect(() => {
    if (!started) return;
    const handleVisibilityChange = () => {"""
effect_new = """  useEffect(() => {
    if (!started) return;
    
    const preventScroll = (e: WheelEvent) => {
      e.preventDefault();
    };
    const preventKeys = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "PageUp", "PageDown", "Home", "End", " "];
      if (keys.includes(e.key)) {
        e.preventDefault();
      }
    };
    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('keydown', preventKeys, { passive: false });
    
    const handleVisibilityChange = () => {"""
code = code.replace(effect_old, effect_new)

# 5.1 cleanup for wheel and keydown events
cleanup_old = """    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("contextmenu", preventContextMenu);
    };"""
cleanup_new = """    return () => {
      window.removeEventListener('wheel', preventScroll);
      window.removeEventListener('keydown', preventKeys);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("contextmenu", preventContextMenu);
    };"""
code = code.replace(cleanup_old, cleanup_new)

# 6. Question Paper Modal
modal_insertion = """      {showQuestionPaper && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col h-screen text-[13px] font-sans">
          <div className="h-14 bg-[#2f3136] text-white flex justify-between items-center px-6 shadow-md">
            <h2 className="text-xl font-bold">Question Paper</h2>
            <button onClick={() => setShowQuestionPaper(false)} className="text-white hover:text-red-400 font-bold text-lg cursor-pointer">Close X</button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full">
            {sections.map(sec => (
              <div key={sec} className="mb-10">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">{sec}</h3>
                {shuffledQuestions.map((q) => {
                  if ((q.section || 'General') !== sec) return null;
                  const localIdx = shuffledQuestions.filter(sq => (sq.section || 'General') === sec).findIndex(sq => sq.id === q.id);
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
      <div className="lg:hidden fixed inset-0 z-[100] flex items-center justify-center p-8 text-center bg-gray-50">"""
code = code.replace('      <div className="lg:hidden fixed inset-0 z-[100] flex items-center justify-center p-8 text-center bg-gray-50">', modal_insertion)

# 7. GATE branding and section tabs
header_old = """      {/* Top Banner */}
      <div className="h-14 flex justify-between items-center border-b border-[#a0a0a0] relative bg-white px-6 shadow-sm">
         <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center border border-purple-300 text-purple-700 font-bold text-[10px]">LOGO</div>
         </div>
         <div className="flex-1 flex justify-center text-[#2d228f] font-bold text-lg tracking-wide uppercase">
            GRADUATE APTITUDE TEST IN ENGINEERING (GATE)
         </div>
      </div>"""
header_new = """      {/* Top Banner */}
      <div className="h-14 flex justify-between items-center border-b border-[#a0a0a0] relative bg-white px-6 shadow-sm">
         <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-transparent rounded-full flex items-center justify-center border border-transparent font-bold text-[10px]"></div>
         </div>
         <div className="flex-1 flex justify-center text-[#2d228f] font-bold text-lg tracking-wide uppercase">
            ExamPortal
         </div>
      </div>"""
code = code.replace(header_old, header_new)

# 8. Add section tabs to Main Content
main_content_old = """        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Header of Left Area */}
          <div className="h-10 bg-[#3b4354] text-white flex items-center justify-between px-4 font-bold text-sm tracking-wide border-b border-[#2a303c]">
            <span>Q.{currentQIndex + 1}</span>"""
main_content_new = """        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Sections Bar */}
          <div className="h-10 flex bg-white border-b border-[#a0a0a0] relative overflow-x-auto shadow-sm shrink-0">
             {sections.map(sec => (
               <button
                 key={sec}
                 onClick={() => {
                   setActiveSection(sec);
                   const firstIdx = shuffledQuestions.findIndex(q => (q.section || 'General') === sec);
                   if (firstIdx !== -1) navigateTo(firstIdx);
                 }}
                 className={`px-6 h-full font-bold text-sm border-r border-[#a0a0a0] transition ${
                   activeSection === sec ? 'bg-[#3b4354] text-white' : 'bg-[#eef5fb] text-[#1e73be] hover:bg-[#d0e2f5]'
                 }`}
               >
                 {sec}
               </button>
             ))}
          </div>
          {/* Header of Left Area */}
          <div className="h-10 bg-[#3b4354] text-white flex items-center justify-between px-4 font-bold text-sm tracking-wide border-b border-[#2a303c]">
            <span>Q.{activeSectionIndices.indexOf(currentQIndex) + 1}</span>"""
code = code.replace(main_content_old, main_content_new)

# 9. Question Paper button click
qp_old = """            {/* View Paper / Instruction */}
            <div className="flex justify-between mt-2 font-bold text-[#1e73be] cursor-pointer hover:underline">
              <div>Question Paper</div>"""
qp_new = """            {/* View Paper / Instruction */}
            <div className="flex justify-between mt-2 font-bold text-[#1e73be] cursor-pointer hover:underline">
              <div onClick={() => setShowQuestionPaper(true)}>Question Paper</div>"""
code = code.replace(qp_old, qp_new)

# 10. Filter Palette buttons by activeSection
palette_old = """          {/* Palette Area */}
          <div className="p-3 flex-1 overflow-y-auto bg-[#eef5fb]">
            <div className="flex flex-wrap gap-2.5">
              {shuffledQuestions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => navigateTo(i)}
                  className={`w-10 h-9 font-bold text-[13px] flex items-center justify-center shadow-sm hover:opacity-90 transition ${getPaletteClass(qStatus[q.id])} ${i === currentQIndex ? 'ring-2 ring-blue-500' : ''}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>"""
palette_new = """          {/* Palette Area */}
          <div className="p-3 flex-1 overflow-y-auto bg-[#eef5fb]">
            <div className="flex flex-wrap gap-2.5">
              {activeSectionIndices.map((globalIdx, localIdx) => {
                const q = shuffledQuestions[globalIdx];
                return (
                  <button
                    key={q.id}
                    onClick={() => navigateTo(globalIdx)}
                    className={`w-10 h-9 font-bold text-[13px] flex items-center justify-center shadow-sm hover:opacity-90 transition ${getPaletteClass(qStatus[q.id])} ${globalIdx === currentQIndex ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    {localIdx + 1}
                  </button>
                );
              })}
            </div>
          </div>"""
code = code.replace(palette_old, palette_new)


with open("src/components/TestEngine.tsx", "w") as f:
    f.write(code)

