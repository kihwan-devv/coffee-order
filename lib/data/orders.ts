import { createClient } from "@/lib/supabase/client";
import { order, type Row } from "./shared";
import type { OrderStatus, Temperature } from "@/types";

const query = "*, order_responses(*)";
export async function listOrders(teamId: string) { const { data, error } = await createClient().from("orders").select(query).eq("team_id", teamId).order("created_at", { ascending: false }); if (error) throw error; return data.map(order); }
export async function getOrder(teamId: string, orderCode: string) { const { data, error } = await createClient().from("orders").select(query).eq("team_id", teamId).eq("order_code", orderCode).single(); if (error) { console.error("get order error", { code: error.code, message: error.message, details: error.details, hint: error.hint }); throw error; } return order(data); }
export async function createOrder(input: { teamId: string; title: string; cafeId: string; currentMemberId: string; deadline: string }) {
  const [hours, minutes] = input.deadline.split(":").map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) throw new Error("마감 시간 형식이 올바르지 않습니다.");
  const deadline = new Date();
  deadline.setHours(hours, minutes, 0, 0);
  const payload = { team_id: input.teamId, title: input.title, cafe_id: input.cafeId, created_by_member_id: input.currentMemberId, deadline: deadline.toISOString(), status: "OPEN" };
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
