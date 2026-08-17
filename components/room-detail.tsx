"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getRecommendations } from "@/lib/data/preferences";
import type { Menu, MenuRecommendation, OrderRoom, Temperature } from "@/types";
import { useOrderRooms } from "./order-room-provider";
import { OrderStatusBadge } from "./order-status-badge";

const menuText = (item: MenuRecommendation, menus: Menu[]) => `${menus.find((menu) => menu.id === item.menuId)?.name ?? "메뉴"} ${item.temperature}`;

function Countdown({ deadline, isOpen }: { deadline: string; isOpen: boolean }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!isOpen) return <p className="mt-3 text-sm font-bold text-emerald-300">✅ 주문이 마감되었어요</p>;

  const [hour, minute] = deadline.split(":").map(Number);
  const endsAt = new Date(now);
  endsAt.setHours(hour, minute, 0, 0);
  const remaining = Math.max(0, endsAt.getTime() - now.getTime());
  const totalMinutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const emoji = remaining === 0 ? "⏰" : totalMinutes < 15 ? "🚨" : totalMinutes < 60 ? "☕" : "🧋";
  const text = remaining === 0 ? "마감 시간이 지났어요" : `${String(totalMinutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")} 남음`;

  return <p className={`mt-3 text-sm font-bold ${totalMinutes < 15 ? "text-rose-200" : "text-amber-200"}`}>{emoji} {text}</p>;
}

function MenuPicker({ cafeId, menus, onSelect, onAddMenu }: {
  cafeId: string;
  menus: Menu[];
  onSelect: (menu: Menu, temperature: Temperature) => void;
  onAddMenu: (name: string, temperatures: Temperature[]) => void;
}) {
  const available = menus.filter((menu) => menu.cafeId === cafeId);
  const [menuId, setMenuId] = useState(available[0]?.id ?? "");
  const selectedMenu = available.find((item) => item.id === menuId) ?? available[0];
  const [temperature, setTemperature] = useState<Temperature>(selectedMenu?.supportedTemperatures[0] ?? "ICED");
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [temperatures, setTemperatures] = useState<Temperature[]>(["ICED"]);
  const [showImport, setShowImport] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const officialCandidates = ["아메리카노", "카페라떼", "바닐라라떼", "콜드브루", "자몽 허니 블랙 티"];

  const selectMenu = (id: string) => {
    const menu = available.find((item) => item.id === id);
    if (!menu) return;
    setMenuId(id);
    setTemperature(menu.supportedTemperatures[0]);
  };

  const addMenu = () => {
    const trimmed = name.trim();
    if (!trimmed || temperatures.length === 0) return;
    onAddMenu(trimmed, temperatures);
    setName("");
    setTemperatures(["ICED"]);
    setShowAdd(false);
  };

  const importSelectedMenus = () => {
    selectedCandidates.forEach((candidate) => {
      if (!available.some((menu) => menu.name === candidate)) onAddMenu(candidate, ["HOT", "ICED"]);
    });
    setSelectedCandidates([]);
    setShowImport(false);
  };

  if (!selectedMenu) return null;

  return <div className="rounded-2xl border border-stone-200 bg-white p-3">
    <div className="grid grid-cols-2 gap-2">
      {available.map((item) => <button type="button" key={item.id} onClick={() => selectMenu(item.id)} className={`rounded-xl border px-2 py-2 text-sm font-bold ${item.id === selectedMenu.id ? "border-amber-500 bg-amber-50" : "border-stone-200"}`}>{item.name}</button>)}
      <button type="button" onClick={() => setShowAdd((value) => !value)} className="rounded-xl border border-dashed border-amber-400 bg-amber-50 px-2 py-2 text-sm font-bold text-amber-800">+ 메뉴 추가</button>
    </div>
    {showAdd && <div className="mt-3 rounded-xl bg-stone-50 p-3">
      <label className="text-xs font-bold text-stone-600">새 메뉴 이름</label>
      <div className="mt-1 flex gap-2">
        <input value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addMenu(); } }} placeholder="예: 자몽 허니 블랙 티" className="min-w-0 flex-1 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-300" />
        <button type="button" onClick={addMenu} className="rounded-lg bg-amber-600 px-3 text-sm font-bold text-white">추가</button>
      </div>
      <div className="mt-2 flex gap-2 text-xs">
        {(["HOT", "ICED"] as Temperature[]).map((item) => <label key={item} className="flex items-center gap-1"><input type="checkbox" checked={temperatures.includes(item)} onChange={() => setTemperatures((previous) => previous.includes(item) ? previous.filter((value) => value !== item) : [...previous, item])} /> {item}</label>)}
      </div>
    </div>}
    <button type="button" onClick={() => setShowImport((value) => !value)} className="mt-3 text-xs font-bold text-stone-500 underline">공식 메뉴에서 가져오기 (프로토타입)</button>
    {showImport && <div className="mt-2 rounded-xl border border-sky-200 bg-sky-50 p-3"><p className="text-xs font-bold text-sky-900">공식 홈페이지 메뉴 후보</p><p className="mt-1 text-[11px] text-stone-500">현재는 선택 흐름을 검증하는 mock 목록입니다.</p><div className="mt-2 grid grid-cols-2 gap-2">{officialCandidates.map((candidate) => <label key={candidate} className="flex items-center gap-1 rounded-lg bg-white px-2 py-2 text-xs font-medium"><input type="checkbox" checked={selectedCandidates.includes(candidate)} onChange={() => setSelectedCandidates((previous) => previous.includes(candidate) ? previous.filter((item) => item !== candidate) : [...previous, candidate])} /> {candidate}</label>)}</div><button type="button" onClick={importSelectedMenus} disabled={selectedCandidates.length === 0} className="mt-3 rounded-lg bg-sky-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">선택한 메뉴 추가</button></div>}
    <div className="mt-3 flex gap-2">{selectedMenu.supportedTemperatures.map((item) => <button type="button" key={item} onClick={() => setTemperature(item)} className={`rounded-full px-3 py-1 text-xs font-bold ${item === temperature ? "bg-stone-800 text-white" : "bg-stone-100 text-stone-600"}`}>{item}</button>)}</div>
    <button type="button" onClick={() => onSelect(selectedMenu, temperature)} className="mt-3 w-full rounded-xl bg-stone-800 py-2.5 text-sm font-bold text-white">{selectedMenu.name} {temperature}로 주문</button>
  </div>;
}

