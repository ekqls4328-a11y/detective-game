import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const AudioContext = createContext();

export const useAudio = () => useContext(AudioContext);

export const AudioProvider = ({ children }) => {
  const [bgmVolume, setBgmVolume] = useState(0.5);
  const [sfxVolume, setSfxVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  // 💡 오디오 객체 및 페이드 타이머 참조
  const bgmAudio = useRef(new Audio()); 
  const clickSfx = useRef(new Audio('/audio/click.wav')); // 실제 클릭음 경로 필요
  const fadeIntervalRef = useRef(null); // 페이드 효과 겹침 방지용

  // 컴포넌트 마운트/언마운트 및 BGM 루프 설정
  useEffect(() => {
    bgmAudio.current.loop = true;
    
    // 앱이 꺼지거나 Provider가 언마운트 될 때 메모리 누수 방지
    return () => {
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    };
  }, []);

  // 설정창에서 볼륨 및 음소거 상태 변경 시 즉각 반영
  useEffect(() => {
    bgmAudio.current.volume = isMuted ? 0 : bgmVolume;
    clickSfx.current.volume = isMuted ? 0 : sfxVolume;
  }, [bgmVolume, sfxVolume, isMuted]);

  // 💡 [핵심] 자연스러운 크로스페이드가 적용된 BGM 변경 함수
  const changeAndPlayBgm = (bgmSrc) => {
    if (!bgmSrc) return;
    const audio = bgmAudio.current;

    // 1. 이미 같은 BGM이 세팅되어 있을 때
    if (audio.src.endsWith(bgmSrc)) {
      if (audio.paused && !isMuted) {
        audio.play().catch(e => console.log("오디오 자동재생 차단됨:", e));
      }
      return;
    }

    // 2. 기존 페이드 효과가 진행 중이라면 강제 중지 (연속 클릭 시 꼬임 방지)
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }

    // 3. 목표 볼륨 설정 (음소거면 0, 아니면 설정된 bgmVolume)
    const targetVolume = isMuted ? 0 : bgmVolume;

    // 4. 현재 음악이 멈춰있거나 음소거 상태면 페이드 아웃 없이 바로 교체
    if (audio.paused || audio.volume === 0) {
      audio.src = bgmSrc;
      audio.volume = targetVolume;
      if (!isMuted) {
        audio.play().catch(e => console.log("오디오 자동재생 차단됨:", e));
      }
      return;
    }

    // 💡 5. 자연스러운 Fade Out -> 교체 -> Fade In 로직
    const fadeStep = 0.05;
    const fadeSpeed = 50; // 50ms마다 볼륨 조정

    // [Fade Out]
    fadeIntervalRef.current = setInterval(() => {
      // 부동소수점 오류 방지를 위해 Math.max 사용 (0 밑으로 안 내려가게)
      if (audio.volume > fadeStep) {
        audio.volume = Math.max(0, audio.volume - fadeStep);
      } else {
        // 볼륨이 0에 도달하면
        clearInterval(fadeIntervalRef.current);
        audio.pause();
        audio.volume = 0;
        
        // 새 소스로 교체 및 로드
        audio.src = bgmSrc;
        audio.load();

        if (!isMuted) {
          audio.play().then(() => {
            // [Fade In]
            fadeIntervalRef.current = setInterval(() => {
              // 목표 볼륨(targetVolume)까지만 소리를 서서히 키움
              if (audio.volume < targetVolume - fadeStep) {
                audio.volume = Math.min(targetVolume, audio.volume + fadeStep);
              } else {
                // 목표 볼륨에 도달하면 타이머 종료
                audio.volume = targetVolume;
                clearInterval(fadeIntervalRef.current);
              }
            }, fadeSpeed);
          }).catch(e => console.log("오디오 재생 실패:", e));
        }
      }
    }, fadeSpeed);
  };

  const stopBgm = () => {
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
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
      changeAndPlayBgm, 
      stopBgm, playSfx
    }}>
      {children}
    </AudioContext.Provider>
  );
};