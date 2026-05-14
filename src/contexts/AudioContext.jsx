import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const AudioContext = createContext();

export const useAudio = () => useContext(AudioContext);

export const AudioProvider = ({ children }) => {
  const [bgmVolume, setBgmVolume] = useState(0.5);
  const [sfxVolume, setSfxVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  // 💡 초기 BGM 경로는 비워두고 Audio 객체만 생성
  const bgmAudio = useRef(new Audio()); 
  const clickSfx = useRef(new Audio('/audio/click.mp3')); // 실제 클릭음 경로 필요

  // BGM 루프 설정
  useEffect(() => {
    bgmAudio.current.loop = true;
  }, []);

  // 볼륨 및 음소거 상태 적용
  useEffect(() => {
    bgmAudio.current.volume = isMuted ? 0 : bgmVolume;
    clickSfx.current.volume = isMuted ? 0 : sfxVolume;
  }, [bgmVolume, sfxVolume, isMuted]);

  // 💡 [핵심] 시나리오별 BGM 변경 및 재생 함수
  const changeAndPlayBgm = (bgmSrc) => {
    if (!bgmSrc) return;

    // 브라우저는 오디오 src를 절대 경로(http://...)로 변환하므로 endsWith로 비교하는 게 안전함
    if (bgmAudio.current.src.endsWith(bgmSrc)) {
      // 이미 같은 BGM이 세팅되어 있고 멈춰있는 상태라면 재생만 시킴
      if (bgmAudio.current.paused && !isMuted) {
        bgmAudio.current.play().catch(e => console.log("오디오 자동재생 차단됨:", e));
      }
      return;
    }

    // 다른 BGM이 들어왔다면 기존 BGM 정지 후 소스 교체
    bgmAudio.current.pause();
    bgmAudio.current.src = bgmSrc;
    
    if (!isMuted) {
      bgmAudio.current.play().catch(e => console.log("오디오 자동재생 차단됨:", e));
    }
  };

  const stopBgm = () => {
    bgmAudio.current.pause();
    bgmAudio.current.currentTime = 0;
  };

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
      changeAndPlayBgm, // 💡 playBgm 대신 이걸 내보냄
      stopBgm, playSfx
    }}>
      {children}
    </AudioContext.Provider>
  );
};