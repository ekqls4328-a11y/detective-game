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

const AppContent = () => {
  const [currentScreen, setCurrentScreen] = useState('splash'); // 'splash' | 'title' | 'select' | 'play'
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

    return () => {
      KeepAwake.allowSleep().catch(console.error);
    };
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

    return () => {
      listenerPromise.then(listener => listener.remove());
    };
  }, [currentScreen, isSettingsOpen]);

  // 이어하기 로직 (타이틀 화면용)
  const handleContinue = () => {
    setSelectedScenarioId('wedding_murder'); 
    setCurrentScreen('play');
  };

  // 💡 MainScreen에서 사건을 골랐을 때 실행되는 로직 수정
  // 선택한 방식이 이어하기인지(isResume = true) 처음부터인지(isResume = false) 판단함
  const handleScenarioSelect = (id, isResume = false) => {
    const saved = localStorage.getItem(`crime_game_progress_${id}`);
    
    // 💡 기존 기록이 존재하고, 유저가 '처음부터' 시작하기를 원할 때만 초기화 confirm 처리
    if (saved && !isResume) {
      if (!window.confirm("기존 수사 기록이 있습니다. 초기화하고 처음부터 다시 시작하시겠습니까?")) return;
      localStorage.removeItem(`crime_game_progress_${id}`);
    }
    
    setSelectedScenarioId(id);
    setCurrentScreen('play');
  };

  return (
    <>
      {/* 설정 모달 */}
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}

      {/* 1. 스플래시 화면 */}
      {currentScreen === 'splash' && (
        <SplashScreen onFinish={() => setCurrentScreen('title')} />
      )}

      {/* 2. 타이틀 화면 */}
      {currentScreen === 'title' && (
        <TitleScreen 
          hasSaveData={!!localStorage.getItem('crime_game_progress_wedding_murder')} 
          onStartGame={() => setCurrentScreen('select')} 
          onContinue={handleContinue} 
          onOpenSettings={() => setIsSettingsOpen(true)} 
        />
      )}

      {/* 3. 사건 선택 화면(MainScreen) */}
      {currentScreen === 'select' && (
        <MainScreen 
          onSelectScenario={handleScenarioSelect} 
          onBack={() => setCurrentScreen('title')} 
          onOpenSettings={() => setIsSettingsOpen(true)} 
        />
      )}
      
      {/* 4. 실제 수사 화면(PlayScreen) */}
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