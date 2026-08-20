"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Coffee, Plus, Settings } from "lucide-react";
import { AppHeader } from "./app-header";
import { CafeManager } from "./cafe-manager";
import { useOrderRooms } from "./order-room-provider";

export function NewOrderPage({ teamCode }: { teamCode: string }) {
  const router = useRouter();
  const { createRoom, currentUser, teams, activateTeam, cafes, menus, addCafe } = useOrderRooms();
  const team = teams.find((item) => item.code === teamCode);
  const [title, setTitle] = useState("");
  const [cafeId, setCafeId] = useState("");
  const [showCafeForm, setShowCafeForm] = useState(false);
  const [cafeName, setCafeName] = useState("");
  const [officialMenuUrl, setOfficialMenuUrl] = useState("");
  const [showManagement, setShowManagement] = useState(false);
  const [isAddingCafe, setIsAddingCafe] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => { void activateTeam(teamCode); }, [activateTeam, teamCode]);

  useEffect(() => {
    if (!cafeId && cafes[0]) setCafeId(cafes[0].id);
  }, [cafeId, cafes]);

  if (!team || !currentUser) return null;

  const createCafe = async () => {
    const name = cafeName.trim();
    if (!name) return;
    setIsAddingCafe(true); setCreateError("");
    try { const cafe = await addCafe({ name, officialMenuUrl: officialMenuUrl.trim() }); setCafeId(cafe.id); setCafeName(""); setOfficialMenuUrl(""); setShowCafeForm(false); }
    catch (value) { setCreateError(value instanceof Error ? value.message : "카페를 추가하지 못했습니다."); }
    finally { setIsAddingCafe(false); }
  };

  const submit = async () => {
    if (!title.trim() || !cafeId || isCreating) return;
    setIsCreating(true);
    setCreateError("");
    try {
      const orderCode = await createRoom(team.id, title.trim(), cafeId);
      if (!orderCode) throw new Error("주문 코드가 반환되지 않았습니다.");
      router.push(`/team/${team.code}/order/${orderCode}`);
    } catch (value) {
      const message = value instanceof Error ? value.message : "주문을 생성하지 못했습니다.";
      console.error("order creation failed", value);
      setCreateError(message);
      setIsCreating(false);
    }
  };

  return <main className="mx-auto min-h-screen max-w-xl p-4 sm:p-5">
    <AppHeader teamCode={team.code} />
    <h1 className="text-3xl font-black tracking-tight">새 주문 만들기</h1>
    <p className="mt-2 text-sm text-stone-500">{team.name}의 활성 팀원이 모두 주문 대상에 포함돼요.</p>
    <div className="mt-5 space-y-4 sm:mt-7 sm:space-y-6">
      <label className="block"><span className="mb-2 block text-sm font-bold">주문 제목</span><input autoFocus required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="예: 오후 커피 주문" className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3.5 outline-none focus:ring-2 focus:ring-amber-300" /></label>
      <fieldset>
        <legend className="mb-2 text-sm font-bold">카페 선택</legend>
        <div className="grid gap-2 sm:grid-cols-3">{cafes.filter((cafe) => cafe.isActive).map((cafe) => <button type="button" key={cafe.id} onClick={() => setCafeId(cafe.id)} className={`min-h-14 rounded-2xl border p-3 text-left transition active:scale-[0.98] ${cafeId === cafe.id ? "border-amber-500 bg-amber-50 ring-1 ring-amber-500" : "border-stone-200 bg-white hover:border-amber-300"}`}><span className={`mr-2 inline-grid size-8 place-items-center rounded-xl ${cafe.color}`}>{cafe.emoji}</span><span className="text-sm font-bold">{cafe.name}</span></button>)}</div>
        <div className="mt-3 flex gap-2"><button type="button" onClick={() => setShowCafeForm((value) => !value)} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-amber-400 bg-amber-50 px-4 text-sm font-bold text-amber-800 transition hover:bg-amber-100 active:scale-[0.98]"><Plus size={17} />새 카페</button><button type="button" onClick={() => setShowManagement((value) => !value)} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-sm font-bold transition hover:bg-stone-50 active:scale-[0.98]"><Settings size={17} />카페·메뉴 관리</button></div>
        {showCafeForm && <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-bold">카페 추가</p>
          <input value={cafeName} onChange={(event) => setCafeName(event.target.value)} placeholder="카페 이름" className="mt-3 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300" />
          <input value={officialMenuUrl} onChange={(event) => setOfficialMenuUrl(event.target.value)} placeholder="공식 메뉴 URL (선택)" type="url" className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300" />
          <p className="mt-2 text-xs text-stone-500">메뉴 URL은 향후 서버 수집 기능에 연결할 수 있어요.</p>
          <button type="button" disabled={isAddingCafe} onClick={() => void createCafe()} className="mt-3 flex min-h-11 items-center gap-2 rounded-xl bg-amber-600 px-4 text-sm font-bold text-white disabled:opacity-50"><Plus size={17} />{isAddingCafe ? "추가 중..." : "카페 추가"}</button>
        </div>}
        {showManagement && <div className="mt-4"><h2 className="flex items-center gap-2 text-lg font-black"><Coffee size={20} />카페·메뉴 관리</h2>{cafes.map((cafe) => <CafeManager key={cafe.id} cafe={cafe} />)}</div>}
      </fieldset>
      {cafeId && menus.filter((menu) => menu.cafeId === cafeId && menu.isActive).length === 0 && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="font-bold">이 카페에는 아직 메뉴가 없습니다.</p><div className="mt-3 grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => setShowManagement(true)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-600 text-sm font-bold text-white"><Settings size={16} />메뉴 추가하기</button><button type="button" onClick={() => void submit()} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-stone-700">주문방은 먼저 만들기<ChevronRight size={16} /></button></div></section>}
      {createError && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{createError}</p>}
      <button type="button" disabled={isCreating} onClick={() => void submit()} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-amber-600 font-extrabold text-white transition hover:bg-amber-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"><Plus size={19} />{isCreating ? "주문 만드는 중..." : "새 주문"}</button>
    </div>
  </main>;
}
