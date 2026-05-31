import React, { useState, useEffect } from 'react';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { App as CapacitorApp } from '@capacitor/app'; 
import { Toast } from '@capacitor/toast'; 
import TitleScreen from './components/TitleScreen'; 
import MainScreen from './components/MainScreen'; 
import PlayScreen from './components/PlayScreen';
import SplashScreen from './components/SplashScreen'; 
import SettingsModal from './components/SettingsModal';
import AdConfirmModal from './components/AdConfirmModal';
import { AudioProvider } from './contexts/AudioContext';
import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob';
import scenarioDataList from './data/scenario_list.json';
import { Capacitor } from '@capacitor/core';
import { AppUpdate } from '@capawesome/capacitor-app-update';

const AppContent = () => {
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasAnySaveData, setHasAnySaveData] = useState(false);

  const [truthAdModalOpen, setTruthAdModalOpen] = useState(false);
  const [truthScenarioId, setTruthScenarioId] = useState(null);
  const [isTruthMode, setIsTruthMode] = useState(false); 

  const allScenarios = scenarioDataList.flatMap(seasonItem => seasonItem.scenarios || []);

  useEffect(() => {
    const initAdMob = async () => {
      try {
        await AdMob.initialize({
          requestTrackingAuthorization: true, 
          initializeForTesting: true,        
        });
        console.log('애드몹 초기화 성공');
      } catch (error) {
        console.error('애드몹 초기화 실패:', error);
      }
    };
    initAdMob();
  }, []);

  useEffect(() => {
    const preventScreenSleep = async () => {
      try {
        await KeepAwake.keepAwake();
      } catch (error) {}
    };
    preventScreenSleep();
    return () => { KeepAwake.allowSleep().catch(console.error); };
  }, []);

  useEffect(() => {
    let lastBackPressTime = 0;
    const setupBackButton = async () => {
      const listener = await CapacitorApp.addListener('backButton', () => {
        if (truthAdModalOpen) { setTruthAdModalOpen(false); return; }
        if (isSettingsOpen) { setIsSettingsOpen(false); return; }

        if (currentScreen === 'play') {
          return; 
        } 
        else if (currentScreen === 'select') {
          setCurrentScreen('title');
        } 
        else if (currentScreen === 'title') {
          const now = new Date().getTime();
          if (now - lastBackPressTime < 2000) {
            CapacitorApp.exitApp(); 
          } else {
            lastBackPressTime = now;
            Toast.show({
              text: "'뒤로' 버튼을 한 번 더 누르면 종료됩니다.",
              duration: 'short'
            });
          }
        }
      });
      return listener;
    };
    const listenerPromise = setupBackButton();
    return () => { listenerPromise.then(listener => listener.remove()); };
  }, [currentScreen, isSettingsOpen, truthAdModalOpen]);

  useEffect(() => {
    const checkSaveData = () => {
      const isSaved = allScenarios.some(scenario => 
        localStorage.getItem(`crime_game_progress_${scenario.id}`) !== null
      );
      setHasAnySaveData(isSaved);
    };
    
    if (currentScreen === 'title' || currentScreen === 'select') {
      checkSaveData();
    }
  }, [currentScreen, allScenarios]);

  const handleContinue = () => {
    const lastPlayedId = localStorage.getItem('last_played_scenario_id');
    setIsTruthMode(false);

    if (lastPlayedId && localStorage.getItem(`crime_game_progress_${lastPlayedId}`)) {
      setSelectedScenarioId(lastPlayedId);
      setCurrentScreen('play');
    } else {
      let fallbackId = null;
      for (const scenario of allScenarios) {
        if (localStorage.getItem(`crime_game_progress_${scenario.id}`)) {
          fallbackId = scenario.id;
          break; 
        }
      }

      if (fallbackId) {
        localStorage.setItem('last_played_scenario_id', fallbackId);
        setSelectedScenarioId(fallbackId);
        setCurrentScreen('play');
      } else {
        alert("이어서 할 수사 기록을 찾을 수 없습니다.");
        setCurrentScreen('select');
      }
    }
  };

  const handleScenarioSelect = (id, isResume = false) => {
    const saved = localStorage.getItem(`crime_game_progress_${id}`);
    
    if (saved && !isResume) {
      if (!window.confirm("기존 수사 기록이 있습니다. 초기화하고 처음부터 다시 시작하시겠습니까?")) return;
      localStorage.removeItem(`crime_game_progress_${id}`);
    }
    
    setIsTruthMode(false);
    
    localStorage.setItem('last_played_scenario_id', id);
    setSelectedScenarioId(id);
    setCurrentScreen('play');
  };

  const handleViewTruthRequest = (id) => {
    setTruthScenarioId(id);
    setTruthAdModalOpen(true);
  };

  // 💡 사건의 전말 2단계: 광고 재생 스킵 & 강제 보상 처리 (테스트용)
  const handleTruthAdConfirm = async () => {
    setTruthAdModalOpen(false);
    
    // 🚨 [테스트용 치트키] 광고 호출 안 하고 무조건 통과!
    console.log("📺 [개발용 치트키] 사건의 전말 광고 시청 스킵");
    // (얼럿이 거슬리면 아래 alert 줄은 지워도 돼!)
    alert("📺 [테스트 모드] 광고 시청을 스킵하고 사건의 전말을 바로 확인합니다.");

    // 원래는 광고를 다 봐야 실행되는 로직을 바로 실행시켜버림
    setIsTruthMode(true);
    setSelectedScenarioId(truthScenarioId);
    setCurrentScreen('play');

    /* -------------------------------------------------------------
       ⛔ 정식 출시 전에는 위에 있는 '치트키 로직'을 지우고 
       아래 주석 처리된 진짜 애드몹 로직의 주석(/*)을 풀어서 써야 해!
       -------------------------------------------------------------
    try {
      await AdMob.prepareRewardVideoAd({
        adId: 'ca-app-pub-3940256099942544/5224354917', 
        isTesting: true
      });

      const rewardListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
        setIsTruthMode(true);
        setSelectedScenarioId(truthScenarioId);
        setCurrentScreen('play');
      });

      const dismissListener = await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        rewardListener.remove();
        dismissListener.remove();
      });

      await AdMob.showRewardVideoAd();

    } catch (error) {
      console.error('보상형 광고 로드 실패:', error);
      alert("광고를 불러올 수 없습니다. 인터넷 연결을 확인해 주세요.");
    }
    ------------------------------------------------------------- */
  };

  useEffect(() => {
    const CURRENT_VERSION = "1.0.0"; 
    const savedVersion = localStorage.getItem('app_version');

    if (!savedVersion) {
      localStorage.clear(); 
      localStorage.setItem('app_version', CURRENT_VERSION); 
      console.log(`[Version Check] 베타 데이터를 초기화하고 v${CURRENT_VERSION} 환경을 세팅했습니다.`);
    } 
    else if (savedVersion !== CURRENT_VERSION) {
      localStorage.setItem('app_version', CURRENT_VERSION);
      console.log(`[Version Check] 앱이 v${savedVersion}에서 v${CURRENT_VERSION}으로 업데이트 되었습니다. (데이터 보존)`);
    }
  }, []);

  useEffect(() => {
    const checkForUpdate = async () => {
      // 안드로이드 환경이 아니면(웹 등) 작동하지 않도록 방어
      if (Capacitor.getPlatform() !== 'android') return;

      try {
        const result = await AppUpdate.getAppUpdateInfo();
        
        // 💡 2 = UPDATE_AVAILABLE (새 버전이 존재함)
        if (result.updateAvailability === 2) {
          
          // 🚨 무조건 강제 업데이트 (유저가 취소하면 앱 종료됨)
          if (result.immediateUpdateAllowed) {
            await AppUpdate.performImmediateUpdate();
          }
        }
      } catch (error) {
        console.error('업데이트 체크 실패:', error);
      }
    };

    checkForUpdate();
  }, []);

  return (
    <>
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}

      {truthAdModalOpen && (
        <AdConfirmModal 
          type="truth" 
          onConfirm={handleTruthAdConfirm} 
          onCancel={() => setTruthAdModalOpen(false)} 
        />
      )}

      {currentScreen === 'splash' && (
        <SplashScreen onFinish={() => setCurrentScreen('title')} />
      )}

      {currentScreen === 'title' && (
        <TitleScreen 
          hasSaveData={hasAnySaveData} 
          onStartGame={() => setCurrentScreen('select')} 
          onContinue={handleContinue} 
          onOpenSettings={() => setIsSettingsOpen(true)} 
        />
      )}

      {currentScreen === 'select' && (
        <MainScreen 
          onSelectScenario={handleScenarioSelect}
          onViewTruth={handleViewTruthRequest} 
          onBack={() => setCurrentScreen('title')} 
          onOpenSettings={() => setIsSettingsOpen(true)} 
        />
      )}
      
      {currentScreen === 'play' && selectedScenarioId && (
        <PlayScreen 
          scenarioId={selectedScenarioId} 
          isTruthMode={isTruthMode} 
          onBack={() => setCurrentScreen('select')} 
          onOpenSettings={() => setIsSettingsOpen(true)} 
        />
      )}
    </>
  );
};

const App = () => (
  <AudioProvider>
    <AppContent />
  </AudioProvider>
);

export default App;