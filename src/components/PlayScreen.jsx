import React, { useState, useEffect } from 'react';
import scenarioData from '../data/wedding_murder.json';
import InterrogationView from './InterrogationView';
import DeductionView from './DeductionView';
import InventoryModal from './InventoryModal';
import LocationModal from './LocationModal';

const PlayScreen = ({ scenarioId, onBack }) => {
  // 💡 1. 로컬스토리지 키 설정 (시나리오별로 독립적인 세이브 파일 생성)
  const SAVE_KEY = `crime_game_progress_${scenarioId}`;

  // 💡 2. 초기 상태 로드 함수 (로컬스토리지에 데이터가 있으면 가져오고, 없으면 기본값)
  const getInitialState = (key, defaultValue) => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (!saved) return defaultValue;
      const parsed = JSON.parse(saved);
      return parsed[key] !== undefined ? parsed[key] : defaultValue;
    } catch (e) {
      console.error("Save data load failed:", e);
      return defaultValue;
    }
  };

  const defaultAP = scenarioData.maxActionPoints || 3;

  // 💡 3. 상태 초기화 시 getInitialState를 통해 세이브 데이터 연동
  const [data, setData] = useState(scenarioData); 
  const [activeTab, setActiveTab] = useState(() => getInitialState('activeTab', 'briefing')); 
  const [actionPoints, setActionPoints] = useState(() => getInitialState('actionPoints', defaultAP));
  const [inventory, setInventory] = useState(() => getInitialState('inventory', [])); // 획득한 단서 ID 배열
  const [viewedClues, setViewedClues] = useState(() => getInitialState('viewedClues', []));
  const [deductionLife, setDeductionLife] = useState(() => getInitialState('deductionLife', 3));

  // 저장되지 않는 휘발성 UI 상태 (모달 등)
  const [selectedSuspect, setSelectedSuspect] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isGlobalInventoryOpen, setIsGlobalInventoryOpen] = useState(false);

  // 읽지 않은 단서 개수 계산
  const unreadCount = inventory.filter(id => !viewedClues.includes(id)).length;

  // 💡 4. 상태가 바뀔 때마다 자동으로 로컬스토리지에 저장 (Auto-save)
  useEffect(() => {
    const gameState = {
      activeTab,
      actionPoints,
      inventory,
      viewedClues,
      deductionLife
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
  }, [activeTab, actionPoints, inventory, viewedClues, deductionLife, SAVE_KEY]);

  // 시나리오 ID가 바뀔 때 초기화 및 세이브 로드
  useEffect(() => {
    setData(scenarioData);
    const saved = localStorage.getItem(SAVE_KEY);
    
    if (saved) {
      const parsed = JSON.parse(saved);
      setActionPoints(parsed.actionPoints !== undefined ? parsed.actionPoints : defaultAP);
      setInventory(parsed.inventory || []);
      setViewedClues(parsed.viewedClues || []);
      setActiveTab(parsed.activeTab || 'briefing');
      setDeductionLife(parsed.deductionLife !== undefined ? parsed.deductionLife : 3);
    } else {
      setActionPoints(defaultAP);
      setInventory([]);
      setViewedClues([]);
      setActiveTab('briefing');
      setDeductionLife(3);
    }
  }, [scenarioId, SAVE_KEY, defaultAP]);
  
  // AP 소진 시 강제 추리 탭 이동
  useEffect(() => {
    if (data && actionPoints <= 0 && activeTab !== 'deduction') {
      alert("🚨 모든 수사 기회를 소진했습니다! 지금부터 범인을 지목해야 합니다.");
      setSelectedSuspect(null);
      setSelectedLocation(null);
      setIsGlobalInventoryOpen(false); 
      setActiveTab('deduction');
    }
  }, [actionPoints, activeTab, data]);

  // 💡 5. 게임오버 또는 사건 종결 시 진행 상황을 초기화하는 함수
  const clearProgress = () => {
    localStorage.removeItem(SAVE_KEY);
    window.location.reload();
  };

  const handlePresentEvidence = () => {
    setActionPoints((prev) => Math.max(0, prev - 1));
  };

  const handleScanArea = () => {
    setActionPoints(prev => Math.max(0, prev - 1));
  };

  const handleAddClue = (clueId) => {
    setInventory((prev) => {
      if (prev.includes(clueId)) return prev;
      return [...prev, clueId];
    });
  };

  const handleRemoveClue = (clueId) => {
    setInventory((prev) => prev.filter(id => id !== clueId));
  };

  const markClueAsViewed = (clueId) => {
    setViewedClues(prev => {
      if (prev.includes(clueId)) return prev;
      return [...prev, clueId];
    });
  };

  if (!data) return <div className="text-white p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-neutral-900 text-gray-100 flex flex-col font-sans">
      
      {/* 1. 상단 고정 헤더 */}
      <header className={`sticky top-0 z-20 border-b border-neutral-800 p-3 flex justify-between items-center gap-2 shadow-md transition-colors ${actionPoints === 0 ? 'bg-red-950' : 'bg-neutral-950'}`}>
        {/* 왼쪽: 철수 버튼 (영역 보존) */}
        <button onClick={onBack} className="text-neutral-400 hover:text-white font-bold text-sm whitespace-nowrap shrink-0">
          &lt; 철수
        </button>
        
        {/* 중앙: 타이틀 (좁으면 말줄임표 처리) */}
        <h1 className="text-sm font-black truncate flex-1 text-center text-white min-w-0">
          {data.title}
        </h1>
        
        {/* 우측: 인벤토리 & AP (영역 보존) */}
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => setIsGlobalInventoryOpen(true)}
            className="relative w-8 h-8 bg-neutral-800 rounded-full border border-neutral-600 flex items-center justify-center hover:bg-neutral-700 active:scale-95 transition-all"
          >
            <span className="text-sm">💼</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-md animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          <div className={`flex items-center gap-1 px-2 py-1 rounded-full border transition-colors ${
            actionPoints <= 1 ? 'bg-red-900/50 border-red-500 animate-pulse text-red-400' : 'bg-neutral-800 border-neutral-700 text-neutral-300'
          }`}>
            <span className="text-xs">⚡</span>
            <span className="text-[11px] font-black tracking-widest mt-px">
              {actionPoints} <span className="text-neutral-500 mx-0.5">/</span> {data.maxActionPoints || 3}
            </span>
          </div>
        </div>
      </header>

      {/* 중앙 메인 콘텐츠 영역 */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        
        {/* [사건 개요 탭] */}
        {activeTab === 'briefing' && (
          <div className="animate-fadeIn space-y-6">
            <div className="w-full h-48 bg-neutral-800 rounded-xl overflow-hidden border border-neutral-700 relative">
              {data.briefingImageUrl ? (
                <img src={data.briefingImageUrl} alt="사건 현장" className="w-full h-full object-cover opacity-80" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-600 font-bold">이미지 준비 중</div>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-black text-white mb-2">{data.title}</h2>
              <p className="text-red-400 font-bold text-sm mb-4 leading-relaxed">{data.summary}</p>
            </div>

            <div className="bg-neutral-800 p-5 rounded-xl border border-neutral-700">
              <h3 className="text-sm font-bold text-neutral-400 mb-3 flex items-center gap-2">
                <span>📋</span> 사건 보고서
              </h3>
              <p className="text-sm text-neutral-200 leading-loose whitespace-pre-wrap">
                {data.desc}
              </p>
            </div>

            <button 
              onClick={() => setActiveTab('interrogation')}
              className="w-full py-4 bg-neutral-200 text-black font-black rounded-xl hover:bg-white active:scale-95 transition-all shadow-lg mt-4"
            >
              용의자 심문 시작하기
            </button>
          </div>
        )}

        {/* [심문 탭] */}
        {activeTab === 'interrogation' && (
          <div className="animate-fadeIn">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="text-amber-500">💬</span> 용의자 심문
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {data.suspects.map(suspect => (
                <button key={suspect.id} onClick={() => setSelectedSuspect(suspect)} className="w-full bg-neutral-800 p-4 rounded-xl flex items-center gap-4 border border-neutral-700 hover:bg-neutral-700 active:scale-[0.98] transition-all">
                  <div className="w-14 h-14 bg-neutral-900 rounded-full flex items-center justify-center text-xl font-bold text-neutral-600 border border-neutral-600">
                    {suspect.name.charAt(0)}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-white text-lg">{suspect.name}</div>
                    <div className="text-xs text-amber-500 font-bold mb-1">{suspect.role}</div>
                    <div className="text-xs text-neutral-400 line-clamp-1">{suspect.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* [현장 조사 탭] */}
        {activeTab === 'investigation' && (
          <div className="animate-fadeIn">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="text-blue-400">🔍</span> 현장 조사
            </h2>
            <div className="space-y-3">
              {data.locations.map(loc => (
                <button 
                  key={loc.id} 
                  onClick={() => setSelectedLocation(loc)} 
                  className="w-full bg-neutral-800 p-4 rounded-xl text-left border border-neutral-700 hover:bg-neutral-700 active:scale-[0.98] transition-all flex justify-between items-center"
                >
                  <div>
                    <div className="font-bold text-white mb-1">{loc.name}</div>
                    <div className="text-xs text-neutral-400">조사 가능한 단서: {loc.clues.length}개</div>
                  </div>
                  <div className="text-neutral-500">이동 &gt;</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* [최종 추리 탭] */}
        {activeTab === 'deduction' && (
          <DeductionView 
            scenarioData={data} 
            inventory={inventory}
            actionPoints={actionPoints}
            deductionLife={deductionLife} 
            onFail={() => setDeductionLife(prev => Math.max(0, prev - 1))} 
            onReset={clearProgress} // 💡 게임 끝났을 때 세이브 날리는 함수 전달!
          />
        )}
      </main>

      {/* 하단 고정 탭 바 */}
      {actionPoints > 0 && (
        <nav className="fixed bottom-0 w-full bg-neutral-950 border-t border-neutral-800 flex pb-safe z-10">
          <button onClick={() => setActiveTab('briefing')} className={`flex-1 py-4 flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'briefing' ? 'text-white bg-neutral-900' : 'text-neutral-500 hover:text-neutral-300'}`}>
              <span className="text-2xl mb-1">📋</span>
              <span className="text-[11px] font-bold tracking-wider">사건 개요</span>
          </button>
          <button onClick={() => setActiveTab('interrogation')} className={`flex-1 py-4 flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'interrogation' ? 'text-amber-400 bg-neutral-900' : 'text-neutral-500 hover:text-neutral-300'}`}>
              <span className="text-2xl mb-1">💬</span>
              <span className="text-[11px] font-bold tracking-wider">용의자 심문</span>
          </button>
          <button onClick={() => setActiveTab('investigation')} className={`flex-1 py-4 flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'investigation' ? 'text-blue-400 bg-neutral-900' : 'text-neutral-500 hover:text-neutral-300'}`}>
              <span className="text-2xl mb-1">🔍</span>
              <span className="text-[11px] font-bold tracking-wider">현장 조사</span>
          </button>
          <button onClick={() => setActiveTab('deduction')} className={`flex-1 py-4 flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'deduction' ? 'text-red-500 bg-neutral-900' : 'text-neutral-500 hover:text-neutral-300'}`}>
              <span className="text-2xl mb-1">⚖️</span>
              <span className="text-[11px] font-bold tracking-wider">사건 종결</span>
          </button>
        </nav>
      )}

      {/* 용의자 심문 화면 오버레이 */}
      {selectedSuspect && (
        <InterrogationView 
          suspect={selectedSuspect} 
          scenarioData={data}
          inventory={inventory}          
          viewedClues={viewedClues}
          onClueFound={handleAddClue}    
          onMarkAsViewed={markClueAsViewed}
          onRemoveClue={handleRemoveClue}
          onClose={() => setSelectedSuspect(null)} 
          onPresent={handlePresentEvidence} 
        />
      )}

      {/* 글로벌 인벤토리 모달 렌더링 */}
      {isGlobalInventoryOpen && (
        <InventoryModal 
          inventory={inventory} 
          viewedClues={viewedClues}
          onMarkAsViewed={markClueAsViewed}
          scenarioData={data}
          onRemoveClue={handleRemoveClue}
          onClose={() => setIsGlobalInventoryOpen(false)} 
        />
      )}

      {/* 현장 조사 상세 화면 (LocationModal) */}
      {selectedLocation && (
        <LocationModal
          location={selectedLocation}
          inventory={inventory}
          maxActionPoints={data.maxActionPoints}
          actionPoints={actionPoints}
          onClueFound={handleAddClue}
          onScan={handleScanArea}
          onClose={() => setSelectedLocation(null)}
        />
      )}
    </div>
  );
};

export default PlayScreen;