-- Create a cafe and its initial menus atomically. Existing rows are untouched.
create or replace function public.create_cafe_with_default_menus(
  p_name text,
  p_logo_url text default null,
  p_image_url text default null,
  p_official_menu_url text default null
)
returns public.cafes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cafe public.cafes;
  v_name text := btrim(p_name);
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;
  if v_name = '' or char_length(v_name) > 100 then
    raise exception using errcode = '22023', message = 'INVALID_CAFE_NAME';
  end if;

  insert into public.cafes (name, logo_url, image_url, official_menu_url, is_active)
  values (v_name, nullif(btrim(p_logo_url), ''), nullif(btrim(p_image_url), ''), nullif(btrim(p_official_menu_url), ''), true)
  returning * into v_cafe;

  insert into public.menus (cafe_id, name, available_temperatures, is_active, sort_order)
  values
    (v_cafe.id, '아메리카노', array['HOT', 'ICED'], true, 0),
    (v_cafe.id, '카페라떼', array['HOT', 'ICED'], true, 1);

  return v_cafe;
end;
$$;

revoke all on function public.create_cafe_with_default_menus(text, text, text, text) from public, anon;
grant execute on function public.create_cafe_with_default_menus(text, text, text, text) to authenticated;
