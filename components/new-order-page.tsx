"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "./app-header";
import { useOrderRooms } from "./order-room-provider";

export function NewOrderPage({ teamCode }: { teamCode: string }) {
  const router = useRouter();
  const { createRoom, currentUser, teams, activateTeam, cafes, addCafe } = useOrderRooms();
  const team = teams.find((item) => item.code === teamCode);
  const [title, setTitle] = useState("");
  const [cafeId, setCafeId] = useState("");
  const [deadline, setDeadline] = useState("14:30");
  const [showCafeForm, setShowCafeForm] = useState(false);
  const [cafeName, setCafeName] = useState("");
  const [officialMenuUrl, setOfficialMenuUrl] = useState("");

  useEffect(() => {
    if (team) activateTeam(teamCode);
  }, [activateTeam, team, teamCode]);

  useEffect(() => {
    if (!cafeId && cafes[0]) setCafeId(cafes[0].id);
  }, [cafeId, cafes]);

  if (!team || !currentUser) return null;

  const createCafe = () => {
    const name = cafeName.trim();
    if (!name) return;
    const cafe = addCafe(name, officialMenuUrl.trim());
    setCafeId(cafe.id);
    setCafeName("");
    setOfficialMenuUrl("");
    setShowCafeForm(false);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !cafeId) return;
    const orderCode = createRoom(team.id, title.trim(), cafeId, deadline);
    router.push(`/team/${team.code}/order/${orderCode}`);
  };

  return <main className="mx-auto min-h-screen max-w-xl p-5">
    <AppHeader teamCode={team.code} />
    <h1 className="text-3xl font-black tracking-tight">새 주문 만들기</h1>
    <p className="mt-2 text-sm text-stone-500">{team.name}의 활성 팀원이 모두 주문 대상에 포함돼요.</p>
    <form onSubmit={submit} className="mt-7 space-y-6">
      <label className="block"><span className="mb-2 block text-sm font-bold">주문 제목</span><input autoFocus required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="예: Eric이 쏩니다" className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3.5 outline-none focus:ring-2 focus:ring-amber-300" /></label>
      <fieldset>
        <legend className="mb-2 text-sm font-bold">카페 선택</legend>
        <div className="grid gap-2 sm:grid-cols-3">{cafes.map((cafe) => <button type="button" key={cafe.id} onClick={() => setCafeId(cafe.id)} className={`rounded-2xl border p-3 text-left ${cafeId === cafe.id ? "border-amber-500 bg-amber-50 ring-1 ring-amber-500" : "border-stone-200 bg-white"}`}><span className={`mr-2 inline-grid size-8 place-items-center rounded-xl ${cafe.color}`}>{cafe.emoji}</span><span className="text-sm font-bold">{cafe.name}</span></button>)}</div>
        <button type="button" onClick={() => setShowCafeForm((value) => !value)} className="mt-3 rounded-xl border border-dashed border-amber-400 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800">+ 새 카페 추가</button>
        {showCafeForm && <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-bold">카페 추가</p>
          <input value={cafeName} onChange={(event) => setCafeName(event.target.value)} placeholder="카페 이름" className="mt-3 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300" />
          <input value={officialMenuUrl} onChange={(event) => setOfficialMenuUrl(event.target.value)} placeholder="공식 메뉴 URL (선택)" type="url" className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300" />
          <p className="mt-2 text-xs text-stone-500">메뉴 URL은 향후 서버 수집 기능에 연결할 수 있어요.</p>
          <button type="button" onClick={createCafe} className="mt-3 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white">카페 추가</button>
        </div>}
      </fieldset>
      <label className="block"><span className="mb-2 block text-sm font-bold">마감시간</span><input type="time" value={deadline} onChange={(event) => setDeadline(event.target.value)} className="rounded-2xl border border-stone-200 bg-white px-4 py-3.5 outline-none focus:ring-2 focus:ring-amber-300" /></label>
      <button className="w-full rounded-2xl bg-amber-600 py-4 font-extrabold text-white">주문 만들기</button>
    </form>
  </main>;
}
