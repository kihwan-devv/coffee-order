"use client";
import { use, useEffect } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { OrderRoomCard } from "@/components/order-room-card";
import { ShareOrderActions } from "@/components/share-order-actions";
import { useOrderRooms } from "@/components/order-room-provider";
import { UserSelector } from "@/components/user-selector";

function Message({ title, description, retry }: { title: string; description: string; retry?: () => void }) {
  return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-6"><h1 className="text-2xl font-black">{title}</h1><p className="mt-3 text-sm leading-6 text-stone-600">{description}</p>{retry && <button type="button" onClick={retry} className="mt-6 rounded-2xl bg-stone-800 px-5 py-3 font-bold text-white">다시 시도</button>}</main>;
}

export default function TeamPage({ params }: { params: Promise<{ teamCode: string }> }) {
  const { teamCode } = use(params);
  const { currentUser, error, teamLoadStatus, rooms, teams, activateTeam, getTeamMembers } = useOrderRooms();
  const team = teams.find((item) => item.code === teamCode);
  useEffect(() => { void activateTeam(teamCode); }, [activateTeam, teamCode]);

  if (teamLoadStatus === "idle" || teamLoadStatus === "authenticating") return <Message title="익명 세션을 준비하고 있어요" description="안전하게 팀 정보를 불러오기 위해 인증을 확인하는 중입니다." />;
  if (teamLoadStatus === "loading-team") return <Message title="팀을 불러오는 중..." description="인증이 완료되어 공유된 팀 정보와 팀원 목록을 가져오고 있습니다." />;
  if (teamLoadStatus === "joining") return <Message title="팀에 참여하는 중..." description="선택한 팀원과 현재 브라우저의 익명 세션을 연결하고 있습니다." />;
  if (teamLoadStatus === "not-found") return <Message title="팀을 찾을 수 없습니다" description={`팀 코드 ${teamCode}에 해당하는 팀이 실제로 존재하지 않습니다. 공유 URL을 다시 확인해 주세요.`} />;
  if (teamLoadStatus === "error") return <Message title="팀을 불러오지 못했습니다" description={error ?? "인증 또는 데이터베이스 요청 중 오류가 발생했습니다."} retry={() => void activateTeam(teamCode)} />;
  if (!team) return <Message title="팀 데이터가 비어 있습니다" description="요청은 완료됐지만 팀 데이터가 반환되지 않았습니다. RPC 반환값을 확인해 주세요." retry={() => void activateTeam(teamCode)} />;

  const members = getTeamMembers(team.id);
  if (!currentUser) return <UserSelector teamCode={teamCode} teamName={team.name} members={members} />;
  const orders = rooms.filter((item) => item.teamId === team.id);
  return <main className="mx-auto min-h-screen max-w-xl p-5 pb-12"><AppHeader teamCode={teamCode} /><section className="mb-6"><p className="text-sm font-bold text-amber-700">TEAM · {team.code}</p><h1 className="mt-1 text-3xl font-black tracking-tight">{team.name}</h1><p className="mt-2 text-sm text-stone-500">{members.length}명 · {currentUser.name}으로 사용 중</p><ShareOrderActions title={`${team.name} 커피방에 참여하세요 ☕`} /></section><section className="mb-5 flex items-end justify-between"><div><h2 className="text-xl font-black">오늘의 주문</h2><p className="mt-1 text-sm text-stone-500">같은 날에도 여러 주문을 만들 수 있어요.</p></div><Link href={`/team/${teamCode}/order/new`} className="rounded-2xl bg-stone-800 px-4 py-3 text-sm font-bold text-white">+ 새 주문 만들기</Link></section><section className="space-y-3">{orders.length ? orders.map((item) => <OrderRoomCard key={item.id} room={item} teamCode={teamCode} />) : <p className="rounded-2xl bg-white p-6 text-center text-sm text-stone-500">아직 주문이 없습니다.</p>}</section></main>;
}
