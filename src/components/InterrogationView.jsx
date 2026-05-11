import React, { useState, useEffect } from 'react';
import TypewriterText from './TypewriterText';
import InventoryModal from './InventoryModal';
import InspectionModal from './InspectionModal';

const InterrogationView = ({ suspect, scenarioData, inventory, viewedClues, onClueFound, onMarkAsViewed, onRemoveClue, onPresent, onClose }) => {
  const [isTypingDone, setIsTypingDone] = useState(false);
  const [showQuestionMenu, setShowQuestionMenu] = useState(false);
  const [currentDialog, setCurrentDialog] = useState(suspect.selfIntro);
  const [dialogKey, setDialogKey] = useState(0); 
  const [isSkipping, setIsSkipping] = useState(false);
  
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isInspectionOpen, setIsInspectionOpen] = useState(false);

  // 💡 [수정] 어떤 대화를 기록할지 통째로 들고 있는 상태
  const [currentStatement, setCurrentStatement] = useState(null); 
  const [discoveryText, setDiscoveryText] = useState(null);

  useEffect(() => {
    setCurrentDialog(suspect.selfIntro);
    setShowQuestionMenu(false);
    setIsTypingDone(false);
    setIsSkipping(false); 
    setCurrentStatement(null); 
    setDiscoveryText(null);
    setDialogKey(prev => prev + 1); 
  }, [suspect]);

  const handleAskQuestion = (question) => {
    setShowQuestionMenu(false);
    setIsTypingDone(false);
    setIsSkipping(false); 
    setCurrentDialog(question.response); 
    
    // 💡 [핵심] 질문 객체 자체의 id와 title을 바로 상태에 저장
    setCurrentStatement({ id: question.id, title: question.title });
    setDiscoveryText(null);
    setDialogKey(prev => prev + 1); 
  };

  const handlePresentEvidence = (evidence) => {
    setIsInventoryOpen(false);
    setIsTypingDone(false);
    setIsSkipping(false); 

    const defense = suspect.defenses.find(d => d.clueId === evidence.id);
    if (defense) {
      setCurrentDialog(defense.response);
      
      // 💡 [핵심] 원래 단서 이름을 찾아서 변론(추궁) 기록용 가상 ID 생성
      const originalClue = scenarioData.locations?.flatMap(l => l.clues || []).find(c => c.id === evidence.id);
      const clueName = originalClue ? originalClue.name : '단서';
      
      setCurrentStatement({ 
        id: `def_${suspect.id}_${evidence.id}`, 
        title: `[${clueName}] 추궁` 
      });
    } else {
      const fallbackResponse = suspect.wrongEvidenceResponse || "그게 이 사건과 무슨 상관이라는 겁니까? 억지 부리지 마시죠.";
      setCurrentDialog(fallbackResponse);
      setCurrentStatement(null);
    }
    setDiscoveryText(null);
    setDialogKey(prev => prev + 1); 
    if (onPresent) onPresent();
  };

  const handleSaveToInventory = () => {
    if (currentStatement && onClueFound) {
      onClueFound(currentStatement.id); // 💡 인벤토리에 q1_1 같은 ID가 바로 들어감
      setDiscoveryText(`[${currentStatement.title}] 진술을 수첩에 기록했습니다.`);
    }
  };

  if (!suspect) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-900 animate-fadeIn overflow-hidden">
      {/* 상단 헤더 */}
      <header className="absolute top-0 w-full z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={onClose} className="text-white font-bold px-3 py-1 bg-black/50 rounded-full hover:bg-neutral-700 backdrop-blur-sm">
          &lt; 심문 종료
        </button>
        <button onClick={() => setIsInspectionOpen(true)} className="font-bold px-4 py-1.5 rounded-full backdrop-blur-sm bg-neutral-800 border border-neutral-600 text-amber-500 shadow-md flex items-center gap-2 active:scale-95 transition-transform">
          <span>🧐</span> 외형 관찰
        </button>
      </header>

      {/* 중앙 용의자 일러스트 영역 */}
      <div className="flex-1 relative flex items-end justify-center overflow-hidden border-b-2 border-neutral-700 bg-black">
        {suspect.illustration?.interrogationUrl ? (
          <img src={suspect.illustration.interrogationUrl} alt={`${suspect.name} 심문`} className="w-full h-full object-cover pointer-events-none" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-500 font-bold">심문용 일러스트 준비 중</div>
        )}
      </div>

      {/* 비주얼 노벨 스타일 대화창 */}
      <div className="shrink-0 bg-neutral-950 p-4 pb-8 flex flex-col gap-4 relative z-20">
        
        {/* 질문 오버레이 */}
        {showQuestionMenu && (
          <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-fadeIn">
            <div className="w-full max-w-md flex flex-col max-h-full py-2">
              <div className="shrink-0 text-amber-500 font-bold text-sm mb-4 text-center tracking-widest animate-pulse">
                [ 심문 주제 선택 ]
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 px-1 scrollbar-hide py-1">
                {suspect.questions.map((q, idx) => (
                  <button key={q.id} onClick={() => handleAskQuestion(q)} className="group relative w-full overflow-hidden rounded-xl bg-neutral-900 border border-neutral-700 p-4 text-left shadow-lg hover:border-amber-500 transition-all active:scale-[0.98] shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center gap-4">
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-neutral-800 text-neutral-500 text-xs font-black group-hover:bg-amber-500 group-hover:text-black transition-colors shrink-0">{idx + 1}</span>
                      <span className="text-gray-300 font-bold group-hover:text-white transition-colors leading-relaxed break-keep">{q.title}</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="shrink-0 pt-5 flex justify-center">
                <button onClick={() => setShowQuestionMenu(false)} className="py-3 px-8 rounded-full bg-neutral-800 text-neutral-400 font-bold hover:bg-neutral-700 hover:text-white transition-all border border-neutral-600 shadow-md">닫기</button>
              </div>
            </div>
          </div>
        )}

        <div onClick={() => { if (!isTypingDone) setIsSkipping(true); }} className="bg-neutral-900 border-2 border-neutral-700 rounded-xl p-4 relative shadow-inner cursor-pointer flex flex-col min-h-[100px]">
          <div className="absolute -top-3 left-4 bg-neutral-700 text-white font-bold px-3 py-0.5 rounded text-sm border border-neutral-500 shadow-md">
            {suspect.name}
          </div>
          <div className="overflow-y-auto max-h-[25vh] pr-1 mt-2">
            <p className="text-gray-100 leading-relaxed text-sm select-none break-keep whitespace-pre-wrap">
              <TypewriterText key={dialogKey} text={currentDialog} speed={30} forceSkip={isSkipping} onComplete={() => setIsTypingDone(true)} />
            </p>
          </div>
          {isTypingDone && <div className="absolute bottom-3 right-4 text-amber-500 animate-bounce">▼</div>}
        </div>

        {/* 💡 수첩 기록 버튼 로직 */}
        {isTypingDone && currentStatement && !inventory.includes(currentStatement.id) && (
          <button onClick={handleSaveToInventory} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 animate-fadeIn">
            <span>📌</span> 이 진술을 수첩에 기록하기
          </button>
        )}

        {isTypingDone && currentStatement && inventory.includes(currentStatement.id) && discoveryText && (
          <div className="w-full py-2 text-center text-xs text-emerald-400 font-bold bg-emerald-950/30 rounded-lg border border-emerald-900/50 shrink-0 animate-fadeIn">
            {discoveryText}
          </div>
        )}
        {isTypingDone && currentStatement && inventory.includes(currentStatement.id) && !discoveryText && (
          <div className="w-full py-2 text-center text-xs text-neutral-500 font-bold bg-neutral-900 rounded-lg border border-neutral-800 shrink-0 animate-fadeIn">
            이미 기록된 진술입니다
          </div>
        )}

        {/* 액션 버튼 */}
        <div className={`flex gap-3 h-14 shrink-0 transition-opacity ${isTypingDone && !showQuestionMenu ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
          <button onClick={() => setShowQuestionMenu(true)} className="flex-1 bg-neutral-800 text-white font-bold rounded-xl border border-neutral-600 hover:bg-neutral-700 transition-colors flex items-center justify-center gap-2">
            <span className="text-lg">🗣️</span> 질문하기
          </button>
          <button onClick={() => setIsInventoryOpen(true)} className="flex-1 bg-red-800 text-white font-black rounded-xl border border-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)] hover:bg-red-700 transition-all flex items-center justify-center gap-1">
            <span className="text-xl">!</span> 단서 제시 (⚡ -1)
          </button>
        </div>

      </div>

      {isInventoryOpen && <InventoryModal inventory={inventory} viewedClues={viewedClues} onMarkAsViewed={onMarkAsViewed} scenarioData={scenarioData} onRemoveClue={onRemoveClue} onClose={() => setIsInventoryOpen(false)} onPresent={handlePresentEvidence} />}
      {isInspectionOpen && <InspectionModal suspect={suspect} inventory={inventory} onClueFound={onClueFound} onClose={() => setIsInspectionOpen(false)} />}
    </div>
  );
};

export default InterrogationView;