import React, { useState, useEffect } from 'react';
import { useAudio } from '../contexts/AudioContext';

const TitleScreen = ({ onStartGame, hasSaveData, onContinue, onOpenSettings }) => {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const { changeAndPlayBgm, playSfx } = useAudio();

  useEffect(() => {
    changeAndPlayBgm('/audio/main_bgm.mp3');
  }, [changeAndPlayBgm]);

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* 우측 상단 설정 버튼 */}
      <button 
        onClick={() => { playSfx(); onOpenSettings(); }} 
        className="absolute top-6 right-6 z-20 w-10 h-10 bg-neutral-900/80 backdrop-blur border border-neutral-700 rounded-full flex items-center justify-center text-xl shadow-lg hover:bg-neutral-800 active:scale-95"
      >
        ⚙️
      </button>
      
      {/* 배경 장식 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-800 via-neutral-950 to-black opacity-50" />
      
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm gap-10">
        {/* 타이틀 영역 */}
        <div className="text-center space-y-4">
          <p className="text-red-600 font-bold tracking-[0.3em] text-sm animate-pulse">DETECTIVE FILES</p>
          <h1 className="text-5xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            미스터리<br/>
            <span className="text-neutral-500">탐정 보고서</span>
          </h1>
        </div>

        {/* 버튼 영역 */}
        <div className="flex flex-col gap-4 w-full mt-4">
          {hasSaveData && (
            <button 
              onClick={() => { playSfx(); onContinue(); }} 
              className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-2xl shadow-[0_0_20px_rgba(217,119,6,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>📂</span> 이어서 수사하기
            </button>
          )}
          
          <button 
            onClick={() => { playSfx(); onStartGame(); }} 
            className={`w-full py-4 font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 ${
              hasSaveData 
                ? 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 border border-neutral-700' 
                : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]'
            }`}
          >
            <span>🚨</span> 새로운 사건 의뢰받기
          </button>

          {/* 수사 가이드 보기 버튼 */}
          <button 
            onClick={() => { playSfx(); setIsGuideOpen(true); }}
            className="w-full py-4 mt-2 bg-neutral-900/50 border border-dashed border-neutral-700 rounded-2xl flex items-center justify-center gap-3 hover:bg-neutral-800 transition-all active:scale-[0.98]"
          >
            <span className="text-xl">💡</span>
            <div className="text-left">
              <p className="text-xs text-neutral-400 font-bold leading-none mb-1">수사가 처음이신가요?</p>
              <p className="text-sm text-white font-black leading-none">사건 수사 가이드 보기</p>
            </div>
            <span className="ml-2 text-neutral-600 text-xs">➔</span>
          </button>
        </div>
      </div>

      {/* 최하단 면책 조항 */}
      <footer className="absolute bottom-6 w-full text-center px-8 opacity-50 pointer-events-none">
        <p className="text-[11px] text-neutral-400 leading-relaxed font-bold break-keep">
          본 게임의 모든 시나리오, 인물, 사건 및 장소는 허구로 창작된 것이며, 
          실제 사건이나 인물과는 어떠한 관련도 없음을 알려드립니다.
        </p>
        <p className="text-[10px] text-neutral-600 mt-2 font-mono">
          &copy; 2026 DETECTIVE FILES. ALL RIGHTS RESERVED.
        </p>
      </footer>

      {/* 💡 앱 버전 표시 (우측 하단 고정) */}
      <div className="absolute bottom-4 right-4 text-[10px] text-neutral-500 font-mono opacity-60 pointer-events-none">
        v1.0.0
      </div>

      {/* 수사 가이드 모달 */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fadeIn">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => { playSfx(); setIsGuideOpen(false); }} />
          
          <div className="bg-neutral-900 border border-neutral-700 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative z-10 animate-slideUp">
            <button 
              onClick={() => { playSfx(); setIsGuideOpen(false); }} 
              className="absolute top-4 right-4 text-neutral-500 hover:text-white font-bold text-xl active:scale-95"
            >
              ✕
            </button>
            
            <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
              <span className="text-blue-500">🔎</span> 수사 가이드
            </h2>
            
            <div className="space-y-5">
              
              <div className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 font-black text-xs border border-blue-500/30">1</div>
                <div>
                  <p className="text-sm font-bold text-white mb-1">용의자 심문</p>
                  <p className="text-xs text-neutral-400 leading-relaxed break-keep">
                    사건의 실마리를 풀기 위해 용의자에게 질문을 던지고, 의심스러운 답변은 수첩에 <span className="text-blue-400 font-bold">진술</span>로 기록하세요.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-amber-900/50 flex items-center justify-center text-amber-400 font-black text-xs border border-amber-500/30">2</div>
                <div>
                  <p className="text-sm font-bold text-white mb-1">현장 조사 & 외형 관찰</p>
                  <p className="text-xs text-neutral-400 leading-relaxed break-keep">
                    의심스러운 곳을 터치해 결정적 <span className="text-amber-400 font-bold">물증</span>을 수집하세요. 조사가 막힐 땐 <span className="text-white font-bold">주변 탐색</span>을 쓰면 1.5초간 단서 위치가 드러납니다.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-900/50 flex items-center justify-center text-emerald-400 font-black text-xs border border-emerald-500/30">3</div>
                <div>
                  <p className="text-sm font-bold text-white mb-1">추궁하기 (⚡ 행동력 소모)</p>
                  <p className="text-xs text-neutral-400 leading-relaxed break-keep">
                    수집한 단서나 진술을 용의자에게 제시하여 새로운 <span className="text-emerald-400 font-bold">진술을 확보</span>하세요. 제시할 때마다 <span className="text-white font-bold">행동력(⚡)이 1씩 감소</span>합니다.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-red-900/50 flex items-center justify-center text-red-400 font-black text-xs border border-red-500/30">4</div>
                <div>
                  <p className="text-sm font-bold text-red-400 mb-1">사건 종결</p>
                  <p className="text-xs text-neutral-400 leading-relaxed break-keep">
                    행동력(⚡)이 0이 되면 강제로 추리가 시작됩니다. <span className="text-red-400 font-bold">단 3번의 기회</span> 안에 엇갈리는 진술들을 파악해 진짜 범인을 지목하세요.
                  </p>
                </div>
              </div>

            </div>

            <button 
              onClick={() => { playSfx(); setIsGuideOpen(false); }} 
              className="w-full mt-8 py-4 bg-white text-black font-black rounded-2xl hover:bg-gray-200 active:scale-95 transition-all shadow-lg"
            >
              알겠습니다
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default TitleScreen;