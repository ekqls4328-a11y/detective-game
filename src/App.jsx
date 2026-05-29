import React, { useState, useEffect } from 'react';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { App as CapacitorApp } from '@capacitor/app'; 
import { Toast } from '@capacitor/toast'; 
import TitleScreen from './components/TitleScreen'; 
import MainScreen from './components/MainScreen'; 
import PlayScreen from './components/PlayScreen';
import SplashScreen from './components/SplashScreen'; 
import SettingsModal from './components/SettingsModal';
import { AudioProvider } from './contexts/AudioContext';
import { AdMob } from '@capacitor-community/admob';
// 💡 시나리오 리스트에서 ID 목록을 가져오기 위해 임포트
import scenarioDataList from './data/scenario_list.json';

const AppContent = () => {
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasAnySaveData, setHasAnySaveData] = useState(false);

  // 💡 [핵심] 계층형 JSON 데이터를 1차원 배열로 평탄화(Flat)해서 세이브 체크용으로 사용
  const allScenarios = scenarioDataList.flatMap(seasonItem => seasonItem.scenarios || []);

  // 애드몹 엔진 초기화 로직
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

  // 화면 꺼짐 방지 로직
  useEffect(() => {
    const preventScreenSleep = async () => {
      try {
        await KeepAwake.keepAwake();
      } catch (error) {
        // console.error('화면 꺼짐 방지 실패:', error);
      }
    };
    preventScreenSleep();
    return () => { KeepAwake.allowSleep().catch(console.error); };
  }, []);

  // 하드웨어 뒤로 가기 버튼 제어 로직
  useEffect(() => {
    let lastBackPressTime = 0;
    const setupBackButton = async () => {
      const listener = await CapacitorApp.addListener('backButton', () => {
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
          return;
        }

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
  }, [currentScreen, isSettingsOpen]);

  // 💡 앱이 켜질 때, 존재하는 모든 시나리오 중 하나라도 세이브 데이터가 있는지 확인
  useEffect(() => {
    const checkSaveData = () => {
      // 💡 평탄화된 allScenarios 배열을 사용하여 검사
      const isSaved = allScenarios.some(scenario => 
        localStorage.getItem(`crime_game_progress_${scenario.id}`) !== null
      );
      setHasAnySaveData(isSaved);
    };
    
    if (currentScreen === 'title' || currentScreen === 'select') {
      checkSaveData();
    }
  }, [currentScreen, allScenarios]);

  // 타이틀 화면용 이어하기 로직
  const handleContinue = () => {
    const lastPlayedId = localStorage.getItem('last_played_scenario_id');

    if (lastPlayedId && localStorage.getItem(`crime_game_progress_${lastPlayedId}`)) {
      setSelectedScenarioId(lastPlayedId);
      setCurrentScreen('play');
    } else {
      let fallbackId = null;
      // 💡 평탄화된 allScenarios 배열을 사용하여 폴백 세이브 검색
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

  // MainScreen에서 사건을 골랐을 때
  const handleScenarioSelect = (id, isResume = false) => {
    const saved = localStorage.getItem(`crime_game_progress_${id}`);
    
    if (saved && !isResume) {
      if (!window.confirm("기존 수사 기록이 있습니다. 초기화하고 처음부터 다시 시작하시겠습니까?")) return;
      localStorage.removeItem(`crime_game_progress_${id}`);
    }
    
    localStorage.setItem('last_played_scenario_id', id);
    
    setSelectedScenarioId(id);
    setCurrentScreen('play');
  };

  return (
    <>
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}

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
          onBack={() => setCurrentScreen('title')} 
          onOpenSettings={() => setIsSettingsOpen(true)} 
        />
      )}
      
      {currentScreen === 'play' && selectedScenarioId && (
        <PlayScreen 
          scenarioId={selectedScenarioId} 
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