-- 1. 학습 게임 결과를 저장할 테이블 생성
CREATE TABLE IF NOT EXISTS game_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 리더보드 조회를 위한 인덱스 추가 (점수 내림차순, 동일 점수 시 등록순 정렬 최적화)
CREATE INDEX IF NOT EXISTS idx_game_results_score_desc ON game_results (score DESC, created_at ASC);

-- 3. Row Level Security(RLS) 보안 정책 활성화
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;

-- 4. 누구나 리더보드를 조회할 수 있도록 SELECT 정책 허용 (익명 접근)
CREATE POLICY "Allow anonymous read access"
ON game_results FOR SELECT
TO anon
USING (true);

-- 5. 누구나 게임 결과를 기록할 수 있도록 INSERT 정책 허용 (익명 접근)
CREATE POLICY "Allow anonymous write access"
ON game_results FOR INSERT
TO anon
WITH CHECK (true);
