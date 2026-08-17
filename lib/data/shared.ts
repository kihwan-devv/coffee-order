/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase schema is supplied by the remote project. */
import type { Cafe, Menu, OrderRoom, Team, User, UserOrder } from "@/types";

export type Row = Record<string, any>;
export const one = (value: any): Row => Array.isArray(value) ? (value[0] ?? {}) : (value ?? {});
export const user = (row: Row): User => ({ id: row.id ?? row.team_member_id, name: row.name ?? row.member_name, createdAt: row.created_at ?? "" });
export const team = (row: Row): Team => ({ id: row.id ?? row.team_id, code: row.code ?? row.team_code, name: row.name ?? row.team_name, createdBy: row.created_by_member_id ?? row.created_by ?? "", createdAt: row.created_at ?? "" });
export const cafe = (row: Row): Cafe => ({ id: row.id, name: row.name, emoji: row.emoji ?? "☕", color: row.color ?? "bg-amber-100" });
export const menu = (row: Row): Menu => ({ id: row.id, cafeId: row.cafe_id, name: row.name, supportedTemperatures: row.available_temperatures ?? row.supported_temperatures ?? [] });
export const response = (row: Row): UserOrder => ({ userId: row.team_member_id, status: row.status, menuId: row.menu_id, temperature: row.temperature, selectedBy: row.selected_by_member_id, markedBy: row.marked_by_member_id, updatedAt: row.updated_at ?? "" });
const deadlineText = (value: string) => {
  if (!value.includes("T")) return value.slice(0, 5);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};
export const order = (row: Row): OrderRoom => ({ id: row.id, teamId: row.team_id, orderCode: row.order_code, name: row.title, cafeId: row.cafe_id, createdBy: row.created_by_member_id, deadline: deadlineText(row.deadline), status: row.status, createdAt: row.created_at, orders: (row.order_responses ?? []).map(response) });
