# 주문 가드 (Order Guard)

발주 누락 방지용 모바일 웹앱(PWA). 파일 몇 개뿐인 정적 사이트라 빌드가 필요 없습니다.

## GitHub Pages로 올리기
1. 저장소 루트에 이 폴더의 파일을 모두 올립니다 (`index.html`, `manifest.webmanifest`, `sw.js`, `icons/`).
2. 저장소 Settings → Pages → Source: `Deploy from a branch`, Branch: `main` / `(root)` → Save.
3. 1~2분 뒤 `https://<아이디>.github.io/<저장소>/` 로 열립니다.

## 폰에 설치
- iPhone: Safari로 열기 → 공유 버튼 → "홈 화면에 추가"
- Android: Chrome으로 열기 → 메뉴(⋮) → "앱 설치" 또는 "홈 화면에 추가"

## 데이터
- 입력한 내용은 그 폰의 브라우저 저장소에만 있습니다. 설정 탭 → 백업 → 내보내기로 주기적으로 복사해 두세요.
- 브라우저 데이터를 지우면 사라집니다.

## 주의
- 저장소가 Public이면 주소를 아는 사람은 누구나 앱을 열 수 있습니다. 앱에는 일반 명칭의 샘플 품목만 들어 있고, 사장님이 입력한 데이터는 저장소에 올라가지 않습니다.
- 새 버전을 올린 뒤에는 앱을 한 번 완전히 닫았다 열어야 반영될 수 있습니다.

## 업데이트하는 방법
1. GitHub 저장소에서 바뀐 파일을 같은 이름으로 다시 올립니다 (Add file → Upload files → Commit).
2. 1~2분 뒤 사이트가 자동으로 새 버전이 됩니다.
3. 폰에서 앱을 열면 위쪽에 "새 버전이 있습니다 — 새로고침" 알림이 뜹니다. 누르면 반영됩니다.
4. 앱 파일을 크게 바꿀 때는 `sw.js` 맨 위의 `CACHE` 이름(order-guard-v2 → v3)도 올려주세요.

## 클라우드 백업 켜기 (Supabase, 무료 플랜으로 시작 가능 — 요금·한도는 Supabase 사이트에서 확인)
앱은 기본적으로 폰에만 저장합니다. 서버에도 백업하려면 한 번만 설정하세요.
1. supabase.com 에서 가입하고 New project 를 만듭니다.
2. 왼쪽 메뉴 SQL Editor → New query → `supabase.sql` 내용을 붙여넣고 Run.
3. Authentication → Email Templates 에서 **Magic Link** 와 **Confirm signup** 두 템플릿 본문에 `{{ .Token }}` 을 넣어 이메일에 6자리 인증번호가 나오게 합니다.
4. Authentication → URL Configuration 의 Site URL 에 앱 주소(`https://아이디.github.io/order-guard/`)를 넣습니다.
5. Settings → API 에서 Project URL 과 `anon public` 키를 복사해 `config.js` 의 두 칸에 넣고 GitHub에 올립니다. (service_role 키는 절대 넣지 마세요.)
6. 앱 → 설정 탭 → 클라우드 백업 → 이메일 입력 → 인증번호 입력. 이후 변경은 몇 초 뒤 자동 백업됩니다.

주의: Supabase 기본 이메일은 시간당 발송 수가 적습니다. 사용자가 늘면 별도 메일 서비스 연결이 필요합니다.


## v0.6.0 — 주문일 알림 (Order-day reminders)
- 설정 → 거래처 선택 → **주문 일정**: 주문 요일, 마감 시간, 몇 분 전에 알릴지 정합니다.
- 홈 화면 맨 위에 **오늘 주문할 곳**이 표시되고, 마감이 지나면 빨갛게 바뀝니다. 아래 '발주' 탭 숫자도 오늘 주문할 곳 수입니다.
- **캘린더에 알림 추가** 버튼을 누르면 order-guard.ics 파일이 내려받아집니다. 열어서 휴대폰 캘린더에 추가하면 매주 반복 알림이 울립니다(앱이 닫혀 있어도).
- 일정을 바꾼 뒤 다시 추가하면 같은 일정이 갱신됩니다. 중복되면 캘린더에서 예전 것을 지우세요.

## v0.9.0 — 초대받은 사용자만 로그인 (Invite-only sign-in)
Supabase를 연결(config.js에 주소와 anon 키 입력)하면 앱 첫 화면이 **로그인 화면**이 됩니다. 이메일로 받은 인증번호를 넣어야 앱이 열리고, 한 번 로그인하면 그 폰에서는 계속 유지됩니다.

**초대한 사람만 들어오게 하는 설정 (Supabase 대시보드):**
1. Authentication → Sign In / Providers(또는 Settings) → **"Allow new users to sign up"을 끕니다.**
2. Authentication → Users → **Add user(또는 Invite user)** 로 허용할 이메일(예: 사장님)을 직접 추가합니다.
3. Authentication → Email Templates에서 로그인 메일 본문에 **{{ .Token }}** (6자리 번호)가 들어가게 합니다. 기본은 링크 형식이라 번호가 안 보일 수 있습니다.

초대하지 않은 이메일은 "초대 목록에 없는 이메일입니다"라고 나오고 번호가 발송되지 않습니다. 사용자를 막으려면 Users 목록에서 삭제하면 됩니다.

설정 전(config.js가 비어 있을 때)에는 로그인 없이 기기 안에서만 동작합니다.

## v0.10.0 — 구글 드라이브 백업
Supabase 없이도 내 구글 드라이브에 자동 백업할 수 있습니다. 설정 방법은 `GOOGLE-BACKUP.md`, 받는 스크립트는 `google-backup.gs` 입니다. 앱의 설정 → 구글 백업에서 주소와 비밀 단어를 넣으면 변경 후 약 5초 뒤 자동 저장됩니다. 주소와 비밀 단어는 그 폰에만 저장되고 저장소에는 들어가지 않습니다.


## v0.11.0 — 백업 필수 + 초대 링크
- `config.js`의 `GOOGLE_URL`에 웹 앱 주소를 넣으면 백업이 **필수**가 되고, 초대 코드가 없으면 앱이 열리지 않습니다. 설정은 `GOOGLE-BACKUP.md`를 따르세요.
- 공개 앱에는 가상의 **샘플 데이터**만 들어 있습니다. 실제 거래처 정보는 구글 드라이브 백업에서 불러옵니다.
- 초대 링크: `https://(앱 주소)/#k=(초대 코드)`
