import React, { useState, useEffect, useRef } from 'react'; // 💡 useRef 필수!
import TypewriterText from './TypewriterText';
import InventoryModal from './InventoryModal';
import InspectionModal from './InspectionModal';
import { useAudio } from '../contexts/AudioContext';
// 💡 다빈이가 확인한 중괄호 명시적 임포트 유지
import { Joyride } from 'react-joyride'; 

// 💡 추리 게임 감성에 맞춘 커스텀 툴팁 컴포넌트
const CustomTooltip = ({
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  isLastStep,
  size, // 💡 하드코딩 대신 전체 스텝 수를 자동으로 받아오게 추가
}) => (
  <div
    {...tooltipProps}
    className="bg-neutral-900 border border-neutral-700 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] p-5 max-w-[320px] w-full font-sans"
  >
    <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-3">
      <span className="text-amber-500 font-black text-[11px] tracking-widest">
        [ 심문 가이드 {index + 1} / {size} ]
      </span>
      <button {...closeProps} className="text-neutral-500 hover:text-red-500 text-lg leading-none active:scale-90 transition-all">
        &times;
      </button>
    </div>
    <div className="text-gray-200 text-sm leading-loose mb-6 break-keep whitespace-pre-wrap">
      {step.content}
    </div>
    <div className="flex justify-between items-center">
      <div>
        {index > 0 && (
          <button
            {...backProps}
            className="px-3 py-2 text-xs font-bold text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors border border-neutral-700 active:scale-95"
          >
            &lt; 이전
          </button>
        )}
      </div>
      <button
        {...primaryProps}
        className="px-5 py-2 text-xs font-black text-black bg-amber-500 hover:bg-amber-400 rounded-lg transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] active:scale-95"
      >
        {isLastStep ? '심문 시작하기' : '다음 단계 >'}
      </button>
    </div>
  </div>
);

