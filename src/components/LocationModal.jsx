import React, { useState, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
// 💡 AudioContext 임포트 추가
import { useAudio } from '../contexts/AudioContext';

const LocationModal = ({ 
  location, inventory, maxActionPoints, actionPoints, 
  onClueFound, onScan, onClose 
}) => {
  const [discoveryText, setDiscoveryText] = useState("화면을 터치해 구역을 조사하세요.");
  const [focusedPoint, setFocusedPoint] = useState(null);
  
  const [isScanning, setIsScanning] = useState(false);

  // 💡 [핵심] 배경 이미지 페이드 인 효과를 위한 상태 추가
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // 💡 효과음 함수 가져오기
  const { playSfx } = useAudio();

  const IS_DEV_MODE = false; 

  // 장소가 바뀔 때마다 이미지 로드 상태 초기화
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
    playSfx(); // 💡 단서(히트박스) 터치 시 클릭음 추가
    setFocusedPoint(clue);
    setDiscoveryText(`[${clue.name}]\n\n${clue.desc}`);
  };

  const handleSaveToInventory = () => {
    playSfx(); // 💡 기록하기 버튼 터치 시 클릭음 추가
    if (focusedPoint && onClueFound) {
      onClueFound(focusedPoint.id);
      setDiscoveryText(`[${focusedPoint.name}] 단서를 수첩에 기록했습니다.`);
    }
  };

  const handleScanClick = () => {
    // 💡 탐색 버튼 터치 시 클릭음 추가 (disabled 상태가 아닐 때만 재생)
    if (actionPoints > 0 && !isScanning) {
      playSfx(); 
      onScan(); 
      setIsScanning(true); 
      setDiscoveryText("주변을 탐색합니다... (단서 위치가 잠시 드러납니다)");
      setFocusedPoint(null);
    }
  };

  if (!location) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-neutral-950 flex flex-col animate-fadeIn overflow-hidden pb-safe">
      
      {/* 1. 상단 헤더 */}
      <header className="shrink-0 w-full z-[80] p-3 flex justify-between items-center gap-2 bg-neutral-950 border-b border-neutral-800 shadow-md">
        <button 
          onClick={() => { playSfx(); onClose(); }} // 💡 클릭음 추가
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

      {/* 2. 중앙 배경 이미지 */}
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
              {/* 줌 컨트롤러 */}
              <div className="absolute top-4 left-4 z-[90] flex flex-col gap-2 opacity-60 hover:opacity-100 transition-opacity">
                {/* 💡 줌 버튼에도 클릭음 추가 */}
                <button onClick={() => { playSfx(); zoomIn(); }} className="w-8 h-8 bg-neutral-900/80 text-white rounded-full border border-neutral-600 backdrop-blur-sm shadow-lg font-bold">+</button>
                <button onClick={() => { playSfx(); zoomOut(); }} className="w-8 h-8 bg-neutral-900/80 text-white rounded-full border border-neutral-600 backdrop-blur-sm shadow-lg font-bold">-</button>
                <button onClick={() => { playSfx(); resetTransform(); }} className="w-8 h-8 bg-neutral-900/80 text-white rounded-full border border-neutral-600 backdrop-blur-sm shadow-lg text-[10px] font-black">R</button>
              </div>

              <TransformComponent 
                wrapperStyle={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
                contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {/* 💡 isImageLoaded 상태에 따라 opacity를 조절하여 부드러운 페이드인 효과 적용! */}
                <div 
                  className="relative max-w-full max-h-full aspect-square flex items-center justify-center transition-opacity duration-500 ease-in-out"
                  style={{ opacity: isImageLoaded ? 1 : 0 }}
                >
                  {location.backgroundUrl ? (
                    <img 
                      src={location.backgroundUrl} 
                      alt={location.name} 
                      onLoad={() => setIsImageLoaded(true)} // 💡 로드 완료 시 페이드 인 트리거
                      className="w-full h-full object-cover pointer-events-none select-none opacity-80" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-500 font-bold border border-neutral-800 rounded-xl bg-neutral-900">
                      [{location.name}] 이미지 없음 
                    </div>
                  )}

                  {/* 💡 히트박스도 이미지가 로드된 후에만 스르륵 나타나게 처리 */}
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
                            className={`absolute rounded-xl transition-all duration-300 ${
                              IS_DEV_MODE 
                                ? `border-2 ${isFocused ? 'border-blue-400 bg-blue-400/30 shadow-[0_0_15px_rgba(96,165,250,0.5)]' : (isFound ? 'border-emerald-500 bg-emerald-500/20' : 'border-red-500 bg-red-500/20')}`
                                : (isFocused ? 'border-2 border-blue-400 bg-blue-400/30 shadow-[0_0_15px_rgba(96,165,250,0.5)]' : 'bg-transparent border-none')
                            }`}
                          >
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

      {/* 3. 하단 패널 및 컨트롤러 */}
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
              <button 
                onClick={handleSaveToInventory}
                className="w-full h-full bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <span>📌</span> 기록하기
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

        <button 
          onClick={handleScanClick}
          disabled={actionPoints <= 0 || isScanning}
          className={`w-full py-3.5 rounded-xl font-black text-base flex items-center justify-center gap-2 transition-all shadow-xl shrink-0 ${
            actionPoints > 0 && !isScanning
              ? 'bg-blue-600 hover:bg-blue-500 text-white active:scale-[0.98]'
              : 'bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed'
          }`}
        >
          {isScanning ? (
            '탐색 중...'
          ) : actionPoints > 0 ? (
            <><span>🔍</span> 주변 탐색 (⚡ -1)</>
          ) : (
            '탐색 불가 (⚡ 부족)'
          )}
        </button>
      </div>

    </div>
  );
};

export default LocationModal;