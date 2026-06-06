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
  const [position, setPosition] = useState({ x: 200, y: 150 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number }>({ startX: 0, startY: 0 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPosition({ x: window.innerWidth / 2 - 250, y: window.innerHeight / 2 - 200 });
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

    const handleMouseUp = () => setIsDragging(false);

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
    if (e.target instanceof HTMLButtonElement) return;
    setIsDragging(true);
    dragRef.current = { startX: e.clientX - position.x, startY: e.clientY - position.y };
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

  const clearEntry = () => setDisplay('0');

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

  const toRad = (val: number) => isRad ? val : val * (Math.PI / 180);
  const fromRad = (val: number) => isRad ? val : val * (180 / Math.PI);

  const btnClass = "bg-[#f5f5f5] hover:bg-[#e0e0e0] border border-[#ccc] text-[#333] text-[12px] font-sans h-8 flex items-center justify-center rounded-sm shadow-sm cursor-pointer select-none";
  const numClass = "bg-white hover:bg-[#e0e0e0] border border-[#ccc] text-[#333] font-bold text-[13px] font-sans h-8 flex items-center justify-center rounded-sm shadow-sm cursor-pointer select-none";
  const redClass = "bg-[#e74c3c] hover:bg-[#c0392b] border border-[#c0392b] text-white text-[12px] font-sans h-8 flex items-center justify-center rounded-sm shadow-sm cursor-pointer select-none";
  const greenClass = "bg-[#2ecc71] hover:bg-[#27ae60] border border-[#27ae60] text-white text-[16px] font-bold font-sans h-[70px] flex items-center justify-center rounded-sm shadow-sm cursor-pointer select-none absolute right-0 bottom-0 w-[42px]";

  return (
    <div
      className="fixed z-[9999] bg-[#dcdcdc] border border-[#888] rounded-t-lg shadow-2xl w-[520px] font-sans"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      {/* Header */}
      <div
        className="bg-[#4b8df8] text-white px-3 py-2 flex justify-between items-center cursor-move rounded-t-lg select-none"
        onMouseDown={handleMouseDown}
      >
        <span className="font-semibold text-[13px]">Scientific Calculator</span>
        <div className="flex gap-2 items-center">
          <button className="bg-[#669ff9] hover:bg-[#80b0ff] text-white text-xs px-2 py-0.5 rounded shadow-sm border border-[#508cf0]">Help</button>
          <button className="text-white hover:text-gray-200 font-bold px-1">—</button>
          <button onClick={onClose} className="text-white hover:text-red-300 font-bold px-1 text-lg leading-none">×</button>
        </div>
      </div>

      <div className="p-3 bg-[#dcdcdc] rounded-b-lg shadow-inner">
        {/* Displays */}
        <div className="bg-white border border-[#aaa] rounded-sm p-1 mb-1 h-6 flex items-center justify-end overflow-hidden shadow-inner">
          <span className="text-[#666] text-[11px] truncate">{equation}</span>
        </div>
        <div className="bg-white border border-[#aaa] rounded-sm p-1 mb-3 h-8 flex items-center justify-end overflow-hidden shadow-inner">
          <span className="text-black text-[16px] font-bold truncate">{display}</span>
        </div>

        {/* Controls Row */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1">
            <button className={btnClass + " w-[42px]"}>mod</button>
          </div>
          <div className="flex items-center gap-2 bg-[#dcdcdc] px-1 rounded border border-transparent">
            <label className="flex items-center gap-1 text-[11px] text-gray-700 font-medium cursor-pointer">
              <input type="radio" checked={!isRad} onChange={() => setIsRad(false)} className="w-3 h-3 text-[#4b8df8]" /> Deg
            </label>
            <label className="flex items-center gap-1 text-[11px] text-gray-700 font-medium cursor-pointer">
              <input type="radio" checked={isRad} onChange={() => setIsRad(true)} className="w-3 h-3 text-[#4b8df8]" /> Rad
            </label>
          </div>
          <div className="flex gap-[6px] ml-auto">
            <button className={btnClass + " w-[38px]"} onClick={() => setMemory(0)}>MC</button>
            <button className={btnClass + " w-[38px]"} onClick={() => { setDisplay(memory.toString()); setIsNewValue(true); }}>MR</button>
            <button className={btnClass + " w-[38px]"} onClick={() => setMemory(parseValue(display))}>MS</button>
            <button className={btnClass + " w-[38px]"} onClick={() => setMemory(memory + parseValue(display))}>M+</button>
            <button className={btnClass + " w-[38px]"} onClick={() => setMemory(memory - parseValue(display))}>M-</button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="flex gap-2 relative">
          {/* Functions Grid (Left) */}
          <div className="grid grid-cols-6 gap-[6px] w-[280px]">
            {/* Row 1 */}
            <button className={btnClass} onClick={() => applyMath('sinh', 'sinh', Math.sinh)}>sinh</button>
            <button className={btnClass} onClick={() => applyMath('cosh', 'cosh', Math.cosh)}>cosh</button>
            <button className={btnClass} onClick={() => applyMath('tanh', 'tanh', Math.tanh)}>tanh</button>
            <button className={btnClass} onClick={() => applyMath('Exp', 'Exp', Math.exp)}>Exp</button>
            <button className={btnClass} onClick={() => { handleNum('('); setIsNewValue(false); }}>(</button>
            <button className={btnClass} onClick={() => { handleNum(')'); setIsNewValue(false); }}>)</button>
            
            {/* Row 2 */}
            <button className={btnClass} onClick={() => applyMath('asinh', 'asinh', Math.asinh)}>sinh⁻¹</button>
            <button className={btnClass} onClick={() => applyMath('acosh', 'acosh', Math.acosh)}>cosh⁻¹</button>
            <button className={btnClass} onClick={() => applyMath('atanh', 'atanh', Math.atanh)}>tanh⁻¹</button>
            <button className={btnClass} onClick={() => applyMath('log2', 'log2', Math.log2)}>log₂x</button>
            <button className={btnClass} onClick={() => applyMath('ln', 'ln', Math.log)}>ln</button>
            <button className={btnClass} onClick={() => applyMath('log10', 'log', Math.log10)}>log</button>

            {/* Row 3 */}
            <button className={btnClass} onClick={() => { setDisplay(Math.PI.toString()); setIsNewValue(true); }}>π</button>
            <button className={btnClass} onClick={() => { setDisplay(Math.E.toString()); setIsNewValue(true); }}>e</button>
            <button className={btnClass} onClick={() => applyMath('fact', 'fact', factorial)}>n!</button>
            <button className={btnClass} onClick={() => handleOp('yroot')}>y√x</button>
            <button className={btnClass} onClick={() => applyMath('exp', 'e^', Math.exp)}>eˣ</button>
            <button className={btnClass} onClick={() => applyMath('10^x', '10^', x => Math.pow(10, x))}>10ˣ</button>

            {/* Row 4 */}
            <button className={btnClass} onClick={() => applyMath('sin', 'sin', x => Math.sin(toRad(x)))}>sin</button>
            <button className={btnClass} onClick={() => applyMath('cos', 'cos', x => Math.cos(toRad(x)))}>cos</button>
            <button className={btnClass} onClick={() => applyMath('tan', 'tan', x => Math.tan(toRad(x)))}>tan</button>
            <button className={btnClass} onClick={() => handleOp('y^x')}>xʸ</button>
            <button className={btnClass} onClick={() => applyMath('x^3', 'cube', x => Math.pow(x, 3))}>x³</button>
            <button className={btnClass} onClick={() => applyMath('x^2', 'sqr', x => Math.pow(x, 2))}>x²</button>

            {/* Row 5 */}
            <button className={btnClass} onClick={() => applyMath('asin', 'asin', x => fromRad(Math.asin(x)))}>sin⁻¹</button>
            <button className={btnClass} onClick={() => applyMath('acos', 'acos', x => fromRad(Math.acos(x)))}>cos⁻¹</button>
            <button className={btnClass} onClick={() => applyMath('atan', 'atan', x => fromRad(Math.atan(x)))}>tan⁻¹</button>
            <button className={btnClass} onClick={() => applyMath('sqrt', 'sqrt', Math.sqrt)}>√x</button>
            <button className={btnClass} onClick={() => applyMath('cbrt', 'cbrt', Math.cbrt)}>³√x</button>
            <button className={btnClass} onClick={() => applyMath('abs', 'abs', Math.abs)}>|x|</button>
          </div>

          {/* Numpad & Operators (Right) */}
          <div className="grid grid-cols-5 gap-[6px] w-[210px] relative">
            {/* Top row overrides: Backspace, C, +/-, sqrt */}
            <button className={redClass + " col-span-2"} onClick={handleBackspace}>←</button>
            <button className={redClass + " col-span-1"} onClick={clearAll}>C</button>
            <button className={redClass + " col-span-1"} onClick={handleSign}>±</button>
            <button className={btnClass} onClick={() => applyMath('sqrt', 'sqrt', Math.sqrt)}>√</button>

            {/* Row 2 */}
            <button className={numClass} onClick={() => handleNum('7')}>7</button>
            <button className={numClass} onClick={() => handleNum('8')}>8</button>
            <button className={numClass} onClick={() => handleNum('9')}>9</button>
            <button className={btnClass} onClick={() => handleOp('/')}>/</button>
            <button className={btnClass} onClick={() => handleOp('mod')}>%</button>

            {/* Row 3 */}
            <button className={numClass} onClick={() => handleNum('4')}>4</button>
            <button className={numClass} onClick={() => handleNum('5')}>5</button>
            <button className={numClass} onClick={() => handleNum('6')}>6</button>
            <button className={btnClass} onClick={() => handleOp('*')}>*</button>
            <button className={btnClass} onClick={() => applyMath('1/x', 'recip', x => 1/x)}>1/x</button>

            {/* Row 4 */}
            <button className={numClass} onClick={() => handleNum('1')}>1</button>
            <button className={numClass} onClick={() => handleNum('2')}>2</button>
            <button className={numClass} onClick={() => handleNum('3')}>3</button>
            <button className={btnClass} onClick={() => handleOp('-')}>-</button>
            {/* Equal spans 2 rows, so we use absolute positioning for it */}

            {/* Row 5 */}
            <button className={numClass + " col-span-2"} onClick={() => handleNum('0')}>0</button>
            <button className={numClass} onClick={handleDot}>.</button>
            <button className={btnClass} onClick={() => handleOp('+')}>+</button>

            <button className={greenClass} onClick={handleEqual}>=</button>
          </div>
        </div>
      </div>
    </div>
  );
}
