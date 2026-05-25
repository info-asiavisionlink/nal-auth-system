-- profiles テーブル
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  email text not null,
  credit integer not null default 500,
  created_at timestamp with time zone not null default now()
);

-- RLS 有効化
alter table public.profiles enable row level security;

-- 自分のプロフィールのみ参照
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- 自分のプロフィールのみ作成（新規登録時）
create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- 自分のプロフィールのみ更新
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- インデックス（メール検索用・任意）
create index if not exists profiles_email_idx on public.profiles (email);
