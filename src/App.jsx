import React, { useState, useEffect } from 'react';
import TitleScreen from './components/TitleScreen'; 
import MainScreen from './components/MainScreen'; 
import PlayScreen from './components/PlayScreen';
import SplashScreen from './components/SplashScreen'; // 💡 스플래시 컴포넌트 임포트!
import SettingsModal from './components/SettingsModal';
import { AudioProvider } from './contexts/AudioContext';

const AppContent = () => {
  // 💡 초기 상태를 'splash'로 설정해서 앱 켜자마자 로고가 뜨게 함
  const [currentScreen, setCurrentScreen] = useState('splash'); // 'splash' | 'title' | 'select' | 'play'
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 이어하기 로직
  const handleContinue = () => {
    // 💡 실제로는 마지막 플레이 기록을 가져오는 로직이 들어가야 함
    setSelectedScenarioId('wedding_murder'); 
    setCurrentScreen('play');
  };

  // MainScreen에서 특정 사건을 골랐을 때
  const handleScenarioSelect = (id) => {
    const saved = localStorage.getItem(`crime_game_progress_${id}`);
    if (saved) {
      if (!window.confirm("기존 수사 기록이 있습니다. 초기화하고 처음부터 다시 시작하시겠습니까?")) return;
      localStorage.removeItem(`crime_game_progress_${id}`);
    }
    setSelectedScenarioId(id);
    setCurrentScreen('play');
  };

  return (
    <>
      {/* 설정 모달은 모든 화면 위에 뜰 수 있게 최상단 유지 */}
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}

      {/* 💡 1. 스플래시 화면: 종료되면 타이틀로 이동 */}
      {currentScreen === 'splash' && (
        <SplashScreen onFinish={() => setCurrentScreen('title')} />
      )}

      {/* 💡 2. 타이틀 화면 */}
      {currentScreen === 'title' && (
        <TitleScreen 
          hasSaveData={!!localStorage.getItem('crime_game_progress_wedding_murder')} 
          onStartGame={() => setCurrentScreen('select')} 
          onContinue={handleContinue} 
          onOpenSettings={() => setIsSettingsOpen(true)} 
        />
      )}

      {/* 💡 3. 사건 선택 화면(MainScreen) */}
      {currentScreen === 'select' && (
        <MainScreen 
          onSelectScenario={handleScenarioSelect} 
          onBack={() => setCurrentScreen('title')} 
          onOpenSettings={() => setIsSettingsOpen(true)} 
        />
      )}
      
      {/* 💡 4. 실제 수사 화면(PlayScreen) */}
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