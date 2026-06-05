'use client';

import { useState, useRef, useEffect } from 'react';

export default function Calculator({ onClose }: { onClose: () => void }) {
  const [display, setDisplay] = useState('0');
  const [memory, setMemory] = useState<number>(0);
  const [equation, setEquation] = useState<string>('');
  
  // Dragging state
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number }>({ startX: 0, startY: 0 });
  const calcRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial position to center-right
    if (typeof window !== 'undefined') {
      setPosition({ x: window.innerWidth - 350, y: 100 });
    }
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX - position.x,
      startY: e.clientY - position.y
    };
    if (calcRef.current) {
      calcRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragRef.current.startX,
        y: e.clientY - dragRef.current.startY
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    if (calcRef.current) {
      calcRef.current.releasePointerCapture(e.pointerId);
    }
  };

  // Calculator logic
  const appendNum = (num: string) => {
    if (display === '0' || display === 'Error') setDisplay(num);
    else setDisplay(display + num);
  };

  const appendOp = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const calculate = () => {
    try {
      // Evaluate string securely without eval by simple parsing
      const fullEq = equation + display;
      const parts = fullEq.split(' ');
      if (parts.length === 3) {
        const a = parseFloat(parts[0]);
        const op = parts[1];
        const b = parseFloat(parts[2]);
        let res = 0;
        switch(op) {
          case '+': res = a + b; break;
          case '-': res = a - b; break;
          case '*': res = a * b; break;
          case '/': res = b !== 0 ? a / b : NaN; break;
        }
        setDisplay(Number.isNaN(res) ? 'Error' : res.toString());
        setEquation('');
      }
    } catch {
      setDisplay('Error');
    }
  };

  const calculateMath = (func: (n: number) => number) => {
    try {
      const n = parseFloat(display);
      const res = func(n);
      setDisplay(Number.isNaN(res) ? 'Error' : res.toString());
    } catch {
      setDisplay('Error');
    }
  };

  return (
    <div 
      ref={calcRef}
      className="fixed z-50 bg-gray-100 rounded-lg shadow-2xl border border-gray-300 w-72 touch-none overflow-hidden"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Header / Drag Handle */}
      <div className="bg-blue-800 text-white px-3 py-2 flex justify-between items-center cursor-move select-none">
        <span className="font-semibold text-sm">GATE Calculator</span>
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }} 
          className="text-white hover:text-red-300 font-bold px-2 pointer-events-auto"
        >
          &times;
        </button>
      </div>

      {/* Screen */}
      <div className="p-3 bg-gray-200">
        <div className="text-right text-gray-500 text-xs h-4">{equation}</div>
        <div className="bg-white border border-gray-300 px-2 py-1 text-right text-xl font-mono overflow-hidden">
          {display}
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-4 gap-1 p-2 bg-gray-200 select-none pointer-events-auto">
        <button onClick={() => setMemory(memory + parseFloat(display))} className="bg-gray-300 py-1 hover:bg-gray-400 text-sm">M+</button>
        <button onClick={() => setMemory(memory - parseFloat(display))} className="bg-gray-300 py-1 hover:bg-gray-400 text-sm">M-</button>
        <button onClick={() => setDisplay(memory.toString())} className="bg-gray-300 py-1 hover:bg-gray-400 text-sm">MR</button>
        <button onClick={() => setMemory(0)} className="bg-gray-300 py-1 hover:bg-gray-400 text-sm">MC</button>

        <button onClick={() => calculateMath(n => Math.sin(n * Math.PI / 180))} className="bg-blue-100 py-1 hover:bg-blue-200 text-sm">sin</button>
        <button onClick={() => calculateMath(n => Math.cos(n * Math.PI / 180))} className="bg-blue-100 py-1 hover:bg-blue-200 text-sm">cos</button>
        <button onClick={() => calculateMath(n => Math.tan(n * Math.PI / 180))} className="bg-blue-100 py-1 hover:bg-blue-200 text-sm">tan</button>
        <button onClick={() => setDisplay(Math.PI.toString())} className="bg-blue-100 py-1 hover:bg-blue-200 text-sm">π</button>

        <button onClick={() => calculateMath(Math.log10)} className="bg-blue-100 py-1 hover:bg-blue-200 text-sm">log</button>
        <button onClick={() => calculateMath(Math.log)} className="bg-blue-100 py-1 hover:bg-blue-200 text-sm">ln</button>
        <button onClick={() => calculateMath(Math.sqrt)} className="bg-blue-100 py-1 hover:bg-blue-200 text-sm">√</button>
        <button onClick={() => calculateMath(n => n * n)} className="bg-blue-100 py-1 hover:bg-blue-200 text-sm">x²</button>

        <button onClick={() => appendNum('7')} className="bg-white py-2 hover:bg-gray-100 font-bold">7</button>
        <button onClick={() => appendNum('8')} className="bg-white py-2 hover:bg-gray-100 font-bold">8</button>
        <button onClick={() => appendNum('9')} className="bg-white py-2 hover:bg-gray-100 font-bold">9</button>
        <button onClick={() => appendOp('/')} className="bg-blue-600 text-white py-2 hover:bg-blue-700 font-bold">÷</button>

        <button onClick={() => appendNum('4')} className="bg-white py-2 hover:bg-gray-100 font-bold">4</button>
        <button onClick={() => appendNum('5')} className="bg-white py-2 hover:bg-gray-100 font-bold">5</button>
        <button onClick={() => appendNum('6')} className="bg-white py-2 hover:bg-gray-100 font-bold">6</button>
        <button onClick={() => appendOp('*')} className="bg-blue-600 text-white py-2 hover:bg-blue-700 font-bold">×</button>

        <button onClick={() => appendNum('1')} className="bg-white py-2 hover:bg-gray-100 font-bold">1</button>
        <button onClick={() => appendNum('2')} className="bg-white py-2 hover:bg-gray-100 font-bold">2</button>
        <button onClick={() => appendNum('3')} className="bg-white py-2 hover:bg-gray-100 font-bold">3</button>
        <button onClick={() => appendOp('-')} className="bg-blue-600 text-white py-2 hover:bg-blue-700 font-bold">-</button>

        <button onClick={() => setDisplay('0')} className="bg-red-500 text-white py-2 hover:bg-red-600 font-bold">C</button>
        <button onClick={() => appendNum('0')} className="bg-white py-2 hover:bg-gray-100 font-bold">0</button>
        <button onClick={() => appendNum('.')} className="bg-white py-2 hover:bg-gray-100 font-bold">.</button>
        <button onClick={() => appendOp('+')} className="bg-blue-600 text-white py-2 hover:bg-blue-700 font-bold">+</button>

        <button onClick={calculate} className="col-span-4 bg-green-600 text-white py-2 hover:bg-green-700 font-bold mt-1">=</button>
      </div>
    </div>
  );
}
