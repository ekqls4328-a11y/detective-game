import React, { useState, useEffect, useRef } from 'react';
import { useAudio } from '../contexts/AudioContext';
import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob';
import AdConfirmModal from './AdConfirmModal';
import { Joyride } from 'react-joyride'; 

// 💡 1. 커스텀 툴팁 (튜토리얼 UI)
const CustomTooltip = ({ index, step, backProps, closeProps, primaryProps, tooltipProps, isLastStep, size }) => (
  <div {...tooltipProps} className="bg-neutral-900 border border-neutral-700 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] p-5 max-w-[320px] w-full font-sans z-[100000]">
    <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-3">
      <span className="text-amber-500 font-black text-[11px] tracking-widest">[ 추리 가이드 {index + 1} / {size} ]</span>
      <button {...closeProps} className="text-neutral-500 hover:text-red-500 text-lg leading-none active:scale-90 transition-all">&times;</button>
    </div>
    <div className="text-gray-200 text-sm leading-loose mb-6 break-keep">{step.content}</div>
    <div className="flex justify-between items-center">
      <div>
        {index > 0 && (
          <button {...backProps} className="px-3 py-2 text-xs font-bold text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors border border-neutral-700 active:scale-95">
            &lt; 이전
          </button>
        )}
      </div>
      <button {...primaryProps} className="px-5 py-2 text-xs font-black text-black bg-amber-500 hover:bg-amber-400 rounded-lg transition-all active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
        {isLastStep ? '범인 추리하기' : '다음 단계 >'}
      </button>
    </div>
  </div>
);

