import React, { useState, useEffect, useRef } from 'react';

const TypewriterText = ({ text, speed = 40, onComplete, forceSkip }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  const audioRef = useRef(typeof Audio !== "undefined" ? new Audio('/sounds/blip.mp3') : null);
  
  // 💡 스킵 여부와 완료 상태를 안전하게 추적하는 Ref
  const isDone = useRef(false);

  useEffect(() => {
    // 시작할 때 확실하게 빈 문자열로 초기화
    setDisplayedText('');
    isDone.current = false;
    let currentIndex = 0;

    if (audioRef.current) {
      audioRef.current.volume = 0.3;
    }

    const typingInterval = setInterval(() => {
      // 💡 [추가] 스킵이 발동되었거나 완료되었으면 기존 타이머 헛도는 것 방지
      if (isDone.current) {
        clearInterval(typingInterval);
        return;
      }

      if (currentIndex < text.length) {
        // 🔥 [기존 핵심 로직 유지] 원본 텍스트에서 잘라오기
        setDisplayedText(text.substring(0, currentIndex + 1));
        
        const currentChar = text[currentIndex];
        
        if (currentChar !== ' ' && currentChar !== '\n' && audioRef.current) {
           if (currentIndex % 2 === 0) { 
              audioRef.current.currentTime = 0; 
              audioRef.current.play().catch((e) => {});
           }
        }
        
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        isDone.current = true;
        if (onComplete) onComplete();
      }
    }, speed);

    return () => {
        clearInterval(typingInterval);
        if(audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    }
  }, [text, speed]);

  // 💡 [추가] 부모 컴포넌트에서 강제 스킵(forceSkip)을 명령했을 때의 로직
  useEffect(() => {
    if (forceSkip && !isDone.current) {
      isDone.current = true;         // 상태 잠금
      setDisplayedText(text);        // 전체 텍스트 즉시 화면에 출력
      
      // 스킵 시 오디오 즉시 정지
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      if (onComplete) onComplete();  // 완료 콜백 실행
    }
  }, [forceSkip, text, onComplete]);

  return <span className="whitespace-pre-line">{displayedText}</span>;
};

export default TypewriterText;