'use client';

import React, { useState, useEffect, useRef } from 'react';

interface CalculatorProps {
  onClose: () => void;
}

export default function Calculator({ onClose }: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [isRad, setIsRad] = useState(true);
  const [memory, setMemory] = useState(0);
  const [isNewValue, setIsNewValue] = useState(false);
  const [operator, setOperator] = useState<string | null>(null);
  const [prevValue, setPrevValue] = useState<number | null>(null);

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
    if (e.target instanceof HTMLButtonElement) return; // Don't drag if clicking buttons
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX - position.x,
      startY: e.clientY - position.y
    };
  };

  const parseValue = (val: string) => {
    if (val === 'Error' || val === 'NaN') return 0;
    return parseFloat(val) || 0;
  };

  const handleNum = (num: string) => {
    if (isNewValue || display === '0' || display === 'Error') {
      setDisplay(num);
      setIsNewValue(false);
    } else {
      setDisplay(display + num);
    }
  };

  const handleDot = () => {
    if (isNewValue || display === 'Error') {
      setDisplay('0.');
      setIsNewValue(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleBackspace = () => {
    if (isNewValue || display === 'Error') return;
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const clearEntry = () => {
    setDisplay('0');
  };

  const clearAll = () => {
    setDisplay('0');
    setEquation('');
    setPrevValue(null);
    setOperator(null);
    setIsNewValue(false);
  };

  const calculate = (a: number, b: number, op: string) => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b === 0 ? NaN : a / b;
      case 'Mod': return a % b;
      case 'y^x': return Math.pow(a, b);
      case 'yroot': return Math.pow(a, 1 / b);
      default: return b;
    }
  };

  const handleOp = (op: string) => {
    const current = parseValue(display);
    if (prevValue !== null && operator && !isNewValue) {
      const result = calculate(prevValue, current, operator);
      const output = Number.isNaN(result) ? 'Error' : parseFloat(result.toFixed(10)).toString();
      setDisplay(output);
      setPrevValue(Number.isNaN(result) ? null : result);
      setEquation(output + ' ' + op + ' ');
    } else {
      setPrevValue(current);
      setEquation(current + ' ' + op + ' ');
    }
    setOperator(op);
    setIsNewValue(true);
  };

  const handleEqual = () => {
    if (operator && prevValue !== null) {
      const current = parseValue(display);
      const result = calculate(prevValue, current, operator);
      const output = Number.isNaN(result) ? 'Error' : parseFloat(result.toFixed(10)).toString();
      setDisplay(output);
      setEquation('');
      setPrevValue(null);
      setOperator(null);
      setIsNewValue(true);
    }
  };

  const applyMath = (funcName: string, displaySymbol: string, mathFunc: (x: number) => number) => {
    const current = parseValue(display);
    const result = mathFunc(current);
    setDisplay(Number.isNaN(result) ? 'Error' : parseFloat(result.toFixed(10)).toString());
    setEquation(`${displaySymbol}(${current})`);
    setIsNewValue(true);
  };

  const handleSign = () => {
    if (display !== '0' && display !== 'Error') {
      setDisplay(display.startsWith('-') ? display.slice(1) : '-' + display);
    }
  };

  // Conversions for trig functions
  const toRad = (val: number) => isRad ? val : val * (Math.PI / 180);
  const fromRad = (val: number) => isRad ? val : val * (180 / Math.PI);

  const btnClass = "bg-[#f5f5f5] border border-[#ccc] text-[#333] hover:bg-[#e6e6e6] text-xs py-1.5 px-1 font-semibold rounded-sm active:bg-[#d4d4d4] transition-colors shadow-sm cursor-pointer";
  const numClass = "bg-[#ffffff] border border-[#ccc] text-black font-bold hover:bg-[#e6e6e6] text-sm py-1.5 px-1 rounded-sm active:bg-[#d4d4d4] transition-colors shadow-sm cursor-pointer";
  const opClass = "bg-[#f5f5f5] border border-[#ccc] text-black font-bold hover:bg-[#e6e6e6] text-sm py-1.5 px-1 rounded-sm active:bg-[#d4d4d4] transition-colors shadow-sm cursor-pointer";

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
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }} 
          className="text-white hover:text-red-200 font-bold px-2 text-lg leading-none cursor-pointer"
        >
          ×
        </button>
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
            <button className={btnClass} onClick={() => setMemory(0)}>MC</button>
            <button className={btnClass} onClick={() => { setDisplay(memory.toString()); setIsNewValue(true); }}>MR</button>
            <button className={btnClass} onClick={() => setMemory(parseValue(display))}>MS</button>
            <button className={btnClass} onClick={() => setMemory(memory + parseValue(display))}>M+</button>
            <button className={btnClass} onClick={() => setMemory(memory - parseValue(display))}>M-</button>
            <button className={btnClass} onClick={handleBackspace}>←</button>

            <button className={btnClass} onClick={() => applyMath('sin', 'sin', (x) => Math.sin(toRad(x)))}>sin</button>
            <button className={btnClass} onClick={() => applyMath('cos', 'cos', (x) => Math.cos(toRad(x)))}>cos</button>
            <button className={btnClass} onClick={() => applyMath('tan', 'tan', (x) => Math.tan(toRad(x)))}>tan</button>

            <button className={btnClass} onClick={() => applyMath('asin', 'asin', (x) => fromRad(Math.asin(x)))}>sin⁻¹</button>
            <button className={btnClass} onClick={() => applyMath('acos', 'acos', (x) => fromRad(Math.acos(x)))}>cos⁻¹</button>
            <button className={btnClass} onClick={() => applyMath('atan', 'atan', (x) => fromRad(Math.atan(x)))}>tan⁻¹</button>

            <button className={btnClass} onClick={() => applyMath('sinh', 'sinh', Math.sinh)}>sinh</button>
            <button className={btnClass} onClick={() => applyMath('cosh', 'cosh', Math.cosh)}>cosh</button>
            <button className={btnClass} onClick={() => applyMath('tanh', 'tanh', Math.tanh)}>tanh</button>

            <button className={btnClass} onClick={() => applyMath('x^2', 'sqr', (x) => x * x)}>x²</button>
            <button className={btnClass} onClick={() => applyMath('x^3', 'cube', (x) => x * x * x)}>x³</button>
            <button className={btnClass} onClick={() => handleOp('y^x')}>xʸ</button>

            <button className={btnClass} onClick={() => applyMath('10^x', '10^', (x) => Math.pow(10, x))}>10ˣ</button>
            <button className={btnClass} onClick={() => applyMath('e^x', 'e^', Math.exp)}>eˣ</button>
            <button className={btnClass} onClick={() => applyMath('1/x', '1/', (x) => 1 / x)}>1/x</button>

            <button className={btnClass} onClick={() => applyMath('sqrt', 'sqrt', Math.sqrt)}>√</button>
            <button className={btnClass} onClick={() => applyMath('cbrt', 'cbrt', Math.cbrt)}>³√</button>
            <button className={btnClass} onClick={() => handleOp('yroot')}>ʸ√x</button>
          </div>

          {/* Right Numpad Panel */}
          <div className="grid grid-cols-4 gap-1.5">
            <button className={btnClass} onClick={clearEntry}>CE</button>
            <button className={btnClass} onClick={clearAll}>C</button>
            <button className={btnClass} onClick={handleSign}>±</button>
            <button className={btnClass} onClick={() => applyMath('sqrt', 'sqrt', Math.sqrt)}>√</button>

            <button className={numClass} onClick={() => handleNum('7')}>7</button>
            <button className={numClass} onClick={() => handleNum('8')}>8</button>
            <button className={numClass} onClick={() => handleNum('9')}>9</button>
            <button className={opClass} onClick={() => handleOp('/')}>/</button>

            <button className={numClass} onClick={() => handleNum('4')}>4</button>
            <button className={numClass} onClick={() => handleNum('5')}>5</button>
            <button className={numClass} onClick={() => handleNum('6')}>6</button>
            <button className={opClass} onClick={() => handleOp('*')}>*</button>

            <button className={numClass} onClick={() => handleNum('1')}>1</button>
            <button className={numClass} onClick={() => handleNum('2')}>2</button>
            <button className={numClass} onClick={() => handleNum('3')}>3</button>
            <button className={opClass} onClick={() => handleOp('-')}>-</button>

            <button className={numClass} onClick={() => handleNum('0')}>0</button>
            <button className={numClass} onClick={handleDot}>.</button>
            <button className={opClass} onClick={handleEqual}>=</button>
            <button className={opClass} onClick={() => handleOp('+')}>+</button>

            {/* Extra bottom row */}
            <button className={btnClass} onClick={() => applyMath('ln', 'ln', Math.log)}>ln</button>
            <button className={btnClass} onClick={() => applyMath('log', 'log', Math.log10)}>log</button>
            <button className={btnClass} onClick={() => { setDisplay(Math.PI.toString()); setIsNewValue(true); }}>π</button>
            <button className={btnClass} onClick={() => { setDisplay(Math.E.toString()); setIsNewValue(true); }}>e</button>
          </div>
        </div>
      </div>
    </div>
  );
}
