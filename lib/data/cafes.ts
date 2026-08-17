import { createClient } from "@/lib/supabase/client";
import { cafe, menu } from "./shared";
import type { Temperature } from "@/types";

export async function listCafesAndMenus() {
  const supabase = createClient();
  const [cafes, menus] = await Promise.all([supabase.from("cafes").select("*"), supabase.from("menus").select("*")]);
  if (cafes.error) throw cafes.error;
  if (menus.error) throw menus.error;
  return { cafes: cafes.data.map(cafe), menus: menus.data.map(menu) };
}
export async function createCafe(name: string, officialMenuUrl?: string) {
  const { data, error } = await createClient().from("cafes").insert({ name, official_menu_url: officialMenuUrl || null }).select().single();
  if (error) throw error; return cafe(data);
}
export async function createMenu(cafeId: string, name: string, temperatures: Temperature[]) {
  const { data, error } = await createClient().from("menus").insert({ cafe_id: cafeId, name, available_temperatures: temperatures }).select().single();
  if (error) throw error; return menu(data);
}
