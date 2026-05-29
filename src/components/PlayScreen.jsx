import React, { useState, useEffect } from 'react';
import { Joyride } from 'react-joyride'; 
import InterrogationView from './InterrogationView';
import DeductionView from './DeductionView';
import InventoryModal from './InventoryModal';
import LocationModal from './LocationModal';
import ReasoningNoteModal from './ReasoningNoteModal'; 
import { useAudio } from '../contexts/AudioContext'; 
import { AdMob } from '@capacitor-community/admob';
import { App as CapacitorApp } from '@capacitor/app';
import wedding_murder from '../data/wedding_murder.json';
import apartment_murder from '../data/apartment_murder.json';
import camping_murder from '../data/camping_murder.json';
import broadcast_murder from '../data/broadcast_murder.json';
import AdConfirmModal from './AdConfirmModal';

const scenarioDB = {
  "wedding_murder": wedding_murder,
  "apartment_murder": apartment_murder,
  "camping_murder": camping_murder,
  "broadcast_murder": broadcast_murder
};

// 💡 추리 게임 감성에 맞춘 커스텀 툴팁 컴포넌트
const CustomTooltip = ({
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  isLastStep,
}) => (
  <div
    {...tooltipProps}
    className="bg-neutral-900 border border-neutral-700 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] p-5 max-w-[320px] w-full font-sans"
  >
    <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-3">
      <span className="text-amber-500 font-black text-[11px] tracking-widest">
        [ 시스템 가이드 {index + 1} / 6 ]
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
        {isLastStep ? '수사 시작하기' : '다음 단계 >'}
      </button>
    </div>
  </div>
);

