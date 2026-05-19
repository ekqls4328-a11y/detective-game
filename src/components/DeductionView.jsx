import React, { useState, useEffect } from 'react'; 
// 💡 AudioContext 임포트 추가 (이제 playSfx만 사용)
import { useAudio } from '../contexts/AudioContext';
import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob';
// 💡 모달 컴포넌트 임포트
import AdConfirmModal from './AdConfirmModal';

// 💡 onAdRevive props 추가!
const DeductionView = ({ scenarioData, inventory, actionPoints, deductionLife, onFail, onReset, onAdRevive }) => {
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState('none'); // 'none', 'success', 'fail', 'gameover'
  const [accuracy, setAccuracy] = useState(0);

  // 💡 생명력 부활 모달 관련 상태값 추가
  const [showLifeAdModal, setShowLifeAdModal] = useState(false);
  const [hasUsedAdRevive, setHasUsedAdRevive] = useState(false); // 한 번만 살려주기 위한 플래그

  // 💡 효과음 함수만 가져오기
  const { playSfx } = useAudio();

  const questions = scenarioData.solution.questions || [];
  const truth = scenarioData.solution.crimeTruth;

  // 인벤토리 물증 매핑 (출처 이름 주입 로직 포함)
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

  const handleSelectAnswer = (questionId, answerId) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerId }));
  };

  const handleAccuse = () => {
    const questions = scenarioData.solution.questions;
    if (Object.keys(answers).length < questions.length) {
      alert("모든 추리 항목을 선택해주세요.");
      return;
    }
    
    // 정답 개수 계산
    let correctCount = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.answerId) {
        correctCount++;
      }
    });

    // 일치율(퍼센트) 계산 후 상태에 저장
    const calculatedAccuracy = Math.floor((correctCount / questions.length) * 100);
    setAccuracy(calculatedAccuracy);
    
    const isAllCorrect = questions.every(q => answers[q.id] === q.answerId);
    
    if (isAllCorrect) {
      const savedData = localStorage.getItem('cleared_scenarios');
      let clearedList = savedData ? JSON.parse(savedData) : [];
      
      if (!clearedList.includes(scenarioData.id)) {
        clearedList.push(scenarioData.id);
        localStorage.setItem('cleared_scenarios', JSON.stringify(clearedList));
      }
      
      setResult('success');
    } else {
      // 💡 틀렸을 때는 무조건 목숨을 하나 깎고 일치율 화면(fail)으로 보냄!
      onFail(); 
      setResult('fail');
    }
  };

  // 💡 실패 화면(일치율 화면)에서 버튼을 눌렀을 때의 분기 처리
  const handleFailNextStep = () => {
    playSfx();
    
    // 💡 방금 onFail()로 깎인 목숨이 0이라면?
    if (deductionLife <= 0) {
      if (!hasUsedAdRevive) {
        // 광고 부활 찬스 안 썼으면 물어보기!
        setShowLifeAdModal(true);
      } else {
        // 이미 썼는데 또 죽었으면 자비 없이 게임오버!
        setResult('gameover');
      }
    } else {
      // 아직 목숨 남아있으면 다시 추리 창으로!
      setResult('none');
    }
  };

  // 💡 추리 실패 모달이 뜰 때 백그라운드에서 광고 장전!
  useEffect(() => {
    if (showLifeAdModal) {
      AdMob.prepareRewardVideoAd({ adId: 'ca-app-pub-3940256099942544/5224354917' })
        .catch(e => console.error("추리 부활 광고 사전 로드 실패:", e));
    }
  }, [showLifeAdModal]);

  // 💡 모달에서 [광고 보고 부활하기] 눌렀을 때
  const handleLifeAdConfirm = async () => {
    setShowLifeAdModal(false);
    
    try {
      /* 🚨 정식 배포 시 주석 해제할 부분!
      await AdMob.removeAllListeners();

      AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
        alert("마지막 추리 기회가 주어집니다!");
        setHasUsedAdRevive(true); 
        if (onAdRevive) onAdRevive(); 
        setResult('none'); 
      });

      AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        AdMob.removeAllListeners();
      });

      // 💡 장전은 위에서 했으니 바로 쏜다!
      await AdMob.showRewardVideoAd();
      */

      // 💡 [개발용 치트키] 광고 본 척하고 즉시 부활
      console.log("📺 [개발용 치트키] 추리 부활 광고 시청 스킵");
      alert("📺 [테스트] 마지막 추리 기회가 주어집니다!");
      setHasUsedAdRevive(true); // 광고 부활 1회 사용 기록 남기기
      
      if (onAdRevive) {
        onAdRevive(); // 부모(PlayScreen)에게 생명력 1로 만들어달라고 요청
      }
      setResult('none'); // 다시 추리 화면으로

    } catch (error) {
      console.error("광고 재생 실패:", error);
      alert("광고를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  // 💡 모달에서 [포기하기] 눌렀을 때
  const handleLifeAdCancel = () => {
    setShowLifeAdModal(false);
    setResult('gameover'); // 안 본다고 하면 바로 배드 엔딩
  };

  // [실패 화면 - 일치율 보여주는 곳]
  if (result === 'fail') {
    return (
      <>
        <div className="animate-fadeIn flex flex-col items-center justify-center p-10 text-center bg-neutral-900 rounded-3xl border border-red-900/30 relative overflow-hidden">
          
          {/* 💡 기회가 0일 때 긴장감 주는 배경 효과 */}
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
            // 💡 수정됨: 바로 추리 창으로 안 가고 검문소(handleFailNextStep)를 거침
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

        {/* 💡 실패 화면에서도 광고 모달이 뜰 수 있도록 추가된 부분! */}
        {showLifeAdModal && (
          <AdConfirmModal 
            type="life" 
            onConfirm={handleLifeAdConfirm} 
            onCancel={handleLifeAdCancel} 
          />
        )}
      </>
    );
  }

  // [완전 실패 화면 - Bad Ending]
  if (result === 'gameover') {
    return (
      <div className="animate-fadeIn fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-10 text-center">
        <div className="text-7xl mb-8 opacity-50">🕵️‍♂️💨</div>
        <h2 className="text-4xl font-black text-red-600 mb-4">사건 미궁 봉착</h2>
        <p className="text-neutral-400 leading-relaxed mb-10">
          모든 수사 기회를 날렸습니다. 범인은 이미 국외로 도주했고,<br/>
          이 사건은 영원히 해결되지 못한 채 서류 더미 속에 묻혔습니다.
        </p>
        <button 
            // 💡 여기서 호출하는 onReset이 PlayScreen의 clearProgress를 실행함
            onClick={() => { playSfx(); onReset(); }} 
            className="w-full max-w-xs py-4 bg-red-800 text-white font-black rounded-xl border border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)] hover:bg-red-700 active:scale-95 transition-all"
        >
          처음부터 다시 수사하기
        </button>
      </div>
    );
  }

  // [성공 화면: 사건의 전말]
  if (result === 'success') {
    return (
      <div className="animate-fadeIn flex flex-col bg-neutral-900 rounded-3xl overflow-hidden border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
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
            // 💡 성공 시에도 onReset을 통해 진행도를 깔끔히 지우고 메인으로 이동
            onClick={() => { playSfx(); onReset(); }} 
            className="w-full py-4 mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg active:scale-95 transition-all"
          >
            사건 종료 및 메인으로
          </button>
        </div>
      </div>
    );
  }

  // [추리 입력 화면]
  return (
    <>
      <div className="animate-fadeIn pb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-red-500">⚖️</span> 사건 종결.
          </h2>
          <div className="flex gap-1 bg-black/30 px-3 py-1.5 rounded-full border border-neutral-800 mr-14">
          {[...Array(3)].map((_, i) => (
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
          <section key={q.id} className="mb-10 animate-slideUp">
            <h3 className="text-sm font-bold text-neutral-400 mb-4 flex items-center gap-2">
               <div className="w-1 h-4 bg-red-600 rounded-full"/> {q.title}
            </h3>
            
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

            {q.type === 'clue' && (
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
            )}
          </section>
        ))}

        <button 
          onClick={() => { playSfx(); handleAccuse(); }} 
          disabled={Object.keys(answers).length < questions.length}
          className={`w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 ${
            Object.keys(answers).length === questions.length
              ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] active:scale-[0.98]' 
              : 'bg-neutral-800 text-neutral-600 border border-neutral-700 cursor-not-allowed'
          }`}
        >
          <span>⚖️</span> 최종 추리 제출하기
        </button>
      </div>
      
      {/* 💡 추리 실패 시 나타나는 생명력 부활 광고 확인 모달 */}
      {showLifeAdModal && (
        <AdConfirmModal 
          type="life" 
          onConfirm={handleLifeAdConfirm} 
          onCancel={handleLifeAdCancel} 
        />
      )}
    </>
  );
};

export default DeductionView;