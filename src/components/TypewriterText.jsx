import React, { useState, useEffect, useRef } from 'react';

const TypewriterText = ({ text, speed = 40, onComplete, forceSkip }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  const audioRef = useRef(typeof Audio !== "undefined" ? new Audio('/sounds/blip.wav') : null);
  
  const isDone = useRef(false);

  useEffect(() => {
    setDisplayedText('');
    isDone.current = false;
    let currentIndex = 0;

    if (audioRef.current) {
      audioRef.current.volume = 0.3;
    }

    const typingInterval = setInterval(() => {
      if (isDone.current) {
        clearInterval(typingInterval);
        return;
      }

      if (currentIndex < text.length) {
        setDisplayedText(text.substring(0, currentIndex + 1));
        
        const currentChar = text[currentIndex];
        
        if (currentChar !== ' ' && currentChar !== '\n' && audioRef.current) {
           // 💡 재생 빈도 수정: 2 -> 3 (120ms 간격으로 여유롭게 재생)
           if (currentIndex % 4 === 0) { 
              const randomPitch = 0.95 + Math.random() * 0.1;
              audioRef.current.playbackRate = randomPitch; 
              
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

  useEffect(() => {
    if (forceSkip && !isDone.current) {
      isDone.current = true;
      setDisplayedText(text);
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      if (onComplete) onComplete();
    }
  }, [forceSkip, text, onComplete]);

  return <span className="whitespace-pre-line">{displayedText}</span>;
};

export default TypewriterText;