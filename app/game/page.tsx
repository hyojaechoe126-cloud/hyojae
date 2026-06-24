"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import Link from "next/link";
import { supabase, checkSupabaseConnection } from "@/lib/supabaseClient";

// 퀴즈 문제 정의 인터페이스
interface Question {
  num1: number;
  num2: number;
  operator: "+" | "-" | "*";
  answer: number;
}

// 리더보드 데이터 인터페이스
interface LeaderboardEntry {
  id?: string;
  player_name: string;
  score: number;
  correct_answers: number;
  total_questions: number;
  duration_seconds: number;
  created_at?: string;
}

export default function GamePage() {
  const [gameState, setGameState] = useState<"READY" | "PLAYING" | "GAMEOVER">("READY");
  const [playerName, setPlayerName] = useState("");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [questionCount, setQuestionCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  
  // 시각적 피드백 상태
  const [feedback, setFeedback] = useState<"CORRECT" | "WRONG" | null>(null);
  const [shake, setShake] = useState(false);
  const [comboPop, setComboPop] = useState(false);
  
  // 리더보드 및 DB 연결 상태
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSupabaseActive, setIsSupabaseActive] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 컴포넌트 마운트 시 Supabase 연결 체크 및 리더보드 로드
  useEffect(() => {
    const active = checkSupabaseConnection();
    setIsSupabaseActive(active);
    loadLeaderboard(active);
    
    // 이전에 입력했던 이름 복원
    const savedName = localStorage.getItem("edu_game_player_name");
    if (savedName) setPlayerName(savedName);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // 리더보드 불러오기
  const loadLeaderboard = async (useDb: boolean) => {
    if (useDb && supabase) {
      try {
        const { data, error } = await supabase
          .from("game_results")
          .select("*")
          .order("score", { ascending: false })
          .limit(10);
        
        if (error) throw error;
        if (data) {
          setLeaderboard(data);
          return;
        }
      } catch (err) {
        console.error("데이터베이스 리더보드 로드 실패:", err);
      }
    }

    // Supabase 실패 시 또는 미설정 시 로컬스토리지 백업 데이터 사용
    const localData = localStorage.getItem("edu_game_leaderboard");
    if (localData) {
      try {
        const parsed = JSON.parse(localData) as LeaderboardEntry[];
        setLeaderboard(parsed.sort((a, b) => b.score - a.score).slice(0, 10));
      } catch (e) {
        setLeaderboard([]);
      }
    }
  };

  // 새로운 수학 문제 생성 (난이도에 따라 숫자 범위 가변)
  const generateQuestion = (currentCount: number): Question => {
    const operators: ("+" | "-" | "*")[] = ["+", "-", "*"];
    // 진행도에 따라 곱셈 확률 및 난이도 증가
    let op: "+" | "-" | "*" = "+";
    if (currentCount > 15) {
      op = operators[Math.floor(Math.random() * 3)];
    } else if (currentCount > 5) {
      op = operators[Math.floor(Math.random() * 2)];
    }

    let num1 = 0;
    let num2 = 0;
    let answer = 0;

    if (op === "+") {
      // 덧셈 난이도 조절
      if (currentCount <= 5) {
        num1 = Math.floor(Math.random() * 15) + 1; // 1 ~ 15
        num2 = Math.floor(Math.random() * 15) + 1;
      } else if (currentCount <= 15) {
        num1 = Math.floor(Math.random() * 50) + 10; // 10 ~ 59
        num2 = Math.floor(Math.random() * 50) + 10;
      } else {
        num1 = Math.floor(Math.random() * 200) + 50; // 50 ~ 249
        num2 = Math.floor(Math.random() * 200) + 50;
      }
      answer = num1 + num2;
    } else if (op === "-") {
      // 뺄셈 난이도 조절 (음수 회피)
      if (currentCount <= 10) {
        num1 = Math.floor(Math.random() * 20) + 10;
        num2 = Math.floor(Math.random() * num1) + 1;
      } else {
        num1 = Math.floor(Math.random() * 100) + 30;
        num2 = Math.floor(Math.random() * num1) + 10;
      }
      answer = num1 - num2;
    } else if (op === "*") {
      // 곱셈 난이도 조절 (구구단 -> 두자리수 곱셈)
      if (currentCount <= 20) {
        num1 = Math.floor(Math.random() * 8) + 2; // 2 ~ 9
        num2 = Math.floor(Math.random() * 9) + 1; // 1 ~ 9
      } else {
        num1 = Math.floor(Math.random() * 15) + 6; // 6 ~ 20
        num2 = Math.floor(Math.random() * 11) + 2; // 2 ~ 12
      }
      answer = num1 * num2;
    }

    return { num1, num2, operator: op, answer };
  };

  // 게임 시작
  const startGame = () => {
    if (!playerName.trim()) {
      alert("게임 시작 전 닉네임을 입력해 주세요!");
      return;
    }
    localStorage.setItem("edu_game_player_name", playerName);
    
    // 상태 초기화
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setTimeLeft(60);
    setQuestionCount(0);
    setCorrectCount(0);
    setUserAnswer("");
    setFeedback(null);
    
    const firstQuestion = generateQuestion(0);
    setCurrentQuestion(firstQuestion);
    setGameState("PLAYING");

    // 인풋 자동 포커스
    setTimeout(() => inputRef.current?.focus(), 50);

    // 타이머 구동
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 게임 종료
  const endGame = () => {
    setGameState("GAMEOVER");
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // 정답 입력 제출 및 자동 감지
  const handleAnswerSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!currentQuestion || gameState !== "PLAYING") return;

    const parsedAnswer = parseInt(userAnswer.trim(), 10);
    
    if (isNaN(parsedAnswer)) return;

    if (parsedAnswer === currentQuestion.answer) {
      // 정답 처리
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);

      // 점수 계산 (기본 100 + 콤보 보너스)
      const points = 100 + (newCombo - 1) * 10;
      setScore((prev) => prev + points);
      setCorrectCount((prev) => prev + 1);

      // 피드백 효과
      setFeedback("CORRECT");
      setComboPop(true);
      setTimeout(() => setComboPop(false), 300);

      // 다음 문제 준비
      const nextCount = questionCount + 1;
      setQuestionCount(nextCount);
      setCurrentQuestion(generateQuestion(nextCount));
      setUserAnswer("");
    } else {
      // 오답 처리
      setCombo(0);
      setFeedback("WRONG");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      
      // 오답이어도 입력창을 비워 플레이 흐름을 이어가게 함
      setUserAnswer("");
    }
  };

  // 입력창 변화 이벤트 (사용자가 정답을 입력하는 순간 자동 매칭 처리하여 속도감 향상)
  const handleInputChange = (val: string) => {
    setUserAnswer(val);
    
    if (!currentQuestion) return;
    const parsed = parseInt(val.trim(), 10);
    
    // 사용자가 입력한 숫자가 정답과 일치할 시 엔터를 안 쳐도 바로 정답 통과
    if (!isNaN(parsed) && parsed === currentQuestion.answer) {
      // 약간의 딜레이를 주어 입력이 반영된 직후 처리되도록 함
      setTimeout(() => {
        // 현재 입력값이 여전히 동일하게 유지되고 있는지 최종 검증 후 제출
        if (parseInt(val.trim(), 10) === currentQuestion.answer) {
          handleAnswerSubmit();
        }
      }, 30);
    }
  };

  // 플레이 결과 Supabase 또는 로컬 스토리지에 제출
  const submitResult = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const newResult: LeaderboardEntry = {
      player_name: playerName,
      score: score,
      correct_answers: correctCount,
      total_questions: questionCount + 1, // 오답 포함 총 제출 횟수
      duration_seconds: 60 - timeLeft,
    };

    let submitted = false;

    if (isSupabaseActive && supabase) {
      try {
        const { error } = await supabase.from("game_results").insert([newResult]);
        if (error) throw error;
        submitted = true;
      } catch (err) {
        console.error("데이터베이스 저장 실패, 로컬 스토리지로 전환:", err);
      }
    }

    // 로컬 백업 저장 (서버 연동 실패 시 또는 미사용 시)
    const localData = localStorage.getItem("edu_game_leaderboard");
    let currentLocalList: LeaderboardEntry[] = [];
    if (localData) {
      try {
        currentLocalList = JSON.parse(localData);
      } catch (e) {
        currentLocalList = [];
      }
    }
    
    currentLocalList.push({
      ...newResult,
      created_at: new Date().toISOString(),
    });
    localStorage.setItem("edu_game_leaderboard", JSON.stringify(currentLocalList));

    // 리더보드 재로드 및 홈 갱신
    await loadLeaderboard(isSupabaseActive);
    setIsSubmitting(false);
    alert(submitted ? "성공적으로 랭킹이 등록되었습니다!" : "네트워크 오류로 로컬 랭킹에 저장되었습니다!");
    setGameState("READY");
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-950 text-slate-100 min-h-screen">
      {/* 백그라운드 네온 비주얼 데코레이션 */}
      <div className="absolute top-[-10%] left-[-15%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-15%] w-[60%] h-[60%] rounded-full bg-purple-500/10 blur-[150px] pointer-events-none" />
      
      {/* 상단 네비게이션 헤더 */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent tracking-tight">
              HyoJae Edu
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            <span className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
              <span className={`w-2.5 h-2.5 rounded-full ${isSupabaseActive ? "bg-emerald-500 shadow-lg shadow-emerald-500/50" : "bg-amber-500 shadow-lg shadow-amber-500/50"}`} />
              {isSupabaseActive ? "Supabase 연결됨" : "로컬 모드 실행 중"}
            </span>
            <Link href="/admin" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              관리자
            </Link>
            <Link href="/" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              메인으로
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row items-stretch max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 gap-8 z-10">
        
        {/* 왼쪽 영역: 게임 컨트롤러 & 플레이 보드 */}
        <div className="flex-1 flex flex-col bg-slate-900/40 backdrop-blur-md border border-slate-850 rounded-2xl p-6 sm:p-8 justify-between min-h-[500px]">
          
          {/* 1. 대기 화면 (READY) */}
          {gameState === "READY" && (
            <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6 py-12">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-4xl shadow-xl shadow-indigo-500/20">
                ⚡
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  Speed Math Mastery
                </h1>
                <p className="text-sm text-slate-400 max-w-md">
                  60초의 제한시간 동안 수식을 해결하고 점수를 획득하세요! <br />
                  연속으로 맞출수록 강력한 <strong className="text-indigo-400">콤보 점수</strong>가 더해집니다.
                </p>
              </div>

              <div className="w-full max-w-xs space-y-4">
                <div>
                  <label htmlFor="playerName" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 text-left">
                    플레이어 닉네임
                  </label>
                  <input
                    id="playerName"
                    type="text"
                    placeholder="닉네임을 입력하세요"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value.slice(0, 12))}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-center"
                  />
                </div>

                <button
                  onClick={startGame}
                  className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-600/30 transition-all transform hover:scale-[1.02] active:scale-95 text-lg"
                >
                  챌린지 시작
                </button>
              </div>
            </div>
          )}

          {/* 2. 게임 플레이 중 화면 (PLAYING) */}
          {gameState === "PLAYING" && currentQuestion && (
            <div className="flex-1 flex flex-col justify-between">
              
              {/* 플레이 메타 헤더 */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">SCORE</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">{score}</span>
                  </div>
                  <div className="border-l border-slate-800 h-8" />
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">COMBO</span>
                    <span className={`text-2xl font-bold transition-all ${combo > 0 ? "text-pink-400" : "text-slate-600"}`}>
                      {combo}
                    </span>
                  </div>
                </div>

                {/* 타이머 */}
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">TIME LEFT</span>
                  <span className={`text-3xl font-mono font-bold ${timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-emerald-400"}`}>
                    {timeLeft}s
                  </span>
                </div>
              </div>

              {/* 퀴즈 문제 출력 보드 */}
              <div className="my-auto py-12 flex flex-col items-center justify-center">
                
                {/* 콤보 이펙트 플로팅 */}
                <div className="h-10 flex items-center justify-center">
                  {combo > 1 && (
                    <span className={`text-lg font-extrabold text-pink-400 bg-pink-500/10 px-4 py-1.5 rounded-full border border-pink-500/20 transition-all transform scale-100 ${comboPop ? "scale-125 duration-100" : "duration-200"}`}>
                      🔥 {combo} COMBO BONUS!
                    </span>
                  )}
                </div>

                {/* 질문 영역 */}
                <div className={`text-6xl sm:text-7xl font-extrabold tracking-wider text-white select-none transition-all my-8 flex items-center gap-4 ${shake ? "animate-shake" : ""}`}>
                  <span>{currentQuestion.num1}</span>
                  <span className="text-indigo-400">
                    {currentQuestion.operator === "*" ? "×" : currentQuestion.operator}
                  </span>
                  <span>{currentQuestion.num2}</span>
                  <span className="text-slate-600">=</span>
                  <span className="text-indigo-400">?</span>
                </div>

                {/* 정답 및 오답 시각적 플래시 테두리 피드백용 */}
                <form onSubmit={handleAnswerSubmit} className="w-full max-w-xs relative">
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="정답 입력"
                    value={userAnswer}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className={`w-full bg-slate-950 border text-center text-3xl font-bold py-4 px-6 rounded-2xl focus:outline-none transition-all ${
                      feedback === "CORRECT"
                        ? "border-emerald-500 ring-4 ring-emerald-500/20 text-emerald-400 shadow-md shadow-emerald-500/20"
                        : feedback === "WRONG"
                        ? "border-red-500 ring-4 ring-red-500/20 text-red-400 shadow-md shadow-red-500/20"
                        : "border-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-white"
                    }`}
                  />
                  <p className="text-xs text-slate-500 text-center mt-3">
                    * 정답이 일치하면 엔터 없이 바로 넘어갑니다
                  </p>
                </form>
              </div>

              {/* 게임 정보 하단 통계 */}
              <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-4">
                <span>진행중인 문항: {questionCount + 1}번째</span>
                <span>정답 수: {correctCount}개</span>
              </div>
            </div>
          )}

          {/* 3. 게임 완료 (GAMEOVER) */}
          {gameState === "GAMEOVER" && (
            <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6 py-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center text-4xl shadow-xl shadow-rose-500/20">
                🏁
              </div>
              <div className="space-y-1">
                <h2 className="text-3xl font-extrabold text-white">게임 종료!</h2>
                <p className="text-sm text-slate-400">당신의 멋진 기록을 등록해 보세요.</p>
              </div>

              {/* 스탯 그리드 */}
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm bg-slate-950/60 p-5 rounded-2xl border border-slate-850">
                <div className="text-center p-3">
                  <span className="text-xs text-slate-500 font-semibold block uppercase">최종 점수</span>
                  <span className="text-3xl font-extrabold text-amber-400">{score}점</span>
                </div>
                <div className="text-center p-3">
                  <span className="text-xs text-slate-500 font-semibold block uppercase">최대 콤보</span>
                  <span className="text-3xl font-extrabold text-pink-400">{maxCombo}회</span>
                </div>
                <div className="text-center p-3 border-t border-slate-905">
                  <span className="text-xs text-slate-500 font-semibold block uppercase">정답률</span>
                  <span className="text-xl font-bold text-white">
                    {questionCount > 0 ? Math.round((correctCount / questionCount) * 100) : 0}%
                  </span>
                  <span className="text-[10px] text-slate-500 block">({correctCount} / {questionCount}개)</span>
                </div>
                <div className="text-center p-3 border-t border-slate-905">
                  <span className="text-xs text-slate-500 font-semibold block uppercase">플레이어</span>
                  <span className="text-xl font-bold text-indigo-300 truncate block max-w-[120px] mx-auto">{playerName}</span>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                <button
                  onClick={submitResult}
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? "랭킹 등록 중..." : "점수 기록 저장"}
                </button>
                <button
                  onClick={() => setGameState("READY")}
                  className="flex-1 bg-slate-800 hover:bg-slate-750 text-white font-bold py-3.5 rounded-xl transition-all border border-slate-700 active:scale-95"
                >
                  다시 도전
                </button>
              </div>
            </div>
          )}

        </div>

        {/* 오른쪽 영역: 실시간 리더보드 랭킹 */}
        <div className="w-full lg:w-96 flex flex-col bg-slate-900/40 backdrop-blur-md border border-slate-850 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              🏆 실시간 랭킹 (Top 10)
            </h3>
            <button
              onClick={() => loadLeaderboard(isSupabaseActive)}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
            >
              새로고침
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[450px] pr-1">
            {leaderboard.length === 0 ? (
              <div className="h-40 flex items-center justify-center border border-dashed border-slate-800 rounded-xl">
                <span className="text-xs text-slate-500 text-center">
                  아직 기록된 점수가 없습니다. <br /> 첫 번째 랭커에 도전해 보세요!
                </span>
              </div>
            ) : (
              leaderboard.map((entry, index) => {
                const isTop3 = index < 3;
                const rankColor =
                  index === 0
                    ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
                    : index === 1
                    ? "text-slate-300 bg-slate-400/10 border-slate-400/20"
                    : index === 2
                    ? "text-amber-600 bg-amber-700/10 border-amber-700/20"
                    : "text-slate-400 bg-slate-800/20 border-slate-800/40";

                return (
                  <div
                    key={entry.id || `${entry.player_name}-${index}`}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                      entry.player_name === playerName && gameState === "READY"
                        ? "bg-indigo-500/10 border-indigo-500/30"
                        : "bg-slate-950/40 border-slate-900 hover:border-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${rankColor}`}>
                        {index + 1}
                      </span>
                      <div>
                        <span className="font-semibold text-sm text-slate-200 block truncate max-w-[120px]">
                          {entry.player_name}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          정답률 {entry.total_questions > 0 ? Math.round((entry.correct_answers / entry.total_questions) * 100) : 0}% ({entry.correct_answers}개)
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-sm text-amber-400 block">{entry.score}점</span>
                      <span className="text-[10px] text-slate-500">{entry.duration_seconds}초</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </main>

      {/* 스타일 애니메이션을 위한 전역 CSS 주입 */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}