function Recommendation({ title, item, menus, merged, onPick }: { title: string; item: MenuRecommendation; menus: Menu[]; merged?: boolean; onPick: () => void }) {
  return <div className="rounded-2xl border border-amber-200 bg-white p-3"><p className="text-xs font-bold text-stone-500">{merged ? "평소에도 자주 먹고 최근에도 먹었어요" : title}</p><p className="mt-1 font-extrabold">{menuText(item, menus)}</p><button type="button" onClick={onPick} className="mt-2 text-sm font-bold text-amber-700 underline">이걸로 주문</button></div>;
}

export function RoomDetail({ room, teamCode }: { room: OrderRoom; teamCode: string }) {
  const { currentUser, updateOrder, toggleRoom, users, cafes, menus, addMenu } = useOrderRooms();
  const [tab, setTab] = useState<"people" | "menu">("people");
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Record<string, { frequent: MenuRecommendation | null; recent: MenuRecommendation | null }>>({});
  const cafe = cafes.find((item) => item.id === room.cafeId)!;
  const creator = users.find((item) => item.id === room.createdBy) ?? users[0];
  const mine = room.orders.find((item) => item.userId === currentUser?.id);
  const complete = room.orders.filter((item) => item.status !== "PENDING").length;
  const isOpen = room.status === "OPEN";
  useEffect(() => {
    let active = true;
    void Promise.all(users.map(async (member) => [member.id, await getRecommendations(member.id, room.cafeId)] as const)).then((items) => { if (active) setRecommendations(Object.fromEntries(items)); });
    return () => { active = false; };
  }, [room.cafeId, users]);
  if (!currentUser || !mine) return null;
  const mineRec = recommendations[currentUser.id] ?? { frequent: null, recent: null };
  const sameMine = mineRec.frequent && mineRec.recent && mineRec.frequent.menuId === mineRec.recent.menuId && mineRec.frequent.temperature === mineRec.recent.temperature;
  const addRoomMenu = (name: string, supportedTemperatures: Temperature[]) => addMenu(room.cafeId, name, supportedTemperatures);
  const choose = (userId: string, item: MenuRecommendation) => updateOrder(room.id, userId, "SELECTED", { menuId: item.menuId, temperature: item.temperature });
  const summary = room.orders.filter((item) => item.status === "SELECTED" && item.menuId && item.temperature).reduce<Record<string, string[]>>((result, item) => {
    const key = `${item.menuId}|${item.temperature}`;
    result[key] = [...(result[key] ?? []), users.find((user) => user.id === item.userId)?.name ?? "팀원"];
    return result;
  }, {});

  return <main className="mx-auto min-h-screen max-w-xl p-5 pb-12">
    <Link href={`/team/${teamCode}`} className="text-sm font-bold text-stone-500">← 주문방 목록</Link>
    <section className="mt-5 rounded-3xl bg-stone-800 p-5 text-white">
      <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-amber-300">{cafe.emoji} {cafe.name}</p><h1 className="mt-1 text-2xl font-black">{room.name}</h1><p className="mt-3 text-sm text-stone-300">{creator?.name ?? "팀원"}님이 만들었어요 · 마감 {room.deadline}</p><Countdown deadline={room.deadline} isOpen={isOpen} /></div><OrderStatusBadge status={room.status} /></div>
    </section>

    <section className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-5">
      <div className="flex justify-between"><div><p className="font-extrabold">{currentUser.name}님의 주문</p><p className="mt-1 text-sm text-stone-600">{mine.status === "SELECTED" ? `${menus.find((item) => item.id === mine.menuId)?.name} ${mine.temperature} 선택 완료` : mine.status === "SKIP" ? "오늘은 안 마시기로 했어요" : mine.status === "ABSENT" ? "휴가 / 부재 상태예요" : "아직 메뉴를 고르지 않았어요"}</p></div><OrderStatusBadge status={mine.status} /></div>
      {isOpen && <div className="mt-4 space-y-3">
        {mineRec.frequent && <Recommendation title="평소 먹던 메뉴" item={mineRec.frequent} menus={menus} merged={Boolean(sameMine)} onPick={() => choose(currentUser.id, mineRec.frequent!)} />}
        {mineRec.recent && !sameMine && <Recommendation title="최근 먹었던 메뉴" item={mineRec.recent} menus={menus} onPick={() => choose(currentUser.id, mineRec.recent!)} />}
        <p className="text-xs font-bold text-stone-500">다른 메뉴 고르기</p>
        <MenuPicker cafeId={room.cafeId} menus={menus} onAddMenu={addRoomMenu} onSelect={(menu, temperature) => updateOrder(room.id, currentUser.id, "SELECTED", { menuId: menu.id, temperature })} />
        <button type="button" onClick={() => updateOrder(room.id, currentUser.id, "SKIP")} className="w-full rounded-2xl bg-stone-200 py-3 text-sm font-bold text-stone-600">오늘은 안 마셔요</button>
      </div>}
    </section>

    <section className="mt-5">
      <div className="flex items-end justify-between"><div><h2 className="text-xl font-black">전체 주문 현황</h2><p className="mt-1 text-sm text-stone-500">응답 완료 {complete}명 · 미응답 {room.orders.length - complete}명</p></div></div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-200"><div className="h-full bg-emerald-500" style={{ width: `${complete / room.orders.length * 100}%` }} /></div>
      {isOpen && room.createdBy === currentUser.id && <button type="button" onClick={() => toggleRoom(room.id)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-4 text-sm font-extrabold text-white shadow-lg shadow-emerald-200 transition hover:brightness-105 active:scale-[0.99]"><span className="grid size-6 place-items-center rounded-full bg-white/20">✓</span> 주문 완료하고 마감하기</button>}
      {!isOpen && <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-800">✓ 이 주문은 완료되어 메뉴별 내역을 확인할 수 있어요.</p>}
      <div className="mt-4 flex rounded-2xl bg-stone-100 p-1"><button type="button" onClick={() => setTab("people")} className={`flex-1 rounded-xl py-2 text-sm font-bold ${tab === "people" ? "bg-white shadow-sm" : "text-stone-500"}`}>사람별 보기</button><button type="button" onClick={() => setTab("menu")} className={`flex-1 rounded-xl py-2 text-sm font-bold ${tab === "menu" ? "bg-white shadow-sm" : "text-stone-500"}`}>메뉴별 보기</button></div>
      {tab === "people" ? <div className="mt-3 rounded-3xl border border-stone-200 bg-white px-4">{room.orders.map((order) => {
        const user = users.find((item) => item.id === order.userId)!;
        const selectedMenu = menus.find((item) => item.id === order.menuId);
        const rec = recommendations[user.id] ?? { frequent: null, recent: null };
        const same = rec.frequent && rec.recent && rec.frequent.menuId === rec.recent.menuId && rec.frequent.temperature === rec.recent.temperature;
        const delegated = order.status === "SELECTED" && order.selectedBy && order.selectedBy !== order.userId;
        return <div key={order.userId} className="border-b border-stone-100 py-4 last:border-0"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-stone-100 font-black text-stone-600">{user.name.slice(0, 1)}</span><div className="min-w-0 flex-1"><p className="font-bold">{user.name}</p><p className="mt-0.5 text-xs text-stone-500">{selectedMenu ? `${selectedMenu.name} ${order.temperature}` : order.status === "ABSENT" && order.markedBy ? `${order.markedBy}님이 표시` : ""}</p>{delegated && <p className="mt-0.5 text-[11px] text-stone-400">{users.find((item) => item.id === order.selectedBy)?.name}이 대신 선택</p>}</div><OrderStatusBadge status={order.status} /></div>
          {isOpen && order.status === "PENDING" && <div className="ml-[52px] mt-3 rounded-2xl bg-stone-50 p-3"><p className="text-xs font-bold text-stone-500">평소 먹던 메뉴</p>{rec.frequent ? <button type="button" onClick={() => choose(user.id, rec.frequent!)} className="mt-1 rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-800">{menuText(rec.frequent, menus)}로 주문</button> : <p className="mt-1 text-xs text-stone-400">주문 이력이 없어요.</p>}{rec.recent && !same && <><p className="mt-3 text-xs font-bold text-stone-500">최근 먹었던 메뉴</p><button type="button" onClick={() => choose(user.id, rec.recent!)} className="mt-1 rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-800">{menuText(rec.recent, menus)}로 주문</button></>}<div className="mt-3 flex gap-3"><button type="button" onClick={() => setPickerFor(pickerFor === user.id ? null : user.id)} className="text-xs font-bold text-stone-600 underline">다른 메뉴 골라주기</button><button type="button" onClick={() => updateOrder(room.id, user.id, "ABSENT")} className="text-xs font-bold text-violet-700 underline">휴가/부재</button></div>{pickerFor === user.id && <div className="mt-3"><MenuPicker cafeId={room.cafeId} menus={menus} onAddMenu={addRoomMenu} onSelect={(menu, temperature) => { updateOrder(room.id, user.id, "SELECTED", { menuId: menu.id, temperature }); setPickerFor(null); }} /></div>}</div>}
          {isOpen && order.status === "ABSENT" && <button type="button" onClick={() => updateOrder(room.id, user.id, "PENDING")} className="ml-[52px] mt-2 text-[11px] font-bold text-stone-500 underline">부재 취소</button>}
        </div>;
      })}</div> : <div className="mt-3 rounded-3xl border border-stone-200 bg-white px-4">{Object.keys(summary).length ? Object.entries(summary).map(([key, people]) => { const [menuId, temperature] = key.split("|"); return <div key={key} className="flex justify-between border-b border-stone-100 py-4 font-bold last:border-0"><div><p>{menus.find((item) => item.id === menuId)?.name ?? "추가 메뉴"} {temperature}</p>{!isOpen && <p className="mt-1 text-xs font-normal text-stone-500">{people.join(", ")}</p>}</div><span className="text-amber-700">× {people.length}</span></div>; }) : <p className="py-8 text-center text-sm text-stone-500">아직 선택된 메뉴가 없어요.</p>}</div>}
    </section>
  </main>;
}
