// 클라우드 백업(Supabase) 설정. 비워두면 이 폰에만 저장됩니다.
// 아래 두 값은 Supabase 프로젝트의 Settings → API 에서 복사합니다.
//   SUPABASE_URL      : https://xxxx.supabase.co
//   SUPABASE_ANON_KEY : "anon public" 키 (공개되어도 되는 키입니다. 보호는 supabase.sql의 접근 규칙이 합니다)
// 절대로 "service_role" 키를 여기에 넣지 마세요.
window.OG_CONFIG = { SUPABASE_URL: "", SUPABASE_ANON_KEY: "" };
