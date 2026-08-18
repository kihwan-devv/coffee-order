"use client";

import Link from "next/link";
import { use, useEffect } from "react";
import { RoomDetail } from "@/components/room-detail";
import { ShareOrderActions } from "@/components/share-order-actions";
import { UserSelector } from "@/components/user-selector";
import { useOrderRooms } from "@/components/order-room-provider";

export default function OrderPage({ params }: { params: Promise<{ teamCode: string; orderCode: string }> }) {
  const { teamCode, orderCode } = use(params);
  const { currentUser, memberJoinPending, rooms, teams, teamLoadStatus, error, activateTeam, getTeamMembers } = useOrderRooms();
  const team = teams.find((item) => item.code === teamCode);
  const order = rooms.find((item) => item.teamId === team?.id && item.orderCode === orderCode);

  useEffect(() => { void activateTeam(teamCode); }, [activateTeam, teamCode]);

  if (teamLoadStatus === "idle" || teamLoadStatus === "authenticating") return <main className="p-8">익명 세션을 준비하는 중...</main>;
  if (teamLoadStatus === "loading-team" || teamLoadStatus === "joining") return <main className="p-8">팀과 주문 정보를 불러오는 중...</main>;
  if (teamLoadStatus === "not-found") return <main className="p-8"><Link href="/">팀을 찾을 수 없습니다.</Link></main>;
  if (teamLoadStatus === "error") return <main className="p-8"><p>{error ?? "팀 정보를 불러오지 못했습니다."}</p><button type="button" onClick={() => void activateTeam(teamCode)} className="mt-4 font-bold underline">다시 시도</button></main>;
  if (!team) return <main className="p-8">팀 데이터를 확인할 수 없습니다.</main>;
  if (!currentUser || memberJoinPending) return <UserSelector teamCode={teamCode} teamName={team.name} members={getTeamMembers(team.id)} />;
  if (!order) return <main className="p-8"><p>이 팀에서 주문방을 찾을 수 없습니다.</p><Link href={`/team/${teamCode}`} className="mt-4 inline-block font-bold underline">주문 목록으로 돌아가기</Link></main>;

  return <><div className="mx-auto max-w-xl px-5 pt-4"><ShareOrderActions title={`${order.name} 주문에 참여하세요 ☕`} path={`/team/${teamCode}/order/${orderCode}`} /></div><RoomDetail room={order} teamCode={teamCode} /></>;
}