const PlayScreen = ({ scenarioId, onBack, onOpenSettings }) => {
  const SAVE_KEY = `crime_game_progress_${scenarioId}`;
  const TUTORIAL_KEY = `crime_game_tutorial_cleared`;

  const currentScenarioData = scenarioDB[scenarioId];

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
  
  const [showApAdModal, setShowApAdModal] = useState(false); 
  const [isAdLoading, setIsAdLoading] = useState(true); 
  const [isCaseSolved, setIsCaseSolved] = useState(false); 

  const [tourRun, setTourRun] = useState(false);

  const [tourSteps] = useState([
    {
      target: 'body', 
      content: '🕵️‍♂️ 탐정님, 사건 현장에 오신 것을 환영합니다! [다음]을 눌러 기본 사용법을 숙지하세요.',
      placement: 'center', 
      disableBeacon: true, 
    },
    {
      target: '.tutorial-tab-interrogation',
      content: '💬 용의자 심문 탭입니다. 사건 관계자들의 알리바이를 캐내고 진술 단서를 획득하세요.',
      placement: 'top',
      disableBeacon: true,
    },
    {
      target: '.tutorial-tab-investigation',
      content: '🔍 현장 조사 탭입니다. 사건 현장을 수색하여 물증과 증거를 찾아낼 수 있습니다.',
      placement: 'top',
      disableBeacon: true,
    },
    {
      target: '.tutorial-tab-deduction',
      content: '⚖️ 사건 종결 탭입니다. 단서가 모두 모였다면 정확한 범인과 흉기를 지목하세요.',
      placement: 'top',
      disableBeacon: true,
    },
    {
      target: '.tutorial-icon-inventory', 
      content: '💼 단서함 가방입니다. 수집한 모든 진술과 물증 리스트를 한눈에 모아볼 수 있습니다.',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '.tutorial-icon-note', 
      content: '📓 추리 노트입니다. 수사 과정에서 필요한 단서들을 자유롭게 메모해 두세요.',
      placement: 'left',
      disableBeacon: true,
    }
  ]);

  const { changeAndPlayBgm, playSfx } = useAudio(); 
  const unreadCount = inventory.filter(id => !viewedClues.includes(id)).length;

  // 💡 하루 광고 시청 제한 로직
  const AD_LIMIT_KEY = 'crime_game_ad_watch_data';
  const MAX_AD_PER_DAY = 3;

  const checkAdLimit = () => {
    // 한국 시간 기준 날짜 문자열 (예: "2026. 5. 30.")
    const today = new Date().toLocaleDateString('ko-KR'); 
    const savedData = JSON.parse(localStorage.getItem(AD_LIMIT_KEY) || '{"date": "", "count": 0}');

    if (savedData.date !== today) {
      return { date: today, count: 0, canWatch: true };
    }
    return { ...savedData, canWatch: savedData.count < MAX_AD_PER_DAY };
  };

  // 💡 [핵심 로직] 라이브러리 콜백을 믿지 않고, 가이드가 시작되는 즉시 "선불"로 도장 쾅!
  useEffect(() => {
    const isTutorialCleared = localStorage.getItem(TUTORIAL_KEY) === 'true';
    
    if (!isTutorialCleared) {
      setTimeout(() => {
        setTourRun(true); // 가이드 시작
        localStorage.setItem(TUTORIAL_KEY, 'true'); // 시작하자마자 무조건 완료 처리!
      }, 600); 
    }
  }, []);

  // 💡 이미 시작할 때 저장했으므로, 여기선 그냥 화면(UI)만 닫아주면 끝남!
  const handleJoyrideCallback = (data) => {
    const { status, action } = data;
    if (['finished', 'skipped'].includes(status) || action === 'close') {
      setTourRun(false); 
    } 
  };

  useEffect(() => {
    let backButtonListener;
    const setupBackButton = async () => {
      backButtonListener = await CapacitorApp.addListener('backButton', () => {
        if (selectedSuspect) {
          setSelectedSuspect(null);
        } else if (selectedLocation) {
          setSelectedLocation(null);
        } else if (isGlobalInventoryOpen) {
          setIsGlobalInventoryOpen(false);
        } else if (isNoteOpen) {
          setIsNoteOpen(false);
        } else if (showApAdModal) {
          setShowApAdModal(false);
        } else {
          onBack();
        }
      });
    };
    setupBackButton();
    return () => {
      if (backButtonListener) backButtonListener.remove();
    };
  }, [selectedSuspect, selectedLocation, isGlobalInventoryOpen, isNoteOpen, showApAdModal, onBack]);

  useEffect(() => {
    const gameState = { activeTab, actionPoints, inventory, viewedClues, deductionLife };
    localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
  }, [activeTab, actionPoints, inventory, viewedClues, deductionLife, SAVE_KEY]);

  useEffect(() => {
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
  
  // 💡 행동력 0 도달 시 광고 모달 호출 or 강제 사건 종결 유도
  useEffect(() => {
    if (data && actionPoints <= 0 && activeTab !== 'deduction' && !showApAdModal && !selectedSuspect && !selectedLocation) {
      const adStatus = checkAdLimit();
      
      if (adStatus.canWatch) {
        setShowApAdModal(true); // 3번 미만이면 광고 모달 띄움
      } else {
        // 하루 3번 다 본 경우 방어 로직
        alert("오늘의 수사 지원(행동력 충전)을 모두 소진했습니다. 현재까지 수집한 단서만으로 사건을 종결해야 합니다.");
        setActiveTab('deduction'); // 사건 종결 탭으로 강제 이동
      }
    }
  }, [actionPoints, activeTab, data, showApAdModal, selectedSuspect, selectedLocation]);

  useEffect(() => {
    const playIntroAd = async () => {
      try {
        const adId = 'ca-app-pub-3940256099942544/1033173712';
        await AdMob.prepareInterstitial({ adId });
        await AdMob.showInterstitial();
      } catch (error) {
        console.log("전면 광고 호출 실패:", error);
      } finally {
        setIsAdLoading(false); 
      }
    };
    playIntroAd();
  }, [scenarioId]); 

  // 💡 광고 시청 완료 시 실행되는 함수
  const handleApAdConfirm = async () => {
    setShowApAdModal(false);
    
    // 1. 광고 시청 횟수 증가 및 로컬 스토리지 업데이트
    const adStatus = checkAdLimit();
    localStorage.setItem(AD_LIMIT_KEY, JSON.stringify({ 
      date: adStatus.date, 
      count: adStatus.count + 1 
    }));

    // 2. 최대 행동력의 50%만 충전 (소수점 올림)
    const rechargeAmount = Math.ceil((data.maxActionPoints || 3) / 2); 
    
    alert(`⚡ 행동력이 ${rechargeAmount} 충전되었습니다! (오늘 충전 ${adStatus.count + 1}/${MAX_AD_PER_DAY}회)`);
    setActionPoints(rechargeAmount);
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

  const handlePresentEvidence = () => setActionPoints((prev) => Math.max(0, prev - 1));
  const handleScanArea = () => setActionPoints(prev => Math.max(0, prev - 3));
  const handleAddClue = (clueId) => {
    // 💡 이미 인벤토리에 있는 단서인지 먼저 바깥에서 안전하게 체크!
    if (!inventory.includes(clueId)) {
      setInventory(prev => [...prev, clueId]);        // 단서 추가
      setActionPoints(ap => Math.max(0, ap - 1));     // 행동력 1 차감
    }
  };
  const handleRemoveClue = (clueId) => setInventory((prev) => prev.filter(id => id !== clueId));
  const markClueAsViewed = (clueId) => setViewedClues(prev => prev.includes(clueId) ? prev : [...prev, clueId]);

  if (!data) return <div className="text-white p-10 text-center">Loading...</div>;

  if (isAdLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 space-y-8">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 border-4 border-neutral-800 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-amber-600 rounded-full border-t-transparent animate-spin"></div>
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
      
      <Joyride
        steps={tourSteps}
        run={tourRun}
        continuous={true}
        showSkipButton={true}
        disableOverlayClose={true}
        disableScrolling={true} 
        floaterProps={{ disableAnimation: true }}
        callback={handleJoyrideCallback}
        hideBackButton={true}
        tooltipComponent={CustomTooltip} 
        styles={{
          options: {
            zIndex: 10000,
            overlayColor: 'rgba(0, 0, 0, 0.85)',
          }
        }}
      />

      <button 
        onClick={() => { playSfx(); setIsNoteOpen(true); }}
        className="tutorial-icon-note fixed top-[72px] right-4 z-[80] w-12 h-12 bg-neutral-800 border border-neutral-600 rounded-full flex items-center justify-center text-xl shadow-[0_4px_15px_rgba(0,0,0,0.5)] active:scale-90 transition-all hover:bg-neutral-700"
      >
        📓
      </button>

      <header className={`sticky top-0 z-20 border-b border-neutral-800 p-3 flex justify-between items-center gap-2 shadow-md transition-colors ${actionPoints === 0 ? 'bg-red-955' : 'bg-neutral-950'}`}>
        <button onClick={() => { playSfx(); onBack(); }} className="text-neutral-400 hover:text-white font-bold text-sm whitespace-nowrap shrink-0">&lt; 철수</button>
        <h1 className="text-sm font-black truncate flex-1 text-center text-white min-w-0">{data.title}</h1>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => { playSfx(); onOpenSettings(); }} className="w-8 h-8 bg-neutral-800 rounded-full border border-neutral-600 flex items-center justify-center hover:bg-neutral-700"><span className="text-sm">⚙️</span></button>
          
          <button onClick={() => { playSfx(); setIsGlobalInventoryOpen(true); }} className="tutorial-icon-inventory relative w-8 h-8 bg-neutral-800 rounded-full border border-neutral-600 flex items-center justify-center">
            <span className="text-sm">💼</span>
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center animate-bounce">{unreadCount}</span>}
          </button>
          
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full border ${actionPoints <= 1 ? 'bg-red-900/50 border-red-500 text-red-400' : 'bg-neutral-800 border-neutral-700 text-neutral-300'}`}>
            <span className="text-xs">⚡</span>
            <span className="text-[11px] font-black tracking-widest">{actionPoints} / {data.maxActionPoints || 3}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {activeTab === 'briefing' && (
          <div className="animate-fadeIn space-y-6">
            <div className="w-full h-48 bg-neutral-800 rounded-xl overflow-hidden border border-neutral-700 relative">
              {data.briefingImageUrl ? <img src={data.briefingImageUrl} alt="사건 현장" className="w-full h-full object-cover opacity-80" /> : <div className="w-full h-full flex items-center justify-center text-neutral-600 font-bold">이미지 준비 중</div>}
            </div>
            <div>
              <h2 className="text-2xl font-black text-white mb-2">{data.title}</h2>
              <p className="text-red-400 font-bold text-sm mb-4">{data.summary}</p>
            </div>
            <div className="bg-neutral-800 p-5 rounded-xl border border-neutral-700">
              <h3 className="text-sm font-bold text-neutral-400 mb-3">📋 사건 보고서</h3>
              <p className="text-sm text-neutral-200 leading-loose whitespace-pre-wrap">{data.desc}</p>
            </div>
            <button onClick={() => { playSfx(); setActiveTab('interrogation'); }} className="w-full py-4 bg-neutral-200 text-black font-black rounded-xl shadow-lg mt-4">용의자 심문 시작하기</button>
          </div>
        )}

        {activeTab === 'interrogation' && (
          <div className="animate-fadeIn">
            <h2 className="text-xl font-bold mb-6">💬 용의자 심문</h2>
            <div className="grid grid-cols-1 gap-3">
              {data.suspects.map((suspect, index) => (
                <button key={suspect.id} onClick={() => { playSfx(); setSelectedSuspect(suspect); }} className="w-full bg-neutral-800 p-4 rounded-xl flex items-center gap-4 border border-neutral-700">
                  <div className="w-14 h-14 shrink-0 bg-neutral-900 rounded-lg border border-neutral-600 flex flex-col items-center justify-center relative overflow-hidden">
                    <span className="text-[7px] text-neutral-500 font-black mt-1">SUSPECT</span>
                    <span className="text-xl text-red-600/90 font-black mt-0.5">{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-white text-lg">{suspect.name}</div>
                    <div className="text-xs text-amber-500 font-bold mb-1">{suspect.role}</div>
                    <div className="text-xs text-neutral-400 line-clamp-2">{suspect.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'investigation' && (
          <div className="animate-fadeIn">
            <h2 className="text-xl font-bold mb-6">🔍 현장 조사</h2>
            <div className="space-y-3">
              {data.locations.map(loc => (
                <button key={loc.id} onClick={() => { playSfx(); setSelectedLocation(loc); }} className="w-full bg-neutral-800 p-4 rounded-xl text-left border border-neutral-700 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-white mb-1">{loc.name}</div>
                    <div className="text-xs text-neutral-400">조사 가능한 단서: {loc.clues.length}개</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'deduction' && (
          <DeductionView scenarioData={data} inventory={inventory} actionPoints={actionPoints} deductionLife={deductionLife} onFail={() => setDeductionLife(prev => Math.max(0, prev - 1))} onReset={clearProgress} onAdRevive={() => setDeductionLife(1)} onSuccess={() => setIsCaseSolved(true)} />
        )}
      </main>

      {actionPoints > 0 && !isCaseSolved && (
        <nav className="fixed bottom-0 w-full bg-neutral-950 border-t border-neutral-800 flex pb-safe z-10">
          <button onClick={() => { playSfx(); setActiveTab('briefing'); }} className={`flex-1 py-4 flex flex-col items-center justify-center transition-colors ${activeTab === 'briefing' ? 'text-white bg-neutral-900' : 'text-neutral-500'}`}>
              <span className="text-2xl mb-1">📋</span><span className="text-[11px] font-bold">사건 개요</span>
          </button>
          
          <button onClick={() => { playSfx(); setActiveTab('interrogation'); }} className={`tutorial-tab-interrogation flex-1 py-4 flex flex-col items-center justify-center transition-colors ${activeTab === 'interrogation' ? 'text-amber-400 bg-neutral-900' : 'text-neutral-500'}`}>
              <span className="text-2xl mb-1">💬</span><span className="text-[11px] font-bold">용의자 심문</span>
          </button>
          <button onClick={() => { playSfx(); setActiveTab('investigation'); }} className={`tutorial-tab-investigation flex-1 py-4 flex flex-col items-center justify-center transition-colors ${activeTab === 'investigation' ? 'text-blue-400 bg-neutral-900' : 'text-neutral-500'}`}>
              <span className="text-2xl mb-1">🔍</span><span className="text-[11px] font-bold">현장 조사</span>
          </button>
          <button onClick={() => { playSfx(); setActiveTab('deduction'); }} className={`tutorial-tab-deduction flex-1 py-4 flex flex-col items-center justify-center transition-colors ${activeTab === 'deduction' ? 'text-red-500 bg-neutral-900' : 'text-neutral-500'}`}>
              <span className="text-2xl mb-1">⚖️</span><span className="text-[11px] font-bold">사건 종결</span>
          </button>
        </nav>
      )}

      {selectedSuspect && <InterrogationView suspect={selectedSuspect} scenarioData={data} inventory={inventory} viewedClues={viewedClues} actionPoints={actionPoints} onClueFound={handleAddClue} onMarkAsViewed={markClueAsViewed} onRemoveClue={handleRemoveClue} onClose={() => setSelectedSuspect(null)} onPresent={handlePresentEvidence} />}
      {isGlobalInventoryOpen && <InventoryModal inventory={inventory} viewedClues={viewedClues} onMarkAsViewed={markClueAsViewed} scenarioData={data} onRemoveClue={handleRemoveClue} onClose={() => setIsGlobalInventoryOpen(false)} />}
      {selectedLocation && <LocationModal location={selectedLocation} inventory={inventory} maxActionPoints={data.maxActionPoints} actionPoints={actionPoints} onClueFound={handleAddClue} onScan={handleScanArea} onClose={() => setSelectedLocation(null)} />}
      {isNoteOpen && <div className="relative z-[110]"><ReasoningNoteModal onClose={() => setIsNoteOpen(false)} /></div>}
      {showApAdModal && <AdConfirmModal type="ap" onConfirm={handleApAdConfirm} onCancel={handleApAdCancel} />}
    </div>
  );
};

export default PlayScreen;