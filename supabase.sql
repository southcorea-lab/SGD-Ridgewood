-- Supabase → SQL Editor 에 통째로 붙여넣고 Run 하세요. (한 번만)

-- 1) 현재 데이터(계정당 1행)
create table if not exists public.app_state (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb       not null,
  rev        bigint      not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.app_state enable row level security;
create policy "own select" on public.app_state for select using (auth.uid() = user_id);
create policy "own insert" on public.app_state for insert with check (auth.uid() = user_id);
create policy "own update" on public.app_state for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2) 하루 1회 스냅샷(되돌릴 수 있는 이력). 앱에서는 추가만 가능하고 수정·삭제는 불가.
create table if not exists public.app_backups (
  id         bigint generated always as identity primary key,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  data       jsonb       not null,
  created_at timestamptz not null default now()
);
alter table public.app_backups enable row level security;
create policy "own select" on public.app_backups for select using (auth.uid() = user_id);
create policy "own insert" on public.app_backups for insert with check (auth.uid() = user_id);
