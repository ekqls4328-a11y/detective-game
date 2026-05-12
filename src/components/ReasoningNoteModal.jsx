import React, { useState } from 'react';

const ReasoningNoteModal = ({ onClose }) => {
  // 로컬 스토리지에서 기존 메모 불러오기
  const [noteText, setNoteText] = useState(() => {
    return localStorage.getItem('detective_note') || "";
  });
  const [isEditing, setIsEditing] = useState(false);

  // 저장 로직
  const handleSave = () => {
    localStorage.setItem('detective_note', noteText);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center">
      {/* 배경 블러 */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fadeIn" onClick={onClose} />

      {/* 노트 본체 (다크 테마 적용) */}
      <div className="relative w-full max-w-lg bg-neutral-900 h-[75vh] rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-slideUp border-t border-neutral-700">
        
        {/* 핸들 바 */}
        <div className="w-full flex justify-center py-3 bg-neutral-950">
          <div className="w-12 h-1.5 bg-neutral-700 rounded-full" />
        </div>

        {/* 헤더 영역 */}
        <header className="px-6 pb-4 pt-1 bg-neutral-950 flex justify-between items-center border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">📓</span>
            <h2 className="text-lg font-black text-white">추리 노트</h2>
          </div>
          
          <div className="flex gap-2 items-center">
            {isEditing ? (
              <button 
                onClick={handleSave}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-full shadow-md active:scale-95 transition-all"
              >
                저장하기
              </button>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-4 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white text-sm font-bold rounded-full shadow-md active:scale-95 transition-all"
              >
                기록 수정
              </button>
            )}
            <button 
              onClick={onClose} 
              className="ml-1 w-8 h-8 flex items-center justify-center bg-neutral-800 rounded-full text-neutral-400 font-bold hover:text-white hover:bg-neutral-700 transition-all active:scale-95"
            >
              ✕
            </button>
          </div>
        </header>

        {/* 메모 영역: 다크 테마 및 모바일 타자 환경 최적화 */}
        <div className="flex-1 p-6 bg-neutral-900 overflow-y-auto">
          {isEditing ? (
            <textarea
              autoFocus
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="사건의 모순점이나 범인에 대한 단서를 자유롭게 기록하세요..."
              className="w-full h-full bg-transparent border-none focus:ring-0 text-gray-100 leading-relaxed resize-none p-0 text-sm font-medium placeholder-neutral-600 scrollbar-hide outline-none"
              style={{ lineHeight: '1.8rem' }}
            />
          ) : (
            <div 
              className="w-full h-full text-gray-100 leading-relaxed whitespace-pre-wrap break-keep text-sm font-medium"
              style={{ lineHeight: '1.8rem' }}
            >
              {noteText || <span className="text-neutral-600 italic">기록된 내용이 없습니다. '기록 수정'을 눌러 추리를 시작하세요.</span>}
            </div>
          )}
        </div>

        {/* 하단 여백 (모바일 키보드 띄워졌을 때 여유 공간) */}
        <div className="h-8 bg-neutral-900 shrink-0" />
      </div>
    </div>
  );
};

export default ReasoningNoteModal;