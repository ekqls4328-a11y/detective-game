import React, { useState, useEffect } from 'react';
import InterrogationView from './InterrogationView';
import DeductionView from './DeductionView';
import InventoryModal from './InventoryModal';
import LocationModal from './LocationModal';
import ReasoningNoteModal from './ReasoningNoteModal'; 
import { useAudio } from '../contexts/AudioContext'; 
import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob';

// 💡 1. 만들어둔 시나리오 JSON 파일들을 모두 임포트해!
import wedding_murder from '../data/wedding_murder.json';
import apartment_murder from '../data/apartment_murder.json';
import AdConfirmModal from './AdConfirmModal'; // 💡 모달 임포트

// 💡 2. 시나리오 ID를 키(Key)값으로 하는 객체(DB)를 만들어줘!
const scenarioDB = {
  "wedding_murder": wedding_murder,
  "apartment_murder": apartment_murder
};

const PlayScreen = ({ scenarioId, onBack, onOpenSettings }) => {
  const SAVE_KEY = `crime_game_progress_${scenarioId}`;

  // 💡 3. App.jsx에서 넘겨준 scenarioId를 바탕으로 진짜 데이터를 꺼냄!
  const currentScenarioData = scenarioDB[scenarioId];

  // 혹시라도 데이터를 못 찾았을 때 앱이 뻗는 걸 방지하는 안전장치
  if (!currentScenarioData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        해당 시나리오({scenarioId}) 데이터를 찾을 수 없습니다.
      </div>
    );
  }

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

  const defaultAP = currentScenarioData.maxActionPoints || 3;

  // 💡 4. 고정된 값이 아니라 현재 시나리오 데이터를 초기값으로 세팅
  const [data, setData] = useState(currentScenarioData); 
  const [activeTab, setActiveTab] = useState(() => getInitialState('activeTab', 'briefing')); 
  const [actionPoints, setActionPoints] = useState(() => getInitialState('actionPoints', defaultAP));
  const [inventory, setInventory] = useState(() => getInitialState('inventory', []));
  const [viewedClues, setViewedClues] = useState(() => getInitialState('viewedClues', []));
  const [deductionLife, setDeductionLife] = useState(() => getInitialState('deductionLife', 3));

  const [selectedSuspect, setSelectedSuspect] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isGlobalInventoryOpen, setIsGlobalInventoryOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  
  const [showApAdModal, setShowApAdModal] = useState(false); // 💡 행동력 광고 모달 상태
  const [isAdLoading, setIsAdLoading] = useState(true); // 💡 진입 시 전면광고 로딩 상태

  const { changeAndPlayBgm, playSfx } = useAudio(); 

  const unreadCount = inventory.filter(id => !viewedClues.includes(id)).length;

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

  useEffect(() => {
    // 💡 5. scenarioId가 바뀔 때 올바른 데이터를 다시 세팅
    const newData = scenarioDB[scenarioId];
    setData(newData);
    
    const saved = localStorage.getItem(SAVE_KEY);
    
    if (saved) {
      const parsed = JSON.parse(saved);
      setActionPoints(parsed.actionPoints !== undefined ? parsed.actionPoints : (newData.maxActionPoints || 3));
      setInventory(parsed.inventory || []);
      setViewedClues(parsed.viewedClues || []);
      setActiveTab(parsed.activeTab || 'briefing');
      setDeductionLife(parsed.deductionLife !== undefined ? parsed.deductionLife : 3);
    } else {
      setActionPoints(newData.maxActionPoints || 3);
      setInventory([]);
      setViewedClues([]);
      setActiveTab('briefing');
      setDeductionLife(3);
    }

    if (newData && newData.bgmUrl) {
      changeAndPlayBgm(newData.bgmUrl);
    }
  }, [scenarioId, SAVE_KEY, changeAndPlayBgm]);
  
  // 💡 행동력이 0이 되었을 때 모달을 띄우는 로직으로 수정
  useEffect(() => {
    if (data && actionPoints <= 0 && activeTab !== 'deduction' && !showApAdModal &&
      !selectedSuspect &&
      !selectedLocation) {
      setShowApAdModal(true); // 💡 강제 이동 대신 모달 오픈
    }
  }, [actionPoints, activeTab, data, showApAdModal, selectedSuspect, selectedLocation]);

  // 💡 진입 시 전면 광고 로딩 및 송출 로직
  useEffect(() => {
    const playIntroAd = async () => {
      try {
        const adId = 'ca-app-pub-3940256099942544/1033173712'; // 💡 전면 광고 테스트 ID
        
        // 1. 광고 장전 대기
        await AdMob.prepareInterstitial({ adId });
        
        // 2. 장전 완료되면 쏘기
        await AdMob.showInterstitial();
        
      } catch (error) {
        console.log("전면 광고 호출 실패 (웹 환경이거나 로드 에러):", error);
      } finally {
        // 3. 광고를 다 봤거나 에러가 났거나, 무조건 로딩 화면을 치워줌!
        setIsAdLoading(false); 
      }
    };
    
    playIntroAd();
  }, [scenarioId]); 

  // 💡 행동력 광고 모달 뜰 때 사전 장전
  useEffect(() => {
    if (showApAdModal) {
      AdMob.prepareRewardVideoAd({ adId: 'ca-app-pub-3940256099942544/5224354917' })
        .catch(e => console.error("광고 사전 로드 실패:", e));
    }
  }, [showApAdModal]);

  // 💡 행동력 충전 완료 로직
  const handleApAdConfirm = async () => {
    setShowApAdModal(false);
    
    try {
      // await AdMob.removeAllListeners();

      // AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
      //   alert("행동력이 가득 충전되었습니다!");
      //   setActionPoints(data.maxActionPoints || 3);
      // });

      // AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
      //   AdMob.removeAllListeners();
      // });

      // await AdMob.showRewardVideoAd();

      // 💡 2. 광고 본 척하고 바로 충전시켜 버리는 프리패스 코드!
      console.log("📺 [개발용 치트키] 광고 시청 스킵");
      alert("📺 [테스트] 행동력이 가득 충전되었습니다!");
      setActionPoints(data.maxActionPoints || 3);

    } catch (error) {
      console.error("광고 재생 실패:", error);
      alert("광고를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  const handleApAdCancel = () => {
    setShowApAdModal(false);
    setSelectedSuspect(null);
    setSelectedLocation(null);
    setIsGlobalInventoryOpen(false); 
    setIsNoteOpen(false); 
    setActiveTab('deduction'); 
  };

  const clearProgress = () => {
    localStorage.removeItem(SAVE_KEY);
    onBack(); 
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

  // 💡 진입 시 보여줄 커스텀 탐정 로딩 스피너 UI
  if (isAdLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 space-y-8">
        <div className="relative w-20 h-20 flex items-center justify-center">
          {/* 흐릿한 배경 트랙 */}
          <div className="absolute inset-0 border-4 border-neutral-800 rounded-full"></div>
          {/* 빙글빙글 도는 메인 스피너 */}
          <div className="absolute inset-0 border-4 border-amber-600 rounded-full border-t-transparent animate-spin"></div>
          {/* 가운데 아이콘 */}
          <span className="text-3xl relative z-10 opacity-80 animate-pulse">🕵️‍♂️</span>
        </div>
        <div className="text-center animate-pulse">
          <h2 className="text-white font-black text-xl mb-2 tracking-widest text-shadow-md">사건 파일 동기화 중...</h2>
          <p className="text-amber-600/80 text-sm font-bold tracking-widest">기밀 데이터 접근 권한 확인</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-gray-100 flex flex-col font-sans">
      
      {/* 글로벌 수첩 플로팅 버튼 */}
      <button 
        onClick={() => { playSfx(); setIsNoteOpen(true); }}
        className="fixed top-[72px] right-4 z-[80] w-12 h-12 bg-neutral-800 border border-neutral-600 rounded-full flex items-center justify-center text-xl shadow-[0_4px_15px_rgba(0,0,0,0.5)] active:scale-90 transition-all hover:bg-neutral-700"
      >
        📓
      </button>

      <header className={`sticky top-0 z-20 border-b border-neutral-800 p-3 flex justify-between items-center gap-2 shadow-md transition-colors ${actionPoints === 0 ? 'bg-red-950' : 'bg-neutral-950'}`}>
        <button 
          onClick={() => { playSfx(); onBack(); }}
          className="text-neutral-400 hover:text-white font-bold text-sm whitespace-nowrap shrink-0"
        >
          &lt; 철수
        </button>
        
        <h1 className="text-sm font-black truncate flex-1 text-center text-white min-w-0">
          {data.title}
        </h1>
        
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => { playSfx(); onOpenSettings(); }}
            className="w-8 h-8 bg-neutral-800 rounded-full border border-neutral-600 flex items-center justify-center hover:bg-neutral-700 active:scale-95 transition-all"
          >
            <span className="text-sm">⚙️</span>
          </button>

          <button 
            onClick={() => { playSfx(); setIsGlobalInventoryOpen(true); }}
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

      <main className="flex-1 overflow-y-auto p-4 pb-24">
        
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
              onClick={() => { playSfx(); setActiveTab('interrogation'); }}
              className="w-full py-4 bg-neutral-200 text-black font-black rounded-xl hover:bg-white active:scale-95 transition-all shadow-lg mt-4"
            >
              용의자 심문 시작하기
            </button>
          </div>
        )}

        {activeTab === 'interrogation' && (
          <div className="animate-fadeIn">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="text-amber-500">💬</span> 용의자 심문
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {data.suspects.map((suspect, index) => (
                <button 
                  key={suspect.id} 
                  onClick={() => { playSfx(); setSelectedSuspect(suspect); }}
                  className="w-full bg-neutral-800 p-4 rounded-xl flex items-center gap-4 border border-neutral-700 hover:bg-neutral-700 active:scale-[0.98] transition-all"
                >
                  {/* 💡 [수정] TARGET ➔ SUSPECT 표기 변경 */}
                  <div className="w-14 h-14 shrink-0 bg-neutral-900 rounded-lg border border-neutral-600 flex flex-col items-center justify-center shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] relative overflow-hidden">
                    <div className="absolute top-0 w-full h-1 bg-amber-600/60" />
                    <span className="text-[7px] text-neutral-500 font-black tracking-widest mt-1 opacity-80">SUSPECT</span>
                    <span className="text-xl text-red-600/90 font-black tracking-tighter leading-none mt-0.5">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  
                  <div className="text-left flex-1">
                    <div className="font-bold text-white text-lg">{suspect.name}</div>
                    <div className="text-xs text-amber-500 font-bold mb-1">{suspect.role}</div>
                    {/* 💡 [수정] 옵션 A 적용: line-clamp-1 ➔ line-clamp-2로 변경하여 최대 2줄 노출 */}
                    <div className="text-xs text-neutral-400 line-clamp-2">{suspect.desc}</div>
                  </div>
                  
                  <div className="text-neutral-600 text-lg pr-1 opacity-50">&gt;</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'investigation' && (
          <div className="animate-fadeIn">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="text-blue-400">🔍</span> 현장 조사
            </h2>
            <div className="space-y-3">
              {data.locations.map(loc => (
                <button 
                  key={loc.id} 
                  onClick={() => { playSfx(); setSelectedLocation(loc); }}
                  className="w-full bg-neutral-800 p-4 rounded-xl text-left border border-neutral-700 hover:bg-neutral-700 active:scale-[0.98] transition-all flex justify-between items-center"
                >
                  <div>
                    <div className="font-bold text-white mb-1">{loc.name}</div>
                    <div className="text-xs text-neutral-400">조사 가능한 단서: {loc.clues.length}개</div>
                  </div>
                  <div className="text-neutral-500">&gt;</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'deduction' && (
          <DeductionView 
            scenarioData={data} 
            inventory={inventory}
            actionPoints={actionPoints}
            deductionLife={deductionLife} 
            onFail={() => setDeductionLife(prev => Math.max(0, prev - 1))} 
            onReset={clearProgress} 
            onAdRevive={() => setDeductionLife(1)} 
          />
        )}
      </main>

      {/* 하단 고정 탭 바 */}
      {actionPoints > 0 && (
        <nav className="fixed bottom-0 w-full bg-neutral-950 border-t border-neutral-800 flex pb-safe z-10">
          <button onClick={() => { playSfx(); setActiveTab('briefing'); }} className={`flex-1 py-4 flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'briefing' ? 'text-white bg-neutral-900' : 'text-neutral-500 hover:text-neutral-300'}`}>
              <span className="text-2xl mb-1">📋</span>
              <span className="text-[11px] font-bold tracking-wider">사건 개요</span>
          </button>
          <button onClick={() => { playSfx(); setActiveTab('interrogation'); }} className={`flex-1 py-4 flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'interrogation' ? 'text-amber-400 bg-neutral-900' : 'text-neutral-500 hover:text-neutral-300'}`}>
              <span className="text-2xl mb-1">💬</span>
              <span className="text-[11px] font-bold tracking-wider">용의자 심문</span>
          </button>
          <button onClick={() => { playSfx(); setActiveTab('investigation'); }} className={`flex-1 py-4 flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'investigation' ? 'text-blue-400 bg-neutral-900' : 'text-neutral-500 hover:text-neutral-300'}`}>
              <span className="text-2xl mb-1">🔍</span>
              <span className="text-[11px] font-bold tracking-wider">현장 조사</span>
          </button>
          <button onClick={() => { playSfx(); setActiveTab('deduction'); }} className={`flex-1 py-4 flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'deduction' ? 'text-red-500 bg-neutral-900' : 'text-neutral-500 hover:text-neutral-300'}`}>
              <span className="text-2xl mb-1">⚖️</span>
              <span className="text-[11px] font-bold tracking-wider">사건 종결</span>
          </button>
        </nav>
      )}

      {selectedSuspect && (
        <InterrogationView 
          suspect={selectedSuspect} 
          scenarioData={data}
          inventory={inventory}          
          viewedClues={viewedClues}
          actionPoints={actionPoints}
          onClueFound={handleAddClue}    
          onMarkAsViewed={markClueAsViewed}
          onRemoveClue={handleRemoveClue}
          onClose={() => setSelectedSuspect(null)} 
          onPresent={handlePresentEvidence} 
        />
      )}

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

      {isNoteOpen && (
        <div className="relative z-[110]">
          <ReasoningNoteModal onClose={() => setIsNoteOpen(false)} />
        </div>
      )}

      {/* 💡 행동력 소진 시 나타나는 광고 확인 모달 */}
      {showApAdModal && (
        <AdConfirmModal 
          type="ap" 
          onConfirm={handleApAdConfirm} 
          onCancel={handleApAdCancel} 
        />
      )}
    </div>
  );
};

export default PlayScreen;