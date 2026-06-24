"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase, checkSupabaseConnection } from "@/lib/supabaseClient";

interface GameRecord {
  id: string;
  player_name: string;
  score: number;
  correct_answers: number;
  total_questions: number;
  duration_seconds: number;
  created_at: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  
  // 데이터 상태
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<GameRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseActive, setIsSupabaseActive] = useState(false);

  // 검색 및 정렬 필터 상태
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "score" | "accuracy">("latest");

  useEffect(() => {
    // 세션 스토리지를 활용해 인증 상태 체크
    const sessionAuth = sessionStorage.getItem("edu_admin_authenticated");
    if (sessionAuth === "true") {
      setIsAuthenticated(true);
      fetchData();
    }
    
    setIsSupabaseActive(checkSupabaseConnection());
  }, []);

  // 검색 및 정렬이 변경될 때마다 결과 리스트 필터링
  useEffect(() => {
    let result = [...records];

    // 1. 검색어 필터링
    if (searchQuery.trim()) {
      result = result.filter((r) =>
        r.player_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 2. 정렬
    if (sortBy === "latest") {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === "score") {
      result.sort((a, b) => b.score - a.score);
    } else if (sortBy === "accuracy") {
      result.sort((a, b) => {
        const accA = a.total_questions > 0 ? a.correct_answers / a.total_questions : 0;
        const accB = b.total_questions > 0 ? b.correct_answers / b.total_questions : 0;
        return accB - accA;
      });
    }

    setFilteredRecords(result);
  }, [records, searchQuery, sortBy]);

  // 비밀번호 확인 제출
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "1116") {
      setIsAuthenticated(true);
      setErrorMsg("");
      sessionStorage.setItem("edu_admin_authenticated", "true");
      fetchData();
    } else {
      setErrorMsg("비밀번호가 올바르지 않습니다. 다시 입력해 주세요.");
      setPassword("");
    }
  };

  // 관리자 로그아웃
  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("edu_admin_authenticated");
    setPassword("");
  };

  // 학생들의 전체 학습 결과 조회
  const fetchData = async () => {
    setIsLoading(true);
    const useDb = checkSupabaseConnection();

    if (useDb && supabase) {
      try {
        const { data, error } = await supabase
          .from("game_results")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (data) {
          setRecords(data as GameRecord[]);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.error("데이터베이스 레코드 조회 에러:", err);
      }
    }

    // Supabase 미연동 혹은 로드 에러 시 로컬 스토리지 데이터 폴백
    const localData = localStorage.getItem("edu_game_leaderboard");
    if (localData) {
      try {
        const parsed = JSON.parse(localData) as GameRecord[];
        setRecords(parsed);
      } catch (e) {
        setRecords([]);
      }
    } else {
      setRecords([]);
    }
    setIsLoading(false);
  };

  // 특정 학습 결과 삭제
  const handleDeleteRecord = async (id: string, playerName: string) => {
    if (!confirm(` 정말 ${playerName} 학생의 기록을 삭제하시겠습니까?`)) {
      return;
    }

    const useDb = checkSupabaseConnection();
    let deletedSuccess = false;

    if (useDb && supabase) {
      try {
        const { error } = await supabase.from("game_results").delete().eq("id", id);
        if (error) throw error;
        deletedSuccess = true;
      } catch (err) {
        console.error("데이터베이스 기록 삭제 실패:", err);
      }
    }

    // 로컬 스토리지 데이터에서도 일치 여부 확인 후 삭제 (백업 동기화)
    const localData = localStorage.getItem("edu_game_leaderboard");
    if (localData) {
      try {
        const parsed = JSON.parse(localData) as GameRecord[];
        const updatedLocal = parsed.filter((r) => r.id !== id && !(r.player_name === playerName && r.created_at === id));
        localStorage.setItem("edu_game_leaderboard", JSON.stringify(updatedLocal));
        if (!useDb) deletedSuccess = true;
      } catch (e) {
        console.error(e);
      }
    }

    if (deletedSuccess) {
      alert("성공적으로 기록을 삭제했습니다.");
      fetchData(); // 데이터 새로고침
    } else {
      alert("기록 삭제 처리에 실패했습니다. DB RLS 정책을 확인하세요.");
    }
  };

  // 통계 연산
  const totalCount = records.length;
  const averageScore =
    totalCount > 0
      ? Math.round(records.reduce((acc, r) => acc + r.score, 0) / totalCount)
      : 0;
  const maxScore = totalCount > 0 ? Math.max(...records.map((r) => r.score)) : 0;
  
  const averageAccuracy =
    totalCount > 0
      ? Math.round(
          (records.reduce((acc, r) => acc + (r.total_questions > 0 ? r.correct_answers / r.total_questions : 0), 0) /
            totalCount) *
            100
        )
      : 0;

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-950 text-slate-100 min-h-screen">
      {/* 장식용 글로우 */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none" />

      {/* 상단 네비게이션 헤더 */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent tracking-tight">
              HyoJae Edu
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            <span className="text-xs text-indigo-400 font-semibold px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
              관리자 모드
            </span>
            <Link href="/" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              메인으로
            </Link>
          </div>
        </div>
      </header>

      {/* 본문 영역 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10 flex flex-col justify-start">
        
        {/* 미인증 상태: 비밀번호 입력 화면 */}
        {!isAuthenticated ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-md border border-slate-850 p-8 rounded-2xl shadow-xl space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-2xl mx-auto border border-indigo-500/20">
                  🔒
                </div>
                <h2 className="text-2xl font-bold text-white">관리자 인증</h2>
                <p className="text-xs text-slate-400">학생들의 학습 기록 조회를 위해 비밀번호를 입력해 주세요.</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <input
                    type="password"
                    placeholder="비밀번호 입력"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-white placeholder-slate-700 text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    autoFocus
                  />
                  {errorMsg && <p className="text-xs text-red-400 mt-2 text-center">{errorMsg}</p>}
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
                >
                  인증하기
                </button>
              </form>
            </div>
          </div>
        ) : (
          
          // 인증 상태: 관리자 대시보드 화면
          <div className="space-y-8 flex-1 flex flex-col">
            
            {/* 대시보드 상단 헤더 및 로그아웃 */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white">학생 학습 결과 모니터링</h1>
                <p className="text-xs text-slate-400">학생들의 Speed Math Mastery 학습 데이터를 확인하고 관리합니다.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={fetchData}
                  className="bg-slate-900 border border-slate-800 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                >
                  새로고침
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-red-950/40 border border-red-900/30 text-red-300 hover:text-red-200 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                >
                  로그아웃
                </button>
              </div>
            </div>

            {/* 통계 요약 (Stat Cards) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/30 border border-slate-850 p-5 rounded-2xl">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">총 누적 플레이 수</span>
                <span className="text-3xl font-extrabold text-white mt-1 block">{totalCount}회</span>
              </div>
              <div className="bg-slate-900/30 border border-slate-850 p-5 rounded-2xl">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">학생 평균 점수</span>
                <span className="text-3xl font-extrabold text-indigo-400 mt-1 block">{averageScore}점</span>
              </div>
              <div className="bg-slate-900/30 border border-slate-850 p-5 rounded-2xl">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">역대 최고 점수</span>
                <span className="text-3xl font-extrabold text-amber-400 mt-1 block">{maxScore}점</span>
              </div>
              <div className="bg-slate-900/30 border border-slate-850 p-5 rounded-2xl">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">평균 정답률</span>
                <span className="text-3xl font-extrabold text-emerald-400 mt-1 block">{averageAccuracy}%</span>
              </div>
            </div>

            {/* 컨트롤 바 (필터 & 검색) */}
            <div className="bg-slate-900/30 border border-slate-850 p-4 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-center">
              
              {/* 검색창 */}
              <div className="w-full md:w-80 relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
                <input
                  type="text"
                  placeholder="학생 이름으로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              {/* 정렬 셀렉터 */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <span className="text-xs text-slate-400 font-medium">정렬 기준</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="latest">최신 등록순</option>
                  <option value="score">최고 점수순</option>
                  <option value="accuracy">높은 정답률순</option>
                </select>
              </div>

            </div>

            {/* 데이터 테이블 */}
            <div className="flex-1 bg-slate-900/20 border border-slate-850 rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 bg-slate-900/40 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="py-4 px-6">학생 이름</th>
                      <th className="py-4 px-6 text-right">점수</th>
                      <th className="py-4 px-6 text-center">정답 현황</th>
                      <th className="py-4 px-6 text-center">정답률</th>
                      <th className="py-4 px-6 text-center">소요 시간</th>
                      <th className="py-4 px-6">플레이 일시</th>
                      <th className="py-4 px-6 text-center">동작</th>
                    </tr>
                  </thead>
                  
                  <tbody className="divide-y divide-slate-850/50 text-xs text-slate-300">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="py-20 text-center text-slate-500 font-medium">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <span className="animate-spin text-2xl">⏳</span>
                            <span>학습 데이터를 불러오는 중입니다...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-20 text-center text-slate-500 font-medium border-dashed border-t border-slate-850">
                          검색 조건에 맞는 학생 기록이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((record) => {
                        const accuracy =
                          record.total_questions > 0
                            ? Math.round((record.correct_answers / record.total_questions) * 100)
                            : 0;

                        return (
                          <tr key={record.id} className="hover:bg-slate-900/30 transition-colors">
                            <td className="py-4 px-6 font-semibold text-slate-200">
                              {record.player_name}
                            </td>
                            <td className="py-4 px-6 text-right font-bold text-amber-400">
                              {record.score}점
                            </td>
                            <td className="py-4 px-6 text-center font-mono">
                              {record.correct_answers} / {record.total_questions}
                            </td>
                            <td className="py-4 px-6 text-center font-semibold">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] ${
                                accuracy >= 80
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : accuracy >= 50
                                  ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                  : "bg-red-500/10 text-red-400 border border-red-500/20"
                              }`}>
                                {accuracy}%
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center font-mono text-slate-400">
                              {record.duration_seconds}초
                            </td>
                            <td className="py-4 px-6 text-slate-500">
                              {new Date(record.created_at).toLocaleString("ko-KR", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <button
                                onClick={() => handleDeleteRecord(record.id, record.player_name)}
                                className="text-[10px] font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2.5 py-1.5 rounded-lg border border-red-500/10 transition-all cursor-pointer"
                              >
                                삭제
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
