import React, { useState, useEffect } from 'react';
import scenarioData from '../data/scenario_list.json';

const MainScreen = ({ onSelectScenario }) => {
  const [scenarios, setScenarios] = useState([]);
  const [clearedScenarios, setClearedScenarios] = useState([]);

  useEffect(() => {
    setScenarios(scenarioData);
    const savedData = localStorage.getItem('cleared_scenarios');
    if (savedData) {
      setClearedScenarios(JSON.parse(savedData));
    }
  }, []);

  return (
    // 모바일 환경에 맞춰 좌우 패딩을 약간 줄이고(p-4), 하단 여백(pb-10)을 넉넉히 줌
    <div className="min-h-screen bg-neutral-900 text-gray-100 p-4 pb-10 font-sans">
      
      {/* 헤더 영역 (모바일 뷰에 맞춰 간결하게) */}
      <header className="mt-4 mb-8 pl-1">
        <h1 className="text-2xl font-black tracking-tight text-white mb-1">
          사건 파일
        </h1>
        <p className="text-neutral-400 text-sm">
          조사할 사건을 선택해 주십시오.
        </p>
      </header>

      {/* 세로 스크롤 사건 리스트 */}
      <div className="flex flex-col gap-6">
        {scenarios.map((scenario) => {
          const isCleared = clearedScenarios.includes(scenario.id);
          
          return (
            <div 
              key={scenario.id} 
              // w-full로 모바일 화면 가로를 꽉 채우고 둥근 모서리(rounded-2xl) 적용
              className={`
                relative w-full bg-neutral-800 rounded-2xl p-5 flex flex-col
                border border-neutral-700 shadow-lg transition-all duration-300
                ${scenario.isLocked ? 'opacity-60' : ''}
              `}
            >
              {/* 해결됨 뱃지 */}
              {isCleared && (
                <div className="absolute top-4 right-4 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded shadow-md border border-red-800 tracking-wider">
                  SOLVED
                </div>
              )}

              {/* 난이도 */}
              <div className="text-yellow-500 text-xs tracking-widest mb-2 font-bold">
                DIFFICULTY {scenario.level}
              </div>
              
              {/* 타이틀 */}
              <h2 className="text-lg font-bold leading-snug mb-4 pr-12 text-white">
                {scenario.title}
              </h2>
              
              {/* 썸네일 이미지 (모바일 비율에 맞는 높이 설정 h-44) */}
              <div className="h-44 w-full bg-neutral-950 rounded-xl overflow-hidden border border-neutral-700 mb-5 relative flex items-center justify-center">
                <span className="text-neutral-600 text-xs font-mono block text-center">
                  [EVIDENCE PHOTO]<br/>NO DATA
                </span>
                
                {/* 잠금 오버레이 */}
                {scenario.isLocked && (
                  <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center backdrop-blur-sm">
                    <span className="text-3xl mb-2">🔒</span>
                    <span className="text-red-400 text-xs font-bold tracking-widest">ACCESS DENIED</span>
                  </div>
                )}
              </div>

              {/* 엄지손가락 최적화 하단 풀사이즈 버튼 */}
              <button 
                onClick={() => !scenario.isLocked && onSelectScenario(scenario.id)}
                disabled={scenario.isLocked}
                className={`
                  w-full py-3.5 rounded-xl text-sm font-bold tracking-wide flex items-center justify-center gap-2
                  transition-colors
                  ${scenario.isLocked 
                    ? 'bg-neutral-700 text-neutral-500 cursor-not-allowed' 
                    : 'bg-white text-black hover:bg-gray-200 active:bg-gray-300 shadow-md'}
                `}
              >
                {scenario.isLocked ? (
                  '이전 사건 해결 필요'
                ) : (
                  <>조사 시작하기 <span className="text-lg">➔</span></>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MainScreen;