import React, { useState, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useAudio } from '../contexts/AudioContext';
import { Joyride } from 'react-joyride';

const CustomTooltip = ({ index, step, backProps, closeProps, primaryProps, tooltipProps, isLastStep }) => (
  <div {...tooltipProps} className="bg-neutral-900 border border-neutral-700 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] p-5 max-w-[320px] w-full font-sans z-[100000]">
    <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-3">
      <span className="text-amber-500 font-black text-[11px] tracking-widest">[ 조사 가이드 {index + 1} / 3 ]</span>
      <button {...closeProps} className="text-neutral-500 hover:text-red-500 text-lg leading-none">&times;</button>
    </div>
    <div className="text-gray-200 text-sm leading-loose mb-6 break-keep">{step.content}</div>
    <div className="flex justify-between items-center">
      <div>{index > 0 && <button {...backProps} className="px-3 py-2 text-xs font-bold text-neutral-400 bg-neutral-800 rounded-lg border border-neutral-700">&lt; 이전</button>}</div>
      <button {...primaryProps} className="px-5 py-2 text-xs font-black text-black bg-amber-500 rounded-lg">{isLastStep ? '조사 시작' : '다음 >'}</button>
    </div>
  </div>
);

const LocationModal = ({ 
  location, inventory, maxActionPoints, actionPoints, 
  onClueFound, onScan, onClose 
}) => {
  const [discoveryText, setDiscoveryText] = useState("화면을 터치해 구역을 조사하세요.");
  const [focusedPoint, setFocusedPoint] = useState(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const { playSfx } = useAudio();
  const TUTORIAL_KEY = 'crime_game_investigation_tutorial_cleared';
  const [tourRun, setTourRun] = useState(false);

  const IS_DEV_MODE = false; 
  // 💡 1. 마우스 위치를 저장할 상태 추가
  const [cursorPos, setCursorPos] = useState(null);

  useEffect(() => {
    setIsImageLoaded(false);
  }, [location?.backgroundUrl]);

  useEffect(() => {
    if (isScanning) {
      const timer = setTimeout(() => setIsScanning(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isScanning]);

  const handlePointClick = (e, clue) => {
    e.stopPropagation(); 
    playSfx(); 
    setFocusedPoint(clue);
    setDiscoveryText(`[${clue.name}]\n\n${clue.desc}`);
  };

  const handleSaveToInventory = () => {
    // 💡 방어 로직 (버튼이 잠기지만 혹시 모를 버그 대비)
    if (actionPoints <= 0) return;

    playSfx(); 
    if (focusedPoint && onClueFound) {
      onClueFound(focusedPoint.id);
      setDiscoveryText(`[${focusedPoint.name}] 단서를 단서함에 추가하였습니다. (⚡ -1)`);
    }
  };

  const handleScanClick = () => {
    // 💡 스캔 비용이 3이므로, 3 이상일 때만 작동하도록 조건 변경!
    if (actionPoints >= 3 && !isScanning) {
      playSfx(); 
      onScan(); 
      setIsScanning(true); 
      setDiscoveryText("주변을 탐색합니다... (단서 위치가 잠시 드러납니다)");
      setFocusedPoint(null);
    }
  };

  const handleMouseMove = (e) => {
    if (!IS_DEV_MODE) return;
    
    // 현재 이미지 컨테이너의 실제 화면상 크기와 위치를 가져옴 (확대/축소 비율 완벽 대응)
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // 소수점 1자리까지만 잘라서 저장
    setCursorPos({ x: x.toFixed(1), y: y.toFixed(1) });
  };

  const [tourSteps] = useState([
  {
    target: '.react-transform-component', 
    content: '현장은 거짓말을 하지 않습니다. 두 손가락으로 화면을 확대하고 스와이프하여 은폐된 흔적을 샅샅이 수색하십시오.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.tutorial-scan-btn', 
    content: '수색이 막막할 땐 주변 탐색을 활용하세요. 행동력(⚡)을 소모해 숨겨진 결정적 물증의 위치를 스캔할 수 있습니다.',
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.tutorial-clue-item', 
    content: '작은 위화감도 놓치지 마십시오. 의심스러운 흔적을 직접 터치해 조사하고 단서함에 확실하게 기록해야 합니다.',
    placement: 'top',
    disableBeacon: true,
  }
]);

  useEffect(() => {
    if (localStorage.getItem(TUTORIAL_KEY) !== 'true') {
      setTimeout(() => {
        setTourRun(true);
        localStorage.setItem(TUTORIAL_KEY, 'true');
      }, 800);
    }
  }, []);

  if (!location) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-neutral-950 flex flex-col animate-fadeIn overflow-hidden pb-safe">
      
      <Joyride
        steps={tourSteps}
        run={tourRun}
        continuous={true}
        disableOverlayClose={true}
        disableScrolling={true}
        disablePortal={true}
        spotlightClicks={true}
        callback={(data) => { if (data.status === 'finished' || data.action === 'close') setTourRun(false); }}
        hideBackButton={true}
        tooltipComponent={CustomTooltip}
        styles={{
          options: { zIndex: 100000, overlayColor: 'rgba(0, 0, 0, 0.6)' },
          spotlight: { backgroundColor: 'transparent' }
        }}
      />

      <header className="shrink-0 w-full z-[80] p-3 flex justify-between items-center gap-2 bg-neutral-950 border-b border-neutral-800 shadow-md">
        <button 
          onClick={() => { playSfx(); onClose(); }} 
          className="text-white text-xs font-bold px-4 py-2 bg-neutral-800 rounded-full border border-neutral-600 active:scale-95 whitespace-nowrap shrink-0 hover:bg-neutral-700 transition-all"
        >
          &lt; 현장 이탈
        </button>
        
        <div className="flex items-center gap-1.5 min-w-0 justify-end flex-1">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full border transition-colors shrink-0 ${
            actionPoints <= 1 ? 'bg-red-900/70 border-red-500 text-red-400 animate-pulse' : 'bg-neutral-800 border-neutral-700 text-neutral-300'
          }`}>
            <span className="text-xs">⚡</span>
            <span className="text-[10px] font-black tracking-widest mt-px">
              {actionPoints} <span className="text-neutral-500 mx-0.5">/</span> {maxActionPoints || 3}
            </span>
          </div>

          <div className="flex flex-col items-end shrink-0 max-w-[130px]">
            <span className="text-blue-400 font-black bg-neutral-800 px-3 py-1 rounded-full text-[11px] border border-blue-900/50 truncate w-full text-center">
              {location.name}
            </span>
            {IS_DEV_MODE && <span className="text-[9px] text-red-500 font-bold mt-1 tracking-tighter opacity-70">DEBUG MODE</span>}
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex items-center justify-center bg-black overflow-hidden relative">
        <TransformWrapper
          initialScale={1}
          minScale={1}
          maxScale={4}
          wheel={{ step: 0.1 }}
          doubleClick={{ disabled: true }}
          panning={{ velocityDisabled: true }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <div className="absolute top-4 left-4 z-[90] flex flex-col gap-2 opacity-60 hover:opacity-100 transition-opacity">
                <button onClick={() => { playSfx(); zoomIn(); }} className="w-8 h-8 bg-neutral-900/80 text-white rounded-full border border-neutral-600 backdrop-blur-sm shadow-lg font-bold">+</button>
                <button onClick={() => { playSfx(); zoomOut(); }} className="w-8 h-8 bg-neutral-900/80 text-white rounded-full border border-neutral-600 backdrop-blur-sm shadow-lg font-bold">-</button>
                <button onClick={() => { playSfx(); resetTransform(); }} className="w-8 h-8 bg-neutral-900/80 text-white rounded-full border border-neutral-600 backdrop-blur-sm shadow-lg text-[10px] font-black">R</button>
              </div>

              <TransformComponent 
                wrapperStyle={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
                contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <div 
                  className="relative max-w-full max-h-full aspect-square flex items-center justify-center transition-opacity duration-500 ease-in-out"
                  style={{ opacity: isImageLoaded ? 1 : 0 }}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={() => setCursorPos(null)} 
                >
                  {location.backgroundUrl ? (
                    <img 
                      src={location.backgroundUrl} 
                      alt={location.name} 
                      onLoad={() => setIsImageLoaded(true)} 
                      className="w-full h-full object-cover pointer-events-none select-none opacity-80" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-500 font-bold border border-neutral-800 rounded-xl bg-neutral-900">
                      [{location.name}] 이미지 없음 
                    </div>
                  )}

                  {/* 💡 [수정됨] 레이더 UI를 map 반복문 밖으로 빼서 딱 1번만 띄움! */}
                  {IS_DEV_MODE && cursorPos && (
                    <div className="absolute top-2 left-2 bg-black/90 text-emerald-400 font-mono text-[12px] font-black px-3 py-1.5 rounded-lg border border-emerald-500/50 z-[100] pointer-events-none shadow-2xl flex items-center gap-3">
                      <span>🎯 레이더 가동 중</span>
                      <span className="text-white bg-neutral-800 px-2 py-0.5 rounded border border-neutral-600">
                        top: "{cursorPos.y}%", left: "{cursorPos.x}%"
                      </span>
                    </div>
                  )}

                  {isImageLoaded && (
                    <div className="absolute inset-0 z-[75]">
                      {location.clues?.map(clue => {
                        const isFound = inventory?.includes(clue.id);
                        const isFocused = focusedPoint?.id === clue.id;

                        return (
                          <button
                            key={clue.id}
                            onClick={(e) => handlePointClick(e, clue)}
                            style={{ 
                              top: clue.top, left: clue.left, width: clue.width, height: clue.height,
                              transform: 'translate(-50%, -50%)'
                            }}
                            className={`tutorial-clue-item absolute rounded-xl transition-all duration-300 ${
                              IS_DEV_MODE 
                                ? `border-2 ${isFocused ? 'border-blue-400 bg-blue-400/30 shadow-[0_0_15px_rgba(96,165,250,0.5)]' : (isFound ? 'border-emerald-500 bg-emerald-500/20' : 'border-red-500 bg-red-500/20')}`
                                : (isFocused ? 'border-2 border-blue-400 bg-blue-400/30 shadow-[0_0_15px_rgba(96,165,250,0.5)]' : 'bg-transparent border-none')
                            }`}
                          >
                            {/* 💡 여기에 있던 레이더 코드를 지웠음 (위로 옮김) */}
                            {IS_DEV_MODE && (
                              <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-bold bg-black/80 text-white px-1.5 py-0.5 rounded border border-neutral-700 opacity-80 z-10 pointer-events-none">
                                {clue.id}
                              </span>
                            )}
                            
                            {isScanning && !isFound && (
                              <span className="absolute inset-0 rounded-xl bg-amber-400/40 animate-ping" />
                            )}
                            {isScanning && isFound && (
                              <span className="absolute inset-0 rounded-xl bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
        
        {isScanning && <div className="absolute inset-0 bg-blue-500/10 pointer-events-none animate-pulse mix-blend-overlay z-[80]" />}
      </div>

      <div className="shrink-0 w-full z-[80] bg-neutral-950 border-t border-neutral-800 p-3 pb-6 flex flex-col gap-2.5 shadow-2xl">
        <div className="bg-neutral-900 border border-neutral-700 px-3 py-2.5 rounded-xl shadow-inner relative flex flex-col h-[80px]">
          <div className="overflow-y-auto h-full pr-1 pb-1">
            <p className="text-[13px] leading-snug text-gray-100 whitespace-pre-wrap break-keep select-none">
              {discoveryText}
            </p>
          </div>
          <div className="absolute bottom-1 left-1 right-2 h-4 bg-gradient-to-t from-neutral-900 via-neutral-900/50 to-transparent pointer-events-none rounded-b-lg" />
        </div>

        <div className="h-[48px] w-full flex items-center justify-center shrink-0">
          {focusedPoint ? (
            !inventory?.includes(focusedPoint.id) ? (
              // 💡 1. 기록하기 버튼 비활성화 로직 장착!
              <button 
                disabled={actionPoints <= 0}
                onClick={handleSaveToInventory}
                className={`w-full h-full text-white font-black rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 text-sm ${
                  actionPoints <= 0 
                    ? 'bg-neutral-800 border border-neutral-700 opacity-50 cursor-not-allowed text-neutral-500' 
                    : 'bg-emerald-600 hover:bg-emerald-500 active:scale-95'
                }`}
              >
                <span>📌</span> 기록하기 {actionPoints <= 0 ? '(⚡ 부족)' : '(⚡ -1)'}
              </button>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-emerald-400 font-bold bg-emerald-950/30 rounded-lg border border-emerald-900/50">
                이미 수집된 단서
              </div>
            )
          ) : (
            <div className="w-full h-full rounded-lg border border-dashed border-neutral-800 flex items-center justify-center text-neutral-600 text-xs font-bold bg-neutral-900/30">
              조사할 위치를 클릭하세요
            </div>
          )}
        </div>

        {/* 💡 2. 스캔 버튼 비활성화 조건 강화 (3 미만일 때 잠금) */}
        <button 
          onClick={handleScanClick}
          disabled={actionPoints < 3 || isScanning}
          className={`tutorial-scan-btn w-full py-3.5 rounded-xl font-black text-base flex items-center justify-center gap-2 transition-all shadow-xl shrink-0 ${
            actionPoints >= 3 && !isScanning
              ? 'bg-blue-600 hover:bg-blue-500 text-white active:scale-[0.98]'
              : 'bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed'
          }`}
        >
          {isScanning ? (
            '탐색 중...'
          ) : actionPoints >= 3 ? (
            <><span>🔍</span> 주변 탐색 (⚡ -3)</>
          ) : (
            '탐색 불가 (⚡ 부족)'
          )}
        </button>
      </div>

    </div>
  );
};

export default LocationModal;