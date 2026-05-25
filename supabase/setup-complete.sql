-- ============================================================
-- NAL Auth System: profiles 完全セットアップ
-- Supabase SQL Editor にそのまま貼り付けて実行
-- ============================================================

-- テーブル作成
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  email text not null,
  credit integer not null default 500,
  created_at timestamp with time zone not null default now()
);

-- 不足カラムの追加（既存テーブルがある場合の修復用）
alter table public.profiles
  add column if not exists username text,
  add column if not exists email text,
  add column if not exists credit integer not null default 500,
  add column if not exists created_at timestamp with time zone not null default now();

-- NOT NULL 制約（新規カラム追加後にデータがある場合は事前に値を埋めてから実行）
alter table public.profiles
  alter column username set not null,
  alter column email set not null;

alter table public.profiles
  alter column credit set default 500;

alter table public.profiles
  alter column created_at set default now();

-- RLS
alter table public.profiles enable row level security;

-- 既存ポリシーを削除して再作成（冪等）
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- インデックス
create index if not exists profiles_email_idx on public.profiles (email);

-- PostgREST のスキーマキャッシュ更新
notify pgrst, 'reload schema';
