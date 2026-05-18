import React from 'react';
import { useAudio } from '../contexts/AudioContext';

const AdConfirmModal = ({ type, onConfirm, onCancel }) => {
  const { playSfx } = useAudio();

  const isAp = type === 'ap';
  
  // 💡 타입에 따라 문구와 아이콘이 자동으로 바뀜
  const title = isAp ? "행동력 소진" : "추리 실패 위기";
  const desc = isAp
    ? "모든 행동력을 소진했습니다.\n광고를 시청하고 행동력을 가득 충전하시겠습니까?"
    : "모든 추리 기회를 잃었습니다.\n광고를 시청하고 마지막 기회를 1번 얻으시겠습니까?";
  const icon = isAp ? "⚡" : "🚨";
  const confirmText = "광고 보고 충전하기";
  const cancelText = isAp ? "수사 종결하기 (추리 이동)" : "포기하기 (게임 오버)";

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 animate-fadeIn">
      {/* 배경 블러 처리 (클릭 시 취소) */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { playSfx(); onCancel(); }} />
      
      {/* 모달 본체 */}
      <div className="bg-neutral-900 border border-neutral-700 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative z-10 text-center animate-slideUp">
        <div className="text-5xl mb-4">{icon}</div>
        <h2 className="text-2xl font-black text-white mb-3">{title}</h2>
        <p className="text-sm text-neutral-400 leading-relaxed whitespace-pre-wrap mb-8">
          {desc}
        </p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={() => { playSfx(); onConfirm(); }}
            className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_0_15px_rgba(217,119,6,0.3)]"
          >
            <span>📺</span> {confirmText}
          </button>
          <button
            onClick={() => { playSfx(); onCancel(); }}
            className="w-full py-4 bg-neutral-800 text-neutral-400 font-bold rounded-xl border border-neutral-700 active:scale-95 transition-all hover:bg-neutral-700"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdConfirmModal;