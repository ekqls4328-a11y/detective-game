import React, { useState, useEffect } from 'react';

const LocationModal = ({ 
  location, inventory, maxActionPoints, actionPoints, // 💡 여기에 maxActionPoints 추가!
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
    setDiscoveryText(`[${clue.name}] ${clue.desc}`);
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
      onScan(); // PlayScreen의 AP 1 차감 함수 실행
      setIsScanning(true); // 스캔 이펙트 켜기
      setDiscoveryText("주변을 탐색합니다... (단서 위치가 잠시 드러납니다)");
      setFocusedPoint(null);
    }
  };

  if (!location) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-neutral-950 flex flex-col animate-fadeIn overflow-hidden">
      
      {/* 상단 헤더 */}
      <header className="absolute top-0 w-full z-[80] p-3 flex justify-between items-center gap-2 bg-gradient-to-b from-black/80 to-transparent">
        {/* 왼쪽: 이탈 버튼 */}
        <button onClick={onClose} className="text-white text-xs font-bold px-3 py-1.5 bg-neutral-800/80 rounded-full border border-neutral-600 backdrop-blur-md active:scale-95 whitespace-nowrap shrink-0">
          &lt; 현장 이탈
        </button>
        
        {/* 오른쪽: AP 및 현장 이름 */}
        <div className="flex items-center gap-1.5 min-w-0 justify-end flex-1">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full border backdrop-blur-sm transition-colors shrink-0 ${
            actionPoints <= 1 ? 'bg-red-900/70 border-red-500 text-red-400 animate-pulse' : 'bg-black/50 border-neutral-700 text-neutral-300'
          }`}>
            <span className="text-xs">⚡</span>
            <span className="text-[10px] font-black tracking-widest mt-px">
              {actionPoints} <span className="text-neutral-500 mx-0.5">/</span> {maxActionPoints || 3}
            </span>
          </div>

          {/* 구역 이름 (길면 잘리도록 max-w 설정) */}
          <span className="text-blue-400 font-black bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm text-[11px] border border-blue-900/50 truncate shrink-0 max-w-[110px]">
            {location.name}
          </span>
        </div>
      </header>

      {/* 중앙 배경 이미지 및 히트박스 영역 */}
      <div className="flex-1 relative flex items-center justify-center bg-black">
        {/* 배경 일러스트 (location 데이터에 backgroundUrl 필요) */}
        {location.backgroundUrl ? (
          <img 
            src={location.backgroundUrl} 
            alt={location.name} 
            className="w-full h-full object-cover pointer-events-none select-none opacity-80" 
          />
        ) : (
          <div className="text-neutral-500 font-bold">[{location.name}] 배경 이미지 준비 중</div>
        )}

        {/* 단서 히트박스 레이어 */}
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
                  isFocused ? 'border-2 border-blue-400 bg-blue-400/30' : 'bg-transparent border-none'
                }`}
              >
                {/* 스캔(isScanning) 중일 때만 파동(ping) 애니메이션 표시 */}
                {isScanning && !isFound && (
                  <span className="absolute inset-0 rounded-xl bg-amber-400/40 animate-ping" />
                )}
                {/* 이미 찾은 단서는 스캔 시 녹색으로 짧게 표시 */}
                {isScanning && isFound && (
                  <span className="absolute inset-0 rounded-xl bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                )}
              </button>
            );
          })}
        </div>
        
        {/* 스캔 시 화면 전체에 아주 살짝 파란빛 플래시 효과 */}
        {isScanning && <div className="absolute inset-0 bg-blue-500/10 pointer-events-none animate-pulse mix-blend-overlay" />}
      </div>

      {/* 하단 패널 및 컨트롤러 */}
      <div className="absolute bottom-0 w-full z-[80] bg-gradient-to-t from-black via-neutral-950/95 to-transparent p-6 flex flex-col gap-4 pb-8">
        
        {/* 조사 텍스트 창 */}
        <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-700 p-4 rounded-2xl shadow-2xl flex flex-col gap-3 min-h-[5rem] justify-center">
          <p className="text-sm leading-relaxed text-white">
            {discoveryText}
          </p>

          {/* 인벤토리 수동 추가 버튼 */}
          {focusedPoint && !inventory?.includes(focusedPoint.id) && (
            <button 
              onClick={handleSaveToInventory}
              className="mt-2 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>📌</span> 이 단서를 수첩에 기록하기
            </button>
          )}

          {focusedPoint && inventory?.includes(focusedPoint.id) && (
            <div className="mt-2 w-full py-2 text-center text-xs text-emerald-400 font-bold bg-emerald-950/30 rounded-lg border border-emerald-900/50">
              이미 수집된 단서입니다
            </div>
          )}
        </div>

        {/* 주변 탐색 (스캔) 버튼 */}
        <button 
          onClick={handleScanClick}
          disabled={actionPoints <= 0 || isScanning}
          className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all shadow-xl ${
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