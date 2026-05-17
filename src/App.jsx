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
// 💡 시나리오 리스트에서 ID 목록을 가져오기 위해 임포트
import scenarioDataList from './data/scenario_list.json';

const AppContent = () => {
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasAnySaveData, setHasAnySaveData] = useState(false);

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
          setCurrentScreen('select');
        } else if (currentScreen === 'select') {
          setCurrentScreen('title');
        } else if (currentScreen === 'title') {
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
      const isSaved = scenarioDataList.some(scenario => 
        localStorage.getItem(`crime_game_progress_${scenario.id}`) !== null
      );
      setHasAnySaveData(isSaved);
    };
    
    // 타이틀이나 메인 스크린으로 진입할 때마다 세이브 존재 여부 업데이트
    if (currentScreen === 'title' || currentScreen === 'select') {
      checkSaveData();
    }
  }, [currentScreen]);

  // 💡 [핵심] 타이틀 화면용 이어하기 로직 개선
  const handleContinue = () => {
    // 1. 시나리오 목록을 순회하면서 가장 최근에 수정된 세이브 데이터를 찾음 (가상 로직)
    // 원래라면 저장 시간에 대한 timestamp가 필요하지만, 
    // 여기서는 로컬 스토리지에 데이터가 존재하는 '첫 번째' 시나리오를 찾아줌
    let lastPlayedId = null;
    
    for (const scenario of scenarioDataList) {
      if (localStorage.getItem(`crime_game_progress_${scenario.id}`)) {
        lastPlayedId = scenario.id;
        break; // 일단 하나 찾으면 멈춤 (추후 timestamp 비교 로직으로 고도화 가능)
      }
    }

    if (lastPlayedId) {
      setSelectedScenarioId(lastPlayedId);
      setCurrentScreen('play');
    } else {
      // 혹시라도 세이브 파일이 꼬여서 못 찾았을 경우 대비
      alert("이어서 할 수사 기록을 찾을 수 없습니다.");
      setCurrentScreen('select');
    }
  };

  // MainScreen에서 사건을 골랐을 때
  const handleScenarioSelect = (id, isResume = false) => {
    const saved = localStorage.getItem(`crime_game_progress_${id}`);
    
    if (saved && !isResume) {
      if (!window.confirm("기존 수사 기록이 있습니다. 초기화하고 처음부터 다시 시작하시겠습니까?")) return;
      localStorage.removeItem(`crime_game_progress_${id}`);
    }
    
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
          // 💡 특정 ID가 아니라, 어떤 세이브 파일이든 존재하면 버튼을 활성화
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