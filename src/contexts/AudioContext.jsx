import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const AudioContext = createContext();

export const useAudio = () => useContext(AudioContext);

export const AudioProvider = ({ children }) => {
  const [bgmVolume, setBgmVolume] = useState(0.5);
  const [sfxVolume, setSfxVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  // Audio 객체를 useRef로 관리 (리렌더링 시 초기화 방지)
  const bgmAudio = useRef(new Audio('/audio/main_bgm.mp3')); // 💡 실제 BGM 경로로 변경 필요
  const clickSfx = useRef(new Audio('/audio/click.mp3'));    // 💡 실제 클릭음 경로로 변경 필요

  // BGM 초기 설정 (무한 반복)
  useEffect(() => {
    bgmAudio.current.loop = true;
  }, []);

  // 볼륨 및 음소거 상태가 바뀔 때마다 Audio 객체에 적용
  useEffect(() => {
    bgmAudio.current.volume = isMuted ? 0 : bgmVolume;
    clickSfx.current.volume = isMuted ? 0 : sfxVolume;
  }, [bgmVolume, sfxVolume, isMuted]);

  // BGM 재생/정지 함수
  const playBgm = () => {
    if (!isMuted) bgmAudio.current.play().catch(e => console.log("오디오 자동재생 차단됨:", e));
  };
  const stopBgm = () => {
    bgmAudio.current.pause();
    bgmAudio.current.currentTime = 0;
  };

  // 효과음 재생 함수 (클릭할 때마다 처음부터 재생되도록 currentTime 초기화)
  const playSfx = () => {
    if (!isMuted) {
      clickSfx.current.currentTime = 0;
      clickSfx.current.play().catch(e => console.log("효과음 재생 차단됨:", e));
    }
  };

  return (
    <AudioContext.Provider value={{
      bgmVolume, setBgmVolume,
      sfxVolume, setSfxVolume,
      isMuted, setIsMuted,
      playBgm, stopBgm, playSfx
    }}>
      {children}
    </AudioContext.Provider>
  );
};