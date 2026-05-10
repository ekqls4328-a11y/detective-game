import React, { useState, useEffect } from 'react';
import TypewriterText from './TypewriterText';
import InventoryModal from './InventoryModal';
import InspectionModal from './InspectionModal';

const InterrogationView = ({ suspect, scenarioData, inventory, viewedClues, onClueFound, onMarkAsViewed, onRemoveClue, onPresent, onClose }) => {
  const [isTypingDone, setIsTypingDone] = useState(false);
  const [showQuestionMenu, setShowQuestionMenu] = useState(false);
  const [currentDialog, setCurrentDialog] = useState(suspect.selfIntro);
  const [dialogKey, setDialogKey] = useState(0); 

  // 💡 강제 스킵 상태 추가
  const [isSkipping, setIsSkipping] = useState(false);
  
  // 모달 제어용 상태
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isInspectionOpen, setIsInspectionOpen] = useState(false);

  // 용의자가 바뀔 때마다 초기화
  useEffect(() => {
    setCurrentDialog(suspect.selfIntro);
    setShowQuestionMenu(false);
    setIsTypingDone(false);
    setIsSkipping(false); // 💡 스킵 상태 리셋
    setDialogKey(prev => prev + 1); 
  }, [suspect]);

  // [질문하기] 실행
  const handleAskQuestion = (question) => {
    setShowQuestionMenu(false);
    setIsTypingDone(false);
    setIsSkipping(false); // 💡 질문할 때마다 스킵 상태 리셋
    setCurrentDialog(question.response); 
    setDialogKey(prev => prev + 1); 
  };

  // [단서 제시] 실행
  const handlePresentEvidence = (evidence) => {
    setIsInventoryOpen(false);
    setIsTypingDone(false);
    setIsSkipping(false); // 💡 단서 제시할 때마다 스킵 상태 리셋

    const defense = suspect.defenses.find(d => d.clueId === evidence.id);
    if (defense) {
      setCurrentDialog(defense.response);
    } else {
      // 💡 [핵심 수정] 하드코딩된 대사 대신 용의자 고유의 반응을 출력. (데이터가 없으면 기본 대사)
      const fallbackResponse = suspect.wrongEvidenceResponse || "그게 이 사건과 무슨 상관이라는 겁니까? 억지 부리지 마시죠.";
      setCurrentDialog(fallbackResponse);
    }
    setDialogKey(prev => prev + 1); 
    if (onPresent) onPresent();
  };

  if (!suspect) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-900 animate-fadeIn">
      {/* 상단 헤더 */}
      <header className="absolute top-0 w-full z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <button 
          onClick={onClose}
          className="text-white font-bold px-3 py-1 bg-black/50 rounded-full hover:bg-neutral-700 backdrop-blur-sm"
        >
          &lt; 심문 종료
        </button>

        <button 
          onClick={() => setIsInspectionOpen(true)}
          className="font-bold px-4 py-1.5 rounded-full backdrop-blur-sm bg-neutral-800 border border-neutral-600 text-amber-500 shadow-md flex items-center gap-2 active:scale-95 transition-transform"
        >
          <span>🧐</span> 외형 관찰
        </button>
      </header>

      {/* 중앙 용의자 일러스트 영역 */}
      <div className="flex-1 relative flex items-end justify-center overflow-hidden border-b-2 border-neutral-700 bg-black">
        {suspect.illustration?.interrogationUrl ? (
          <img 
            src={suspect.illustration.interrogationUrl} 
            alt={`${suspect.name} 심문`} 
            className="w-full h-full object-cover pointer-events-none" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-500 font-bold">
            심문용 일러스트 준비 중
          </div>
        )}
      </div>

      {/* 비주얼 노벨 스타일 대화창 */}
      <div className="h-2/5 bg-neutral-950 p-4 flex flex-col justify-between relative z-20">
        
        {/* 질문 메뉴 오버레이 */}
        {showQuestionMenu && (
          <div className="absolute inset-0 z-40 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-fadeIn">
            <div className="w-full max-w-md flex flex-col gap-3">
              
              <div className="text-amber-500 font-bold text-sm mb-4 text-center tracking-widest animate-pulse">
                [ 심문 주제 선택 ]
              </div>

              {suspect.questions.map((q, idx) => (
                <button 
                  key={q.id}
                  onClick={() => handleAskQuestion(q)}
                  className="group relative w-full overflow-hidden rounded-xl bg-neutral-900 border border-neutral-700 p-4 text-left shadow-lg hover:border-amber-500 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative flex items-center gap-4">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-neutral-800 text-neutral-500 text-xs font-black group-hover:bg-amber-500 group-hover:text-black transition-colors shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-gray-300 font-bold group-hover:text-white transition-colors leading-relaxed break-keep">
                      {q.title}
                    </span>
                  </div>
                </button>
              ))}

              {/* 닫기 버튼 */}
              <button 
                onClick={() => setShowQuestionMenu(false)}
                className="mt-6 py-3 px-8 rounded-full bg-neutral-800 text-neutral-400 font-bold hover:bg-neutral-700 hover:text-white transition-all self-center border border-neutral-600 shadow-md"
              >
                닫기
              </button>
              
            </div>
          </div>
        )}

        {/* 💡 [대화 텍스트 박스 수정] 클릭 시 강제 스킵 발동 */}
        <div 
          onClick={() => {
            if (!isTypingDone) setIsSkipping(true);
          }}
          className="flex-1 bg-neutral-900 border-2 border-neutral-700 rounded-xl p-4 relative shadow-inner cursor-pointer" // 💡 cursor-pointer 추가
        >
          <div className="absolute -top-3 left-4 bg-neutral-700 text-white font-bold px-3 py-0.5 rounded text-sm border border-neutral-500 shadow-md">
            {suspect.name}
          </div>
          
          <p className="text-gray-100 leading-relaxed text-sm mt-2 select-none">
            <TypewriterText 
              key={dialogKey} 
              text={currentDialog} 
              speed={30} 
              forceSkip={isSkipping} // 💡 스킵 상태를 TypewriterText에 전달
              onComplete={() => setIsTypingDone(true)} 
            />
          </p>
          
          {isTypingDone && (
            <div className="absolute bottom-3 right-4 text-amber-500 animate-bounce">▼</div>
          )}
        </div>

        {/* 심문 액션 버튼 */}
        <div className={`flex gap-3 mt-4 h-14 transition-opacity ${isTypingDone && !showQuestionMenu ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
          <button 
            onClick={() => setShowQuestionMenu(true)}
            className="flex-1 bg-neutral-800 text-white font-bold rounded-lg border border-neutral-600 hover:bg-neutral-700 transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-lg">🗣️</span> 질문하기
          </button>
          <button 
            onClick={() => setIsInventoryOpen(true)}
            className="flex-1 bg-red-800 text-white font-black rounded-lg border border-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)] hover:bg-red-700 transition-all flex items-center justify-center gap-1"
          >
            <span className="text-xl">!</span> 단서 제시 (⚡ -1)
          </button>
        </div>
      </div>

      {/* 단서 제시 모달 */}
      {isInventoryOpen && (
        <InventoryModal 
          inventory={inventory}
          viewedClues={viewedClues}
          onMarkAsViewed={onMarkAsViewed}
          scenarioData={scenarioData}
          onRemoveClue={onRemoveClue}
          onClose={() => setIsInventoryOpen(false)} 
          onPresent={handlePresentEvidence} 
        />
      )}

      {/* 전신 관찰 모달 */}
      {isInspectionOpen && (
        <InspectionModal
          suspect={suspect}
          inventory={inventory}
          onClueFound={onClueFound}
          onClose={() => setIsInspectionOpen(false)}
        />
      )}
    </div>
  );
};

export default InterrogationView;