'use client';

import React from 'react';

export default function VirtualNumpad({
  value,
  onChange
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const handlePress = (key: string) => {
    if (key === 'Clear') {
      onChange('');
    } else if (key === 'Backspace') {
      onChange(value.slice(0, -1));
    } else if (key === '-') {
      // Toggle negative sign
      if (value.startsWith('-')) {
        onChange(value.slice(1));
      } else {
        onChange('-' + value);
      }
    } else if (key === '.') {
      if (!value.includes('.')) {
        onChange(value + '.');
      }
    } else {
      onChange(value + key);
    }
  };

  const btnClass = "bg-white border border-gray-300 text-gray-700 font-bold py-2 px-4 hover:bg-blue-50 transition active:bg-blue-100 rounded-sm";

  return (
    <div className="mt-4 p-4 bg-[#f8f9fa] border border-gray-200 rounded-md shadow-sm max-w-[240px]">
      <div className="text-xs text-gray-500 mb-2 font-semibold text-center">VIRTUAL NUMPAD</div>
      <div className="grid grid-cols-3 gap-2">
        {['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '-'].map(key => (
          <button
            key={key}
            onClick={() => handlePress(key)}
            className={btnClass}
            type="button"
          >
            {key}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <button
          onClick={() => handlePress('Backspace')}
          className="bg-orange-100 border border-orange-300 text-orange-700 font-bold py-2 px-4 hover:bg-orange-200 transition rounded-sm text-sm"
          type="button"
        >
          Backspace
        </button>
        <button
          onClick={() => handlePress('Clear')}
          className="bg-red-100 border border-red-300 text-red-700 font-bold py-2 px-4 hover:bg-red-200 transition rounded-sm text-sm"
          type="button"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
