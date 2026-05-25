-- ツール利用履歴テーブル
create table if not exists public.tool_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tool_id text not null,
  tool_name text not null,
  credit_cost integer not null check (credit_cost > 0),
  credit_before integer not null check (credit_before >= 0),
  credit_after integer not null check (credit_after >= 0),
  used_at timestamp with time zone not null default now()
);

create index if not exists tool_usage_logs_user_id_idx
  on public.tool_usage_logs (user_id);

create index if not exists tool_usage_logs_used_at_idx
  on public.tool_usage_logs (used_at desc);

alter table public.tool_usage_logs enable row level security;

create policy "tool_usage_logs_select_own"
  on public.tool_usage_logs
  for select
  to authenticated
  using (auth.uid() = user_id);

-- クレジット消費を1トランザクションで実行（二重消費・マイナス残高防止）
create or replace function public.consume_tool_credit(
  p_user_id uuid,
  p_tool_id text,
  p_tool_name text,
  p_credit_cost integer
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

  select credit
  into v_before
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    return query
    select false, null::integer, null::integer, 'PROFILE_NOT_FOUND'::text;
    return;
  end if;

  if v_before < p_credit_cost then
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
    return query
    select false, v_before, v_before, 'INSUFFICIENT_CREDIT'::text;
    return;
  end if;

  insert into public.tool_usage_logs (
    user_id,
    tool_id,
    tool_name,
    credit_cost,
    credit_before,
    credit_after
  )
  values (
    p_user_id,
    p_tool_id,
    p_tool_name,
    p_credit_cost,
    v_before,
    v_after
  );

  return query
  select true, v_before, v_after, null::text;
end;
$$;

revoke all on function public.consume_tool_credit(uuid, text, text, integer)
  from public;

grant execute on function public.consume_tool_credit(uuid, text, text, integer)
  to authenticated;
