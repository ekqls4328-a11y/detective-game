import React from 'react';
import { useAudio } from '../contexts/AudioContext';

const AdConfirmModal = ({ type, onConfirm, onCancel }) => {
  const { playSfx } = useAudio();

  // 💡 타입별 설정 객체 (새로운 타입이 추가돼도 여기만 수정하면 됨)
  const config = {
    ap: {
      title: "행동력 소진",
      desc: "모든 행동력을 소진했습니다.\n광고를 시청하고 행동력을 가득 충전하시겠습니까?",
      icon: "⚡",
      confirmText: "광고 보고 충전하기",
      cancelText: "수사 종결하기 (추리 이동)",
      confirmColor: "bg-amber-600 hover:bg-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.3)]",
      btnIcon: "📺"
    },
    fail: {
      title: "추리 실패 위기",
      desc: "모든 추리 기회를 잃었습니다.\n광고를 시청하고 마지막 기회를 1번 얻으시겠습니까?",
      icon: "🚨",
      confirmText: "광고 보고 기회 얻기",
      cancelText: "포기하기 (게임 오버)",
      confirmColor: "bg-red-600 hover:bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.3)]",
      btnIcon: "📺"
    },
    truth: {
      title: "사건의 전말 확인",
      desc: "광고를 시청하고 이 사건에 숨겨진\n모든 진실과 뒷이야기를 확인하시겠습니까?",
      icon: "🎬",
      confirmText: "광고 보고 전말 확인하기",
      cancelText: "닫기",
      confirmColor: "bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]",
      btnIcon: "🎬"
    }
  };

  // 전달받은 type에 맞는 설정 가져오기 (잘못된 값이면 기본값으로 ap 세팅)
  const currentConfig = config[type] || config.ap;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 animate-fadeIn">
      {/* 배경 블러 처리 (클릭 시 취소) */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { playSfx(); onCancel(); }} />
      
      {/* 모달 본체 */}
      <div className="bg-neutral-900 border border-neutral-700 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative z-10 text-center animate-slideUp">
        <div className="text-5xl mb-4">{currentConfig.icon}</div>
        <h2 className="text-2xl font-black text-white mb-3">{currentConfig.title}</h2>
        <p className="text-sm text-neutral-400 leading-relaxed whitespace-pre-wrap mb-8">
          {currentConfig.desc}
        </p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={() => { playSfx(); onConfirm(); }}
            className={`w-full py-4 text-white font-black rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all ${currentConfig.confirmColor}`}
          >
            <span>{currentConfig.btnIcon}</span> {currentConfig.confirmText}
          </button>
          <button
            onClick={() => { playSfx(); onCancel(); }}
            className="w-full py-4 bg-neutral-800 text-neutral-400 font-bold rounded-xl border border-neutral-700 active:scale-95 transition-all hover:bg-neutral-700"
          >
            {currentConfig.cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdConfirmModal;