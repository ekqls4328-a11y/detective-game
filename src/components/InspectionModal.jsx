import React, { useState, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useAudio } from '../contexts/AudioContext';

// 💡 1. Props에 actionPoints 추가!
const InspectionModal = ({ suspect, inventory, actionPoints, onClueFound, onClose }) => {
  const [inspectionSide, setInspectionSide] = useState('front');
  const [discoveryText, setDiscoveryText] = useState("화면을 터치해 수상한 곳을 찾아보세요.");
  const [focusedPoint, setFocusedPoint] = useState(null);
  
  const [aspectRatio, setAspectRatio] = useState(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const { playSfx } = useAudio();

  const IS_DEV_MODE = true; 
  const [cursorPos, setCursorPos] = useState(null);

  const currentImageUrl = inspectionSide === 'front' ? suspect.illustration?.frontFullUrl : suspect.illustration?.backFullUrl;

  useEffect(() => {
    setIsImageLoaded(false); 
  }, [currentImageUrl]);

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (naturalWidth && naturalHeight) {
      setAspectRatio(naturalWidth / naturalHeight);
    }
    setIsImageLoaded(true);
  };

  const handlePointClick = (e, point) => {
    e.stopPropagation(); 
    playSfx(); 
    setFocusedPoint(point);
    setDiscoveryText(`[${point.name}]\n\n${point.description}`);
  };

  const handleSaveToInventory = () => {
    // 💡 버튼이 비활성화되므로 굳이 얼럿으로 막을 필요는 없지만, 혹시 모를 더블클릭 방어용!
    if (actionPoints <= 0) return; 

    playSfx(); 
    if (focusedPoint && onClueFound) {
      onClueFound(focusedPoint.id);
      setDiscoveryText(`[${focusedPoint.name}] 단서를 단서함에 추가했습니다. (⚡ -1)`);
    }
  };

  const handleMouseMove = (e) => {
    if (!IS_DEV_MODE) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCursorPos({ x: x.toFixed(1), y: y.toFixed(1) });
  };

  return (
    <div className="fixed inset-0 z-[70] bg-neutral-950 flex flex-col animate-fadeIn overflow-hidden pb-safe">
      
      {/* 1. 상단 헤더 */}
      <header className="shrink-0 w-full z-[80] p-4 flex justify-between items-center bg-neutral-950 border-b border-neutral-800 shadow-md">
        <button 
          onClick={() => { playSfx(); onClose(); }} 
          className="text-white font-bold text-xs px-4 py-2 bg-neutral-800 rounded-full border border-neutral-600 active:scale-95 transition-all hover:bg-neutral-700"
        >
          &lt; 돌아가기
        </button>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-amber-500 font-black bg-neutral-900 px-3 py-1 rounded-full border border-amber-900/30 text-[11px]">
              {suspect.name} 관찰 중
            </span>
            {IS_DEV_MODE && <span className="text-[9px] text-red-500 font-bold mt-1 tracking-tighter opacity-70">DEBUG MODE</span>}
          </div>
        </div>
      </header>

      {/* 2. 중앙 전신 이미지 및 히트박스 영역 */}
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
              {/* 줌 컨트롤러 (좌측 상단 고정) */}
              <div className="absolute top-4 left-4 z-[90] flex flex-col gap-2 opacity-60 hover:opacity-100 transition-opacity">
                <button onClick={() => { playSfx(); zoomIn(); }} className="w-8 h-8 bg-neutral-900/80 text-white rounded-full border border-neutral-600 backdrop-blur-sm shadow-lg font-bold">+</button>
                <button onClick={() => { playSfx(); zoomOut(); }} className="w-8 h-8 bg-neutral-900/80 text-white rounded-full border border-neutral-600 backdrop-blur-sm shadow-lg font-bold">-</button>
                <button onClick={() => { playSfx(); resetTransform(); }} className="w-8 h-8 bg-neutral-900/80 text-white rounded-full border border-neutral-600 backdrop-blur-sm shadow-lg text-[10px] font-black">R</button>
              </div>

              <TransformComponent 
                wrapperStyle={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
                contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "12px" }}
              >
                <div 
                  className="relative flex items-center justify-center"
                  style={{
                    aspectRatio: aspectRatio ? `${aspectRatio}` : 'auto',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    height: aspectRatio ? '100%' : 'auto',
                    width: aspectRatio ? 'auto' : 'auto',
                    opacity: isImageLoaded ? 1 : 0,
                    transition: 'opacity 0.3s ease-in-out'
                  }}
                  // 💡 마우스 이벤트 추가
                  onMouseMove={handleMouseMove}
                  onMouseLeave={() => setCursorPos(null)}
                >
                  {currentImageUrl ? (
                    <img 
                      src={currentImageUrl} 
                      alt="전신" 
                      onLoad={handleImageLoad}
                      className="w-full h-full object-fill block pointer-events-none select-none" 
                    />
                  ) : (
                    <div className="w-[200px] h-[300px] flex items-center justify-center text-neutral-600 border border-neutral-800 rounded-xl text-xs">이미지 없음</div>
                  )}

                  {/* 💡 반복문 바깥에 레이더 UI 추가 */}
                  {IS_DEV_MODE && cursorPos && (
                    <div className="absolute top-2 left-2 bg-black/90 text-emerald-400 font-mono text-[12px] font-black px-3 py-1.5 rounded-lg border border-emerald-500/50 z-[100] pointer-events-none shadow-2xl flex items-center gap-3">
                      <span>🎯 레이더 가동 중</span>
                      <span className="text-white bg-neutral-800 px-2 py-0.5 rounded border border-neutral-600">
                        top: "{cursorPos.y}%", left: "{cursorPos.x}%"
                      </span>
                    </div>
                  )}

                  {/* 히트박스 레이어 */}
                  {isImageLoaded && (
                    <div className="absolute inset-0 z-[75]">
                      {suspect.inspectionPoints?.filter(point => point.side === inspectionSide).map(point => {
                        const isFound = inventory?.includes(point.id);
                        const isFocused = focusedPoint?.id === point.id;
                        return (
                          <button
                            key={point.id}
                            onClick={(e) => handlePointClick(e, point)}
                            style={{ 
                              top: point.top, 
                              left: point.left, 
                              width: point.width, 
                              height: point.height, 
                              transform: 'translate(-50%, -50%)' 
                            }}
                            className={`absolute rounded-full transition-all duration-300 ${
                              IS_DEV_MODE 
                                ? `border-2 ${isFocused ? 'border-blue-400 bg-blue-400/30 shadow-[0_0_15px_rgba(96,165,250,0.5)]' : (isFound ? 'border-emerald-500 bg-emerald-500/10' : 'border-red-500 bg-red-500/10')}` 
                                : (isFocused ? 'border-2 border-blue-400 bg-blue-400/30 shadow-[0_0_15px_rgba(96,165,250,0.5)]' : 'bg-transparent border-none')
                            }`}
                          >
                            {IS_DEV_MODE && (
                              <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-bold bg-black/80 text-white px-1 py-0.5 rounded border border-neutral-700 opacity-60 pointer-events-none">
                                {point.id}
                              </span>
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
      </div>

      {/* 3. 하단 패널 */}
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
              // 💡 2. 기록하기 버튼 비활성화 로직 장착!
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
                이미 수집됨
              </div>
            )
          ) : (
            <div className="w-full h-full rounded-lg border border-dashed border-neutral-800 flex items-center justify-center text-neutral-600 text-xs font-bold bg-neutral-900/30">
              수상한 곳 클릭
            </div>
          )}
        </div>

        {suspect.illustration?.backFullUrl && (
          <div className="flex bg-neutral-800 rounded-xl p-1 border border-neutral-700 w-full shrink-0 h-[48px]">
            <button 
              onClick={() => { playSfx(); setInspectionSide('front'); setFocusedPoint(null); setDiscoveryText("앞모습을 보고 있습니다."); }} 
              className={`flex-1 text-xs font-black rounded-lg transition-all ${inspectionSide === 'front' ? 'bg-amber-500 text-black shadow-lg' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              앞모습
            </button>
            <button 
              onClick={() => { playSfx(); setInspectionSide('back'); setFocusedPoint(null); setDiscoveryText("뒷모습을 보고 있습니다."); }} 
              className={`flex-1 text-xs font-black rounded-lg transition-all ${inspectionSide === 'back' ? 'bg-amber-500 text-black shadow-lg' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              뒷모습
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default InspectionModal;