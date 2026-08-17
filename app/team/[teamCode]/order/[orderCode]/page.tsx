"use client";

import Link from "next/link";
import { use, useEffect } from "react";
import { RoomDetail } from "@/components/room-detail";
import { ShareOrderActions } from "@/components/share-order-actions";
import { UserSelector } from "@/components/user-selector";
import { useOrderRooms } from "@/components/order-room-provider";

export default function OrderPage({ params }: { params: Promise<{ teamCode: string; orderCode: string }> }) {
  const { teamCode, orderCode } = use(params);
  const { rooms, ready, currentUser, teams, activateTeam, getTeamMembers } = useOrderRooms();
  const team = teams.find((item) => item.code === teamCode);

  useEffect(() => {
    if (team) activateTeam(teamCode);
  }, [activateTeam, team, teamCode]);

  if (!ready) return null;
  if (!team) return <main className="p-8"><Link href="/">팀을 찾을 수 없어요.</Link></main>;

  const order = rooms.find((item) => item.teamId === team.id && item.orderCode === orderCode);
  if (!order) return <main className="p-8"><Link href={`/team/${teamCode}`}>주문 목록으로 돌아가기</Link></main>;
  if (!currentUser) return <UserSelector teamCode={teamCode} teamName={team.name} members={getTeamMembers(team.id)} />;

  return <>
    <div className="mx-auto max-w-xl px-5 pt-4"><ShareOrderActions title={`${order.name} 주문에 참여하세요 ☕`} /></div>
    <RoomDetail room={order} teamCode={teamCode} />
  </>;
}
