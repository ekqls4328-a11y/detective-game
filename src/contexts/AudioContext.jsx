import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
// 💡 앱 상태 감지 플러그인 추가
import { App } from '@capacitor/app';

const AudioContext = createContext();

export const useAudio = () => useContext(AudioContext);

export const AudioProvider = ({ children }) => {
  const [bgmVolume, setBgmVolume] = useState(0.5);
  const [sfxVolume, setSfxVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  const bgmAudio = useRef(new Audio()); 
  const clickSfx = useRef(new Audio('/audio/click.wav')); 
  const fadeIntervalRef = useRef(null); 

  // 💡 이벤트 리스너 안에서 최신 isMuted 값을 참조하기 위한 Ref
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // 컴포넌트 마운트/언마운트 및 앱 상태 감지 로직
  useEffect(() => {
    bgmAudio.current.loop = true;

    // 💡 [핵심] 앱이 백그라운드로 가거나 다시 켜질 때를 감지
    const setupAppStateListener = async () => {
      const listener = await App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) {
          // 앱이 화면에서 사라졌을 때 (뒤로가기, 홈 버튼, 화면 꺼짐 등)
          bgmAudio.current.pause();
        } else {
          // 앱이 다시 화면에 나타났을 때 (음소거 상태가 아니면 이어서 재생)
          if (!isMutedRef.current && bgmAudio.current.src) {
            bgmAudio.current.play().catch(e => console.log("오디오 자동재생 차단됨:", e));
          }
        }
      });
      return listener;
    };

    let listenerPromise = setupAppStateListener();
    
    return () => {
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      // 언마운트 시 리스너 해제 (메모리 누수 방지)
      listenerPromise.then(listener => listener.remove());
    };
  }, []);

  useEffect(() => {
    bgmAudio.current.volume = isMuted ? 0 : bgmVolume;
    clickSfx.current.volume = isMuted ? 0 : sfxVolume;
  }, [bgmVolume, sfxVolume, isMuted]);

  const changeAndPlayBgm = (bgmSrc) => {
    if (!bgmSrc) return;
    const audio = bgmAudio.current;

    if (audio.src.endsWith(bgmSrc)) {
      if (audio.paused && !isMuted) {
        audio.play().catch(e => console.log("오디오 자동재생 차단됨:", e));
      }
      return;
    }

    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }

    const targetVolume = isMuted ? 0 : bgmVolume;

    if (audio.paused || audio.volume === 0) {
      audio.src = bgmSrc;
      audio.volume = targetVolume;
      if (!isMuted) {
        audio.play().catch(e => console.log("오디오 자동재생 차단됨:", e));
      }
      return;
    }

    const fadeStep = 0.05;
    const fadeSpeed = 50; 

    fadeIntervalRef.current = setInterval(() => {
      if (audio.volume > fadeStep) {
        audio.volume = Math.max(0, audio.volume - fadeStep);
      } else {
        clearInterval(fadeIntervalRef.current);
        audio.pause();
        audio.volume = 0;
        
        audio.src = bgmSrc;
        audio.load();

        if (!isMuted) {
          audio.play().then(() => {
            fadeIntervalRef.current = setInterval(() => {
              if (audio.volume < targetVolume - fadeStep) {
                audio.volume = Math.min(targetVolume, audio.volume + fadeStep);
              } else {
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