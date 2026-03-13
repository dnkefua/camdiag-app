import React, { useState } from 'react';

const Scanner = ({ onCapture, onClose, t }) => {
  const [flashOn, setFlashOn] = useState(false);

  const handleCapture = () => {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-white z-[100] transition-opacity duration-150';
    document.body.appendChild(overlay);
    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.remove();
        onCapture();
      }, 150);
    }, 50);
  };

  return (
    <div className="bg-black h-screen w-full overflow-hidden flex flex-col text-white font-sans">
      <header className="relative z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={onClose} aria-label="Close Scanner" className="p-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
        </button>
        <div className="text-center">
          <h1 className="text-sm font-semibold tracking-wide uppercase">CamDiag Scan</h1>
          <p className="text-[10px] text-gray-300">Lab Test / X-Ray</p>
        </div>
        <button 
          onClick={() => setFlashOn(!flashOn)}
          className={`p-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10 ${flashOn ? 'opacity-100' : 'opacity-60'}`}
        >
          <svg className={`h-6 w-6 ${flashOn ? 'text-yellow-400' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
        </button>
      </header>

      <main className="flex-grow relative overflow-hidden viewfinder-bg flex items-center justify-center">
        <div className="absolute top-10 left-0 right-0 text-center px-6 z-10">
          <p className="bg-black/40 backdrop-blur-sm inline-block px-4 py-2 rounded-full text-sm font-medium border border-white/10">
            {t.align}
          </p>
        </div>
        
        <div className="guide-box relative w-4/5 aspect-[3/4] max-w-sm rounded-sm transition-all duration-300">
          <div className="corner corner-tl"></div>
          <div className="corner corner-tr"></div>
          <div className="corner corner-bl"></div>
          <div className="corner corner-br"></div>
          <div className="scan-line"></div>
        </div>

        <div className="absolute bottom-10 left-0 right-0 flex justify-center z-10">
          <div className="flex items-center space-x-2 bg-blue-600/90 px-4 py-2 rounded-lg animate-pulse">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
            </svg>
            <span className="text-xs font-medium">{t.positioning}</span>
          </div>
        </div>
      </main>

      <footer className="bg-black/90 pb-10 pt-6 px-8 flex items-center justify-between">
        <button className="flex flex-col items-center space-y-1 group">
          <div className="p-3 rounded-full bg-white/10 group-active:bg-white/20 transition-colors">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
          </div>
          <span className="text-[10px] text-gray-400 font-medium">{t.gallery}</span>
        </button>

        <button onClick={handleCapture} aria-label="Capture Photo" className="relative flex items-center justify-center">
          <div className="w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center p-1">
            <div className="w-full h-full bg-white rounded-full active:scale-90 transition-transform duration-75"></div>
          </div>
        </button>

        <button className="flex flex-col items-center space-y-1 opacity-50 cursor-not-allowed">
          <div className="p-3 rounded-full bg-white/5">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
          </div>
          <span className="text-[10px] text-gray-400 font-medium">{t.multi_scan}</span>
        </button>
      </footer>
    </div>
  );
};

export default Scanner;
