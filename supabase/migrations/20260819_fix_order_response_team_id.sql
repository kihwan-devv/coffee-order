-- Ensure order participation responses include the NOT NULL team_id and satisfy
-- the (order_id, team_id) foreign key. Existing domain data is not modified.

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

  insert into public.order_responses (
    order_id,
    team_id,
    team_member_id,
    status,
    menu_id,
    temperature,
    selected_by_member_id,
    marked_by_member_id
  )
  select
    o.id,
    o.team_id,
    p_team_member_id,
    'PENDING',
    null,
    null,
    null,
    null
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


-- Remove the earlier order-code overload if it was already deployed.
drop function if exists public.add_member_to_order(text, uuid);

create or replace function public.add_member_to_order(
  p_order_id uuid,
  p_team_member_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_team_id uuid;
  v_order_status text;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  select o.team_id, o.status::text
    into v_team_id, v_order_status
    from public.orders as o
   where o.id = p_order_id;

  if v_team_id is null then
    raise exception using errcode = 'P0002', message = 'ORDER_NOT_FOUND';
  end if;
  if v_order_status <> 'OPEN' then
    raise exception using errcode = '22023', message = 'ORDER_NOT_OPEN';
  end if;
  if not exists (
    select 1
      from public.team_members as tm
     where tm.id = p_team_member_id
       and tm.team_id = v_team_id
       and tm.is_active = true
  ) then
    raise exception using errcode = '22023', message = 'TEAM_MEMBER_NOT_IN_ORDER_TEAM';
  end if;

  insert into public.order_responses (
    order_id,
    team_id,
    team_member_id,
    status,
    menu_id,
    temperature,
    selected_by_member_id,
    marked_by_member_id
  )
  values (
    p_order_id,
    v_team_id,
    p_team_member_id,
    'PENDING',
    null,
    null,
    null,
    null
  )
  on conflict (order_id, team_member_id) do nothing;

  return p_order_id;
end;
$$;

revoke all on function public.add_member_to_order(uuid, uuid) from public, anon;
grant execute on function public.add_member_to_order(uuid, uuid) to authenticated;
