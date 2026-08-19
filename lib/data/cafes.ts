import { createClient } from "@/lib/supabase/client";
import { cafe, menu } from "./shared";
import type { Cafe, Menu, Temperature } from "@/types";

export const DEFAULT_CAFE_MENUS = [
  { name: "아메리카노", temperatures: ["HOT", "ICED"] as Temperature[] },
  { name: "카페라떼", temperatures: ["HOT", "ICED"] as Temperature[] },
] as const;

export type CafeInput = { name: string; logoUrl?: string; imageUrl?: string; officialMenuUrl?: string; isActive?: boolean };
export type MenuInput = { name: string; category?: string; imageUrl?: string; temperatures: Temperature[]; isActive?: boolean };

export async function listCafesAndMenus() {
  const supabase = createClient();
  const [cafes, menus] = await Promise.all([supabase.from("cafes").select("*"), supabase.from("menus").select("*")]);
  if (cafes.error) throw cafes.error;
  if (menus.error) throw menus.error;
  return { cafes: cafes.data.map(cafe), menus: menus.data.map(menu) };
}
export async function createCafe(input: CafeInput) {
  const { data, error } = await createClient().rpc("create_cafe_with_default_menus", { p_name: input.name, p_logo_url: input.logoUrl || null, p_image_url: input.imageUrl || null, p_official_menu_url: input.officialMenuUrl || null });
  if (error) throw error; return cafe(data);
}
export async function createMenu(cafeId: string, input: MenuInput) {
  const { data, error } = await createClient().from("menus").insert({ cafe_id: cafeId, name: input.name, category: input.category || null, image_url: input.imageUrl || null, available_temperatures: input.temperatures, is_active: input.isActive ?? true }).select().single();
  if (error) throw error; return menu(data);
}
export async function updateCafe(id: string, input: CafeInput): Promise<Cafe> {
  const { data, error } = await createClient().from("cafes").update({ name: input.name, logo_url: input.logoUrl || null, image_url: input.imageUrl || null, official_menu_url: input.officialMenuUrl || null, is_active: input.isActive ?? true }).eq("id", id).select().single();
  if (error) throw error; return cafe(data);
}
export async function updateMenu(id: string, input: MenuInput): Promise<Menu> {
  const { data, error } = await createClient().from("menus").update({ name: input.name, category: input.category || null, image_url: input.imageUrl || null, available_temperatures: input.temperatures, is_active: input.isActive ?? true }).eq("id", id).select().single();
  if (error) throw error; return menu(data);
}
