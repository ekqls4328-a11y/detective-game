import React, { useState, useEffect } from 'react';
import TitleScreen from './components/TitleScreen'; 
import MainScreen from './components/MainScreen'; // 💡 네가 만든 파일 임포트!
import PlayScreen from './components/PlayScreen';
import SettingsModal from './components/SettingsModal';
import { AudioProvider } from './contexts/AudioContext';

const AppContent = () => {
  const [currentScreen, setCurrentScreen] = useState('title'); // 'title' | 'select' | 'play'
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 이어하기 로직
  const handleContinue = () => {
    setSelectedScenarioId('wedding_murder'); // 💡 나중에는 최근 저장된 시나리오 ID를 불러오게 수정
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
      {/* 💡 1. 여기에 있던 fixed 버튼(⚙️)은 과감하게 삭제! */}

      {/* 설정 모달은 그대로 유지 (z-[100]으로 최상단에 뜨게) */}
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}

      {/* 2. 각 화면에 onOpenSettings 프롭스로 열기 권한 전달 */}
      {currentScreen === 'title' && (
        <TitleScreen 
          hasSaveData={!!localStorage.getItem('crime_game_progress_wedding_murder')} 
          onStartGame={() => setCurrentScreen('select')} 
          onContinue={handleContinue} 
          onOpenSettings={() => setIsSettingsOpen(true)} // 💡 전달
        />
      )}

      {currentScreen === 'select' && (
        <MainScreen 
          onSelectScenario={handleScenarioSelect} 
          onBack={() => setCurrentScreen('title')} 
          onOpenSettings={() => setIsSettingsOpen(true)} // 💡 전달
        />
      )}
      
      {currentScreen === 'play' && selectedScenarioId && (
        <PlayScreen 
          scenarioId={selectedScenarioId} 
          onBack={() => setCurrentScreen('select')} 
          onOpenSettings={() => setIsSettingsOpen(true)} // 💡 전달
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