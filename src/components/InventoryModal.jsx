import React, { useState } from 'react';

const InventoryModal = ({ inventory, scenarioData, viewedClues, onMarkAsViewed, onRemoveClue, onClose, onPresent }) => {
  const [selectedClue, setSelectedClue] = useState(null);

  // 1. 전체 데이터에서 단서 객체들 긁어오기 (현장 단서 + 관찰 단서)
  const allLocationClues = scenarioData.locations?.flatMap(loc => loc.clues || []) || [];
  const allInspectionClues = scenarioData.suspects?.flatMap(s => s.inspectionPoints || []) || [];
  const allClues = [...allLocationClues, ...allInspectionClues];

  // 2. 현재 내 인벤토리 ID와 일치하는 단서 객체만 필터링
  const myClues = inventory?.map(id => allClues.find(c => c.id === id)).filter(Boolean) || [];

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      {/* 배경 블러 및 클릭 시 닫기 */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fadeIn" 
        onClick={onClose} 
      />

      {/* 바텀 시트 본체 */}
      <div className="relative w-full max-w-lg bg-neutral-900 h-[85vh] rounded-t-[32px] shadow-2xl flex flex-col overflow-hidden animate-slideUp border-t border-neutral-700">
        
        {/* 핸들 바 */}
        <div className="w-full flex justify-center py-3">
          <div className="w-12 h-1.5 bg-neutral-700 rounded-full" />
        </div>

        {/* 헤더 */}
        <header className="px-6 pb-4 flex justify-between items-center">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span className="text-2xl">💼</span> 증거 수첩 
            <span className="text-sm font-normal text-neutral-500 ml-1">{myClues.length}</span>
          </h2>
        </header>

        {/* 메인 콘텐츠 영역 */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {myClues.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 p-10 text-center">
              <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mb-4 text-4xl">🫙</div>
              <p className="font-bold text-lg mb-1">가방이 비어있습니다</p>
              <p className="text-xs leading-relaxed">사건 현장을 조사하거나<br/>용의자의 차림새를 면밀히 관찰하세요.</p>
            </div>
          ) : (
            <>
              {/* 단서 그리드 리스트 */}
              <div className="grid grid-cols-3 gap-3 p-6 overflow-y-auto max-h-[40%] bg-neutral-950/50">
                {myClues.map(clue => {
                  const isUnread = !viewedClues.includes(clue.id); // 💡 안 읽은 단서인지 확인

                  return (
                    <button
                      key={clue.id}
                      onClick={() => {
                        setSelectedClue(clue);
                        onMarkAsViewed(clue.id); // 💡 클릭하는 순간 확인한 걸로 처리
                      }}
                      className={`relative aspect-square rounded-2xl border flex items-center justify-center p-3 transition-all active:scale-95 ${
                        selectedClue?.id === clue.id 
                          ? 'bg-amber-500/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                          : 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700/80'
                      }`}
                    >
                      {/* 💡 안 읽은 단서일 경우 빨간 점(!) 표시 */}
                      {isUnread && (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
                      )}

                      <div className={`text-xs font-bold text-center leading-snug break-keep line-clamp-3 ${
                        selectedClue?.id === clue.id ? 'text-amber-400' : 'text-neutral-300'
                      }`}>
                        {clue.name}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 선택된 단서 상세 정보 */}
              <div className="flex-1 p-6 bg-neutral-900 overflow-y-auto pb-32">
                {selectedClue ? (
                  <div className="animate-fadeIn">
                    
                    {/* 타이틀 및 휴지통 버튼 영역 */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center border border-neutral-700 text-2xl">
                          📍
                        </div>
                        <h3 className="text-xl font-black text-white">{selectedClue.name}</h3>
                      </div>
                      
                      {/* 휴지통(삭제) 버튼 */}
                      {onRemoveClue && (
                        <button 
                          onClick={() => {
                            if(window.confirm('이 단서를 수첩에서 정말 파기하시겠습니까? (현장에서 다시 획득할 수 있습니다)')) {
                              onRemoveClue(selectedClue.id);
                              setSelectedClue(null);
                            }
                          }}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-800 hover:bg-red-950/50 text-neutral-500 hover:text-red-500 border border-neutral-700 transition-colors active:scale-95"
                        >
                          🗑️
                        </button>
                      )}
                    </div>

                    <p className="text-neutral-300 leading-relaxed text-sm bg-neutral-800/50 p-4 rounded-2xl border border-neutral-700/50">
                      {/* 현장 단서는 desc, 관찰 단서는 description을 사용함 */}
                      {selectedClue.desc || selectedClue.description}
                    </p>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-neutral-600 text-sm italic">
                    확인할 단서를 선택해주세요
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* 하단 고정 액션 버튼 영역 (글로벌 뷰어 / 심문 모드 분기) */}
        <footer className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-neutral-950 via-neutral-900 to-transparent flex gap-3 z-10">
          {onPresent ? (
            <>
              <button 
                onClick={onClose}
                className="w-1/3 h-[56px] bg-neutral-800 text-neutral-300 font-bold rounded-2xl active:scale-[0.97] transition-all border border-neutral-700"
              >
                닫기
              </button>
              <button 
                onClick={() => selectedClue && onPresent(selectedClue)}
                disabled={!selectedClue}
                className={`flex-1 h-[56px] font-black rounded-2xl transition-all flex items-center justify-center gap-2 text-base ${
                  selectedClue 
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] active:scale-[0.97]' 
                    : 'bg-neutral-800 text-neutral-600 cursor-not-allowed border border-neutral-700/50'
                }`}
              >
                {selectedClue ? '⚡ 이 단서로 추궁하기' : '단서를 선택하세요'}
              </button>
            </>
          ) : (
            <button 
              onClick={onClose}
              className="w-full h-[56px] bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-2xl active:scale-[0.97] transition-all border border-neutral-600 shadow-lg"
            >
              수첩 닫기
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};

export default InventoryModal;