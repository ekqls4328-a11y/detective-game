import React from 'react';

const TitleScreen = ({ onStartGame, hasSaveData, onContinue, onOpenSettings }) => {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* 💡 우측 상단 설정 버튼 */}
      <button 
        onClick={onOpenSettings}
        className="absolute top-6 right-6 z-20 w-10 h-10 bg-neutral-900/80 backdrop-blur border border-neutral-700 rounded-full flex items-center justify-center text-xl shadow-lg hover:bg-neutral-800 active:scale-95"
      >
        ⚙️
      </button>
      {/* 배경 장식 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-800 via-neutral-950 to-black opacity-50" />
      
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm gap-12">
        {/* 타이틀 영역 */}
        <div className="text-center space-y-4">
          <p className="text-red-600 font-bold tracking-[0.3em] text-sm animate-pulse">DETECTIVE FILES</p>
          <h1 className="text-5xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            살인사건<br/>
            <span className="text-neutral-500">조사보고서</span>
          </h1>
        </div>

        {/* 버튼 영역 */}
        <div className="flex flex-col gap-4 w-full">
          {hasSaveData && (
            <button 
              onClick={onContinue}
              className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-2xl shadow-[0_0_20px_rgba(217,119,6,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>📂</span> 이어서 수사하기
            </button>
          )}
          
          <button 
            onClick={onStartGame}
            className={`w-full py-4 font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 ${
              hasSaveData 
                ? 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 border border-neutral-700' 
                : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]'
            }`}
          >
            <span>🚨</span> 새로운 사건 의뢰받기
          </button>
        </div>
      </div>
    </div>
  );
};

export default TitleScreen;