import React, { useState } from 'react';

const InspectionModal = ({ suspect, inventory, onClueFound, onClose }) => {
  const [inspectionSide, setInspectionSide] = useState('front');
  const [discoveryText, setDiscoveryText] = useState("화면을 터치해 수상한 곳을 찾아보세요.");
  
  // 💡 현재 유저가 터치해서 보고 있는 단서 정보 저장
  const [focusedPoint, setFocusedPoint] = useState(null);

  const IS_DEV_MODE = true; 

  const handlePointClick = (e, point) => {
    // 💡 이벤트 버블링 방지 (이미지 클릭과 겹치지 않게)
    e.stopPropagation(); 
    
    setFocusedPoint(point);
    setDiscoveryText(`[${point.name}] ${point.description}`);
  };

  const handleSaveToInventory = () => {
    if (focusedPoint && onClueFound) {
      onClueFound(focusedPoint.id);
      setDiscoveryText(`[${focusedPoint.name}] 단서를 수첩에 기록했습니다.`);
    }
  };

  const currentImageUrl = inspectionSide === 'front' ? suspect.illustration?.frontFullUrl : suspect.illustration?.backFullUrl;

  return (
    <div className="fixed inset-0 z-[70] bg-neutral-950 flex flex-col animate-fadeIn overflow-hidden">
      
      {/* 상단 헤더 */}
      <header className="absolute top-0 w-full z-[80] p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={onClose} className="text-white font-bold px-4 py-2 bg-neutral-800/80 rounded-full border border-neutral-600 backdrop-blur-md active:scale-95">
          &lt; 돌아가기
        </button>
        <div className="flex flex-col items-end">
          <span className="text-amber-500 font-black bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm text-sm">
            {suspect.name} 관찰 중
          </span>
          {IS_DEV_MODE && <span className="text-[10px] text-red-500 font-bold mt-1 tracking-tighter">DEBUG MODE ACTIVE</span>}
        </div>
      </header>

      {/* 중앙 전신 이미지 및 히트박스 영역 */}
      <div className="flex-1 relative flex items-center justify-center pt-16 pb-32">
        <div className="relative w-full h-full max-w-md mx-auto">
          {currentImageUrl ? (
            <img 
              src={currentImageUrl} 
              alt="전신" 
              className="w-full h-full object-contain pointer-events-none select-none" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-600">이미지 없음</div>
          )}

          {/* 💡 히트박스 레이어 (z-index를 높게 설정해서 터치 우선순위 확보) */}
          <div className="absolute inset-0 z-[75]">
            {suspect.inspectionPoints
              ?.filter(point => point.side === inspectionSide)
              .map(point => {
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
                      transform: 'translate(-50%, -50%)' // 좌표 기준점을 중앙으로 맞춤
                    }}
                    className={`absolute rounded-full transition-all duration-300 ${
                      IS_DEV_MODE 
                        ? `border-2 ${isFocused ? 'border-blue-400 bg-blue-400/30' : (isFound ? 'border-emerald-500 bg-emerald-500/10' : 'border-red-500 bg-red-500/10')}` 
                        : 'bg-transparent border-none'
                    }`}
                  >
                    {IS_DEV_MODE && (
                      <span className="absolute -top-5 left-0 whitespace-nowrap text-[8px] bg-black/70 text-white px-1 rounded">
                        {point.id}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      {/* 하단 패널 및 컨트롤러 */}
      <div className="absolute bottom-0 w-full z-[80] bg-gradient-to-t from-black via-neutral-950/95 to-transparent p-6 flex flex-col gap-4">
        
        {/* 조사 텍스트 창 + 인벤토리 추가 버튼 */}
        <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-700 p-4 rounded-2xl shadow-2xl flex flex-col gap-3">
          <p className="text-sm leading-relaxed text-white min-h-[3rem]">
            {discoveryText}
          </p>

          {/* 💡 수동 인벤토리 추가 버튼: 단서를 선택했고 아직 수집 전일 때만 노출 */}
          {focusedPoint && !inventory?.includes(focusedPoint.id) && (
            <button 
              onClick={handleSaveToInventory}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>📌</span> 이 단서를 수첩에 기록하기
            </button>
          )}

          {/* 이미 수집한 경우 표시 */}
          {focusedPoint && inventory?.includes(focusedPoint.id) && (
            <div className="w-full py-2 text-center text-xs text-emerald-400 font-bold bg-emerald-950/30 rounded-lg border border-emerald-900/50">
              이미 수집된 단서입니다
            </div>
          )}
        </div>

        {/* 앞/뒤 전환 버튼 */}
        {suspect.illustration?.backFullUrl && (
          <div className="flex bg-neutral-800/50 rounded-2xl p-1.5 border border-neutral-700 backdrop-blur-md mx-auto w-full max-w-xs">
            <button 
              onClick={() => { setInspectionSide('front'); setFocusedPoint(null); setDiscoveryText("앞모습을 보고 있습니다."); }} 
              className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${inspectionSide === 'front' ? 'bg-amber-500 text-black shadow-lg' : 'text-neutral-500'}`}
            >
              앞모습
            </button>
            <button 
              onClick={() => { setInspectionSide('back'); setFocusedPoint(null); setDiscoveryText("뒷모습을 보고 있습니다."); }} 
              className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${inspectionSide === 'back' ? 'bg-amber-500 text-black shadow-lg' : 'text-neutral-500'}`}
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