const InterrogationView = ({ suspect, scenarioData, inventory, viewedClues, actionPoints, onClueFound, onMarkAsViewed, onRemoveClue, onPresent, onClose }) => {
  const [isTypingDone, setIsTypingDone] = useState(false);
  const [showQuestionMenu, setShowQuestionMenu] = useState(false);
  const [currentDialog, setCurrentDialog] = useState(suspect.selfIntro);
  const [dialogKey, setDialogKey] = useState(0); 
  const [isSkipping, setIsSkipping] = useState(false);
  
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isInspectionOpen, setIsInspectionOpen] = useState(false);

  const [currentStatement, setCurrentStatement] = useState(null); 
  const [discoveryText, setDiscoveryText] = useState(null);

  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const { changeAndPlayBgm, playSfx } = useAudio();
  const scrollContainerRef = useRef(null);

  // 💡 중복 실행 방지를 위한 로컬스토리지 키값 v5 업데이트
  const TUTORIAL_KEY = 'crime_game_interrogation_tutorial_cleared';
  const [tourRun, setTourRun] = useState(false);
  const [tourSteps] = useState([
    // 💡 [핵심] PlayScreen과 똑같이 첫 타겟을 'body'로 설정해서 비콘을 강제 스킵하고 즉시 팝업!
    {
      target: 'body',
      content: '🕵️‍♂️ 탐정님, 심문실에 오신 것을 환영합니다!\n상대의 진술을 듣고 모순을 꿰뚫어보세요.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.tutorial-step-dialog',
      content: '용의자의 진술입니다. 박스를 터치하면 타이핑을 건너뛰고 빠르게 읽을 수 있어요.',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '.tutorial-step-inspect',
      content: '용의자의 머리부터 발끝까지 샅샅이 관찰하여 숨겨진 특징을 단서로 획득하세요.',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '.tutorial-step-ask',
      content: '질문하기를 통해 용의자의 알리바이를 캐낼 수 있습니다.',
      placement: 'top',
      disableBeacon: true,
    },
    {
      target: '.tutorial-step-present',
      content: '수집한 결정적인 단서를 들이밀어 거짓말을 추궁하세요! (⚡ 1 소모)',
      placement: 'top',
      disableBeacon: true,
    }
  ]);

  // 💡 화면 진입 시 PlayScreen과 동일하게 선불 도장 날인 후 가이드 실행
  useEffect(() => {
    const isTutorialCleared = localStorage.getItem(TUTORIAL_KEY) === 'true';
    if (!isTutorialCleared) {
      setTimeout(() => {
        setTourRun(true); 
        localStorage.setItem(TUTORIAL_KEY, 'true'); 
      }, 800); 
    }
  }, []);

  const handleJoyrideCallback = (data) => {
    const { status, action } = data;
    if (['finished', 'skipped'].includes(status) || action === 'close') {
      setTourRun(false); 
    } 
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new MutationObserver(() => {
      container.scrollTop = container.scrollHeight;
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => observer.disconnect(); 
  }, [currentDialog]); 

  useEffect(() => {
    return () => {
      if (scenarioData && scenarioData.bgmUrl) {
        changeAndPlayBgm(scenarioData.bgmUrl);
      }
    };
  }, [changeAndPlayBgm, scenarioData]);

  useEffect(() => {
    setCurrentDialog(suspect.selfIntro);
    setShowQuestionMenu(false);
    setIsTypingDone(false);
    setIsSkipping(false); 
    setCurrentStatement(null); 
    setDiscoveryText(null);
    setDialogKey(prev => prev + 1); 
    setIsImageLoaded(false);
  }, [suspect]);

  const handleAskQuestion = (question) => {
    setShowQuestionMenu(false);
    setIsTypingDone(false);
    setIsSkipping(false); 
    setCurrentDialog(question.response); 
    setCurrentStatement({ id: question.id, title: question.title });
    setDiscoveryText(null);
    setDialogKey(prev => prev + 1); 
  };

  const handlePresentEvidence = (evidence) => {
    if (actionPoints <= 0) {
      alert("⚡ 행동력이 부족합니다. 창을 닫고 행동력을 충전해주세요.");
      return; 
    }

    setIsInventoryOpen(false);
    setIsTypingDone(false);
    setIsSkipping(false); 

    const defense = suspect.defenses.find(d => d.clueId === evidence.id);
    if (defense) {
      setCurrentDialog(defense.response);
    } else {
      const fallbackResponse = suspect.wrongEvidenceResponse || "그게 이 사건과 무슨 상관이라는 겁니까? 억지 부리지 마시죠.";
      setCurrentDialog(fallbackResponse);
    }
    
    setCurrentStatement(null); 
    setDiscoveryText(null);
    setDialogKey(prev => prev + 1); 
    if (onPresent) onPresent(); 
  };

  const handleSaveToInventory = () => {
    if (currentStatement && onClueFound) {
      onClueFound(currentStatement.id); 
      setDiscoveryText(`[${currentStatement.title}] 진술이 단서함에 추가되었습니다.`);
    }
  };

  const handleOpenInventory = () => {
    if (actionPoints <= 0) {
      alert("⚡ 행동력이 부족합니다. 창을 닫고 행동력을 충전해주세요.");
      return;
    }
    playSfx();
    setIsInventoryOpen(true);
  };

  if (!suspect) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black animate-fadeIn overflow-hidden">
      
      <Joyride
        steps={tourSteps}
        run={tourRun}
        continuous={true}
        showSkipButton={true}
        disableOverlayClose={true}
        disableScrolling={true} 
        spotlightClicks={true}
        floaterProps={{ disableAnimation: true }}
        callback={handleJoyrideCallback}
        hideBackButton={true}
        tooltipComponent={CustomTooltip} 
        styles={{
          options: {
            zIndex: 100000,
            overlayColor: 'rgba(0, 0, 0, 0.85)',
          }
        }}
      />

      {/* 배경 이미지 영역 */}
      <div className="absolute inset-0 z-0">
        <div 
          className="w-full h-full transition-opacity duration-500 ease-in-out"
          style={{ opacity: isImageLoaded ? 1 : 0 }}
        >
          {suspect.illustration?.interrogationUrl ? (
            <img 
              key={suspect.id}
              src={suspect.illustration.interrogationUrl} 
              alt={`${suspect.name} 심문`} 
              onLoad={() => {
                setTimeout(() => {
                  setIsImageLoaded(true);
                }, 50);
              }}
              className="w-full h-full object-cover pointer-events-none" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-neutral-500 font-bold">
              심문용 일러스트 준비 중
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        
        <header className="shrink-0 p-3 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent gap-1">
          <button 
            onClick={() => { playSfx(); onClose(); }} 
            className="text-white font-bold px-3 py-1.5 text-sm bg-black/50 rounded-full hover:bg-neutral-700 backdrop-blur-sm border border-neutral-700 shrink-0"
          >
            &lt; 심문 종료
          </button>
          
          <div className="flex justify-center shrink-0">
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full border backdrop-blur-sm transition-colors whitespace-nowrap ${
              actionPoints <= 1 ? 'bg-red-900/80 border-red-500 animate-pulse text-red-300' : 'bg-black/60 border-neutral-600 text-neutral-300'
            }`}>
              <span className="text-sm">⚡</span>
              <span className="text-[12px] font-black tracking-wider mt-px shadow-sm">
                {actionPoints} <span className="text-neutral-500 mx-0.5">/</span> {scenarioData.maxActionPoints || 3}
              </span>
            </div>
          </div>

          <button 
            onClick={() => { playSfx(); setIsInspectionOpen(true); }} 
            className="tutorial-step-inspect font-bold px-3 py-1.5 text-sm rounded-full backdrop-blur-md bg-neutral-900/80 border border-neutral-600 text-amber-500 shadow-lg flex items-center gap-1 active:scale-95 transition-transform shrink-0"
          >
            <span>🧐</span> 외형 관찰
          </button>
        </header>

        <div className="flex-1" />

        <div className="shrink-0 p-4 pb-8 flex flex-col gap-4 w-full">
          
          {showQuestionMenu && (
            <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fadeIn">
              <div className="w-full max-w-md flex flex-col max-h-[80vh] py-2">
                <div className="shrink-0 text-amber-500 font-bold text-sm mb-4 text-center tracking-widest animate-pulse">
                  [ 심문 주제 선택 ]
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 px-1 scrollbar-hide py-1">
                  {suspect.questions.map((q, idx) => (
                    <button 
                      key={q.id} 
                      onClick={() => { playSfx(); handleAskQuestion(q); }} 
                      className="group relative w-full overflow-hidden rounded-xl bg-neutral-900 border border-neutral-700 p-4 text-left shadow-lg hover:border-amber-500 transition-all active:scale-[0.98] shrink-0"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative flex items-center gap-4">
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-neutral-800 text-neutral-500 text-xs font-black group-hover:bg-amber-500 group-hover:text-black transition-colors shrink-0">{idx + 1}</span>
                        <span className="text-gray-300 font-bold group-hover:text-white transition-colors leading-relaxed break-keep">{q.title}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="shrink-0 pt-5 flex justify-center">
                  <button 
                    onClick={() => { playSfx(); setShowQuestionMenu(false); }} 
                    className="py-3 px-8 rounded-full bg-neutral-800 text-neutral-400 font-bold hover:bg-neutral-700 hover:text-white transition-all border border-neutral-600 shadow-md"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          )}

          <div 
            onClick={() => { 
              if (!isTypingDone) {
                playSfx(); 
                setIsSkipping(true); 
              } 
            }} 
            className="tutorial-step-dialog bg-black/60 backdrop-blur-md border border-neutral-700/50 rounded-xl p-4 pt-5 relative shadow-2xl cursor-pointer flex flex-col min-h-[110px]"
          >
            <div className="absolute -top-3 left-4 bg-neutral-800 text-amber-500 font-black px-4 py-1 rounded-md text-sm border border-neutral-600 shadow-lg">
              {suspect.name}
            </div>
            
            <div ref={scrollContainerRef} className="overflow-y-auto h-[90px] pr-2 mt-1 scrollbar-hide">
              <p className="text-gray-100 leading-relaxed text-sm select-none break-keep whitespace-pre-wrap text-shadow-sm">
                <TypewriterText 
                  key={dialogKey} 
                  text={currentDialog} 
                  speed={30} 
                  forceSkip={isSkipping} 
                  onComplete={() => setIsTypingDone(true)} 
                />
              </p>
            </div>
            
            {isTypingDone && <div className="absolute bottom-3 right-4 text-amber-500 animate-bounce">▼</div>}
          </div>

          {isTypingDone && currentStatement && !inventory.includes(currentStatement.id) && (
            <button 
              onClick={() => { playSfx(); handleSaveToInventory(); }} 
              className="w-full py-3.5 bg-emerald-600/90 backdrop-blur-sm hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 border border-emerald-500/50 animate-fadeIn"
            >
              <span>📌</span> 이 진술을 단서함에 추가하기
            </button>
          )}

          {isTypingDone && currentStatement && inventory.includes(currentStatement.id) && discoveryText && (
            <div className="w-full py-2.5 text-center text-xs text-emerald-400 font-bold bg-emerald-950/50 backdrop-blur-sm rounded-lg border border-emerald-900/50 shrink-0 animate-fadeIn">
              {discoveryText}
            </div>
          )}
          {isTypingDone && currentStatement && inventory.includes(currentStatement.id) && !discoveryText && (
            <div className="w-full py-2.5 text-center text-xs text-neutral-400 font-bold bg-black/40 backdrop-blur-sm rounded-lg border border-neutral-800 shrink-0 animate-fadeIn">
              이미 기록된 진술입니다
            </div>
          )}

          <div className={`flex gap-3 h-[52px] shrink-0 transition-opacity ${isTypingDone && !showQuestionMenu ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
            <button 
              onClick={() => { playSfx(); setShowQuestionMenu(true); }} 
              className="tutorial-step-ask flex-1 bg-black/60 backdrop-blur-sm text-white font-bold rounded-xl border border-neutral-600 hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 shadow-lg"
            >
              <span className="text-lg">🗣️</span> 질문하기
            </button>
            <button 
              onClick={handleOpenInventory}
              className={`tutorial-step-present flex-1 backdrop-blur-sm text-white font-black rounded-xl border shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all flex items-center justify-center gap-1 ${
                actionPoints <= 0 ? 'bg-neutral-800 border-neutral-700 opacity-50 cursor-not-allowed' : 'bg-red-900/80 hover:bg-red-800 border-red-600'
              }`}
            >
              <span className="text-xl">!</span> 단서 제시 (⚡ -1)
            </button>
          </div>

        </div>
      </div>

      {isInventoryOpen && <InventoryModal inventory={inventory} viewedClues={viewedClues} onMarkAsViewed={onMarkAsViewed} scenarioData={scenarioData} onRemoveClue={onRemoveClue} onClose={() => setIsInventoryOpen(false)} onPresent={handlePresentEvidence} />}
      {isInspectionOpen && <InspectionModal suspect={suspect} inventory={inventory} onClueFound={onClueFound} onClose={() => setIsInspectionOpen(false)} />}
      
    </div>
  );
};

export default InterrogationView;