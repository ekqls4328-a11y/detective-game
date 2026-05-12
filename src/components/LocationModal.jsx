import React, { useState, useEffect } from 'react';

const LocationModal = ({ 
  location, inventory, maxActionPoints, actionPoints, 
  onClueFound, onScan, onClose 
}) => {
  const [discoveryText, setDiscoveryText] = useState("화면을 터치해 구역을 조사하세요.");
  const [focusedPoint, setFocusedPoint] = useState(null);
  
  // 스캔(탐색) 애니메이션 상태
  const [isScanning, setIsScanning] = useState(false);

  // 스캔 상태가 켜지면 1.5초 뒤에 자동으로 꺼지게 하는 로직
  useEffect(() => {
    if (isScanning) {
      const timer = setTimeout(() => setIsScanning(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isScanning]);

  const handlePointClick = (e, clue) => {
    e.stopPropagation(); 
    setFocusedPoint(clue);
    setDiscoveryText(`[${clue.name}]\n\n${clue.desc}`); // 💡 가독성을 위해 줄바꿈 추가
  };

  const handleSaveToInventory = () => {
    if (focusedPoint && onClueFound) {
      onClueFound(focusedPoint.id);
      setDiscoveryText(`[${focusedPoint.name}] 단서를 수첩에 기록했습니다.`);
    }
  };

  // 스캔 버튼 클릭 로직
  const handleScanClick = () => {
    if (actionPoints > 0 && !isScanning) {
      onScan(); 
      setIsScanning(true); 
      setDiscoveryText("주변을 탐색합니다... (단서 위치가 잠시 드러납니다)");
      setFocusedPoint(null);
    }
  };

  if (!location) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-neutral-950 flex flex-col animate-fadeIn overflow-hidden pb-safe">
      
      {/* 1. 상단 헤더 (shrink-0으로 고정) */}
      <header className="shrink-0 w-full z-[80] p-3 flex justify-between items-center gap-2 bg-neutral-950 border-b border-neutral-800 shadow-md">
        <button onClick={onClose} className="text-white text-xs font-bold px-4 py-2 bg-neutral-800 rounded-full border border-neutral-600 active:scale-95 whitespace-nowrap shrink-0 hover:bg-neutral-700 transition-all">
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

          <span className="text-blue-400 font-black bg-neutral-800 px-3 py-1 rounded-full text-[11px] border border-blue-900/50 truncate shrink-0 max-w-[130px]">
            {location.name}
          </span>
        </div>
      </header>

      {/* 💡 2. 중앙 배경 이미지 및 히트박스 영역 (Shrink-Wrap 기법 적용) */}
      <div className="flex-1 min-h-0 flex items-center justify-center bg-black overflow-hidden relative">
        <div className="relative inline-flex justify-center items-center max-w-full max-h-full">
          {location.backgroundUrl ? (
            <img 
              src={location.backgroundUrl} 
              alt={location.name} 
              // w-full h-full object-cover 대신 컨테이너 크기에 맞게 조절되도록 수정
              className="max-w-full max-h-full block pointer-events-none select-none opacity-80" 
            />
          ) : (
            <div className="w-[300px] h-[200px] flex items-center justify-center text-neutral-500 font-bold border border-neutral-800 rounded-xl bg-neutral-900">
              [{location.name}] 이미지 없음
            </div>
          )}

          {/* 히트박스 레이어 */}
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
                    isFocused ? 'border-2 border-blue-400 bg-blue-400/30 shadow-[0_0_15px_rgba(96,165,250,0.5)]' : 'bg-transparent border-none'
                  }`}
                >
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
        </div>
        
        {isScanning && <div className="absolute inset-0 bg-blue-500/10 pointer-events-none animate-pulse mix-blend-overlay" />}
      </div>

      {/* 💡 3. 하단 패널 및 컨트롤러 (높이 철통 고정) */}
      <div className="shrink-0 w-full z-[80] bg-neutral-950 border-t border-neutral-800 p-3 pb-6 flex flex-col gap-2.5 shadow-2xl">
        
        {/* 조사 텍스트 창 (높이 80px로 다이어트) */}
        <div className="bg-neutral-900 border border-neutral-700 px-3 py-2.5 rounded-xl shadow-inner relative flex flex-col h-[80px]">
          <div className="overflow-y-auto h-full pr-1 pb-1">
            <p className="text-[13px] leading-snug text-gray-100 whitespace-pre-wrap break-keep select-none">
              {discoveryText}
            </p>
          </div>
          <div className="absolute bottom-1 left-1 right-2 h-4 bg-gradient-to-t from-neutral-900 via-neutral-900/50 to-transparent pointer-events-none rounded-b-lg" />
        </div>

        {/* 💡 [핵심] 단서 기록 버튼 영역 높이 48px 고정 (이 박스 때문에 이미지가 안 흔들림!) */}
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

        {/* 주변 탐색 (스캔) 버튼 */}
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
            '탐색 불가 (AP 부족)'
          )}
        </button>
      </div>

    </div>
  );
};

export default LocationModal;