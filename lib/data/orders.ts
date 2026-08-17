import { createClient } from "@/lib/supabase/client";
import { order, type Row } from "./shared";
import type { OrderStatus, Temperature } from "@/types";

const query = "*, order_responses(*)";
export async function listOrders(teamId: string) { const { data, error } = await createClient().from("orders").select(query).eq("team_id", teamId).order("created_at", { ascending: false }); if (error) throw error; return data.map(order); }
export async function getOrder(teamId: string, orderCode: string) { const { data, error } = await createClient().from("orders").select(query).eq("team_id", teamId).eq("order_code", orderCode).single(); if (error) throw error; return order(data); }
export async function createOrder(input: { teamId: string; title: string; cafeId: string; createdBy: string; deadline: string }) { const { data, error } = await createClient().from("orders").insert({ team_id: input.teamId, title: input.title, cafe_id: input.cafeId, created_by_member_id: input.createdBy, deadline: input.deadline }).select().single(); if (error) throw error; return data.order_code as string; }
export async function updateResponse(orderId: string, targetId: string, actorId: string, status: OrderStatus, selection?: { menuId: string; temperature: Temperature }) { const patch: Row = { status, menu_id: status === "SELECTED" ? selection?.menuId : null, temperature: status === "SELECTED" ? selection?.temperature : null, selected_by_member_id: status === "SELECTED" || status === "SKIP" ? actorId : null, marked_by_member_id: status === "ABSENT" ? actorId : null }; const { error } = await createClient().from("order_responses").update(patch).eq("order_id", orderId).eq("team_member_id", targetId); if (error) throw error; }
export async function closeOrder(orderId: string) { const { error } = await createClient().from("orders").update({ status: "CLOSED" }).eq("id", orderId); if (error) throw error; }
