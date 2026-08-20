-- Add the shared default menu set to every existing cafe.
-- Existing menu rows and their settings are preserved.
with default_menus (name, available_temperatures, position) as (
  values
    ('아메리카노'::text, array['HOT', 'ICED']::text[], 1),
    ('카페라떼'::text, array['HOT', 'ICED']::text[], 2)
),
cafe_sort_orders as (
  select
    c.id as cafe_id,
    coalesce(max(m.sort_order), -1) as last_sort_order
  from public.cafes as c
  left join public.menus as m on m.cafe_id = c.id
  group by c.id
)
insert into public.menus (
  cafe_id,
  name,
  available_temperatures,
  is_active,
  sort_order
)
select
  cafe.id,
  default_menu.name,
  default_menu.available_temperatures,
  true,
  cafe_sort_order.last_sort_order + default_menu.position
from public.cafes as cafe
join cafe_sort_orders as cafe_sort_order
  on cafe_sort_order.cafe_id = cafe.id
cross join default_menus as default_menu
where not exists (
  select 1
  from public.menus as existing_menu
  where existing_menu.cafe_id = cafe.id
    and lower(btrim(existing_menu.name)) = lower(default_menu.name)
);
