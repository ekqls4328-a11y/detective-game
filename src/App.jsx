import React, { useState } from 'react';
import MainScreen from './components/MainScreen';
import PlayScreen from './components/PlayScreen';

function App() {
  const [currentScenario, setCurrentScenario] = useState(null);

  const handleSelectScenario = (scenarioId) => {
    setCurrentScenario(scenarioId);
  };

  const handleBackToMain = () => {
    setCurrentScenario(null);
  };

  return (
    <div className="App">
      {!currentScenario ? (
        <MainScreen onSelectScenario={handleSelectScenario} />
      ) : (
        <PlayScreen 
          scenarioId={currentScenario} 
          onBack={handleBackToMain} 
        />
      )}
    </div>
  );
}

export default App;