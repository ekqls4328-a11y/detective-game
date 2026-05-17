import React, { useEffect, useState } from 'react';
// 💡 import 문을 아예 지웠어!

const SplashScreen = ({ onFinish }) => {
  const [stage, setStage] = useState('hidden'); 
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const fadeInTimer = setTimeout(() => {
      setStage('visible');
    }, 500);

    const fadeOutTimer = setTimeout(() => {
      setStage('fadeOut');
    }, 2500);

    const finishTimer = setTimeout(() => {
      onFinish();
    }, 3500);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center">
      <div 
        className={`transition-opacity duration-1000 ease-in-out flex flex-col items-center gap-6 ${
          stage === 'visible' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        
        <div className="flex flex-col items-center gap-4">
          {/* 💡 src에 문자열로 직접 경로를 줬어. (public 폴더 기준) */}
          <img 
            src="/assets/studio_logo.png" 
            alt="Studio PK Logo"
            onLoad={() => setImageLoaded(true)} 
            onError={() => setImageLoaded(false)} 
            className={`transition-all duration-500 w-24 h-auto opacity-90 ${
              imageLoaded ? 'block' : 'hidden'
            }`}
          />

          <span 
            className={`text-6xl text-white/80 animate-pulse ${
              imageLoaded ? 'hidden' : 'block'
            }`}
          >
            👁️
          </span>
        </div>

        <div className="text-center mt-2">
          <h1 className="text-white font-black tracking-[0.4em] text-2xl mb-2">
            STUDIO PK
          </h1>
          <p className="text-neutral-600 font-bold text-xs tracking-[0.3em]">
            PRESENTS
          </p>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;