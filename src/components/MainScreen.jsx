import React, { useState, useEffect } from 'react';
import scenarioData from '../data/scenario_list.json';
// AudioContext 임포트
import { useAudio } from '../contexts/AudioContext';

// 💡 onViewTruth 프롭스 추가 (사건의 전말 보기 클릭 시 App.jsx로 이벤트 전달)
const MainScreen = ({ onSelectScenario, onBack, onOpenSettings, onViewTruth }) => {
  const [seasons, setSeasons] = useState(scenarioData);
  const [clearedScenarios, setClearedScenarios] = useState([]);
  
  const [expandedSeason, setExpandedSeason] = useState(1);

  const { changeAndPlayBgm, playSfx } = useAudio();

  useEffect(() => {
    const savedData = localStorage.getItem('cleared_scenarios');
    if (savedData) {
      setClearedScenarios(JSON.parse(savedData));
    }

    changeAndPlayBgm('/audio/main_bgm.mp3');
  }, [changeAndPlayBgm]);

  const toggleSeason = (season) => {
    playSfx();
    setExpandedSeason(prev => (prev === season ? null : season));
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-gray-100 p-4 pb-10 font-sans">

      {/* 우측 상단 설정 버튼 */}
      <button 
        onClick={() => { playSfx(); onOpenSettings(); }} 
        className="absolute top-4 right-4 z-20 w-9 h-9 bg-neutral-800 border border-neutral-700 rounded-full flex items-center justify-center text-lg shadow-lg hover:bg-neutral-700 active:scale-95"
      >
        ⚙️
      </button>
      
      {/* 헤더 영역 */}
      <header className="mt-4 mb-8 pl-1 flex items-start gap-3">
        <button 
          onClick={() => { playSfx(); onBack(); }} 
          className="text-neutral-400 hover:text-white font-bold mt-1 shrink-0"
        >
          &lt; 뒤로
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white mb-1">
            사건 파일
          </h1>
          <p className="text-neutral-400 text-sm">
            조사할 사건을 선택해 주십시오.
          </p>
        </div>
      </header>

      {/* JSON 루프: 시즌별 아코디언 리스트 렌더링 */}
      <div className="flex flex-col gap-6">
        {seasons.map((seasonItem) => {
          const seasonNumber = seasonItem.season;
          const seasonTitle = seasonItem.seasonTitle || "미스터리 탐정 보고서";
          const seasonScenarios = seasonItem.scenarios || [];
          const isExpanded = expandedSeason === seasonNumber;

          const completedCount = seasonScenarios.filter(s => clearedScenarios.includes(s.id)).length;

          return (
            <div key={seasonNumber} className="border border-neutral-700 rounded-3xl overflow-hidden bg-neutral-800/50 shadow-xl">
              
              <button 
                onClick={() => toggleSeason(seasonNumber)}
                className="w-full relative overflow-hidden p-5 flex items-center justify-between bg-gradient-to-r from-neutral-900 to-neutral-800 hover:from-neutral-800 hover:to-neutral-700 transition-all border-l-4 border-amber-500 group shadow-md"
              >
                <div 
                  className="absolute inset-0 opacity-5 pointer-events-none" 
                  style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ffffff 10px, #ffffff 11px)' }}
                />
                
                <div className="relative z-10 flex-1 flex flex-col items-start gap-1.5 min-w-0 pr-2 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500 font-black text-[10px] tracking-[0.2em] bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/50 shadow-inner">
                      CASE FILE {String(seasonNumber).padStart(2, '0')}
                    </span>
                    {completedCount === seasonScenarios.length && (
                      <span className="text-yellow-400 text-[10px] font-black tracking-wider px-1.5 py-0.5 border border-yellow-500/50 rounded bg-yellow-900/30">
                        CLEARED
                      </span>
                    )}
                  </div>
                  
                  {/* 2. 폰트를 text-xl -> text-lg로 살짝 줄이고, 다시 truncate 추가 */}
                  <span className="text-white font-black text-lg truncate w-full tracking-tight drop-shadow-md group-hover:text-amber-50 transition-colors">
                    {seasonTitle}
                  </span>

                </div>

                <div className="relative z-10 flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] text-neutral-500 font-black tracking-widest mb-0.5">PROGRESS</span>
                      <span className="text-xs text-neutral-300 font-black bg-black/60 px-2.5 py-1 rounded-md border border-neutral-700 shadow-inner">
                        <span className={completedCount === seasonScenarios.length ? 'text-amber-400' : 'text-white'}>
                          {completedCount}
                        </span> 
                        <span className="text-neutral-600 mx-1">/</span> 
                        {seasonScenarios.length}
                      </span>
                    </div>
                    <span 
                      className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all duration-300 ${
                        isExpanded 
                          ? 'rotate-180 bg-amber-900/20 text-amber-500 border-amber-500/30' 
                          : 'bg-neutral-950/50 text-neutral-500 border-neutral-700/50 group-hover:bg-neutral-800'
                      }`}
                    >
                      ▼
                    </span>
                  </div>
                  
                  <div className="w-full h-1.5 bg-neutral-950 rounded-full overflow-hidden mt-0.5 border border-neutral-800 shadow-inner">
                    <div 
                      className="h-full bg-amber-500 transition-all duration-700 ease-out" 
                      style={{ width: `${(completedCount / seasonScenarios.length) * 100}%` }}
                    />
                  </div>
                </div>
              </button>

              <div 
                className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}
              >
                <div className="p-4 flex flex-col gap-6 bg-neutral-900/50">
                  {seasonScenarios.map((scenario) => {
                    const isCleared = clearedScenarios.includes(scenario.id);
                    const hasSavedData = !!localStorage.getItem(`crime_game_progress_${scenario.id}`);
                    
                    return (
                      <div 
                        key={scenario.id} 
                        className={`
                          relative w-full bg-neutral-800 rounded-2xl p-5 flex flex-col
                          border border-neutral-700 shadow-lg transition-all duration-300
                          ${scenario.isLocked ? 'opacity-60' : ''}
                        `}
                      >
                        
                        <div className="flex justify-between items-start mb-4 gap-2">
                          <h2 className="text-lg font-bold leading-snug text-white">
                            {scenario.title}
                          </h2>
                          
                          {!scenario.isLocked && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded border border-neutral-600 bg-neutral-900/50 text-neutral-400 shrink-0 mt-0.5">
                              <span className="text-[10px] text-amber-500">⚡</span>
                              <span className="text-[10px] font-bold tracking-widest mt-px">
                                적정 행동력 {scenario.maxActionPoints || 15}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="h-44 w-full bg-neutral-950 rounded-xl overflow-hidden border border-neutral-700 mb-5 relative flex items-center justify-center">
                          
                          {isCleared && (
                            <div 
                              className="absolute top-2 right-2 bg-neutral-950/80 text-red-500 text-[11px] font-black px-2 py-1 rounded shadow-lg border border-red-900 tracking-wider z-20 
                                         opacity-90 transform rotate-[-12deg] scale-110"
                              style={{ textShadow: '0 0 5px rgba(220, 38, 38, 0.5)' }} 
                            >
                              SOLVED
                            </div>
                          )}

                          {scenario.briefingImageUrl ? (
                            <img 
                              src={scenario.briefingImageUrl} 
                              alt={scenario.title} 
                              className={`w-full h-full object-cover transition-all duration-500 ${
                                scenario.isLocked ? 'blur-sm grayscale' : 'opacity-80'
                              }`}
                            />
                          ) : (
                            <span className="text-neutral-600 text-xs font-mono block text-center">
                              [EVIDENCE PHOTO]<br/>NO DATA
                            </span>
                          )}

                          {scenario.isLocked && (
                            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center backdrop-blur-[2px]">
                              <span className="text-3xl mb-2">🔒</span>
                              <span className="text-red-500 text-[10px] font-black tracking-[0.2em] animate-pulse">
                                ACCESS DENIED
                              </span>
                              {scenario.unlockCondition && (
                                <span className="text-neutral-500 text-[9px] mt-2 font-bold">
                                  {scenario.unlockCondition}
                                </span>
                              )}
                            </div>
                          )}

                          {!scenario.isLocked && (
                            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent pointer-events-none" />
                          )}
                        </div>

                        {/* 💡 하단 버튼 액션 영역 (클리어 상태 최우선 분기) */}
                        <div className="w-full z-10">
                          {scenario.isLocked ? (
                            <button 
                              disabled
                              className="w-full py-3.5 rounded-xl text-sm font-bold tracking-wide bg-neutral-700 text-neutral-500 cursor-not-allowed flex items-center justify-center"
                            >
                              COMING SOON
                            </button>
                          ) : isCleared ? (
                            // 💡 클리어한 사건일 경우 (전말 보기 버튼 활성화)
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => { playSfx(); onViewTruth(scenario.id); }}
                                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-black rounded-xl text-sm tracking-wide shadow-md flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                              >
                                <span>🎬</span> 사건의 전말 확인
                              </button>
                              <button
                                onClick={() => { playSfx(); onSelectScenario(scenario.id, false); }}
                                className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-900 text-neutral-400 font-bold rounded-xl text-xs tracking-wide border border-neutral-700 flex items-center justify-center transition-colors active:scale-[0.98]"
                              >
                                처음부터 다시 수사하기
                              </button>
                            </div>
                          ) : hasSavedData ? (
                            <div className="flex gap-3">
                              <button
                                onClick={() => { playSfx(); onSelectScenario(scenario.id, true); }}
                                className="flex-[2] py-3.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-black rounded-xl text-sm tracking-wide shadow-md flex items-center justify-center transition-colors active:scale-[0.98]"
                              >
                                이어하기
                              </button>
                              <button
                                onClick={() => { playSfx(); onSelectScenario(scenario.id, false); }}
                                className="flex-1 py-3.5 bg-neutral-700 hover:bg-neutral-600 active:bg-neutral-800 text-neutral-300 font-bold rounded-xl text-xs tracking-wide border border-neutral-600 flex items-center justify-center transition-colors active:scale-[0.98]"
                              >
                                처음부터
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => { playSfx(); onSelectScenario(scenario.id, false); }}
                              className="w-full py-3.5 rounded-xl text-sm font-bold tracking-wide bg-white text-black hover:bg-gray-200 active:bg-gray-300 shadow-md flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                            >
                              조사 시작하기 <span className="text-lg">➔</span>
                            </button>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MainScreen;