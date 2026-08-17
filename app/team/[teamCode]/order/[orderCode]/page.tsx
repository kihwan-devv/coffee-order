"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { RoomDetail } from "@/components/room-detail";
import { ShareOrderActions } from "@/components/share-order-actions";
import { UserSelector } from "@/components/user-selector";
import { useOrderRooms } from "@/components/order-room-provider";
import { getOrder } from "@/lib/data/orders";
import type { OrderRoom } from "@/types";

export default function OrderPage({ params }: { params: Promise<{ teamCode: string; orderCode: string }> }) {
  const { teamCode, orderCode } = use(params);
  const { currentUser, teams, teamLoadStatus, error, activateTeam, getTeamMembers } = useOrderRooms();
  const [order, setOrder] = useState<OrderRoom | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState("");
  const team = teams.find((item) => item.code === teamCode);

  useEffect(() => { void activateTeam(teamCode); }, [activateTeam, teamCode]);
  useEffect(() => {
    if (teamLoadStatus !== "ready" || !team || !currentUser) return;
    let active = true;
    setOrderLoading(true); setOrderError("");
    void getOrder(team.id, orderCode).then((value) => { if (active) setOrder(value); }).catch((value) => { if (active) { setOrder(null); setOrderError(value instanceof Error ? value.message : "주문 정보를 불러오지 못했습니다."); } }).finally(() => { if (active) setOrderLoading(false); });
    return () => { active = false; };
  }, [currentUser, orderCode, team, teamLoadStatus]);

  if (teamLoadStatus === "idle" || teamLoadStatus === "authenticating") return <main className="p-8">익명 세션을 준비하는 중...</main>;
  if (teamLoadStatus === "loading-team" || teamLoadStatus === "joining") return <main className="p-8">팀 정보를 불러오는 중...</main>;
  if (teamLoadStatus === "not-found") return <main className="p-8"><Link href="/">팀을 찾을 수 없습니다.</Link></main>;
  if (teamLoadStatus === "error") return <main className="p-8"><p>{error ?? "팀 정보를 불러오지 못했습니다."}</p><button type="button" onClick={() => void activateTeam(teamCode)} className="mt-4 font-bold underline">다시 시도</button></main>;
  if (!team) return <main className="p-8">팀 데이터를 확인할 수 없습니다.</main>;
  if (!currentUser) return <UserSelector teamCode={teamCode} teamName={team.name} members={getTeamMembers(team.id)} />;
  if (orderLoading || !order && !orderError) return <main className="p-8">주문 정보를 불러오는 중...</main>;
  if (orderError || !order) return <main className="p-8"><p>{orderError || "주문을 찾을 수 없습니다."}</p><Link href={`/team/${teamCode}`} className="mt-4 inline-block font-bold underline">주문 목록으로 돌아가기</Link></main>;

  return <><div className="mx-auto max-w-xl px-5 pt-4"><ShareOrderActions title={`${order.name} 주문에 참여하세요 ☕`} path={`/team/${teamCode}/order/${orderCode}`} /></div><RoomDetail room={order} teamCode={teamCode} /></>;
}
