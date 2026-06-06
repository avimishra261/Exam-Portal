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
      setPosition({ x: window.innerWidth - 600, y: 100 });
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
      case 'mod': return a % b;
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

  const factorial = (n: number): number => {
    if (n < 0 || !Number.isInteger(n)) return NaN;
    if (n === 0 || n === 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
  };

  // Conversions for trig functions
  const toRad = (val: number) => isRad ? val : val * (Math.PI / 180);
  const fromRad = (val: number) => isRad ? val : val * (180 / Math.PI);

  const btnSciClass = "bg-gradient-to-b from-[#f9f9f9] to-[#e4e4e4] border border-[#a0a0a0] text-[#000] hover:from-[#e4e4e4] hover:to-[#d0d0d0] text-sm py-1.5 px-0.5 font-bold rounded shadow-sm cursor-pointer";
  const btnNumClass = "bg-gradient-to-b from-[#ffffff] to-[#f0f0f0] border border-[#a0a0a0] text-[#000] font-bold hover:from-[#f0f0f0] hover:to-[#e0e0e0] text-sm py-1.5 px-0.5 rounded shadow-sm cursor-pointer";
  const btnOpClass = "bg-gradient-to-b from-[#e6e6e6] to-[#d4d4d4] border border-[#a0a0a0] text-[#000] font-bold hover:from-[#d4d4d4] hover:to-[#c0c0c0] text-sm py-1.5 px-0.5 rounded shadow-sm cursor-pointer";
  const btnRedClass = "bg-gradient-to-b from-[#fce4e4] to-[#f8caca] border border-[#a0a0a0] text-[#d00000] font-bold hover:from-[#f8caca] hover:to-[#f0a0a0] text-sm py-1.5 px-0.5 rounded shadow-sm cursor-pointer";

  return (
    <div
      className="fixed z-50 bg-[#c0d0e0] shadow-2xl border-2 border-[#8090a0] w-[560px] select-none rounded font-sans"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      {/* Header */}
      <div
        className="bg-gradient-to-b from-[#4080c0] to-[#2060a0] text-white px-3 py-1.5 flex justify-between items-center cursor-move rounded-t border-b border-[#204060]"
        onMouseDown={handleMouseDown}
      >
        <span className="font-bold text-[13px] tracking-wide">Scientific Calculator</span>
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }} 
          className="text-white hover:text-red-300 font-bold px-1 text-lg leading-none cursor-pointer"
        >
          ×
        </button>
      </div>

      <div className="p-3">
        {/* Screen */}
        <div className="bg-[#f0f4f8] border-2 border-[#a0b0c0] rounded mb-3 p-1 shadow-inner relative">
          <div className="text-right text-[#666] text-sm h-5 leading-tight px-2 font-mono break-all overflow-hidden whitespace-nowrap">{equation}</div>
          <div className="text-right text-3xl font-mono text-black font-bold h-10 leading-tight px-2 overflow-hidden whitespace-nowrap">{display}</div>
          {memory !== 0 && <div className="absolute left-2 bottom-2 text-xs font-bold text-gray-500">M</div>}
        </div>

        {/* Radio buttons */}
        <div className="flex gap-4 mb-3 px-1 text-sm font-bold text-[#333]">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="radio" name="angle" checked={!isRad} onChange={() => setIsRad(false)} className="cursor-pointer" /> Deg
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="radio" name="angle" checked={isRad} onChange={() => setIsRad(true)} className="cursor-pointer" /> Rad
          </label>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-2 gap-4">
          
          {/* Left Panel - Scientific */}
          <div className="grid grid-cols-4 gap-1.5">
            <button className={btnSciClass} onClick={() => applyMath('sin', 'sin', (x) => Math.sin(toRad(x)))}>sin</button>
            <button className={btnSciClass} onClick={() => applyMath('cos', 'cos', (x) => Math.cos(toRad(x)))}>cos</button>
            <button className={btnSciClass} onClick={() => applyMath('tan', 'tan', (x) => Math.tan(toRad(x)))}>tan</button>
            <button className={btnSciClass} onClick={() => applyMath('x^2', 'sqr', (x) => x * x)}>x²</button>

            <button className={btnSciClass} onClick={() => applyMath('sinh', 'sinh', Math.sinh)}>sinh</button>
            <button className={btnSciClass} onClick={() => applyMath('cosh', 'cosh', Math.cosh)}>cosh</button>
            <button className={btnSciClass} onClick={() => applyMath('tanh', 'tanh', Math.tanh)}>tanh</button>
            <button className={btnSciClass} onClick={() => applyMath('x^3', 'cube', (x) => x * x * x)}>x³</button>

            <button className={btnSciClass} onClick={() => applyMath('asin', 'asin', (x) => fromRad(Math.asin(x)))}>sin⁻¹</button>
            <button className={btnSciClass} onClick={() => applyMath('acos', 'acos', (x) => fromRad(Math.acos(x)))}>cos⁻¹</button>
            <button className={btnSciClass} onClick={() => applyMath('atan', 'atan', (x) => fromRad(Math.atan(x)))}>tan⁻¹</button>
            <button className={btnSciClass} onClick={() => handleOp('y^x')}>xʸ</button>

            <button className={btnSciClass} onClick={() => applyMath('10^x', '10^', (x) => Math.pow(10, x))}>10ˣ</button>
            <button className={btnSciClass} onClick={() => applyMath('e^x', 'e^', Math.exp)}>eˣ</button>
            <button className={btnSciClass} onClick={() => applyMath('1/x', '1/', (x) => 1 / x)}>1/x</button>
            <button className={btnSciClass} onClick={() => applyMath('sqrt', 'sqrt', Math.sqrt)}>√</button>

            <button className={btnSciClass} onClick={() => applyMath('log', 'log', Math.log10)}>log</button>
            <button className={btnSciClass} onClick={() => applyMath('ln', 'ln', Math.log)}>ln</button>
            <button className={btnSciClass} onClick={() => { setDisplay(Math.E.toString()); setIsNewValue(true); }}>e</button>
            <button className={btnSciClass} onClick={() => applyMath('cbrt', 'cbrt', Math.cbrt)}>³√</button>

            <button className={btnSciClass} onClick={() => applyMath('n!', 'fact', factorial)}>n!</button>
            <button className={btnSciClass} onClick={() => { setDisplay(Math.PI.toString()); setIsNewValue(true); }}>π</button>
            <button className={btnSciClass} onClick={() => handleOp('yroot')}>ʸ√x</button>
            <button className={btnSciClass} onClick={() => applyMath('abs', 'abs', Math.abs)}>|x|</button>
          </div>

          {/* Right Panel - Numpad */}
          <div className="grid grid-cols-5 gap-1.5">
            <button className={btnSciClass} onClick={() => setMemory(0)}>MC</button>
            <button className={btnSciClass} onClick={() => { setDisplay(memory.toString()); setIsNewValue(true); }}>MR</button>
            <button className={btnSciClass} onClick={() => setMemory(parseValue(display))}>MS</button>
            <button className={btnSciClass} onClick={() => setMemory(memory + parseValue(display))}>M+</button>
            <button className={btnSciClass} onClick={() => setMemory(memory - parseValue(display))}>M-</button>

            <button className={btnRedClass} onClick={handleBackspace}>←</button>
            <button className={btnRedClass} onClick={clearEntry}>CE</button>
            <button className={btnRedClass} onClick={clearAll}>C</button>
            <button className={btnOpClass} onClick={handleSign}>±</button>
            <button className={btnOpClass} onClick={() => handleOp('mod')}>mod</button>

            <button className={btnNumClass} onClick={() => handleNum('7')}>7</button>
            <button className={btnNumClass} onClick={() => handleNum('8')}>8</button>
            <button className={btnNumClass} onClick={() => handleNum('9')}>9</button>
            <button className={btnOpClass} onClick={() => handleOp('/')}>/</button>
            <button className={btnOpClass} onClick={() => applyMath('percent', '%', (x) => x / 100)}>%</button>

            <button className={btnNumClass} onClick={() => handleNum('4')}>4</button>
            <button className={btnNumClass} onClick={() => handleNum('5')}>5</button>
            <button className={btnNumClass} onClick={() => handleNum('6')}>6</button>
            <button className={btnOpClass} onClick={() => handleOp('*')}>*</button>
            <button className={btnSciClass} onClick={() => applyMath('10^x', '10^', (x) => Math.pow(10, x))}>10ˣ</button>

            <button className={btnNumClass} onClick={() => handleNum('1')}>1</button>
            <button className={btnNumClass} onClick={() => handleNum('2')}>2</button>
            <button className={btnNumClass} onClick={() => handleNum('3')}>3</button>
            <button className={btnOpClass} onClick={() => handleOp('-')}>-</button>
            <button className={btnSciClass} onClick={() => applyMath('e^x', 'e^', Math.exp)}>eˣ</button>

            <button className={btnNumClass} onClick={() => handleNum('0')}>0</button>
            <button className={btnNumClass} onClick={handleDot}>.</button>
            <button className={btnOpClass} onClick={() => { handleNum('0'); handleNum('0'); }}>00</button>
            <button className={btnOpClass} onClick={() => handleOp('+')}>+</button>
            <button className={btnOpClass} onClick={handleEqual}>=</button>
          </div>

        </div>
      </div>
    </div>
  );
}
