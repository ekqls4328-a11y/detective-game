import React, { useState, useEffect } from 'react';
import scenarioData from '../data/scenario_list.json';
// 💡 AudioContext 임포트
import { useAudio } from '../contexts/AudioContext';

const MainScreen = ({ onSelectScenario, onBack, onOpenSettings }) => {
  const [scenarios, setScenarios] = useState([]);
  const [clearedScenarios, setClearedScenarios] = useState([]);

  // 💡 BGM 변경 및 효과음 함수 가져오기
  const { changeAndPlayBgm, playSfx } = useAudio();

  useEffect(() => {
    setScenarios(scenarioData);
    const savedData = localStorage.getItem('cleared_scenarios');
    if (savedData) {
      setClearedScenarios(JSON.parse(savedData));
    }

    // 💡 화면 진입 시 메인 로비용 BGM 재생
    // 실제 프로젝트의 로비 브금 경로에 맞게 수정해 줘 (ex: /audio/main_bgm.mp3)
    changeAndPlayBgm('/audio/main_bgm.mp3');
  }, [changeAndPlayBgm]);

  return (
    // 모바일 환경에 맞춰 좌우 패딩을 약간 줄이고(p-4), 하단 여백(pb-10)을 넉넉히 줌
    <div className="min-h-screen bg-neutral-900 text-gray-100 p-4 pb-10 font-sans">

      {/* 💡 우측 상단 설정 버튼 */}
      <button 
        onClick={() => { playSfx(); onOpenSettings(); }} // 💡 클릭음 추가
        className="absolute top-4 right-4 z-20 w-9 h-9 bg-neutral-800 border border-neutral-700 rounded-full flex items-center justify-center text-lg shadow-lg hover:bg-neutral-700 active:scale-95"
      >
        ⚙️
      </button>
      
      {/* 💡 헤더 영역에 뒤로 가기 버튼 추가 */}
      <header className="mt-4 mb-8 pl-1 flex items-start gap-3">
        <button 
          onClick={() => { playSfx(); onBack(); }} // 💡 클릭음 추가
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
                <div className="absolute top-4 right-4 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded shadow-md border border-red-800 tracking-wider z-10">
                  SOLVED
                </div>
              )}
              
              {/* 타이틀 */}
              <h2 className="text-lg font-bold leading-snug mb-4 pr-12 text-white">
                {scenario.title}
              </h2>
              
              {/* 썸네일 이미지 영역 */}
              <div className="h-44 w-full bg-neutral-950 rounded-xl overflow-hidden border border-neutral-700 mb-5 relative flex items-center justify-center">
                
                {scenario.briefingImageUrl ? (
                  // 이미지가 있을 때: 꽉 차게 렌더링하고, 잠금 상태면 블러 처리
                  <img 
                    src={scenario.briefingImageUrl} 
                    alt={scenario.title} 
                    className={`w-full h-full object-cover transition-all duration-500 ${
                      scenario.isLocked ? 'blur-sm grayscale' : 'opacity-80'
                    }`}
                  />
                ) : (
                  // 이미지가 없을 때: 기존 NO DATA 표시
                  <span className="text-neutral-600 text-xs font-mono block text-center">
                    [EVIDENCE PHOTO]<br/>NO DATA
                  </span>
                )}

                {/* 잠금 오버레이 */}
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

                {/* 잠금 해제 상태일 때 하단 그라데이션 */}
                {!scenario.isLocked && (
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent pointer-events-none" />
                )}
              </div>

              {/* 엄지손가락 최적화 하단 풀사이즈 버튼 */}
              <button 
                onClick={() => {
                  // 💡 잠겨있지 않을 때만 소리가 나고 넘어가도록 처리
                  if (!scenario.isLocked) {
                    playSfx();
                    onSelectScenario(scenario.id);
                  }
                }}
                disabled={scenario.isLocked}
                className={`
                  w-full py-3.5 rounded-xl text-sm font-bold tracking-wide flex items-center justify-center gap-2
                  transition-colors z-10
                  ${scenario.isLocked 
                    ? 'bg-neutral-700 text-neutral-500 cursor-not-allowed' 
                    : 'bg-white text-black hover:bg-gray-200 active:bg-gray-300 shadow-md'}
                `}
              >
                {scenario.isLocked ? (
                  'COMMING SOON'
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