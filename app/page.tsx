import Link from "next/link";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* 배경 광채 데코레이션 이펙트 (배경을 더욱 세련되게 만들어 줍니다) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-500/10 blur-[120px] pointer-events-none" />

      {/* =========================================================================
          1. 상단 헤더 영역 (향후 components/Header.tsx 파일로 분리하는 것을 추천합니다)
         ========================================================================= */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* 서비스 로고 */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent tracking-tight hover:opacity-90 transition-opacity">
              HyoJae Edu
            </span>
          </Link>

          {/* 네비게이션 메뉴 (데스크탑 브라우저 크기에서만 노출되는 반응형 구조) */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <Link href="/" className="hover:text-indigo-400 transition-colors">홈</Link>
            <Link href="/game" className="hover:text-indigo-400 transition-colors">수학 게임</Link>
            <Link href="/admin" className="hover:text-indigo-400 transition-colors">관리자 대시보드</Link>
          </nav>

          {/* 헤더 우측 유틸리티 영역 */}
          <div className="flex items-center space-x-4">
            <button className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              로그인
            </button>
            <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md shadow-indigo-600/20 active:scale-95">
              시작하기
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. 메인 화면 & 히어로 섹션 (향후 components/Hero.tsx 파일로 분리 가능)
         ========================================================================= */}
      <main className="flex-1 flex flex-col justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24 w-full">
        <div className="text-center max-w-3xl mx-auto space-y-8">
          {/* 미세 배지 */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            ✨ 혁신적인 에듀테크 플랫폼
          </span>

          {/* 핵심 메인 타이틀 */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-none">
            효재의{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">
              교육용 웹앱
            </span>{" "}
            만들기
          </h1>

          {/* 환영 서브 텍스트 */}
          <p className="text-lg text-slate-400 leading-relaxed">
            새로운 개념의 스마트 러닝 서비스를 함께 설계해 보세요. 깔끔하게 정돈된 레이아웃을 시작으로 다양한 모듈형 컴포넌트를 이 자리에 이식하고 나만의 서비스를 완성할 수 있습니다.
          </p>

          {/* 기능 추가를 유도하는 핵심(Placeholder) 버튼 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/game" className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-semibold px-8 py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-98 cursor-pointer text-center">
              학습 게임 시작하기
            </Link>
            <button className="w-full sm:w-auto bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-semibold px-8 py-4 rounded-xl transition-all hover:bg-slate-800 cursor-pointer">
              더 알아보기
            </button>
          </div>
        </div>

        {/* =========================================================================
            3. 콘텐츠 & 컴포넌트 확장 가이드 영역 (컴포넌트 단위 추가가 이루어질 공간입니다)
           ========================================================================= */}
        <section className="mt-16 md:mt-24">
          <div className="border border-dashed border-slate-800 rounded-2xl p-8 text-center bg-slate-900/10 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-slate-300 mb-2">대시보드 또는 학습 콘텐츠가 표시될 자리입니다</h3>
            <p className="text-sm text-slate-500 mb-6">원하는 교육 도구(퀴즈, 동영상 플레이어 등)를 추가하여 화면을 채워보세요.</p>
            
            {/* [여기에 새로운 컴포넌트를 추가하세요] 
                아래 Grid 영역은 향후 개별 컴포넌트(예: QuizCard.tsx, VideoPlayer.tsx 등)로 컴포넌트화하기에 최적입니다. */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-4xl mx-auto">
              {/* 기능 카드 1 (수학 게임 링크로 변경) */}
              <Link href="/game" className="p-6 rounded-xl bg-slate-900/30 border border-slate-850 hover:border-indigo-500/30 transition-all group block cursor-pointer">
                <span className="text-2xl mb-3 block group-hover:scale-110 transition-transform origin-left">📝</span>
                <h4 className="font-medium text-white mb-1">스마트 수학 퀴즈</h4>
                <p className="text-xs text-slate-400">제한시간 동안 연산 문제를 풀고 점수를 획득하여 실시간 랭킹에 등록해보세요.</p>
              </Link>
              
              {/* 기능 카드 2 */}
              <div className="p-6 rounded-xl bg-slate-900/30 border border-slate-850 hover:border-violet-500/30 transition-all group">
                <span className="text-2xl mb-3 block group-hover:scale-110 transition-transform origin-left">🎥</span>
                <h4 className="font-medium text-white mb-1">동영상 강의실</h4>
                <p className="text-xs text-slate-400">스트리밍 플레이어나 강의 모달 팝업을 연동할 수 있는 최적의 컴포넌트 공간입니다.</p>
              </div>

              {/* 기능 카드 3 */}
              <div className="p-6 rounded-xl bg-slate-900/30 border border-slate-850 hover:border-pink-500/30 transition-all group">
                <span className="text-2xl mb-3 block group-hover:scale-110 transition-transform origin-left">📊</span>
                <h4 className="font-medium text-white mb-1">학습 대시보드</h4>
                <p className="text-xs text-slate-400">학습 통계, 시간 관리, 스케줄링 위젯을 여기에 렌더링하세요.</p>
              </div>
            </div>
            
            {/* [여기에 대시보드 통계 차트나 다른 대형 위젯 컴포넌트를 자유롭게 임포트해서 배치하세요] */}
          </div>
        </section>
      </main>

      {/* =========================================================================
          4. 하단 푸터 영역 (향후 components/Footer.tsx 파일로 분리 가능)
         ========================================================================= */}
      <footer className="bg-slate-950 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 HyoJae Edu. All rights reserved.</p>
          <div className="flex space-x-6">
            <Link href="#" className="hover:text-slate-300 transition-colors">이용약관</Link>
            <Link href="#" className="hover:text-slate-300 transition-colors">개인정보처리방침</Link>
            <Link href="#" className="hover:text-slate-300 transition-colors">고객지원</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
