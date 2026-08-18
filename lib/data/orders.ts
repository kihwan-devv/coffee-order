import { createClient } from "@/lib/supabase/client";
import { order, type Row } from "./shared";
import type { OrderRoom, OrderStatus, Temperature } from "@/types";

const query = "*, order_responses(*)";
export async function listOrders(teamId: string): Promise<OrderRoom[]> { const { data, error } = await createClient().from("orders").select(query).eq("team_id", teamId).order("created_at", { ascending: false }); if (error) throw error; return data.map(order); }
export async function getOrder(teamId: string, orderCode: string) { const { data, error } = await createClient().from("orders").select(query).eq("team_id", teamId).eq("order_code", orderCode).single(); if (error) { console.error("get order error", { code: error.code, message: error.message, details: error.details, hint: error.hint }); throw error; } return order(data); }
export async function createOrder(input: { teamId: string; title: string; cafeId: string; currentMemberId: string }) {
  const payload = { team_id: input.teamId, title: input.title, cafe_id: input.cafeId, created_by_member_id: input.currentMemberId, status: "OPEN" };
  const { data, error } = await createClient().from("orders").insert(payload).select("id, order_code").single();
  console.log("create order result", { data, error });
  if (error) {
    console.error("create order error", { code: error.code, message: error.message, details: error.details, hint: error.hint });
    throw error;
  }
  if (!data?.id || !data.order_code) throw new Error("주문은 생성됐지만 id 또는 order_code를 반환받지 못했습니다. orders SELECT RLS 정책을 확인해 주세요.");
  return { id: data.id as string, orderCode: data.order_code as string };
}
export async function updateResponse(orderId: string, targetId: string, actorId: string, status: OrderStatus, selection?: { menuId: string; temperature: Temperature }) { const patch: Row = { status, menu_id: status === "SELECTED" ? selection?.menuId : null, temperature: status === "SELECTED" ? selection?.temperature : null, selected_by_member_id: status === "SELECTED" || status === "SKIP" ? actorId : null, marked_by_member_id: status === "ABSENT" ? actorId : null }; const { error } = await createClient().from("order_responses").update(patch).eq("order_id", orderId).eq("team_member_id", targetId); if (error) throw error; }
export async function closeOrder(orderId: string) { const { error } = await createClient().from("orders").update({ status: "CLOSED" }).eq("id", orderId); if (error) throw error; }
export async function deleteOrder(orderId: string) { const { data, error } = await createClient().from("orders").delete().eq("id", orderId).select("id").maybeSingle(); console.log("delete order result", { data, error }); if (error) { console.error("delete order error", { code: error.code, message: error.message, details: error.details, hint: error.hint }); throw error; } if (!data?.id) throw new Error("주문을 삭제할 권한이 없거나 주문을 찾을 수 없습니다."); }
