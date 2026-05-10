import React, { useState, useEffect, useRef } from 'react';

const TypewriterText = ({ text, speed = 40, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  const audioRef = useRef(typeof Audio !== "undefined" ? new Audio('/sounds/blip.mp3') : null);

  useEffect(() => {
    // 시작할 때 확실하게 빈 문자열로 초기화
    setDisplayedText('');
    let currentIndex = 0;

    if (audioRef.current) {
      audioRef.current.volume = 0.3;
    }

    const typingInterval = setInterval(() => {
      if (currentIndex < text.length) {
        
        // 🔥 [핵심 수정 포인트] 🔥
        // 이전 상태(prev)에 더하는 방식 대신, 원본 텍스트에서 0부터 현재 인덱스까지 잘라옴!
        // 이렇게 하면 StrictMode의 두 번 렌더링 공격을 완벽하게 방어할 수 있음.
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

  return <span className="whitespace-pre-line">{displayedText}</span>;
};

export default TypewriterText;