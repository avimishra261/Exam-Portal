'use client';

import { useState, useRef, useEffect } from 'react';

export default function Calculator({ onClose }: { onClose: () => void }) {
  const [display, setDisplay] = useState('0');
  const [memory, setMemory] = useState<number>(0);
  const [equation, setEquation] = useState<string>('');
  const [isRad, setIsRad] = useState(true);
  
  // Dragging state
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number }>({ startX: 0, startY: 0 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPosition({ x: window.innerWidth - 500, y: 100 });
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragRef.current.startX,
          y: e.clientY - dragRef.current.startY
        });
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX - position.x,
      startY: e.clientY - position.y
    };
  };

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
      if (!equation) return;
      const fullEq = equation + display;
      const parts = fullEq.split(' ');
      if (parts.length >= 3) {
        const a = parseFloat(parts[0]);
        const op = parts[1];
        const b = parseFloat(parts[2]);
        let res = 0;
        switch(op) {
          case '+': res = a + b; break;
          case '-': res = a - b; break;
          case '*': res = a * b; break;
          case '/': res = b !== 0 ? a / b : NaN; break;
          case 'Mod': res = a % b; break;
          case 'y^x': res = Math.pow(a, b); break;
        }
        setDisplay(Number.isNaN(res) ? 'Error' : parseFloat(res.toFixed(10)).toString());
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
      setDisplay(Number.isNaN(res) ? 'Error' : parseFloat(res.toFixed(10)).toString());
    } catch {
      setDisplay('Error');
    }
  };

  const toRad = (n: number) => isRad ? n : n * Math.PI / 180;
  
  // Custom functions
  const handleSign = () => {
    if (display !== '0' && display !== 'Error') {
      setDisplay(display.startsWith('-') ? display.slice(1) : '-' + display);
    }
  };

  const handleBackspace = () => {
    if (display !== 'Error' && display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const btnClass = "bg-[#f5f5f5] border border-[#ccc] text-[#333] hover:bg-[#e6e6e6] text-xs py-1.5 px-1 font-semibold rounded-sm active:bg-[#d4d4d4] transition-colors shadow-sm";
  const numClass = "bg-[#ffffff] border border-[#ccc] text-black font-bold hover:bg-[#e6e6e6] text-sm py-1.5 px-1 rounded-sm active:bg-[#d4d4d4] transition-colors shadow-sm";
  const opClass = "bg-[#f5f5f5] border border-[#ccc] text-black font-bold hover:bg-[#e6e6e6] text-sm py-1.5 px-1 rounded-sm active:bg-[#d4d4d4] transition-colors shadow-sm";

  return (
    <div 
      className="fixed z-50 bg-[#e8e8e8] shadow-[0_5px_15px_rgba(0,0,0,0.5)] border border-[#a0a0a0] w-[450px] select-none rounded-t font-sans"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      {/* Header */}
      <div 
        className="bg-[#337ab7] text-white px-3 py-2 flex justify-between items-center cursor-move rounded-t"
        onMouseDown={handleMouseDown}
      >
        <span className="font-bold text-sm tracking-wide">Calculator</span>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-white hover:text-red-200 font-bold px-2 text-lg leading-none cursor-pointer">×</button>
      </div>

      <div className="p-3 bg-[#d9e4f1]">
        {/* Screen */}
        <div className="bg-[#c3d9ff] border border-[#8faad9] rounded-sm mb-3 p-1 shadow-inner">
          <div className="text-right text-[#555] text-xs h-4 leading-tight px-1 font-mono">{equation}</div>
          <div className="text-right text-2xl font-mono text-black font-bold h-8 leading-tight px-1 overflow-hidden">{display}</div>
        </div>

        {/* Radio buttons */}
        <div className="flex gap-4 mb-3 px-1 text-xs font-semibold text-[#333]">
          <label className="flex items-center gap-1 cursor-pointer">
            <input type="radio" name="angle" checked={!isRad} onChange={() => setIsRad(false)} className="w-3 h-3 cursor-pointer" /> Deg
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input type="radio" name="angle" checked={isRad} onChange={() => setIsRad(true)} className="w-3 h-3 cursor-pointer" /> Rad
          </label>
        </div>

        {/* Keypad Layout */}
        <div className="grid grid-cols-2 gap-3">
          {/* Left Scientific Panel */}
          <div className="grid grid-cols-3 gap-1.5">
            <button className={btnClass}>MC</button>
            <button className={btnClass} onClick={() => setDisplay(memory.toString())}>MR</button>
            <button className={btnClass} onClick={() => setMemory(parseFloat(display))}>MS</button>
            <button className={btnClass} onClick={() => setMemory(memory + parseFloat(display))}>M+</button>
            <button className={btnClass} onClick={() => setMemory(memory - parseFloat(display))}>M-</button>
            <button className={btnClass} onClick={handleBackspace}>←</button>

            <button className={btnClass} onClick={() => calculateMath(n => Math.sin(toRad(n)))}>sin</button>
            <button className={btnClass} onClick={() => calculateMath(n => Math.cos(toRad(n)))}>cos</button>
            <button className={btnClass} onClick={() => calculateMath(n => Math.tan(toRad(n)))}>tan</button>

            <button className={btnClass} onClick={() => calculateMath(Math.asin)}>sin⁻¹</button>
            <button className={btnClass} onClick={() => calculateMath(Math.acos)}>cos⁻¹</button>
            <button className={btnClass} onClick={() => calculateMath(Math.atan)}>tan⁻¹</button>

            <button className={btnClass} onClick={() => calculateMath(Math.sinh)}>sinh</button>
            <button className={btnClass} onClick={() => calculateMath(Math.cosh)}>cosh</button>
            <button className={btnClass} onClick={() => calculateMath(Math.tanh)}>tanh</button>

            <button className={btnClass} onClick={() => calculateMath(n => n*n)}>x²</button>
            <button className={btnClass} onClick={() => calculateMath(n => n*n*n)}>x³</button>
            <button className={btnClass} onClick={() => appendOp('y^x')}>xʸ</button>

            <button className={btnClass} onClick={() => calculateMath(n => Math.pow(10, n))}>10ˣ</button>
            <button className={btnClass} onClick={() => calculateMath(Math.exp)}>eˣ</button>
            <button className={btnClass} onClick={() => calculateMath(n => 1/n)}>1/x</button>

            <button className={btnClass} onClick={() => calculateMath(Math.sqrt)}>√</button>
            <button className={btnClass} onClick={() => calculateMath(Math.cbrt)}>³√</button>
            <button className={btnClass} onClick={() => appendOp('y√x')}>ʸ√x</button>
          </div>

          {/* Right Numpad Panel */}
          <div className="grid grid-cols-4 gap-1.5">
            <button className={btnClass} onClick={() => setDisplay('0')}>CE</button>
            <button className={btnClass} onClick={() => { setDisplay('0'); setEquation(''); }}>C</button>
            <button className={btnClass} onClick={handleSign}>±</button>
            <button className={btnClass} onClick={() => calculateMath(Math.sqrt)}>√</button>

            <button className={numClass} onClick={() => appendNum('7')}>7</button>
            <button className={numClass} onClick={() => appendNum('8')}>8</button>
            <button className={numClass} onClick={() => appendNum('9')}>9</button>
            <button className={opClass} onClick={() => appendOp('/')}>/</button>

            <button className={numClass} onClick={() => appendNum('4')}>4</button>
            <button className={numClass} onClick={() => appendNum('5')}>5</button>
            <button className={numClass} onClick={() => appendNum('6')}>6</button>
            <button className={opClass} onClick={() => appendOp('*')}>*</button>

            <button className={numClass} onClick={() => appendNum('1')}>1</button>
            <button className={numClass} onClick={() => appendNum('2')}>2</button>
            <button className={numClass} onClick={() => appendNum('3')}>3</button>
            <button className={opClass} onClick={() => appendOp('-')}>-</button>

            <button className={numClass} onClick={() => appendNum('0')}>0</button>
            <button className={numClass} onClick={() => appendNum('.')}>.</button>
            <button className={opClass} onClick={calculate}>=</button>
            <button className={opClass} onClick={() => appendOp('+')}>+</button>

            {/* Extra bottom row */}
            <button className={btnClass} onClick={() => calculateMath(Math.log)}>ln</button>
            <button className={btnClass} onClick={() => calculateMath(Math.log10)}>log</button>
            <button className={btnClass} onClick={() => setDisplay(Math.PI.toString())}>π</button>
            <button className={btnClass} onClick={() => setDisplay(Math.E.toString())}>e</button>
          </div>
        </div>
      </div>
    </div>
  );
}
