-- Use anonymous auth only for the authenticated PostgREST role.
-- Browser-local teamCode -> teamMemberId storage is the TeamMember identity source.
-- Existing teams, members, orders, responses, cafes, and menus are preserved.

-- Remove every existing policy on the affected tables before replacing session-based RLS.
do $$
declare
  policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
      from pg_policies
     where schemaname = 'public'
       and tablename in ('teams', 'team_members', 'cafes', 'menus', 'orders', 'order_responses')
  loop
    execute format('drop policy if exists %I on %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  end loop;
end;
$$;

alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.cafes enable row level security;
alter table public.menus enable row level security;
alter table public.orders enable row level security;
alter table public.order_responses enable row level security;

create policy teams_authenticated_select
  on public.teams for select to authenticated using (true);

create policy team_members_authenticated_select
  on public.team_members for select to authenticated using (true);

create policy cafes_authenticated_all
  on public.cafes for all to authenticated using (true) with check (true);

create policy menus_authenticated_all
  on public.menus for all to authenticated using (true) with check (true);

create policy orders_authenticated_select
  on public.orders for select to authenticated using (true);
create policy orders_authenticated_insert
  on public.orders for insert to authenticated with check (true);
create policy orders_authenticated_update
  on public.orders for update to authenticated using (true) with check (true);
create policy orders_authenticated_delete
  on public.orders for delete to authenticated using (true);

create policy order_responses_authenticated_select
  on public.order_responses for select to authenticated using (true);
create policy order_responses_authenticated_update_open
  on public.order_responses for update to authenticated
  using (public.is_order_open(order_id))
  with check (public.is_order_open(order_id));


drop function if exists public.create_team(text, text);

create or replace function public.create_team(
  p_team_name text,
  p_member_names text[]
)
returns table(team_id uuid, team_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_team_id uuid;
  v_team_code text;
  v_team_name text := btrim(p_team_name);
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;
  if v_team_name = '' or char_length(v_team_name) > 100 then
    raise exception using errcode = '22023', message = 'INVALID_TEAM_NAME';
  end if;
  if p_member_names is null or cardinality(p_member_names) = 0 then
    raise exception using errcode = '22023', message = 'MEMBER_REQUIRED';
  end if;
  if exists (select 1 from unnest(p_member_names) as member_name(value) where btrim(value) = '' or char_length(btrim(value)) > 50) then
    raise exception using errcode = '22023', message = 'INVALID_MEMBER_NAME';
  end if;
  if exists (
    select lower(btrim(value))
      from unnest(p_member_names) as member_name(value)
     group by lower(btrim(value))
    having count(*) > 1
  ) then
    raise exception using errcode = '23505', message = 'TEAM_MEMBER_NAME_EXISTS';
  end if;

  loop
    v_team_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from public.teams as t where t.team_code = v_team_code);
  end loop;

  insert into public.teams (team_code, name, created_by_auth_user)
  values (v_team_code, v_team_name, auth.uid())
  returning id into v_team_id;

  insert into public.team_members (team_id, name)
  select v_team_id, btrim(value)
    from unnest(p_member_names) with ordinality as member(value, position)
   order by position;

  return query select v_team_id, v_team_code;
end;
$$;

revoke all on function public.create_team(text, text[]) from public, anon;
grant execute on function public.create_team(text, text[]) to authenticated;


create or replace function public.add_team_member(
  p_team_code text,
  p_member_name text
)
returns table(team_id uuid, team_member_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_team_id uuid;
  v_team_member_id uuid;
  v_member_name text := btrim(p_member_name);
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;
  if p_team_code is null or btrim(p_team_code) = '' then
    raise exception using errcode = '22023', message = 'TEAM_CODE_REQUIRED';
  end if;
  if v_member_name = '' or char_length(v_member_name) > 50 then
    raise exception using errcode = '22023', message = 'INVALID_MEMBER_NAME';
  end if;

  select t.id into v_team_id
    from public.teams as t
   where upper(t.team_code) = upper(btrim(p_team_code))
   limit 1;
  if v_team_id is null then
    raise exception using errcode = 'P0002', message = 'TEAM_NOT_FOUND';
  end if;
  if exists (
    select 1 from public.team_members as tm
     where tm.team_id = v_team_id
       and lower(btrim(tm.name)) = lower(v_member_name)
  ) then
    raise exception using errcode = '23505', message = 'TEAM_MEMBER_NAME_EXISTS';
  end if;

  insert into public.team_members (team_id, name)
  values (v_team_id, v_member_name)
  returning id into v_team_member_id;

  return query select v_team_id, v_team_member_id;
end;
$$;

revoke all on function public.add_team_member(text, text) from public, anon;
grant execute on function public.add_team_member(text, text) to authenticated;


create or replace function public.add_member_to_open_orders(
  p_team_member_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_team_id uuid;
  v_inserted_count integer;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  select tm.team_id into v_team_id
    from public.team_members as tm
   where tm.id = p_team_member_id
     and tm.is_active = true
   limit 1;
  if v_team_id is null then
    raise exception using errcode = '22023', message = 'INVALID_TEAM_MEMBER';
  end if;

  insert into public.order_responses (order_id, team_member_id, status)
  select o.id, p_team_member_id, 'PENDING'
    from public.orders as o
   where o.team_id = v_team_id
     and o.status = 'OPEN'
  on conflict (order_id, team_member_id) do nothing;

  get diagnostics v_inserted_count = row_count;
  return v_inserted_count;
end;
$$;

revoke all on function public.add_member_to_open_orders(uuid) from public, anon;
grant execute on function public.add_member_to_open_orders(uuid) to authenticated;


create or replace function public.add_member_to_order(
  p_order_code text,
  p_team_member_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  select o.id into v_order_id
    from public.orders as o
    join public.team_members as tm
      on tm.team_id = o.team_id
     and tm.id = p_team_member_id
     and tm.is_active = true
   where o.order_code = p_order_code
     and o.status = 'OPEN'
   limit 1;
  if v_order_id is null then
    raise exception using errcode = '22023', message = 'OPEN_ORDER_OR_TEAM_MEMBER_NOT_FOUND';
  end if;

  insert into public.order_responses (order_id, team_member_id, status)
  values (v_order_id, p_team_member_id, 'PENDING')
  on conflict (order_id, team_member_id) do nothing;

  return v_order_id;
end;
$$;

revoke all on function public.add_member_to_order(text, uuid) from public, anon;
grant execute on function public.add_member_to_order(text, uuid) to authenticated;

-- Remove obsolete auth.uid() -> TeamMember functions after their policies and RPC callers are gone.
drop function if exists public.join_team_as_member(text, uuid);
drop function if exists public.add_team_member_and_join(text, text);
drop function if exists public.create_team_with_members(text, text[], text);
drop function if exists public.is_team_participant(uuid);
drop function if exists public.current_team_member_id(uuid);

-- This table contains only the obsolete identity mapping. Domain data is not touched.
drop table if exists public.team_member_sessions;
