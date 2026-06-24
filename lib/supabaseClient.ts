import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 환경변수 누락 시 우아한 에러 핸들링 및 Mock 클라이언트 구현
const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

if (!isSupabaseConfigured) {
  console.warn(
    "⚠️ Supabase 환경 변수(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)가 설정되지 않았습니다. " +
    "일부 기능이 동작하지 않거나 데모(더미) 모드로 작동할 수 있습니다."
  );
}

// 헬퍼 함수: Supabase가 구성되었는지 여부 확인
export function checkSupabaseConnection() {
  return isSupabaseConfigured;
}
