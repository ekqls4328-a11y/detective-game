import React, { useState, useMemo } from 'react';
// 💡 AudioContext 임포트 추가
import { useAudio } from '../contexts/AudioContext';

const InventoryModal = ({ inventory, scenarioData, viewedClues, onMarkAsViewed, onRemoveClue, onClose, onPresent }) => {
  const [selectedClue, setSelectedClue] = useState(null);
  const [activeTab, setActiveTab] = useState('evidence');

  // 💡 효과음 함수 가져오기
  const { playSfx } = useAudio();

  // 각 단서 객체에 부모의 이름(sourceName)을 자동으로 주입
  const allClues = useMemo(() => {
    if (!scenarioData) return [];
    
    // 1. 현장 단서 (물증) -> sourceName에 장소 이름 주입
    const allLocationClues = scenarioData.locations?.flatMap(loc => 
      (loc.clues || []).map(clue => ({ ...clue, sourceName: loc.name }))
    ) || [];

    // 2. 관찰 단서 (물증) -> sourceName에 용의자 이름 주입
    const allInspectionClues = scenarioData.suspects?.flatMap(s => 
      (s.inspectionPoints || []).map(point => ({ ...point, sourceName: s.name }))
    ) || [];

    const physical = [...allLocationClues, ...allInspectionClues];

    // 3. 진술 단서 -> sourceName에 용의자 이름 주입
    const statements = [];
    scenarioData.suspects?.forEach(suspect => {
      // 질문(questions)
      suspect.questions?.forEach(q => {
        statements.push({
          id: q.id,
          name: q.title,
          desc: q.response,
          icon: '🗣️',
          sourceName: suspect.name
        });
      });

      // 단서 제시 방어(defenses)
      suspect.defenses?.forEach(d => {
        const originalClue = physical.find(c => c.id === d.clueId);
        const clueName = originalClue ? originalClue.name : '단서';
        statements.push({
          id: `def_${suspect.id}_${d.clueId}`,
          name: `${clueName} 추궁`, 
          desc: d.response,
          icon: '🗣️',
          sourceName: suspect.name
        });
      });
    });

    return [...physical, ...statements];
  }, [scenarioData]);

  // 분류 로직
  const { evidenceClues, statementClues } = useMemo(() => {
    const evidence = [];
    const statement = [];

    if (inventory && allClues.length > 0) {
      inventory.forEach(clueId => {
        const clueInfo = allClues.find(c => c.id === clueId);
        if (clueInfo) {
          if (clueInfo.icon === '🗣️' || clueId.startsWith('q') || clueId.startsWith('def_')) {
            statement.push(clueInfo);
          } else {
            evidence.push(clueInfo);
          }
        }
      });
    }
    return { evidenceClues: evidence, statementClues: statement };
  }, [inventory, allClues]);

  const displayList = activeTab === 'evidence' ? evidenceClues : statementClues;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      {/* 💡 배경 블러 및 클릭 시 닫기 (+ 클릭음) */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fadeIn" 
        onClick={() => { playSfx(); onClose(); }} 
      />

      {/* 바텀 시트 본체 */}
      <div className="relative w-full max-w-lg bg-neutral-900 h-[85vh] rounded-t-[32px] shadow-2xl flex flex-col overflow-hidden animate-slideUp border-t border-neutral-700">
        
        {/* 핸들 바 */}
        <div className="w-full flex justify-center py-3">
          <div className="w-12 h-1.5 bg-neutral-700 rounded-full" />
        </div>

        {/* 헤더 */}
        <header className="px-6 pb-3 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span className="text-2xl">💼</span> 증거 수첩 
            <span className="text-sm font-normal text-neutral-500 ml-1">{inventory?.length || 0}</span>
          </h2>
        </header>

        {/* 탭 전환 버튼 영역 */}
        <div className="px-6 pb-2 shrink-0">
          <div className="flex bg-neutral-950 rounded-xl p-1 border border-neutral-800">
            <button 
              onClick={() => { playSfx(); setActiveTab('evidence'); setSelectedClue(null); }} // 💡 클릭음 추가
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'evidence' ? 'bg-blue-600 text-white shadow-md' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <span>🔍</span> 물증 ({evidenceClues.length})
            </button>
            <button 
              onClick={() => { playSfx(); setActiveTab('statement'); setSelectedClue(null); }} // 💡 클릭음 추가
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'statement' ? 'bg-amber-500 text-black shadow-md' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <span>💬</span> 진술 ({statementClues.length})
            </button>
          </div>
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {displayList.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 p-10 text-center">
              <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mb-4 text-4xl">
                {activeTab === 'evidence' ? '🫙' : '🤫'}
              </div>
              <p className="font-bold text-lg mb-1">
                {activeTab === 'evidence' ? '수집한 물증이 없습니다' : '기록된 진술이 없습니다'}
              </p>
              <p className="text-xs leading-relaxed">
                {activeTab === 'evidence' 
                  ? '사건 현장을 조사하거나 용의자의 차림새를 면밀히 관찰하세요.' 
                  : '용의자를 심문하여 중요한 증언을 기록하세요.'}
              </p>
            </div>
          ) : (
            <>
              {/* 단서 그리드 리스트 */}
              <div className="grid grid-cols-3 gap-3 p-6 overflow-y-auto max-h-[40%] bg-neutral-950/50">
                {displayList.map(clue => {
                  const isUnread = viewedClues ? !viewedClues.includes(clue.id) : false;

                  return (
                    <button
                      key={clue.id}
                      onClick={() => {
                        playSfx(); // 💡 단서 선택 시 클릭음 추가
                        setSelectedClue(clue);
                        if (onMarkAsViewed) onMarkAsViewed(clue.id);
                      }}
                      className={`relative aspect-square rounded-2xl border flex flex-col items-center justify-center p-2 transition-all active:scale-95 ${
                        selectedClue?.id === clue.id 
                          ? (activeTab === 'evidence' ? 'bg-blue-500/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-amber-500/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]')
                          : 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700/80'
                      }`}
                    >
                      {isUnread && (
                        <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.8)] border border-neutral-900" />
                      )}
                      
                      {activeTab === 'statement' && (
                        <span className="text-lg mb-1 opacity-80">{clue.icon}</span>
                      )}

                      <div className="w-full px-1 flex flex-col items-center justify-center gap-0.5 mt-auto mb-auto">
                        <span className="text-[9px] text-neutral-400 font-bold truncate w-full text-center">
                          [{clue.sourceName}]
                        </span>
                        <span className={`text-[11px] font-bold text-center leading-snug break-keep line-clamp-2 w-full ${
                          selectedClue?.id === clue.id 
                            ? (activeTab === 'evidence' ? 'text-blue-400' : 'text-amber-400') 
                            : 'text-neutral-200'
                        }`}>
                          {clue.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 선택된 단서 상세 정보 */}
              <div className="flex-1 p-6 bg-neutral-900 overflow-y-auto pb-32 border-t border-neutral-800">
                {selectedClue ? (
                  <div className="animate-fadeIn">
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1 pr-2">
                        <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border text-2xl ${
                          activeTab === 'evidence' ? 'bg-blue-900/30 border-blue-800' : 'bg-amber-900/30 border-amber-800'
                        }`}>
                          {activeTab === 'evidence' ? '📍' : '💬'}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className={`text-[10px] font-black tracking-wider ${activeTab === 'evidence' ? 'text-blue-400' : 'text-amber-500'}`}>
                            [{selectedClue.sourceName}]
                          </span>
                          <h3 className="text-lg font-black text-white leading-tight break-keep">{selectedClue.name}</h3>
                        </div>
                      </div>
                      
                      {/* 휴지통(삭제) 버튼 */}
                      {onRemoveClue && activeTab === 'evidence' && (
                        <button 
                          onClick={() => {
                            playSfx(); // 💡 휴지통 클릭 시 소리 추가
                            if(window.confirm('이 단서를 수첩에서 정말 파기하시겠습니까? (현장에서 다시 획득할 수 있습니다)')) {
                              onRemoveClue(selectedClue.id);
                              setSelectedClue(null);
                            }
                          }}
                          className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-800 hover:bg-red-950/50 text-neutral-500 hover:text-red-500 border border-neutral-700 transition-colors active:scale-95"
                        >
                          🗑️
                        </button>
                      )}
                    </div>

                    <p className="text-neutral-300 leading-relaxed text-sm bg-neutral-950/50 p-4 rounded-2xl border border-neutral-800">
                      {selectedClue.desc || selectedClue.description}
                    </p>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-600 text-sm italic opacity-50 pb-10">
                    <span className="text-3xl mb-2">👆</span>
                    확인할 {activeTab === 'evidence' ? '물증' : '진술'}을 선택해주세요
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* 하단 고정 액션 버튼 영역 */}
        <footer className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-neutral-950 via-neutral-900 to-transparent flex gap-3 z-10">
          {onPresent ? (
            <>
              <button 
                onClick={() => { playSfx(); onClose(); }} // 💡 닫기 버튼 클릭음
                className="w-1/3 h-[56px] bg-neutral-800 text-neutral-300 font-bold rounded-2xl active:scale-[0.97] transition-all border border-neutral-700"
              >
                닫기
              </button>
              <button 
                onClick={() => { playSfx(); selectedClue && onPresent(selectedClue); }} // 💡 추궁하기 버튼 클릭음
                disabled={!selectedClue}
                className={`flex-1 h-[56px] font-black rounded-2xl transition-all flex items-center justify-center gap-2 text-base ${
                  selectedClue 
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] active:scale-[0.97]' 
                    : 'bg-neutral-800 text-neutral-600 cursor-not-allowed border border-neutral-700/50'
                }`}
              >
                {selectedClue ? `⚡ 이 ${activeTab === 'evidence' ? '물증' : '진술'}로 추궁하기` : '단서를 선택하세요'}
              </button>
            </>
          ) : (
            <button 
              onClick={() => { playSfx(); onClose(); }} // 💡 수첩 닫기 버튼 클릭음
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