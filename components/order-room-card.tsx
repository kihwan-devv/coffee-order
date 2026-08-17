"use client";

import Link from "next/link";
import type { OrderRoom } from "@/types";
import { OrderStatusBadge } from "./order-status-badge";
import { useOrderRooms } from "./order-room-provider";

export function OrderRoomCard({ room, teamCode }: { room: OrderRoom; teamCode: string }) {
  const { users, cafes } = useOrderRooms();
  const cafe = cafes.find((item) => item.id === room.cafeId);
  const maker = users.find((item) => item.id === room.createdBy);
  const complete = room.orders.filter((item) => item.status !== "PENDING").length;
  if (!cafe) return null;

  return <Link href={`/team/${teamCode}/order/${room.orderCode}`} className="block rounded-3xl border border-stone-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300">
    <div className="flex gap-3">
      <div className={`grid size-12 shrink-0 place-items-center rounded-2xl text-2xl ${cafe.color}`}>{cafe.emoji}</div>
      <div className="min-w-0 flex-1">
        <div className="flex justify-between gap-2"><h2 className="truncate font-extrabold">{room.name}</h2><OrderStatusBadge status={room.status} /></div>
        <p className="mt-1 text-sm text-stone-500">{cafe.name} · {maker?.name ?? "팀원"}님이 만듦</p>
        <div className="mt-4 flex items-center justify-end text-xs"><span className="text-stone-500">응답 <b className="text-emerald-700">{complete}</b> / {room.orders.length}</span></div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${complete / room.orders.length * 100}%` }} /></div>
      </div>
    </div>
  </Link>;
}