// 💡 2. 메인 DeductionView 컴포넌트
const DeductionView = ({ scenarioData, inventory, actionPoints, deductionLife, onFail, onReset, onAdRevive, onSuccess, isTruthMode }) => {
  // 💡 상태 관리
  const [answers, setAnswers] = useState({}); // 유저가 선택한 정답들
  const [result, setResult] = useState(isTruthMode ? 'success' : 'none'); // 현재 뷰 상태 (none, fail, gameover, success)
  const [accuracy, setAccuracy] = useState(0); // 추리 일치율 (%)

  // 광고 및 부활 관련 상태
  const [showLifeAdModal, setShowLifeAdModal] = useState(false);
  const [hasUsedAdRevive, setHasUsedAdRevive] = useState(false); 

  const { playSfx } = useAudio();
  const topRef = useRef(null); // 결과 화면 전환 시 스크롤을 맨 위로 올리기 위한 Ref

  // 💡 3. 튜토리얼 (Joyride) 설정
  const TUTORIAL_KEY = 'crime_game_deduction_tutorial_cleared';
  const [tourRun, setTourRun] = useState(false);
  const [tourSteps] = useState([
    { target: 'body', content: '🕵️‍♂️ 사건 종결 탭입니다. 모든 단서를 모았다면 정확한 범인을 지목하세요.', placement: 'center', disableBeacon: true },
    { target: '.tutorial-step-lives', content: '남은 수사 기회입니다. 2번 모두 소모하면 사건은 미궁속으로 빠집니다.', placement: 'bottom', disableBeacon: true },
    { target: '.tutorial-step-question', content: '질문 항목들을 꼼꼼히 읽고 용의자와 단서를 선택하세요.', placement: 'bottom', disableBeacon: true },
    { target: '.tutorial-step-submit', content: '최종 제출하여 사건 종결하세요.', placement: 'top', disableBeacon: true }
  ]);

  useEffect(() => {
    const isTutorialCleared = localStorage.getItem(TUTORIAL_KEY) === 'true';
    if (!isTutorialCleared) {
      setTimeout(() => {
        setTourRun(true); 
        localStorage.setItem(TUTORIAL_KEY, 'true'); 
      }, 800); 
    }
  }, []);

  const handleJoyrideCallback = (data) => {
    const { status, action } = data;
    if (['finished', 'skipped'].includes(status) || action === 'close') {
      setTourRun(false); 
    } 
  };

  // 결과 창으로 넘어갈 때 스크롤 맨 위로 자동 이동
  useEffect(() => {
    if (result !== 'none' && topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  // 💡 4. 데이터 가공 구역
  const questions = scenarioData.solution.questions || [];
  const truth = scenarioData.solution.crimeTruth;

  // 장소 단서와 인물 단서를 하나로 합쳐서 유저가 가진(inventory) 단서만 필터링
  const myClues = (() => {
    const locationClues = scenarioData.locations?.flatMap(loc => 
      (loc.clues || []).map(clue => ({ ...clue, sourceName: loc.name }))
    ) || [];

    const inspectionClues = scenarioData.suspects?.flatMap(s => 
      (s.inspectionPoints || []).map(point => ({ ...point, sourceName: s.name }))
    ) || [];

    const allPhysicalClues = [...locationClues, ...inspectionClues];
    return inventory?.map(id => allPhysicalClues.find(c => c.id === id)).filter(Boolean) || [];
  })();

  // 💡 5. 이벤트 핸들러 구역
  const handleSelectAnswer = (questionId, answerId) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerId }));
  };

  // 최종 추리 제출 버튼 클릭 시 로직
  const handleAccuse = () => {
    const questions = scenarioData.solution.questions;
    if (Object.keys(answers).length < questions.length) {
      alert("모든 추리 항목을 선택해주세요.");
      return;
    }
    
    // 정답 개수 체크 및 일치율 계산
    let correctCount = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.answerId) {
        correctCount++;
      }
    });

    const calculatedAccuracy = Math.floor((correctCount / questions.length) * 100);
    setAccuracy(calculatedAccuracy);
    
    // 모든 질문을 맞췄는지 확인
    const isAllCorrect = questions.every(q => answers[q.id] === q.answerId);
    
    if (isAllCorrect) {
      // 💡 클리어 데이터 로컬 스토리지에 저장
      const savedData = localStorage.getItem('cleared_scenarios');
      let clearedList = savedData ? JSON.parse(savedData) : [];
      
      if (!clearedList.includes(scenarioData.id)) {
        clearedList.push(scenarioData.id);
        localStorage.setItem('cleared_scenarios', JSON.stringify(clearedList));
      }
      
      if (onSuccess) onSuccess();
      setResult('success'); // 진실 화면으로 렌더링 변경
    } else {
      onFail(); // PlayScreen의 deductionLife 차감 함수 호출
      setResult('fail'); // 실패 화면으로 렌더링 변경
    }
  };

  // 실패 창에서 '다시 검토하기' 또는 '수사 결과 확인하기' 누를 때
  const handleFailNextStep = () => {
    playSfx();
    if (deductionLife <= 0) {
      if (!hasUsedAdRevive) {
        setShowLifeAdModal(true); // 광고로 부활할 기회 제공
      } else {
        setResult('gameover'); // 이미 광고 썼으면 바로 게임 오버
      }
    } else {
      setResult('none'); // 기회 남았으면 다시 문제 푸는 화면으로 복귀
    }
  };

  // 💡 6. 추리 부활 광고 로직
  const handleLifeAdConfirm = async () => {
    setShowLifeAdModal(false);

    // 🚨 [테스트용 치트키] 광고 호출 안 하고 무조건 통과!
    /* -------- 👇 여기서부터 치트키 -------- */
    console.log("📺 [개발용 치트키] 추리 부활 광고 시청 스킵");
    alert("📺 [테스트 모드] 광고 시청을 스킵하고 마지막 추리 기회를 얻습니다!");
    setHasUsedAdRevive(true); 
    if (onAdRevive) onAdRevive(); 
    setResult('none'); 
    /* -------- 👆 여기까지 치트키 -------- */

    /* -------- 👇 정식 출시(또는 광고 띄워볼 때)용 진짜 애드몹 로직 --------
       출시 전에는 위의 '치트키' 구역을 지우고, 아래 주석을 풀어서 사용해!

    try {
      await AdMob.prepareRewardVideoAd({
        adId: 'ca-app-pub-3940256099942544/5224354917', // 정식 출시 땐 진짜 ID로 교체!
        isTesting: true // 정식 출시 땐 false로 교체!
      });

      const rewardListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
        // 광고 시청 완료 시 부활 처리
        setHasUsedAdRevive(true); 
        if (onAdRevive) onAdRevive(); 
        setResult('none'); 
      });

      const dismissListener = await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        rewardListener.remove();
        dismissListener.remove();
      });

      await AdMob.showRewardVideoAd();

    } catch (error) {
      console.error("광고 재생 실패:", error);
      alert("광고를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
    ------------------------------------------------------------------ */
  };

  const handleLifeAdCancel = () => {
    setShowLifeAdModal(false);
    setResult('gameover'); // 광고 보기 거절 시 바로 게임 오버
  };

  // 💡 7. UI 렌더링 분기 (fail, gameover, success, default)

  // 추리 실패 뷰
  if (result === 'fail') {
    return (
      <>
        <div ref={topRef} className="animate-fadeIn flex flex-col items-center justify-center p-10 text-center bg-neutral-900 rounded-3xl border border-red-900/30 relative overflow-hidden">
          {deductionLife <= 0 && <div className="absolute inset-0 bg-red-900/10 animate-pulse pointer-events-none" />}
          <div className="text-5xl mb-4 relative z-10">⚠️</div>
          <h2 className="text-2xl font-black text-white mb-2 relative z-10">추리 실패!</h2>

          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 w-full mb-6 mt-4 shadow-inner relative z-10">
            <p className="text-neutral-400 text-sm font-bold mb-2">현재 추리 일치율</p>
            <div className="text-4xl font-black text-amber-500 mb-3">{accuracy}%</div>
            <div className="w-full bg-neutral-900 rounded-full h-3 overflow-hidden border border-neutral-700">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${accuracy}%` }}
              />
            </div>
          </div>

          <p className="text-red-400 text-sm font-bold mb-6 relative z-10">
            증거가 불충분하거나 범인을 잘못 지목했습니다.<br/>
            (남은 기회: {deductionLife}번)
          </p>
          <button 
            onClick={handleFailNextStep} 
            className={`w-full py-4 text-white font-bold rounded-xl active:scale-95 transition-all relative z-10 ${
              deductionLife <= 0 
                ? 'bg-red-800 border border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)] hover:bg-red-700' 
                : 'bg-neutral-800 border border-neutral-700'
            }`}
          >
            {deductionLife <= 0 ? '수사 결과 확인하기' : '다시 검토하기'}
          </button>
        </div>

        {/* 💡 실패 시 나타나는 광고 부활 모달 */}
        {showLifeAdModal && (
          <AdConfirmModal type="fail" onConfirm={handleLifeAdConfirm} onCancel={handleLifeAdCancel} />
        )}
      </>
    );
  }

  // 완전 게임 오버 뷰
  if (result === 'gameover') {
    return (
      <div ref={topRef} className="animate-fadeIn fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-10 text-center">
        <div className="text-7xl mb-8 opacity-50">🕵️‍♂️💨</div>
        <h2 className="text-4xl font-black text-red-600 mb-4">사건 미궁 봉착</h2>
        <p className="text-neutral-400 leading-relaxed mb-10">
          모든 수사 기회를 날렸습니다. 범인은 이미 국외로 도주했고,<br/>
          이 사건은 영원히 해결되지 못한 채 서류 더미 속에 묻혔습니다.
        </p>
        <button 
            onClick={() => { playSfx(); onReset(); }} 
            className="w-full max-w-xs py-4 bg-red-800 text-white font-black rounded-xl border border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)] hover:bg-red-700 active:scale-95 transition-all"
        >
          처음부터 다시 수사하기
        </button>
      </div>
    );
  }

  // 추리 성공 (사건의 전말) 뷰
  if (result === 'success') {
    return (
      <div ref={topRef} className="animate-fadeIn flex flex-col bg-neutral-900 rounded-3xl overflow-hidden border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
        <div className="w-full h-56 bg-neutral-800 relative">
          {truth.illustrationUrl ? (
            <img src={truth.illustrationUrl} alt="Truth" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-emerald-500 font-bold">진실 일러스트 준비 중</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-6">
            <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-1 rounded mb-2 inline-block">CASE CLOSED</span>
            <h2 className="text-2xl font-black text-white">{truth.title}</h2>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-emerald-950/20 border border-emerald-900/50 p-5 rounded-2xl">
            <p className="text-emerald-400 font-bold text-sm mb-4 leading-relaxed">
              ✨ {scenarioData.solution.successMessage}
            </p>
            <div className="space-y-3">
              {truth.story.map((line, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-emerald-600 font-black text-sm mt-0.5">{i + 1}.</span>
                  <p className="text-sm text-neutral-300 leading-relaxed">{line}</p>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => { playSfx(); onReset(); }} 
            className="w-full py-4 mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg active:scale-95 transition-all"
          >
            사건 종료 및 메인으로
          </button>
        </div>
      </div>
    );
  }

  // 기본 추리 폼 뷰 (result === 'none')
  return (
    <>
      <div className="animate-fadeIn pb-10">
        <Joyride
          steps={tourSteps}
          run={tourRun}
          continuous={true}
          showSkipButton={true}
          disableOverlayClose={true}
          spotlightClicks={true}
          floaterProps={{ disableAnimation: true }}
          callback={handleJoyrideCallback}
          hideBackButton={true}
          tooltipComponent={CustomTooltip} 
          styles={{
            options: {
              zIndex: 100000,
              overlayColor: 'rgba(0, 0, 0, 0.85)',
            }
          }}
        />

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-red-500">⚖️</span> 사건 종결.
          </h2>
          <div className="tutorial-step-lives scroll-mt-28 flex gap-1 bg-black/30 px-3 py-1.5 rounded-full border border-neutral-800 mr-14">
            {[...Array(2)].map((_, i) => (
              <span 
                key={i} 
                className={`text-base transition-all ${
                  i < deductionLife 
                    ? 'grayscale-0 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]' 
                    : 'grayscale opacity-20 scale-75' 
                }`}
              >
                🔍
              </span>
            ))}
          </div>
        </div>
        
        {actionPoints > 0 && (
          <div className="bg-amber-900/20 border border-amber-600/30 text-amber-200 p-4 rounded-2xl text-xs font-bold mb-8 flex items-start gap-3">
            <span>⚠️</span>
            <p>아직 수사 기회가 {actionPoints}번 남았습니다. 지금 종결하면 추가 단서를 얻을 수 없습니다.</p>
          </div>
        )}

        {questions.map((q) => (
          <section key={q.id} className="scroll-mt-28 mb-10 animate-slideUp">
            <h3 className="tutorial-step-question text-sm font-bold text-neutral-400 mb-4 flex items-center gap-2">
               <div className="w-1 h-4 bg-red-600 rounded-full"/> {q.title}
            </h3>
            
            {/* 용의자 선택 질문 */}
            {q.type === 'suspect' && (
              <div className="grid grid-cols-2 gap-3">
                {scenarioData.suspects.map(suspect => (
                  <button
                    key={suspect.id}
                    onClick={() => { playSfx(); handleSelectAnswer(q.id, suspect.id); }} 
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all active:scale-95 ${
                      answers[q.id] === suspect.id ? 'bg-red-600/10 border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.2)]' : 'bg-neutral-800/50 border-neutral-700 hover:bg-neutral-700/50'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black transition-colors ${answers[q.id] === suspect.id ? 'bg-red-600 text-white' : 'bg-neutral-700 text-neutral-500'}`}>
                      {suspect.name.charAt(0)}
                    </div>
                    <span className={`text-sm font-bold ${answers[q.id] === suspect.id ? 'text-red-400' : 'text-neutral-400'}`}>{suspect.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* 단서 선택 질문 */}
            {q.type === 'clue' && (
              myClues.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {myClues.map(clue => (
                    <button
                      key={clue.id}
                      onClick={() => { playSfx(); handleSelectAnswer(q.id, clue.id); }} 
                      className={`p-2 rounded-xl border-2 flex flex-col items-center justify-center min-h-[5.5rem] transition-all active:scale-95 ${
                        answers[q.id] === clue.id ? 'bg-red-600/10 border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.2)]' : 'bg-neutral-800/50 border-neutral-700 hover:bg-neutral-700/50'
                      }`}
                    >
                      <span className={`text-[8px] mb-1 font-bold truncate w-full text-center ${answers[q.id] === clue.id ? 'text-red-400/80' : 'text-neutral-500'}`}>
                        [{clue.sourceName}]
                      </span>
                      <span className={`text-[11px] font-bold text-center break-keep leading-tight ${answers[q.id] === clue.id ? 'text-red-400' : 'text-neutral-300'}`}>
                        {clue.name}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-neutral-800/50 border border-neutral-700 p-6 rounded-2xl flex flex-col items-center text-center gap-3 animate-pulse">
                  <span className="text-3xl">🕵️‍♂️</span>
                  <p className="text-neutral-400 text-sm font-bold">
                    아직 수집된 단서가 없습니다.<br/>
                    현장 조사나 외형관찰을 통해<br/>결정적인 증거를 찾아보세요!
                  </p>
                </div>
              )
            )}
          </section>
        ))}

        <button 
          onClick={() => { playSfx(); handleAccuse(); }} 
          disabled={Object.keys(answers).length < questions.length}
          className={`tutorial-step-submit scroll-mt-28 w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 ${
            Object.keys(answers).length === questions.length
              ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] active:scale-[0.98]' 
              : 'bg-neutral-800 text-neutral-600 border border-neutral-700 cursor-not-allowed'
          }`}
        >
          <span>⚖️</span> 최종 추리 제출하기
        </button>
      </div>
      
      {showLifeAdModal && (
        <AdConfirmModal type="fail" onConfirm={handleLifeAdConfirm} onCancel={handleLifeAdCancel} />
      )}
    </>
  );
};

export default DeductionView;