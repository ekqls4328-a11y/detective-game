import React, { useState, useEffect } from 'react';
import TypewriterText from './TypewriterText';
import InventoryModal from './InventoryModal';
import InspectionModal from './InspectionModal';
// 💡 AudioContext 임포트 추가
import { useAudio } from '../contexts/AudioContext';

// 💡 actionPoints 추가됨!
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

  // 💡 BGM 변경 및 효과음 함수 가져오기
  const { changeAndPlayBgm, playSfx } = useAudio();

  // 💡 심문 전용 BGM 재생 및 종료 시 원상 복구 로직
  useEffect(() => {
    // 1. 심문 창이 열리면 긴장감 있는 BGM으로 교체 (실제 파일 경로로 수정 필요)
    // changeAndPlayBgm('/audio/tension_bgm.mp3');

    // 2. 심문 창이 닫힐 때(언마운트) 원래 시나리오 BGM으로 되돌림
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
    
    // 용의자가 바뀔 때마다 이미지 로드 상태 초기화
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
    // 💡 방어 코드: 행동력이 0 이하면 튕겨내기!
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
      setDiscoveryText(`[${currentStatement.title}] 진술을 수첩에 기록했습니다.`);
    }
  };

  // 💡 인벤토리 모달 열기 전 방어 로직
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
        
        {/* 💡 헤더에 행동력 표시기 개선 (줄바꿈 방지 적용) */}
        <header className="shrink-0 p-3 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent gap-1">
          <button 
            onClick={() => { playSfx(); onClose(); }} 
            className="text-white font-bold px-3 py-1.5 text-sm bg-black/50 rounded-full hover:bg-neutral-700 backdrop-blur-sm border border-neutral-700 shrink-0"
          >
            &lt; 심문 종료
          </button>
          
          <div className="flex justify-center shrink-0">
             {/* 💡 행동력 게이지 (whitespace-nowrap 추가!) */}
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
            className="font-bold px-3 py-1.5 text-sm rounded-full backdrop-blur-md bg-neutral-900/80 border border-neutral-600 text-amber-500 shadow-lg flex items-center gap-1 active:scale-95 transition-transform shrink-0"
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
            className="bg-black/60 backdrop-blur-md border border-neutral-700/50 rounded-xl p-4 pt-5 relative shadow-2xl cursor-pointer flex flex-col min-h-[110px]"
          >
            <div className="absolute -top-3 left-4 bg-neutral-800 text-amber-500 font-black px-4 py-1 rounded-md text-sm border border-neutral-600 shadow-lg">
              {suspect.name}
            </div>
            <div className="overflow-y-auto h-[90px] pr-2 mt-1 scrollbar-hide">
              <p className="text-gray-100 leading-relaxed text-sm select-none break-keep whitespace-pre-wrap text-shadow-sm">
                <TypewriterText key={dialogKey} text={currentDialog} speed={30} forceSkip={isSkipping} onComplete={() => setIsTypingDone(true)} />
              </p>
            </div>
            {isTypingDone && <div className="absolute bottom-3 right-4 text-amber-500 animate-bounce">▼</div>}
          </div>

          {isTypingDone && currentStatement && !inventory.includes(currentStatement.id) && (
            <button 
              onClick={() => { playSfx(); handleSaveToInventory(); }} 
              className="w-full py-3.5 bg-emerald-600/90 backdrop-blur-sm hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 border border-emerald-500/50 animate-fadeIn"
            >
              <span>📌</span> 이 진술을 수첩에 기록하기
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
              className="flex-1 bg-black/60 backdrop-blur-sm text-white font-bold rounded-xl border border-neutral-600 hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 shadow-lg"
            >
              <span className="text-lg">🗣️</span> 질문하기
            </button>
            <button 
              onClick={handleOpenInventory} // 💡 위에서 만든 방어 로직 적용!
              className={`flex-1 backdrop-blur-sm text-white font-black rounded-xl border shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all flex items-center justify-center gap-1 ${
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