-- お気に入りツール（ダッシュボードのシステム一覧ライブラリ用）
create table if not exists public.user_favorite_tools (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tool_id text not null,
  created_at timestamp with time zone not null default now(),
  unique (user_id, tool_id)
);

create index if not exists user_favorite_tools_user_id_idx
  on public.user_favorite_tools (user_id);

alter table public.user_favorite_tools enable row level security;

create policy "user_favorite_tools_select_own"
  on public.user_favorite_tools
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "user_favorite_tools_insert_own"
  on public.user_favorite_tools
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "user_favorite_tools_delete_own"
  on public.user_favorite_tools
  for delete
  to authenticated
  using (auth.uid() = user_id);
