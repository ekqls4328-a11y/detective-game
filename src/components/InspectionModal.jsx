import React, { useState, useEffect } from 'react';
import ReasoningNoteModal from './ReasoningNoteModal';

const InspectionModal = ({ suspect, inventory, onClueFound, onClose }) => {
  const [inspectionSide, setInspectionSide] = useState('front');
  const [discoveryText, setDiscoveryText] = useState("화면을 터치해 수상한 곳을 찾아보세요.");
  const [focusedPoint, setFocusedPoint] = useState(null);
  const [isNoteOpen, setIsNoteOpen] = useState(false);

  // 💡 [핵심 해결책] 이미지의 원본 비율을 저장할 상태 추가
  const [aspectRatio, setAspectRatio] = useState(null);

  const IS_DEV_MODE = true; 

  const currentImageUrl = inspectionSide === 'front' ? suspect.illustration?.frontFullUrl : suspect.illustration?.backFullUrl;

  // 이미지가 바뀔 때마다 비율 초기화
  useEffect(() => {
    setAspectRatio(null);
  }, [currentImageUrl]);

  // 이미지가 로드되면 원본 가로/세로 비율을 계산해서 저장
  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (naturalWidth && naturalHeight) {
      setAspectRatio(naturalWidth / naturalHeight);
    }
  };

  const handlePointClick = (e, point) => {
    e.stopPropagation(); 
    setFocusedPoint(point);
    setDiscoveryText(`[${point.name}]\n\n${point.description}`);
  };

  const handleSaveToInventory = () => {
    if (focusedPoint && onClueFound) {
      onClueFound(focusedPoint.id);
      setDiscoveryText(`[${focusedPoint.name}] 단서를 수첩에 기록했습니다.`);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-neutral-950 flex flex-col animate-fadeIn overflow-hidden pb-safe">
      
      {/* 1. 상단 헤더 */}
      <header className="shrink-0 w-full z-[80] p-4 flex justify-between items-center bg-neutral-950 border-b border-neutral-800 shadow-md">
        <button onClick={onClose} className="text-white font-bold text-xs px-4 py-2 bg-neutral-800 rounded-full border border-neutral-600 active:scale-95 transition-all hover:bg-neutral-700">
          &lt; 돌아가기
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsNoteOpen(true)} className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-600 text-sm shadow-lg flex items-center justify-center active:scale-95 transition-all hover:bg-neutral-700">
            📓
          </button>
          <div className="flex flex-col items-end">
            <span className="text-amber-500 font-black bg-neutral-900 px-3 py-1 rounded-full border border-amber-900/30 text-[11px]">
              {suspect.name} 관찰 중
            </span>
            {IS_DEV_MODE && <span className="text-[9px] text-red-500 font-bold mt-1 tracking-tighter opacity-70">DEBUG MODE</span>}
          </div>
        </div>
      </header>

      {/* 2. 중앙 전신 이미지 및 히트박스 영역 */}
      <div className="flex-1 min-h-0 flex items-center justify-center bg-black overflow-hidden p-3 relative">
        <div className="w-full h-full flex items-center justify-center">
          
          {/* 💡 컨테이너 비율 강제 고정 (Aspect Ratio 박스) */}
          <div 
            className="relative"
            style={{
              // 이미지가 로드되어 비율을 알면 강제 적용, 모르면 auto
              aspectRatio: aspectRatio ? `${aspectRatio}` : 'auto',
              // 부모 공간을 절대 넘지 못하게 가둬둠
              maxWidth: '100%',
              maxHeight: '100%',
              // 너비와 높이를 비율에 맞게 꽉 채우도록 유도
              height: aspectRatio ? '100%' : 'auto',
              width: aspectRatio ? 'auto' : 'auto',
              // 비율이 계산되기 전까진 투명하게 처리 (깜빡임 방지)
              opacity: aspectRatio ? 1 : 0,
              transition: 'opacity 0.3s'
            }}
          >
            {currentImageUrl ? (
              <img 
                src={currentImageUrl} 
                alt="전신" 
                onLoad={handleImageLoad}
                // 컨테이너가 원본 비율과 일치하므로 object-fill을 써도 절대 찌그러지지 않음
                className="w-full h-full object-fill block pointer-events-none select-none" 
              />
            ) : (
              <div className="w-[200px] h-[300px] flex items-center justify-center text-neutral-600 border border-neutral-800 rounded-xl text-xs">이미지 없음</div>
            )}

            {/* 히트박스 레이어 (컨테이너가 비율을 지키므로 절대 위치가 틀어지지 않음) */}
            {aspectRatio && (
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
                          ? `border-2 ${isFocused ? 'border-blue-400 bg-blue-400/30' : (isFound ? 'border-emerald-500 bg-emerald-500/10' : 'border-red-500 bg-red-500/10')}` 
                          : 'bg-transparent border-none'
                      }`}
                    >
                      {IS_DEV_MODE && (
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-bold bg-black/80 text-white px-1 py-0.5 rounded border border-neutral-700 opacity-60">
                          {point.id}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
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
              <button onClick={handleSaveToInventory} className="w-full h-full bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 text-sm">
                <span>📌</span> 기록하기
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
          <div className="flex bg-neutral-800 rounded-xl p-1 border border-neutral-700 w-full shrink-0">
            <button onClick={() => { setInspectionSide('front'); setFocusedPoint(null); setDiscoveryText("앞모습을 보고 있습니다."); }} className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${inspectionSide === 'front' ? 'bg-amber-500 text-black shadow-lg' : 'text-neutral-500'}`}>앞모습</button>
            <button onClick={() => { setInspectionSide('back'); setFocusedPoint(null); setDiscoveryText("뒷모습을 보고 있습니다."); }} className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${inspectionSide === 'back' ? 'bg-amber-500 text-black shadow-lg' : 'text-neutral-500'}`}>뒷모습</button>
          </div>
        )}
      </div>

      {isNoteOpen && <ReasoningNoteModal onClose={() => setIsNoteOpen(false)} />}
    </div>
  );
};

export default InspectionModal;