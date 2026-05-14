import React from 'react';
import { useAudio } from '../contexts/AudioContext';

const SettingsModal = ({ onClose }) => {
  // 💡 playSfx 가져오기
  const { bgmVolume, setBgmVolume, sfxVolume, setSfxVolume, isMuted, setIsMuted, playSfx } = useAudio();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn p-6">
      <div className="bg-neutral-900 border border-neutral-700 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative">
        <button 
          onClick={() => { playSfx(); onClose(); }} // 💡 상단 닫기 버튼 클릭음
          className="absolute top-4 right-4 text-neutral-500 hover:text-white font-bold text-xl"
        >
          ✕
        </button>
        
        <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
          <span>⚙️</span> 환경 설정
        </h2>

        <div className="space-y-6">
          {/* 전체 음소거 토글 */}
          <div className="flex justify-between items-center bg-neutral-800 p-4 rounded-xl border border-neutral-700">
            <span className="font-bold text-white">전체 소리 끄기</span>
            <button 
              onClick={() => { playSfx(); setIsMuted(!isMuted); }} // 💡 음소거 토글 클릭음
              className={`w-14 h-8 rounded-full transition-colors relative ${isMuted ? 'bg-red-600' : 'bg-neutral-600'}`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${isMuted ? 'right-1' : 'left-1'}`} />
            </button>
          </div>

          {/* 배경음악 볼륨 조절 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-bold">
              <span className="text-neutral-300">배경음악 (BGM)</span>
              <span className="text-neutral-500">{Math.round(bgmVolume * 100)}%</span>
            </div>
            {/* 💡 슬라이더에는 클릭음을 넣지 않습니다 (렉 방지) */}
            <input 
              type="range" min="0" max="1" step="0.1" 
              value={bgmVolume} 
              onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
              disabled={isMuted}
              className="w-full accent-emerald-500 disabled:opacity-50"
            />
          </div>

          {/* 효과음 볼륨 조절 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-bold">
              <span className="text-neutral-300">효과음 (SFX)</span>
              <span className="text-neutral-500">{Math.round(sfxVolume * 100)}%</span>
            </div>
            <input 
              type="range" min="0" max="1" step="0.1" 
              value={sfxVolume} 
              onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
              disabled={isMuted}
              className="w-full accent-emerald-500 disabled:opacity-50"
            />
          </div>
        </div>

        <button 
          onClick={() => { playSfx(); onClose(); }} // 💡 하단 닫기 버튼 클릭음
          className="w-full mt-8 py-4 bg-neutral-100 text-black font-black rounded-xl hover:bg-white active:scale-95 transition-all"
        >
          닫기
        </button>
      </div>
    </div>
  );
};

export default SettingsModal;