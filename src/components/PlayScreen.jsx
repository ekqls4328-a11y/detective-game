import React, { useState, useEffect, useRef } from 'react';
import { Joyride } from 'react-joyride'; 
import InterrogationView from './InterrogationView';
import DeductionView from './DeductionView';
import InventoryModal from './InventoryModal';
import LocationModal from './LocationModal';
import ReasoningNoteModal from './ReasoningNoteModal'; 
import { useAudio } from '../contexts/AudioContext'; 
import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob';
import { App as CapacitorApp } from '@capacitor/app';

import wedding_murder from '../data/wedding_murder.json';
import apartment_murder from '../data/apartment_murder.json';
import camping_murder from '../data/camping_murder.json';
import broadcast_murder from '../data/broadcast_murder.json';
import themepark_murder from '../data/themepark_murder.json';
import hospital_murder from '../data/hospital_murder.json';
import dormitory_murder from '../data/dormitory_murder.json';
import old_cinema_murder from '../data/old_cinema_murder.json';
import AdConfirmModal from './AdConfirmModal';

const scenarioDB = {
  "wedding_murder": wedding_murder,
  "apartment_murder": apartment_murder,
  "camping_murder": camping_murder,
  "broadcast_murder": broadcast_murder,
  "themepark_murder": themepark_murder,
  "hospital_murder": hospital_murder,
  "dormitory_murder": dormitory_murder,
  "old_cinema_murder": old_cinema_murder
};

// ⭐ [가이드 추가] 툴팁 전체 단계 수를 6 -> 7로 변경
const CustomTooltip = ({
  index, step, backProps, closeProps, primaryProps, tooltipProps, isLastStep,
}) => (
  <div {...tooltipProps} className="bg-neutral-900 border border-neutral-700 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] p-5 max-w-[320px] w-full font-sans">
    <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-3">
      <span className="text-amber-500 font-black text-[11px] tracking-widest">
        [ 시스템 가이드 {index + 1} / 7 ]
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
          <button {...backProps} className="px-3 py-2 text-xs font-bold text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors border border-neutral-700 active:scale-95">
            &lt; 이전
          </button>
        )}
      </div>
      <button {...primaryProps} className="px-5 py-2 text-xs font-black text-black bg-amber-500 hover:bg-amber-400 rounded-lg transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] active:scale-95">
        {isLastStep ? '수사 시작하기' : '다음 단계 >'}
      </button>
    </div>
  </div>
);

