-- Allow an authenticated anonymous user to add themselves to an existing team.
-- This migration is additive: existing tables, rows, constraints, and triggers stay intact.

create or replace function public.add_team_member_and_join(
  p_team_code text,
  p_member_name text
)
returns table(team_id uuid, team_member_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auth_user_id uuid := auth.uid();
  v_team_id uuid;
  v_team_member_id uuid;
  v_member_name text := btrim(p_member_name);
begin
  if v_auth_user_id is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  if p_team_code is null or btrim(p_team_code) = '' then
    raise exception using errcode = '22023', message = 'TEAM_CODE_REQUIRED';
  end if;

  if v_member_name = '' or char_length(v_member_name) > 50 then
    raise exception using errcode = '22023', message = 'INVALID_MEMBER_NAME';
  end if;

  select t.id
    into v_team_id
    from public.teams as t
   where upper(t.team_code) = upper(btrim(p_team_code))
   limit 1;

  if v_team_id is null then
    raise exception using errcode = 'P0002', message = 'TEAM_NOT_FOUND';
  end if;

  if exists (
    select 1
      from public.team_members as tm
     where tm.team_id = v_team_id
       and lower(btrim(tm.name)) = lower(v_member_name)
  ) then
    raise exception using errcode = '23505', message = 'TEAM_MEMBER_NAME_EXISTS';
  end if;

  -- The existing team_members unique constraint remains the final race-condition guard.
  insert into public.team_members (team_id, name)
  values (v_team_id, v_member_name)
  returning id into v_team_member_id;

  -- Keep one browser identity per team. Avoid an ON CONFLICT target so this remains
  -- compatible with the existing named unique/primary-key constraint.
  update public.team_member_sessions
     set team_member_id = v_team_member_id
   where auth_user_id = v_auth_user_id
     and team_id = v_team_id;

  if not found then
    insert into public.team_member_sessions (auth_user_id, team_id, team_member_id)
    values (v_auth_user_id, v_team_id, v_team_member_id);
  end if;

  return query select v_team_id, v_team_member_id;
end;
$$;

revoke all on function public.add_team_member_and_join(text, text) from public, anon;
grant execute on function public.add_team_member_and_join(text, text) to authenticated;

comment on function public.add_team_member_and_join(text, text) is
  'Creates one uniquely named team member and links it to the current anonymous auth user.';


create or replace function public.add_member_to_open_orders(
  p_team_member_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auth_user_id uuid := auth.uid();
  v_team_id uuid;
  v_inserted_count integer;
begin
  if v_auth_user_id is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  select tm.team_id
    into v_team_id
    from public.team_members as tm
    join public.team_member_sessions as tms
      on tms.team_id = tm.team_id
     and tms.team_member_id = tm.id
   where tm.id = p_team_member_id
     and tms.auth_user_id = v_auth_user_id
     and tm.is_active = true
   limit 1;

  if v_team_id is null then
    raise exception using errcode = '42501', message = 'TEAM_MEMBER_SESSION_REQUIRED';
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

comment on function public.add_member_to_open_orders(uuid) is
  'Adds the current session member to OPEN orders only, without duplicating responses.';
