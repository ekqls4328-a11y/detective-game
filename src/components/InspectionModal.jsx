import React, { useState } from 'react';
import ReasoningNoteModal from './ReasoningNoteModal';

const InspectionModal = ({ suspect, inventory, onClueFound, onClose }) => {
  const [inspectionSide, setInspectionSide] = useState('front');
  const [discoveryText, setDiscoveryText] = useState("화면을 터치해 수상한 곳을 찾아보세요.");
  const [focusedPoint, setFocusedPoint] = useState(null);
  
  const [isNoteOpen, setIsNoteOpen] = useState(false);

  const IS_DEV_MODE = true; 

  const handlePointClick = (e, point) => {
    e.stopPropagation(); 
    setFocusedPoint(point);
    setDiscoveryText(`[${point.name}]\n${point.description}`);
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
      
      {/* 1. 상단 헤더 */}
      <header className="shrink-0 w-full z-[80] p-4 flex justify-between items-center bg-neutral-950 border-b border-neutral-800 shadow-md">
        <button onClick={onClose} className="text-white font-bold text-xs px-4 py-2 bg-neutral-800 rounded-full border border-neutral-600 active:scale-95 transition-all hover:bg-neutral-700">
          &lt; 돌아가기
        </button>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsNoteOpen(true)}
            className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-600 text-sm shadow-lg flex items-center justify-center active:scale-95 transition-all hover:bg-neutral-700"
          >
            📓
          </button>
          
          <div className="flex flex-col items-end">
            <span className="text-amber-500 font-black bg-neutral-900 px-3 py-1 rounded-full border border-amber-900/30 text-xs">
              {suspect.name} 관찰 중
            </span>
            {IS_DEV_MODE && <span className="text-[9px] text-red-500 font-bold mt-1 tracking-tighter">DEBUG MODE</span>}
          </div>
        </div>
      </header>

      {/* 2. 중앙 전신 이미지 및 히트박스 영역 */}
      <div className="flex-1 min-h-0 flex items-center justify-center bg-black overflow-hidden p-2">
        {/* 💡 [핵심 해결책] w-full h-full 대신 inline-flex를 사용하여 축소된 이미지 사이즈에 맞게 컨테이너가 쪼그라들게 만듦! */}
        <div className="relative inline-flex justify-center items-center max-w-full max-h-full">
          {currentImageUrl ? (
            <img 
              src={currentImageUrl} 
              alt="전신" 
              // 💡 object-contain을 빼고, 원본 비율을 유지하며 부모 영역을 넘지 않게 설정
              className="max-w-full max-h-full block pointer-events-none select-none" 
            />
          ) : (
            <div className="w-[300px] h-[500px] flex items-center justify-center text-neutral-600 border border-neutral-800 rounded-xl">이미지 없음</div>
          )}

          {/* 히트박스 레이어 (이제 이미지가 줄어든 만큼 똑같이 쪼그라들어서 위치가 완벽히 일치함) */}
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
                      transform: 'translate(-50%, -50%)'
                    }}
                    className={`absolute rounded-full transition-all duration-300 ${
                      IS_DEV_MODE 
                        ? `border-2 ${isFocused ? 'border-blue-400 bg-blue-400/30 shadow-[0_0_15px_rgba(96,165,250,0.5)]' : (isFound ? 'border-emerald-500 bg-emerald-500/10' : 'border-red-500 bg-red-500/10')}` 
                        : 'bg-transparent border-none'
                    }`}
                  >
                    {IS_DEV_MODE && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-black bg-black/80 text-white px-1.5 py-0.5 rounded border border-neutral-700">
                        {point.id}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      {/* 3. 하단 패널 및 컨트롤러 */}
      <div className="shrink-0 w-full z-[80] bg-neutral-950 border-t border-neutral-800 p-4 pb-8 flex flex-col gap-3 shadow-2xl">
        
        {/* 조사 텍스트 창 */}
        <div className="bg-neutral-900 border border-neutral-700 p-4 rounded-2xl shadow-inner relative flex flex-col h-[110px]">
          <div className="overflow-y-auto h-full pr-2 pb-2">
            <p className="text-sm leading-relaxed text-white whitespace-pre-wrap break-keep select-none">
              {discoveryText}
            </p>
          </div>
          <div className="absolute bottom-1 left-1 right-3 h-5 bg-gradient-to-t from-neutral-900 to-transparent pointer-events-none rounded-b-xl" />
        </div>

        {/* 단서 기록 버튼 (크기 고정 52px) */}
        <div className="h-[52px] w-full flex items-center justify-center shrink-0">
          {focusedPoint ? (
            !inventory?.includes(focusedPoint.id) ? (
              <button 
                onClick={handleSaveToInventory}
                className="w-full h-full bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>📌</span> 이 단서를 수첩에 기록하기
              </button>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-emerald-400 font-bold bg-emerald-950/30 rounded-xl border border-emerald-900/50">
                이미 수집된 단서입니다
              </div>
            )
          ) : (
            <div className="w-full h-full rounded-xl border border-dashed border-neutral-800 flex items-center justify-center text-neutral-600 text-xs font-bold bg-neutral-900/30">
              수상한 곳을 클릭하세요
            </div>
          )}
        </div>

        {/* 앞/뒤 전환 버튼 */}
        {suspect.illustration?.backFullUrl && (
          <div className="flex bg-neutral-800 rounded-2xl p-1 border border-neutral-700 w-full shrink-0">
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

      {isNoteOpen && <ReasoningNoteModal onClose={() => setIsNoteOpen(false)} />}
    </div>
  );
};

export default InspectionModal;