import React, { useState, useEffect } from 'react';
import TitleScreen from './components/TitleScreen'; 
import PlayScreen from './components/PlayScreen';
import SettingsModal from './components/SettingsModal';
import { AudioProvider } from './contexts/AudioContext'; // 💡 Import 추가

const AppContent = () => {
  const [currentScreen, setCurrentScreen] = useState('title');
  const [hasSaveData, setHasSaveData] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // 💡 설정 모달 상태

  const scenarioId = 'wedding_murder';

  useEffect(() => {
    const saved = localStorage.getItem(`crime_game_progress_${scenarioId}`);
    setHasSaveData(!!saved);
  }, [currentScreen]);

  const handleStartNewGame = () => {
    if (hasSaveData) {
      if (!window.confirm("새로 시작하면 기존 수사 기록이 모두 삭제됩니다. 계속하시겠습니까?")) return;
      localStorage.removeItem(`crime_game_progress_${scenarioId}`);
    }
    setCurrentScreen('play');
  };

  const handleContinue = () => setCurrentScreen('play');

  return (
    <>
      {/* 💡 전역 설정 버튼 (어느 화면에서든 우측 상단에 띄우고 싶다면) */}
      <button 
        onClick={() => setIsSettingsOpen(true)}
        className="fixed top-4 right-4 z-[90] w-10 h-10 bg-neutral-900/80 backdrop-blur border border-neutral-700 rounded-full flex items-center justify-center text-xl shadow-lg hover:bg-neutral-800 active:scale-95"
      >
        ⚙️
      </button>

      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}

      {currentScreen === 'title' && (
        <TitleScreen hasSaveData={hasSaveData} onStartGame={handleStartNewGame} onContinue={handleContinue} />
      )}
      
      {currentScreen === 'play' && (
        <PlayScreen scenarioId={scenarioId} onBack={() => setCurrentScreen('title')} />
      )}
    </>
  );
};

// 💡 1번에서 만든 Provider로 전체를 감싸줌
const App = () => (
  <AudioProvider>
    <AppContent />
  </AudioProvider>
);

export default App;