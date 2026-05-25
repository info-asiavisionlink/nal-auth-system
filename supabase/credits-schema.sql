-- クレジット・ツール管理スキーマ（Supabase SQL Editor にそのまま貼り付けて実行）
-- drop table は使用しません

-- profiles.credit（既存テーブルに不足時のみ追加）
alter table public.profiles
  add column if not exists credit integer not null default 0;

-- tools テーブル
create table if not exists public.tools (
  id uuid primary key default gen_random_uuid(),
  tool_key text unique not null,
  tool_name text not null,
  description text,
  category text,
  tool_url text,
  credit_cost integer not null default 0,
  is_active boolean not null default true,
  display_order integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tools_is_active_display_order_idx
  on public.tools (is_active, display_order);

alter table public.tools enable row level security;

drop policy if exists "tools_select_authenticated" on public.tools;
create policy "tools_select_authenticated"
  on public.tools
  for select
  to authenticated
  using (true);

-- tool_usage_logs（既存があっても拡張）
create table if not exists public.tool_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tool_key text not null,
  tool_name text,
  credit_cost integer not null default 0,
  credit_before integer,
  credit_after integer,
  status text not null default 'success',
  message text,
  external_request_id text,
  created_at timestamptz not null default now()
);

-- 旧カラムからの移行（存在する場合のみ）
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tool_usage_logs'
      and column_name = 'tool_id'
  ) then
    update public.tool_usage_logs
    set tool_key = tool_id
    where tool_key is null and tool_id is not null;
  end if;
end $$;

alter table public.tool_usage_logs
  add column if not exists tool_key text;

alter table public.tool_usage_logs
  add column if not exists tool_name text;

alter table public.tool_usage_logs
  add column if not exists status text default 'success';

update public.tool_usage_logs
set status = 'success'
where status is null;

alter table public.tool_usage_logs
  add column if not exists message text;

alter table public.tool_usage_logs
  add column if not exists external_request_id text;

alter table public.tool_usage_logs
  add column if not exists created_at timestamptz not null default now();

-- search_request_id があれば external_request_id へコピー
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tool_usage_logs'
      and column_name = 'search_request_id'
  ) then
    update public.tool_usage_logs
    set external_request_id = search_request_id::text
    where external_request_id is null and search_request_id is not null;
  end if;
end $$;

create index if not exists tool_usage_logs_user_id_idx
  on public.tool_usage_logs (user_id);

create index if not exists tool_usage_logs_created_at_idx
  on public.tool_usage_logs (created_at desc);

create unique index if not exists tool_usage_logs_dedup_idx
  on public.tool_usage_logs (user_id, tool_key, external_request_id)
  where external_request_id is not null and btrim(external_request_id) <> '';

alter table public.tool_usage_logs enable row level security;

drop policy if exists "tool_usage_logs_select_own" on public.tool_usage_logs;
create policy "tool_usage_logs_select_own"
  on public.tool_usage_logs
  for select
  to authenticated
  using (auth.uid() = user_id);

-- 初期ツールデータ
insert into public.tools (
  tool_key,
  tool_name,
  description,
  category,
  tool_url,
  credit_cost,
  is_active,
  display_order
)
values (
  'google_map_leads',
  'Googleマップ営業リスト作成',
  'エリアとキーワードからGoogleマップ掲載企業を自動取得し、営業リスト化します。',
  '営業支援',
  '',
  30,
  true,
  10
)
on conflict (tool_key) do update set
  tool_name = excluded.tool_name,
  description = excluded.description,
  category = excluded.category,
  credit_cost = excluded.credit_cost,
  is_active = excluded.is_active,
  display_order = excluded.display_order,
  updated_at = now();

-- クレジット消費 RPC（tool_key ベース・二重消費防止・履歴保存）
create or replace function public.consume_credit_by_tool_key(
  p_user_id uuid,
  p_tool_key text,
  p_tool_name text,
  p_credit_cost integer,
  p_external_request_id text default null
)
returns table (
  success boolean,
  credit_before integer,
  credit_after integer,
  error text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before integer;
  v_after integer;
  v_external_id text;
begin
  if auth.uid() is distinct from p_user_id then
    return query
    select false, null::integer, null::integer, 'UNAUTHORIZED'::text;
    return;
  end if;

  if p_credit_cost is null or p_credit_cost < 1 then
    return query
    select false, null::integer, null::integer, 'INVALID_CREDIT_COST'::text;
    return;
  end if;

  v_external_id := nullif(btrim(coalesce(p_external_request_id, '')), '');

  if v_external_id is not null then
    if exists (
      select 1
      from public.tool_usage_logs
      where user_id = p_user_id
        and tool_key = p_tool_key
        and external_request_id = v_external_id
        and status = 'success'
    ) then
      return query
      select false, null::integer, null::integer, 'DUPLICATE_REQUEST'::text;
      return;
    end if;
  end if;

  select credit
  into v_before
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    insert into public.tool_usage_logs (
      user_id, tool_key, tool_name, credit_cost, credit_before, credit_after,
      status, message, external_request_id
    )
    values (
      p_user_id, p_tool_key, p_tool_name, p_credit_cost, null, null,
      'error', 'PROFILE_NOT_FOUND', v_external_id
    );
    return query
    select false, null::integer, null::integer, 'PROFILE_NOT_FOUND'::text;
    return;
  end if;

  if v_before < p_credit_cost then
    insert into public.tool_usage_logs (
      user_id, tool_key, tool_name, credit_cost, credit_before, credit_after,
      status, message, external_request_id
    )
    values (
      p_user_id, p_tool_key, p_tool_name, p_credit_cost, v_before, v_before,
      'insufficient_credit', 'クレジットが不足しています。', v_external_id
    );
    return query
    select false, v_before, v_before, 'INSUFFICIENT_CREDIT'::text;
    return;
  end if;

  v_after := v_before - p_credit_cost;

  update public.profiles
  set credit = v_after
  where id = p_user_id
    and credit >= p_credit_cost;

  if not found then
    select credit into v_before from public.profiles where id = p_user_id;
    insert into public.tool_usage_logs (
      user_id, tool_key, tool_name, credit_cost, credit_before, credit_after,
      status, message, external_request_id
    )
    values (
      p_user_id, p_tool_key, p_tool_name, p_credit_cost, v_before, v_before,
      'insufficient_credit', 'クレジットが不足しています。', v_external_id
    );
    return query
    select false, v_before, v_before, 'INSUFFICIENT_CREDIT'::text;
    return;
  end if;

  insert into public.tool_usage_logs (
    user_id, tool_key, tool_name, credit_cost, credit_before, credit_after,
    status, message, external_request_id
  )
  values (
    p_user_id, p_tool_key, p_tool_name, p_credit_cost, v_before, v_after,
    'success', null, v_external_id
  );

  return query
  select true, v_before, v_after, null::text;
exception
  when unique_violation then
    return query
    select false, v_before, v_before, 'DUPLICATE_REQUEST'::text;
end;
$$;

revoke all on function public.consume_credit_by_tool_key(uuid, text, text, integer, text)
  from public;

grant execute on function public.consume_credit_by_tool_key(uuid, text, text, integer, text)
  to authenticated;
