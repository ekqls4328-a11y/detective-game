import React, { useState, useEffect } from 'react';
import { Joyride } from 'react-joyride'; 
import InterrogationView from './InterrogationView';
import DeductionView from './DeductionView';
import InventoryModal from './InventoryModal';
import LocationModal from './LocationModal';
import ReasoningNoteModal from './ReasoningNoteModal'; 
import { useAudio } from '../contexts/AudioContext'; 
import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob';
import { App as CapacitorApp } from '@capacitor/app';

// 💡 1. 시나리오 데이터 임포트 및 매핑 객체
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

// 💡 2. 튜토리얼(Joyride)용 커스텀 툴팁 UI
// 기본 제공 툴팁 대신 우리 게임의 다크/미스터리 테마에 맞게 깎은 UI 컴포넌트야.
const CustomTooltip = ({
  index, step, backProps, closeProps, primaryProps, tooltipProps, isLastStep,
}) => (
  <div {...tooltipProps} className="bg-neutral-900 border border-neutral-700 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] p-5 max-w-[320px] w-full font-sans">
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

// 💡 3. 메인 플레이 스크린 컴포넌트 시작
const PlayScreen = ({ scenarioId, onBack, onOpenSettings, isTruthMode }) => {
  // 로컬 스토리지에 저장할 때 쓸 고유 키값들
  const SAVE_KEY = `crime_game_progress_${scenarioId}`;
  const TUTORIAL_KEY = `crime_game_tutorial_cleared`;

  const currentScenarioData = scenarioDB[scenarioId];

  // 방어 코드: 없는 시나리오 ID가 들어왔을 때 튕기지 않도록 처리
  if (!currentScenarioData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        해당 시나리오({scenarioId}) 데이터를 찾을 수 없습니다.
      </div>
    );
  }

  // 💡 세이브 데이터 안전하게 불러오는 유틸리티 함수
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

  // 💡 4. 상태(State) 관리 구역
  const [data, setData] = useState(currentScenarioData); 
  
  // 현재 보고 있는 탭 (isTruthMode면 로컬 세이브 무시하고 무조건 '사건종결' 탭으로 렌더링)
  const [activeTab, setActiveTab] = useState(() => {
    if (isTruthMode) return 'deduction';
    return getInitialState('activeTab', 'briefing');
  }); 

  // 게임 진행 핵심 데이터 (행동력, 인벤토리, 읽은 단서, 남은 추리 기회)
  const [actionPoints, setActionPoints] = useState(() => getInitialState('actionPoints', defaultAP));
  const [inventory, setInventory] = useState(() => getInitialState('inventory', []));
  const [viewedClues, setViewedClues] = useState(() => getInitialState('viewedClues', []));
  const [deductionLife, setDeductionLife] = useState(() => getInitialState('deductionLife', 2));

  // 각종 모달 및 팝업 창 띄우기/닫기용 상태
  const [selectedSuspect, setSelectedSuspect] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isGlobalInventoryOpen, setIsGlobalInventoryOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [showApAdModal, setShowApAdModal] = useState(false); 
  const [isAdLoading, setIsAdLoading] = useState(true); 
  const [isCaseSolved, setIsCaseSolved] = useState(false); 

  // 💡 5. 튜토리얼(Joyride) 설정 구역
  const [tourRun, setTourRun] = useState(false);
  const [tourSteps] = useState([
    { target: 'body', content: '🕵️‍♂️ 탐정님, 사건 현장에 오신 것을 환영합니다! [다음]을 눌러 기본 사용법을 숙지하세요.', placement: 'center', disableBeacon: true },
    { target: '.tutorial-tab-interrogation', content: '💬 용의자 심문 탭입니다. 사건 관계자들의 알리바이를 캐내고 진술 단서를 획득하세요.', placement: 'top', disableBeacon: true },
    { target: '.tutorial-tab-investigation', content: '🔍 현장 조사 탭입니다. 사건 현장을 수색하여 물증과 증거를 찾아낼 수 있습니다.', placement: 'top', disableBeacon: true },
    { target: '.tutorial-tab-deduction', content: '⚖️ 사건 종결 탭입니다. 단서가 모두 모였다면 정확한 범인과 흉기를 지목하세요.', placement: 'top', disableBeacon: true },
    { target: '.tutorial-icon-inventory', content: '💼 단서함 가방입니다. 수집한 모든 진술과 물증 리스트를 한눈에 모아볼 수 있습니다.', placement: 'bottom', disableBeacon: true },
    { target: '.tutorial-icon-note', content: '📓 추리 노트입니다. 수사 과정에서 필요한 단서들을 자유롭게 메모해 두세요.', placement: 'left', disableBeacon: true }
  ]);

  const { changeAndPlayBgm, playSfx } = useAudio(); 
  
  // 안 읽은 단서 개수 카운팅 (가방 아이콘 위에 빨간 뱃지 표시용)
  const unreadCount = inventory.filter(id => !viewedClues.includes(id)).length;

  // 💡 6. 행동력 광고 시청 횟수 제한 (하루 3번) 로직
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

  // 💡 7. LifeCycle & Side Effects (useEffect) 모음

  // 앱 최초 진입 시 튜토리얼 띄울지 말지 결정 (한 번만 실행됨)
  useEffect(() => {
    const isTutorialCleared = localStorage.getItem(TUTORIAL_KEY) === 'true';
    if (!isTutorialCleared) {
      setTimeout(() => {
        setTourRun(true); 
        localStorage.setItem(TUTORIAL_KEY, 'true'); // 띄우자마자 바로 완료 도장 쾅!
      }, 600); 
    }
  }, []);

  // 튜토리얼이 끝났거나 스킵했을 때 모달 닫기
  const handleJoyrideCallback = (data) => {
    const { status, action } = data;
    if (['finished', 'skipped'].includes(status) || action === 'close') {
      setTourRun(false); 
    } 
  };

  // 안드로이드 하드웨어 "뒤로 가기" 버튼 우선순위 제어 로직
  // 모달이 열려있으면 모달부터 닫고, 다 닫혀있어야만 onBack()으로 나감
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

  // 플레이어의 행동(AP 차감, 단서 획득 등)이 발생할 때마다 자동 세이브
  useEffect(() => {
    const gameState = { activeTab, actionPoints, inventory, viewedClues, deductionLife };
    localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
  }, [activeTab, actionPoints, inventory, viewedClues, deductionLife, SAVE_KEY]);

  // 시나리오 진입 시 데이터 세팅 및 BGM 재생
  useEffect(() => {
    const newData = scenarioDB[scenarioId];
    setData(newData);
    const saved = localStorage.getItem(SAVE_KEY);
    
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
  
  // 행동력이 0이 되었을 때 광고를 띄울지, 사건 종결로 보낼지 결정
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

  // 처음 진입 시 전면 광고(Interstitial) 송출 및 로딩 화면 해제
  useEffect(() => {
    const playIntroAd = async () => {

      // 💡 [핵심 방어 로직] 사건의 전말(Truth) 모드로 진입했다면 이미 보상형 광고를 본 직후이므로 전면 광고 스킵!
      if (isTruthMode) {
        setIsAdLoading(false);
        return; 
      }

      try {
        const adId = 'ca-app-pub-2340338162252761/9054708020'; // 전면 광고 테스트 ID
        await AdMob.prepareInterstitial({ adId });
        await AdMob.showInterstitial();
      } catch (error) {
        console.log("전면 광고 호출 실패:", error);
      } finally {
        setIsAdLoading(false); // 광고가 실패하든 성공하든 로딩 화면은 무조건 풀어줌
      }
    };
    playIntroAd();
  }, [scenarioId, isTruthMode]); 

  // 💡 8. 이벤트 핸들러 모음 (광고, 단서, AP 처리 등)
  
  // 행동력 충전 광고 보고 난 후 보상 지급 로직
  const handleApAdConfirm = async () => {
    setShowApAdModal(false);

    // 🚨 [테스트용 치트키] 광고 호출 안 하고 무조건 통과!
    /* -------- 👇 여기서부터 치트키 -------- */
    // const adStatus = checkAdLimit();
    // localStorage.setItem(AD_LIMIT_KEY, JSON.stringify({ 
    //   date: adStatus.date, 
    //   count: adStatus.count + 1 
    // }));
    // const rechargeAmount = Math.ceil((data.maxActionPoints || 3) / 2); 
    // alert(`⚡ 행동력이 ${rechargeAmount} 충전되었습니다! (오늘 충전 ${adStatus.count + 1}/${MAX_AD_PER_DAY}회)`);
    // setActionPoints(rechargeAmount);
    /* -------- 👆 여기까지 치트키 -------- */


    /* -------- 👇 정식 출시(또는 광고 띄워볼 때)용 진짜 애드몹 로직 --------
       출시 전에는 위의 '치트키' 구역을 지우고, 아래 주석을 풀어서 사용해!
    */
    try {
      // 💡 바로 여기에 보상형 광고 ID를 집어넣어! (현재는 테스트 ID)
      await AdMob.prepareRewardVideoAd({
        adId: 'ca-app-pub-2340338162252761/7588593433', // 정식 출시 땐 발급받은 찐 ID로 교체!
        isTesting: false // 정식 출시 땐 false로 교체 필수!
      });

      const rewardListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
        // 광고를 끝까지 시청하면 행동력 충전 실행!
        const adStatus = checkAdLimit();
        localStorage.setItem(AD_LIMIT_KEY, JSON.stringify({ 
          date: adStatus.date, 
          count: adStatus.count + 1 
        }));
        const rechargeAmount = Math.ceil((data.maxActionPoints || 3) / 2); 
        // alert(`⚡ 행동력이 ${rechargeAmount} 충전되었습니다!`);
        setActionPoints(rechargeAmount);
      });

      const dismissListener = await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        rewardListener.remove();
        dismissListener.remove();
      });

      await AdMob.showRewardVideoAd();

    } catch (error) {
      console.error('광고 호출 실패:', error);
      alert("광고를 불러올 수 없습니다. 인터넷 연결을 확인해 주세요.");
    }
    /*------------------------------------------------------------------ */
  };

  // 행동력 충전 취소 시 강제 사건 종결로 쫓겨남
  const handleApAdCancel = () => {
    setShowApAdModal(false);
    setSelectedSuspect(null);
    setSelectedLocation(null);
    setIsGlobalInventoryOpen(false); 
    setIsNoteOpen(false); 
    setActiveTab('deduction'); 
  };

  // 수사 데이터 초기화 (다시 하기)
  const clearProgress = () => {
    localStorage.removeItem(SAVE_KEY);
    onBack(); 
  };

  // 게임 로직들: 단서 제시(-1 AP), 현장 탐색(-3 AP), 단서 획득(-1 AP), 획득한 단서 지우기, 단서 읽음 처리
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

  // 💡 9. UI 렌더링 구역

  // 로딩 화면 (광고 뜨기 전 대기)
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

  // 메인 UI 렌더링
  return (
    <div className="min-h-screen bg-neutral-900 text-gray-100 flex flex-col font-sans">
      
      {/* 튜토리얼 오버레이 */}
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

      {/* 플로팅 추리 노트 버튼 */}
      <button 
        onClick={() => { playSfx(); setIsNoteOpen(true); }}
        className="tutorial-icon-note fixed top-[72px] right-4 z-[80] w-12 h-12 bg-neutral-800 border border-neutral-600 rounded-full flex items-center justify-center text-xl shadow-[0_4px_15px_rgba(0,0,0,0.5)] active:scale-90 transition-all hover:bg-neutral-700"
      >
        📓
      </button>

      {/* 최상단 헤더 (타이틀, 설정, 가방, 행동력) */}
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

      {/* 메인 화면: 선택된 탭에 따라 컴포넌트 스위칭 */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {/* 탭 1: 사건 개요 */}
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

        {/* 탭 2: 용의자 심문 */}
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

        {/* 탭 3: 현장 조사 */}
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

        {/* 탭 4: 사건 종결 (추리 파트) */}
        {activeTab === 'deduction' && (
          <DeductionView isTruthMode={isTruthMode} scenarioData={data} inventory={inventory} actionPoints={actionPoints} deductionLife={deductionLife} onFail={() => setDeductionLife(prev => Math.max(0, prev - 1))} onReset={clearProgress} onAdRevive={() => setDeductionLife(1)} onSuccess={() => setIsCaseSolved(true)} />
        )}
      </main>

      {/* 하단 탭 내비게이션 바 (사건 해결 전까지만 노출) */}
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

      {/* 모달 렌더링 구역 (조건부 렌더링) */}
      {selectedSuspect && <InterrogationView suspect={selectedSuspect} scenarioData={data} inventory={inventory} viewedClues={viewedClues} actionPoints={actionPoints} onClueFound={handleAddClue} onMarkAsViewed={markClueAsViewed} onRemoveClue={handleRemoveClue} onClose={() => setSelectedSuspect(null)} onPresent={handlePresentEvidence} />}
      {isGlobalInventoryOpen && <InventoryModal inventory={inventory} viewedClues={viewedClues} onMarkAsViewed={markClueAsViewed} scenarioData={data} onRemoveClue={handleRemoveClue} onClose={() => setIsGlobalInventoryOpen(false)} />}
      {selectedLocation && <LocationModal location={selectedLocation} inventory={inventory} maxActionPoints={data.maxActionPoints} actionPoints={actionPoints} onClueFound={handleAddClue} onScan={handleScanArea} onClose={() => setSelectedLocation(null)} />}
      {isNoteOpen && <div className="relative z-[110]"><ReasoningNoteModal onClose={() => setIsNoteOpen(false)} /></div>}
      
      {/* 행동력 고갈 시 나타나는 충전 모달 */}
      {showApAdModal && <AdConfirmModal type="ap" onConfirm={handleApAdConfirm} onCancel={handleApAdCancel} />}
    </div>
  );
};

export default PlayScreen;