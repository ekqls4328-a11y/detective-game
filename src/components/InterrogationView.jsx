import React, { useState, useEffect } from 'react';
import TypewriterText from './TypewriterText';
import InventoryModal from './InventoryModal';
import InspectionModal from './InspectionModal'; // 💡 100% 분리된 관찰 모달

const InterrogationView = ({ suspect, scenarioData, inventory, viewedClues, onClueFound, onMarkAsViewed, onRemoveClue, onPresent, onClose }) => {
  const [isTypingDone, setIsTypingDone] = useState(false);
  const [showQuestionMenu, setShowQuestionMenu] = useState(false);
  const [currentDialog, setCurrentDialog] = useState(suspect.selfIntro);
  
  // 모달 제어용 상태
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isInspectionOpen, setIsInspectionOpen] = useState(false); // 💡 관찰 모달 띄우는 상태

  // 용의자가 바뀔 때마다 초기화
  useEffect(() => {
    setCurrentDialog(suspect.selfIntro);
    setShowQuestionMenu(false);
    setIsTypingDone(false);
  }, [suspect]);

  // [질문하기] 실행
  const handleAskQuestion = (question) => {
    setShowQuestionMenu(false);
    setIsTypingDone(false);
    setCurrentDialog(question.response); 
  };

  // [단서 제시] 실행
  const handlePresentEvidence = (evidence) => {
    setIsInventoryOpen(false);
    setIsTypingDone(false);

    const defense = suspect.defenses.find(d => d.clueId === evidence.id);
    if (defense) {
      setCurrentDialog(defense.response);
    } else {
      setCurrentDialog("그게 이 사건과 무슨 상관이라는 겁니까? 억지 부리지 마시죠.");
    }
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

        {/* 💡 관찰 모달 띄우기 버튼 */}
        <button 
          onClick={() => setIsInspectionOpen(true)}
          className="font-bold px-4 py-1.5 rounded-full backdrop-blur-sm bg-neutral-800 border border-neutral-600 text-amber-500 shadow-md flex items-center gap-2 active:scale-95 transition-transform"
        >
          <span>🧐</span> 외형 관찰
        </button>
      </header>

      {/* 중앙 용의자 일러스트 영역 (배경 포함 심문용 이미지) */}
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

      {/* 비주얼 노벨 스타일 대화창 (하단 고정) */}
      <div className="h-2/5 bg-neutral-950 p-4 flex flex-col justify-between relative z-20">
        
        {/* 질문 메뉴 팝업 */}
        {showQuestionMenu && (
          <div className="absolute bottom-[calc(100%-1rem)] left-4 right-4 bg-neutral-800 border border-neutral-600 rounded-xl p-3 flex flex-col gap-2 shadow-2xl z-20 max-h-48 overflow-y-auto">
            <div className="text-xs text-neutral-400 font-bold mb-1 px-1">무엇을 물어볼까?</div>
            
            {suspect.questions.map((q) => (
              <button 
                key={q.id}
                onClick={() => handleAskQuestion(q)}
                className="w-full text-left bg-neutral-700 hover:bg-neutral-600 text-white p-3 rounded-lg text-sm transition-colors border border-neutral-500"
              >
                Q. {q.title}
              </button>
            ))}
            <button 
              onClick={() => setShowQuestionMenu(false)}
              className="w-full mt-1 p-2 text-neutral-400 hover:text-white text-sm font-bold sticky bottom-0 bg-neutral-800"
            >
              취소
            </button>
          </div>
        )}

        {/* 대화 텍스트 박스 */}
        <div className="flex-1 bg-neutral-900 border-2 border-neutral-700 rounded-xl p-4 relative shadow-inner">
          <div className="absolute -top-3 left-4 bg-neutral-700 text-white font-bold px-3 py-0.5 rounded text-sm border border-neutral-500 shadow-md">
            {suspect.name}
          </div>
          
          <p className="text-gray-100 leading-relaxed text-sm mt-2">
            <TypewriterText 
              text={currentDialog} 
              speed={30} 
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
            <span className="text-xl">!</span> 단서 제시
          </button>
        </div>
      </div>

      {/* 💡 단서 제시 모달 (바텀 시트) */}
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

      {/* 💡 전신 관찰 모달 (풀스크린) */}
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