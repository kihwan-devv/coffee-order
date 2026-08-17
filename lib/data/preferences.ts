/* eslint-disable @typescript-eslint/no-explicit-any -- view rows are normalized at this boundary. */
import { createClient } from "@/lib/supabase/client";
import type { MenuRecommendation } from "@/types";
export async function getRecommendations(teamMemberId: string, cafeId: string) {
  const supabase = createClient();
  const [stats, recent] = await Promise.all([
    supabase.from("team_member_cafe_menu_stats").select("*").eq("team_member_id", teamMemberId).eq("cafe_id", cafeId).order("order_count", { ascending: false }).order("last_ordered_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("order_responses").select("menu_id, temperature, updated_at, orders!inner(cafe_id)").eq("team_member_id", teamMemberId).eq("status", "SELECTED").eq("orders.cafe_id", cafeId).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (stats.error) throw stats.error; if (recent.error) throw recent.error;
  const map = (row: any, count = 1): MenuRecommendation | null => row ? ({ menuId: row.menu_id, temperature: row.temperature, orderCount: row.order_count ?? count, lastSelectedAt: row.last_ordered_at ?? row.updated_at }) : null;
  return { frequent: map(stats.data), recent: map(recent.data) };
}
