'use client';

import { useEffect } from 'react';

export default function ImageZoomModal({ 
  imageUrl, 
  onClose 
}: { 
  imageUrl: string; 
  onClose: () => void;
}) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out"
      onClick={onClose}
    >
      <div 
        className="relative max-w-[95vw] max-h-[95vh] cursor-default"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
      >
        <button 
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-red-400 font-bold text-3xl"
        >
          &times;
        </button>
        <img 
          src={imageUrl} 
          alt="Zoomed Question Media" 
          className="max-w-full max-h-[90vh] object-contain rounded shadow-2xl bg-white"
        />
      </div>
    </div>
  );
}
