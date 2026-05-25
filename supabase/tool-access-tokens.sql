-- ツール起動用一時アクセストークン（Supabase SQL Editor にそのまま貼り付けて実行）

create table if not exists public.tool_access_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tool_key text not null,
  token text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists tool_access_tokens_token_idx
  on public.tool_access_tokens (token);

create index if not exists tool_access_tokens_user_id_idx
  on public.tool_access_tokens (user_id);

create index if not exists tool_access_tokens_tool_key_idx
  on public.tool_access_tokens (tool_key);

create index if not exists tool_access_tokens_expires_at_idx
  on public.tool_access_tokens (expires_at);

alter table public.tool_access_tokens enable row level security;

-- クライアントからの直接参照は不可（API は service_role で検証）
drop policy if exists "tool_access_tokens_deny_all" on public.tool_access_tokens;

-- Bearer 認証時のクレジット消費（auth.uid 不要・service_role 専用）
create or replace function public.consume_credit_for_user(
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

revoke all on function public.consume_credit_for_user(uuid, text, text, integer, text)
  from public;

grant execute on function public.consume_credit_for_user(uuid, text, text, integer, text)
  to service_role;