const PlayScreen = ({ scenarioId, onBack, onOpenSettings, isTruthMode }) => {
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
  
  const [activeTab, setActiveTab] = useState(() => {
    if (isTruthMode) return 'deduction';
    return getInitialState('activeTab', 'briefing');
  }); 

  const [actionPoints, setActionPoints] = useState(() => getInitialState('actionPoints', defaultAP));
  const [inventory, setInventory] = useState(() => getInitialState('inventory', []));
  const [viewedClues, setViewedClues] = useState(() => getInitialState('viewedClues', []));
  const [deductionLife, setDeductionLife] = useState(() => getInitialState('deductionLife', 2));

  const [selectedSuspect, setSelectedSuspect] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isGlobalInventoryOpen, setIsGlobalInventoryOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [showApAdModal, setShowApAdModal] = useState(false); 
  const [isCaseSolved, setIsCaseSolved] = useState(false); 

  // ⭐ [수정됨] isAdLoading 불리언을 loadingType('scenario' | 'ad' | null)으로 변경
  const [loadingType, setLoadingType] = useState('scenario');

  // ⭐ [새로 추가된 관계도 로직] 어떤 인물이 선택되었는지 기억하는 State
  const [selectedRelationId, setSelectedRelationId] = useState(null);

  // ⭐ 철수 방어 모달 State
  const [showExitModal, setShowExitModal] = useState(false);

  const scrollRef = useRef(null);

  const [tourRun, setTourRun] = useState(false);
  const [tourSteps] = useState([
    { target: 'body', content: '🕵️‍♂️ 탐정님, 사건 현장에 오신 것을 환영합니다! [다음]을 눌러 기본 사용법을 숙지하세요.', placement: 'center', disableBeacon: true },
    { target: '.tutorial-tab-interrogation', content: '💬 용의자 심문 탭입니다. 사건 관계자들의 알리바이를 캐내고 진술 단서를 획득하세요.', placement: 'top', disableBeacon: true },
    { target: '.tutorial-tab-relationship', content: '🕸️ 인물 관계망 탭입니다. 용의자들이 서로를 어떻게 생각하는지 파악하여 범행 동기를 추론하세요.', placement: 'top', disableBeacon: true },
    { target: '.tutorial-tab-investigation', content: '🔍 현장 조사 탭입니다. 사건 현장을 수색하여 물증과 증거를 찾아낼 수 있습니다.', placement: 'top', disableBeacon: true },
    { target: '.tutorial-tab-deduction', content: '⚖️ 사건 종결 탭입니다. 단서가 모두 모였다면 정확한 범인과 흉기를 지목하세요.', placement: 'top', disableBeacon: true },
    { target: '.tutorial-icon-inventory', content: '💼 단서함 가방입니다. 수집한 모든 진술과 물증 리스트를 한눈에 모아볼 수 있습니다.', placement: 'bottom', disableBeacon: true },
    { target: '.tutorial-icon-note', content: '📓 추리 노트입니다. 수사 과정에서 필요한 단서들을 자유롭게 메모해 두세요.', placement: 'left', disableBeacon: true }
  ]);

  const { changeAndPlayBgm, playSfx } = useAudio(); 
  
  const unreadCount = inventory.filter(id => !viewedClues.includes(id)).length;

  const AD_LIMIT_KEY = 'crime_game_ad_watch_data';
  const MAX_AD_PER_DAY = 3;

  const checkAdLimit = () => {
    const today = new Date().toLocaleDateString('ko-KR'); 
    const savedData = JSON.parse(localStorage.getItem(AD_LIMIT_KEY) || '{"date": "", "count": 0}');

    if (savedData.date !== today) {
      return { date: today, count: 0, canWatch: true };
    }
    return { ...savedData, canWatch: savedData.count < MAX_AD_PER_DAY };
  };

  useEffect(() => {
    const isTutorialCleared = localStorage.getItem(TUTORIAL_KEY) === 'true';
    if (!isTutorialCleared) {
      setTimeout(() => {
        setTourRun(true); 
        localStorage.setItem(TUTORIAL_KEY, 'true'); 
      }, 600); 
    }
  }, []);

  useEffect(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant' 
      });
    }, 10); 
  }, [activeTab]);

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
        } else if (showExitModal) {
          setShowExitModal(false);
        } else {
          // ⭐ 바로 나가는 대신 모달을 띄움
          setShowExitModal(true);
        }
      });
    };
    setupBackButton();
    return () => {
      if (backButtonListener) backButtonListener.remove();
    };
  }, [selectedSuspect, selectedLocation, isGlobalInventoryOpen, isNoteOpen, showApAdModal, showExitModal, onBack]);

  useEffect(() => {
    const gameState = { activeTab, actionPoints, inventory, viewedClues, deductionLife };
    localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
  }, [activeTab, actionPoints, inventory, viewedClues, deductionLife, SAVE_KEY]);

  useEffect(() => {
    const newData = scenarioDB[scenarioId];
    setData(newData);
    const saved = localStorage.getItem(SAVE_KEY);
    
    if (newData.victim) {
      setSelectedRelationId(newData.victim.id);
    } else if (newData.suspects && newData.suspects.length > 0) {
      setSelectedRelationId(newData.suspects[0].id);
    }

    if (saved) {
      const parsed = JSON.parse(saved);
      setActionPoints(parsed.actionPoints !== undefined ? parsed.actionPoints : (newData.maxActionPoints || 3));
      setInventory(parsed.inventory || []);
      setViewedClues(parsed.viewedClues || []);
      setDeductionLife(parsed.deductionLife !== undefined ? parsed.deductionLife : 2);
      setActiveTab(isTruthMode ? 'deduction' : (parsed.activeTab || 'briefing'));
    } else {
      setActionPoints(newData.maxActionPoints || 3);
      setInventory([]);
      setViewedClues([]);
      setActiveTab(isTruthMode ? 'deduction' : 'briefing');
      setDeductionLife(2);
    }

    if (newData && newData.bgmUrl) {
      changeAndPlayBgm(newData.bgmUrl);
    }
  }, [scenarioId, SAVE_KEY, changeAndPlayBgm, isTruthMode]);
  
  useEffect(() => {
    if (data && actionPoints <= 0 && activeTab !== 'deduction' && !showApAdModal && !selectedSuspect && !selectedLocation) {
      const adStatus = checkAdLimit();
      
      if (adStatus.canWatch) {
        setShowApAdModal(true); 
      } else {
        alert("오늘의 수사 지원(행동력 충전)을 모두 소진했습니다. 현재까지 수집한 단서만으로 사건을 종결해야 합니다.");
        setActiveTab('deduction'); 
      }
    }
  }, [actionPoints, activeTab, data, showApAdModal, selectedSuspect, selectedLocation]);

  useEffect(() => {
    const playIntroAd = async () => {
      if (isTruthMode) {
        setLoadingType(null);
        return; 
      }
      try {
        const adId = 'ca-app-pub-2340338162252761/9054708020'; 
        await AdMob.prepareInterstitial({ adId });
        await AdMob.showInterstitial();
      } catch (error) {
        console.log("전면 광고 호출 실패:", error);
      } finally {
        setLoadingType(null); 
      }
    };
    playIntroAd();
  }, [scenarioId, isTruthMode]); 

  // ⭐ [수정됨] 행동력 광고 팝업 로직 완벽 분리
  const handleApAdConfirm = async () => {
    // 여기서 모달 안 끔! 
    setLoadingType('ad');

    try {
      await AdMob.prepareRewardVideoAd({
        adId: 'ca-app-pub-2340338162252761/7588593433', 
        isTesting: false 
      });

      const rewardListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
        const adStatus = checkAdLimit();
        localStorage.setItem(AD_LIMIT_KEY, JSON.stringify({ 
          date: adStatus.date, 
          count: adStatus.count + 1 
        }));
        const rechargeAmount = Math.ceil((data.maxActionPoints || 3) / 2); 
        
        // ⭐ 보상 받을 때 행동력 채우고 팝업 끄기
        setActionPoints(rechargeAmount);
        setShowApAdModal(false); 
      });

      const dismissListener = await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        // ⭐ 중간에 껐을 때도 팝업 끄기
        setShowApAdModal(false); 
        rewardListener.remove();
        dismissListener.remove();
      });
      
      setLoadingType(null); // 로딩 화면 끄기
      await AdMob.showRewardVideoAd();

    } catch (error) {
      console.error('광고 호출 실패:', error);
      setLoadingType(null);
      setShowApAdModal(false); // 에러 시에도 팝업 끄기
      alert("외부 통신망과 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
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

  const handlePresentEvidence = () => setActionPoints((prev) => Math.max(0, prev - 1));
  const handleScanArea = () => setActionPoints(prev => Math.max(0, prev - 3));
  const handleAddClue = (clueId) => {
    if (!inventory.includes(clueId)) {
      setInventory(prev => [...prev, clueId]);        
      setActionPoints(ap => Math.max(0, ap - 1));     
    }
  };
  const handleRemoveClue = (clueId) => setInventory((prev) => prev.filter(id => id !== clueId));
  const markClueAsViewed = (clueId) => setViewedClues(prev => prev.includes(clueId) ? prev : [...prev, clueId]);

  // ⭐ [수정됨] 조건부 로딩 화면 렌더링
  if (loadingType) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 space-y-8">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 border-4 border-neutral-800 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-amber-600 rounded-full border-t-transparent animate-spin"></div>
          <span className="text-3xl relative z-10 opacity-80 animate-pulse">
            {loadingType === 'ad' ? '📡' : '🕵️‍♂️'}
          </span>
        </div>
        <div className="text-center animate-pulse">
          <h2 className="text-white font-black text-xl mb-2 tracking-widest text-shadow-md">
            {loadingType === 'ad' ? '외부 통신망 연결 중...' : '사건 파일 동기화 중...'}
          </h2>
          <p className="text-amber-600/80 text-sm font-bold tracking-widest">
            {loadingType === 'ad' ? '수사 지원(행동력)을 요청하고 있습니다' : '기밀 데이터 접근 권한 확인'}
          </p>
        </div>
      </div>
    );
  }

  const allCharacters = [data.victim, ...(data.suspects || [])].filter(Boolean);

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
          options: { zIndex: 10000, overlayColor: 'rgba(0, 0, 0, 0.85)' }
        }}
      />

      <button 
        onClick={() => { playSfx(); setIsNoteOpen(true); }}
        className="tutorial-icon-note fixed top-[72px] right-4 z-[80] w-12 h-12 bg-neutral-800 border border-neutral-600 rounded-full flex items-center justify-center text-xl shadow-[0_4px_15px_rgba(0,0,0,0.5)] active:scale-90 transition-all hover:bg-neutral-700"
      >
        📓
      </button>

      <header className={`sticky top-0 z-20 border-b border-neutral-800 p-3 flex justify-between items-center gap-2 shadow-md transition-colors ${actionPoints === 0 ? 'bg-red-955' : 'bg-neutral-950'}`}>
        <button onClick={() => { playSfx(); setShowExitModal(true); }} className="text-neutral-400 hover:text-white font-bold text-sm whitespace-nowrap shrink-0">&lt; 철수</button>
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

      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 pb-24">
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
                    <div className="text-xs text-neutral-400 leading-relaxed break-keep mt-1">{suspect.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'relationship' && (
          <div className="animate-fadeIn">
            <h2 className="text-xl font-bold mb-6">🕸️ 인물 관계망</h2>
            <div className="flex flex-wrap gap-2 mb-8 bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
              {data.suspects.map(person => (
                <button
                  key={person.id}
                  onClick={() => { playSfx(); setSelectedRelationId(person.id); }}
                  className={`px-4 py-2 rounded-full border text-sm font-bold transition-all active:scale-95 ${
                    selectedRelationId === person.id 
                      ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]' 
                      : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  {person.name}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div className="text-xs text-neutral-500 font-bold mb-4 px-1">
                해당 인물이 다른 사람들을 어떻게 생각하는지 보여줍니다.
              </div>
              
              {(() => {
                const selectedPerson = data.suspects.find(s => s.id === selectedRelationId);
                
                if (!selectedPerson || !selectedPerson.relations || selectedPerson.relations.length === 0) {
                  return (
                    <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-xl text-center flex flex-col items-center justify-center">
                      <span className="text-2xl mb-2 opacity-30">😶</span>
                      <div className="text-neutral-500 text-sm font-bold">기록된 인물 관계가 없습니다.</div>
                    </div>
                  );
                }

                return selectedPerson.relations.map((rel) => {
                  const targetPerson = allCharacters.find(p => p.id === rel.targetId);
                  if (!targetPerson) return null;

                  return (
                    <div key={rel.targetId} className="bg-neutral-800 p-4 rounded-xl border border-neutral-700">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-block px-2 py-0.5 bg-purple-900/60 text-purple-300 text-[11px] font-black rounded border border-purple-800/50">
                          {targetPerson.name}
                        </span>
                        <span className="text-neutral-400 text-xs font-bold">에 대한 생각</span>
                      </div>
                      <div className="text-white text-sm font-bold leading-relaxed">"{rel.summary}"</div>
                      {rel.desc && <div className="text-neutral-400 text-xs mt-1.5 leading-relaxed">{rel.desc}</div>}
                    </div>
                  );
                });
              })()}
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
          <DeductionView isTruthMode={isTruthMode} scenarioData={data} inventory={inventory} actionPoints={actionPoints} deductionLife={deductionLife} onFail={() => setDeductionLife(prev => Math.max(0, prev - 1))} onReset={clearProgress} onAdRevive={() => setDeductionLife(1)} onSuccess={() => setIsCaseSolved(true)} />
        )}
      </main>
      
      {/* ⭐ 철수 확인 모달 (자동 저장 안내로 수정) */}
      {showExitModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-fadeIn">
            <div className="flex flex-col items-center text-center">
              <span className="text-4xl mb-4">🚨</span>
              <h3 className="text-xl font-black text-white mb-2">현장에서 철수하시겠습니까?</h3>
              <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                지금 철수하더라도 <span className="text-amber-500 font-bold">현재까지의 수사 기록은 자동으로 저장</span>됩니다.<br/>언제든 다시 이어서 수사할 수 있습니다.
              </p>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setShowExitModal(false)}
                  className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-colors border border-neutral-600"
                >
                  수사 계속하기
                </button>
                <button 
                  // ⭐ clearProgress() 삭제! 세이브 데이터 유지하고 뒤로가기만 실행
                  onClick={() => { playSfx(); setShowExitModal(false); onBack(); }}
                  className="flex-1 py-3 bg-red-600/20 hover:bg-red-600/40 text-red-500 font-bold rounded-xl transition-colors border border-red-900/50"
                >
                  철수하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {actionPoints > 0 && !isCaseSolved && (
        <nav className="fixed bottom-0 w-full bg-neutral-950 border-t border-neutral-800 flex pb-safe z-10">
          <button onClick={() => { playSfx(); setActiveTab('briefing'); }} className={`flex-1 py-4 flex flex-col items-center justify-center transition-colors ${activeTab === 'briefing' ? 'text-white bg-neutral-900' : 'text-neutral-500'}`}>
              <span className="text-xl mb-1">📋</span><span className="text-[10px] font-bold">사건 개요</span>
          </button>
          
          <button onClick={() => { playSfx(); setActiveTab('interrogation'); }} className={`tutorial-tab-interrogation flex-1 py-4 flex flex-col items-center justify-center transition-colors ${activeTab === 'interrogation' ? 'text-amber-400 bg-neutral-900' : 'text-neutral-500'}`}>
              <span className="text-xl mb-1">💬</span><span className="text-[10px] font-bold">심문</span>
          </button>

          <button onClick={() => { playSfx(); setActiveTab('relationship'); }} className={`tutorial-tab-relationship flex-1 py-4 flex flex-col items-center justify-center transition-colors ${activeTab === 'relationship' ? 'text-purple-400 bg-neutral-900' : 'text-neutral-500'}`}>
              <span className="text-xl mb-1">🕸️</span><span className="text-[10px] font-bold">인물 관계</span>
          </button>

          <button onClick={() => { playSfx(); setActiveTab('investigation'); }} className={`tutorial-tab-investigation flex-1 py-4 flex flex-col items-center justify-center transition-colors ${activeTab === 'investigation' ? 'text-blue-400 bg-neutral-900' : 'text-neutral-500'}`}>
              <span className="text-xl mb-1">🔍</span><span className="text-[10px] font-bold">조사</span>
          </button>
          
          <button onClick={() => { playSfx(); setActiveTab('deduction'); }} className={`tutorial-tab-deduction flex-1 py-4 flex flex-col items-center justify-center transition-colors ${activeTab === 'deduction' ? 'text-red-500 bg-neutral-900' : 'text-neutral-500'}`}>
              <span className="text-xl mb-1">⚖️</span><span className="text-[10px] font-bold">종결</span>
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