"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, Circle, Flame, Pencil, Snowflake, UserRound, X } from "lucide-react";
import { getRecommendations } from "@/lib/data/preferences";
import { primaryButtonClass, primaryPanelClass } from "@/lib/ui/styles";
import type { Menu, MenuRecommendation, OrderRoom, TeamMember, Temperature } from "@/types";
import { useOrderRooms } from "./order-room-provider";
import { OrderStatusBadge } from "./order-status-badge";
import { ShareOrderActions } from "./share-order-actions";

const menuText = (item: MenuRecommendation, menus: Menu[]) => `${menus.find((menu) => menu.id === item.menuId)?.name ?? "메뉴"} ${item.temperature}`;

function MenuPicker({ cafeId, menus, onSelect, onAddMenu }: {
  cafeId: string;
  menus: Menu[];
  onSelect: (menu: Menu, temperature: Temperature) => Promise<void>;
  onAddMenu: (name: string, temperatures: Temperature[]) => void;
}) {
  const available = menus.filter((menu) => menu.cafeId === cafeId && menu.isActive);
  const [menuId, setMenuId] = useState(available[0]?.id ?? "");
  const selectedMenu = available.find((item) => item.id === menuId) ?? available[0];
  const [temperature, setTemperature] = useState<Temperature | null>(selectedMenu?.supportedTemperatures.length === 1 ? selectedMenu.supportedTemperatures[0] : null);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [temperatures, setTemperatures] = useState<Temperature[]>(["ICED"]);
  const [showImport, setShowImport] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const officialCandidates = ["아메리카노", "카페라떼", "바닐라라떼", "콜드브루", "자몽 허니 블랙 티"];
  useEffect(() => {
    if (!selectedMenu) return;
    setMenuId(selectedMenu.id);
    setTemperature(selectedMenu.supportedTemperatures.length === 1 ? selectedMenu.supportedTemperatures[0] : null);
  }, [selectedMenu]);

  const selectMenu = (id: string) => {
    const menu = available.find((item) => item.id === id);
    if (!menu) return;
    setMenuId(id);
    setTemperature(menu.supportedTemperatures.length === 1 ? menu.supportedTemperatures[0] : null);
  };

  const addMenu = () => {
    const trimmed = name.trim();
    if (!trimmed || temperatures.length === 0) return;
    void onAddMenu(trimmed, temperatures);
    setName("");
    setTemperatures(["ICED"]);
    setShowAdd(false);
  };

  const importSelectedMenus = () => {
    selectedCandidates.forEach((candidate) => {
      if (!available.some((menu) => menu.name === candidate)) void onAddMenu(candidate, ["HOT", "ICED"]);
    });
    setSelectedCandidates([]);
    setShowImport(false);
  };
  const submitOrder = async () => { if (!selectedMenu || !temperature || isSubmitting) return; setIsSubmitting(true); setSubmitError(""); try { await onSelect(selectedMenu, temperature); } catch (value) { setSubmitError(value instanceof Error ? value.message : "주문하지 못했습니다."); } finally { setIsSubmitting(false); } };

  if (!selectedMenu) return <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-5 text-center"><p className="text-sm text-stone-500">등록된 메뉴가 없습니다.</p><button type="button" onClick={() => setShowAdd(true)} className="mt-3 min-h-11 rounded-xl bg-amber-600 px-4 text-sm font-bold text-white">+ 메뉴 추가</button>{showAdd && <div className="mt-3"><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="메뉴 이름" className="w-full rounded-xl border px-3 py-2" /><button type="button" onClick={addMenu} className="mt-2 min-h-11 w-full rounded-xl bg-stone-800 text-sm font-bold text-white">메뉴 추가</button></div>}</div>;

  return <div className="rounded-2xl border border-stone-200 bg-white p-3">
    <div className="space-y-2">
      {available.map((item) => <div key={item.id} className={`overflow-hidden rounded-2xl border transition ${item.id === selectedMenu.id ? "border-amber-400 bg-amber-50" : "border-stone-200"}`}><button type="button" onClick={() => selectMenu(item.id)} className="flex min-h-11 w-full items-center justify-between px-3 text-left text-sm font-bold"><span>{item.name}</span>{item.id === selectedMenu.id && <Check size={16} className="text-amber-700" />}</button>{item.id === selectedMenu.id && <div className="border-t border-amber-200 p-3"><div className="flex gap-2">{item.supportedTemperatures.map((value) => { const selected = value === temperature; const Icon = value === "HOT" ? Flame : Snowflake; return <button type="button" key={value} onClick={() => setTemperature(value)} className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border text-xs font-bold transition active:scale-[0.98] ${selected ? "border-amber-500 bg-amber-600 text-white" : "border-stone-200 bg-white text-stone-600"}`}><Icon size={15} />{value}{selected && <Check size={14} />}</button>; })}</div><button type="button" disabled={!temperature || isSubmitting} onClick={() => void submitOrder()} className={`mt-3 w-full ${primaryButtonClass}`}>{isSubmitting ? "주문 중..." : "이걸로 주문"}</button></div>}</div>)}
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
    {submitError && <p className="mt-2 text-xs font-bold text-rose-600">{submitError}</p>}
  </div>;
}

function Recommendation({ title, item, menus, merged, onPick }: { title: string; item: MenuRecommendation; menus: Menu[]; merged?: boolean; onPick: () => Promise<void> }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const pick = async () => { if (isSubmitting) return; setIsSubmitting(true); setSubmitError(""); try { await onPick(); } catch (value) { setSubmitError(value instanceof Error ? value.message : "주문하지 못했습니다."); } finally { setIsSubmitting(false); } };
  return <div className="rounded-2xl border border-amber-200 bg-white p-3"><p className="text-xs font-bold text-stone-500">{merged ? "평소에도 자주 먹고 최근에도 먹었어요" : title}</p><p className="mt-1 font-extrabold">{menuText(item, menus)}</p><button type="button" disabled={isSubmitting} onClick={() => void pick()} className="mt-2 text-sm font-bold text-amber-700 underline disabled:opacity-50">{isSubmitting ? "주문 중..." : "이걸로 주문"}</button>{submitError && <p className="mt-2 text-xs font-bold text-rose-600">{submitError}</p>}</div>;
}

function OrderUserSwitcher({ teamCode, members }: { teamCode: string; members: TeamMember[] }) {
  const { currentUser, selectUser } = useOrderRooms();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(currentUser?.id ?? "");
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setSelectedId(currentUser?.id ?? ""); }, [currentUser?.id]);
  if (!currentUser) return null;
  const selected = members.find((member) => member.id === selectedId);
  const change = async () => { if (!selected || changing) return; setChanging(true); setError(""); try { await selectUser(selected.id, teamCode); setOpen(false); } catch (value) { setError(value instanceof Error ? value.message : "사용자를 변경하지 못했습니다."); } finally { setChanging(false); } };
  return <div className="relative"><button type="button" onClick={() => setOpen((value) => !value)} aria-label="사용자 변경" title={`${currentUser.name}으로 사용 중 · 사용자 변경`} className="grid size-11 place-items-center rounded-full bg-white/80 text-stone-700 transition hover:bg-white active:scale-95"><UserRound size={18} /></button>{open && <div className="absolute right-0 top-12 z-30 w-[min(20rem,calc(100vw-2.5rem))] rounded-3xl border border-stone-200 bg-white p-4 text-stone-900 shadow-xl"><div className="flex items-center justify-between"><div><p className="font-black">누구신가요?</p><p className="mt-1 text-xs text-stone-500">현재 {currentUser.name}으로 사용 중</p></div><button type="button" onClick={() => setOpen(false)} aria-label="사용자 선택 닫기" className="grid size-11 place-items-center rounded-full hover:bg-stone-100"><X size={17} /></button></div><div className="mt-3 grid grid-cols-2 gap-2">{members.filter((member) => member.isActive).map((member) => { const checked = member.id === selectedId; return <button key={member.id} type="button" onClick={() => setSelectedId(member.id)} className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm font-bold ${checked ? "border-amber-500 bg-amber-50 text-amber-900" : "border-stone-200"}`}>{checked && <Check size={15} />}{member.name}</button>; })}</div>{error && <p className="mt-2 text-sm text-rose-600">{error}</p>}<button type="button" disabled={!selected || changing || selected.id === currentUser.id} onClick={() => void change()} className={`mt-3 w-full ${primaryButtonClass}`}>{changing ? `${selected?.name ?? "사용자"}으로 변경 중...` : selected ? `${selected.name}으로 변경` : "사용자 선택"}</button></div>}</div>;
}

function MissingResponseView({ room, teamCode, members, menus }: { room: OrderRoom; teamCode: string; members: TeamMember[]; menus: Menu[] }) {
  const { joinOrder } = useOrderRooms();
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const participate = async () => {
    setJoining(true);
    setJoinError("");
    try { await joinOrder(room.orderCode); }
    catch (value) { setJoinError(value instanceof Error ? value.message : "주문에 참여하지 못했습니다."); setJoining(false); }
  };
  return <main className="mx-auto min-h-screen max-w-xl p-5 pb-12"><Link href={`/team/${teamCode}`} className="text-sm font-bold text-stone-500">← 주문방 목록</Link><section className={`mt-3 rounded-3xl p-5 ${primaryPanelClass}`}><div className="flex items-start justify-between gap-3"><div><h1 className="text-2xl font-black">{room.name}</h1><p className="mt-2 text-sm text-stone-600">{room.status === "OPEN" ? "아직 이 주문에 참여하지 않았어요." : "마감된 주문 결과를 읽기 전용으로 보고 있어요."}</p></div><div className="flex gap-2"><OrderUserSwitcher teamCode={teamCode} members={members} /><ShareOrderActions compact title={room.name} /></div></div>{room.status === "OPEN" && <button type="button" disabled={joining} onClick={() => void participate()} className={`mt-4 px-4 ${primaryButtonClass}`}>{joining ? "참여 중..." : "이 주문에 참여하기"}</button>}{joinError && <p className="mt-3 text-sm font-bold text-rose-600">{joinError}</p>}</section><section className="mt-5"><h2 className="text-xl font-black">전체 주문 현황</h2><div className="mt-3 rounded-3xl border border-stone-200 bg-white px-4">{room.orders.map((response) => { const member = members.find((item) => item.id === response.teamMemberId); const selectedMenu = menus.find((item) => item.id === response.menuId); return <div key={response.teamMemberId} className="flex items-center justify-between border-b border-stone-100 py-4 last:border-0"><div><p className="font-bold">{member?.name ?? "알 수 없는 팀원"}</p><p className="mt-1 text-sm font-semibold text-stone-700">{selectedMenu ? `${selectedMenu.name} ${response.temperature}` : response.status === "PENDING" ? "아직 주문하지 않았어요" : ""}</p></div><OrderStatusBadge status={response.status} /></div>; })}</div></section></main>;
}

export function RoomDetail({ room, teamCode, members }: { room: OrderRoom; teamCode: string; members?: TeamMember[] }) {
  const router = useRouter();
  const { currentUser, updateOrder, toggleRoom, deleteRoom, users: providerUsers, cafes, menus, addMenu } = useOrderRooms();
  const users = members ?? providerUsers;
  const [tab, setTab] = useState<"people" | "menu">("people");
  const [actionFor, setActionFor] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Record<string, { frequent: MenuRecommendation | null; recent: MenuRecommendation | null }>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const cafe = cafes.find((item) => item.id === room.cafeId)!;
  const creator = users.find((item) => item.id === room.createdBy);
  const memberName = (memberId: string | null) => users.find((item) => item.id === memberId)?.name ?? "팀원";
  const mine = room.orders.find((item) => item.teamMemberId === currentUser?.id);
  const complete = room.orders.filter((item) => item.status !== "PENDING").length;
  const isOpen = room.status === "OPEN";
  const peopleOrders = [...room.orders].sort((left, right) => {
    if (left.teamMemberId === currentUser?.id) return -1;
    if (right.teamMemberId === currentUser?.id) return 1;
    return 0;
  });
  useEffect(() => {
    let active = true;
    void Promise.all(users.map(async (member) => [member.id, await getRecommendations(member.id, room.cafeId)] as const)).then((items) => { if (active) setRecommendations(Object.fromEntries(items)); });
    return () => { active = false; };
  }, [room.cafeId, users]);
  useEffect(() => { setActionFor(null); }, [currentUser?.id]);
  if (!currentUser) return null;
  if (!mine) return <MissingResponseView room={room} teamCode={teamCode} members={users} menus={menus} />;
  const addRoomMenu = (name: string, supportedTemperatures: Temperature[]) => addMenu(room.cafeId, { name, temperatures: supportedTemperatures });
  const choose = (userId: string, item: MenuRecommendation) => updateOrder(room.id, userId, "SELECTED", { menuId: item.menuId, temperature: item.temperature });
  const removeRoom = async () => { if (isDeleting) return; setIsDeleting(true); setDeleteError(""); try { await deleteRoom(room.id); router.push(`/team/${teamCode}`); } catch (value) { setDeleteError(value instanceof Error ? value.message : "주문방을 삭제하지 못했습니다."); setIsDeleting(false); } };
  const summary = room.orders.filter((item) => item.status === "SELECTED" && item.menuId && item.temperature).reduce<Record<string, string[]>>((result, item) => {
    const key = `${item.menuId}|${item.temperature}`;
    const orderedFor = users.find((user) => user.id === item.teamMemberId)?.name ?? "팀원";
    const actor = item.selectedByMemberId && item.selectedByMemberId !== item.teamMemberId ? users.find((user) => user.id === item.selectedByMemberId)?.name : null;
    result[key] = [...(result[key] ?? []), actor ? `${orderedFor} · ${actor}님이 대신 선택` : orderedFor];
    return result;
  }, {});

  return <main className="mx-auto min-h-screen max-w-xl p-5 pb-12">
    <Link href={`/team/${teamCode}`} className="text-sm font-bold text-stone-500">← 주문방 목록</Link>
    <section className={`mt-3 rounded-3xl p-5 ${primaryPanelClass}`}>
      <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-amber-700">{cafe.emoji} {cafe.name}</p><h1 className="mt-1 text-2xl font-black">{room.name}</h1><p className="mt-2 text-xs text-stone-600">{creator?.name ?? "팀원"}님이 만들었어요</p></div><div className="flex items-center gap-2"><OrderStatusBadge status={room.status} /><OrderUserSwitcher teamCode={teamCode} members={users} /><ShareOrderActions compact title={room.name} /></div></div>
    </section>

    <section className="mt-4">
      <div className="flex items-end justify-between"><div><h2 className="text-xl font-black">전체 주문 현황</h2><p className="mt-1 text-sm text-stone-500">응답 완료 {complete}명 · 미응답 {room.orders.length - complete}명</p></div></div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-200"><div className="h-full bg-emerald-500" style={{ width: `${complete / room.orders.length * 100}%` }} /></div>
      {isOpen && room.createdBy === currentUser.id && <button type="button" onClick={() => toggleRoom(room.id)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-4 text-sm font-extrabold text-white shadow-lg shadow-emerald-200 transition hover:brightness-105 active:scale-[0.99]"><span className="grid size-6 place-items-center rounded-full bg-white/20">✓</span> 주문 완료하고 마감하기</button>}
      {!isOpen && <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-800">✓ 이 주문은 완료되어 메뉴별 내역을 확인할 수 있어요.</p>}
      {room.createdBy === currentUser.id && <div className="mt-4"><button type="button" onClick={() => setShowDeleteConfirm(true)} className="w-full rounded-2xl border border-rose-200 py-3 text-sm font-bold text-rose-600">주문방 삭제</button>{showDeleteConfirm && <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-4"><p className="font-bold text-rose-900">이 주문방을 삭제할까요?</p><p className="mt-1 text-sm text-rose-700">참여자의 주문 내역도 함께 삭제됩니다.</p>{deleteError && <p className="mt-3 text-sm font-bold text-rose-700">{deleteError}</p>}<div className="mt-4 flex justify-end gap-2"><button type="button" disabled={isDeleting} onClick={() => setShowDeleteConfirm(false)} className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-stone-600 disabled:opacity-50">취소</button><button type="button" disabled={isDeleting} onClick={() => void removeRoom()} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{isDeleting ? "삭제 중..." : "삭제"}</button></div></div>}</div>}
      <div className="mt-4 flex rounded-2xl bg-stone-100 p-1"><button type="button" onClick={() => setTab("people")} className={`flex-1 rounded-xl py-2 text-sm font-bold ${tab === "people" ? "bg-white shadow-sm" : "text-stone-500"}`}>사람별 보기</button><button type="button" onClick={() => setTab("menu")} className={`flex-1 rounded-xl py-2 text-sm font-bold ${tab === "menu" ? "bg-white shadow-sm" : "text-stone-500"}`}>메뉴별 보기</button></div>
      {tab === "people" ? <div className="mt-3 rounded-3xl border border-stone-200 bg-white px-2">{peopleOrders.map((order) => {
        const user = users.find((item) => item.id === order.teamMemberId)!;
        const selectedMenu = menus.find((item) => item.id === order.menuId);
        const isMe = order.teamMemberId === currentUser.id;
        const rec = recommendations[user.id] ?? { frequent: null, recent: null };
        const same = rec.frequent && rec.recent && rec.frequent.menuId === rec.recent.menuId && rec.frequent.temperature === rec.recent.temperature;
        const delegated = order.status === "SELECTED" && order.selectedByMemberId && order.selectedByMemberId !== order.teamMemberId;
        const hasSelectedMenu = order.status === "SELECTED" && Boolean(selectedMenu);
        const actionLabel = hasSelectedMenu ? (isMe ? "다시 고르기" : "다시 골라주기") : (isMe ? "메뉴 고르기" : "메뉴 골라주기");
        return <div key={order.teamMemberId} className={`border-b border-stone-100 px-2 py-4 last:border-0 ${isMe ? "my-1 rounded-2xl border border-amber-100 bg-amber-50/60" : ""}`}><div className="flex items-start gap-3"><span className={`grid size-10 shrink-0 place-items-center rounded-full font-black ${isMe ? "bg-amber-100 text-amber-800" : "bg-stone-100 text-stone-600"}`}>{user.name.slice(0, 1)}</span><div className="min-w-0 flex-1"><p className="flex items-center gap-2 text-sm font-bold">{user.name}{isMe && <span className="rounded-full bg-amber-200/70 px-2 py-0.5 text-[10px] font-black text-amber-900">나</span>}</p>{selectedMenu ? <p className="mt-1 truncate text-base font-semibold text-stone-900">{selectedMenu.name} {order.temperature}</p> : <p className="mt-1 text-sm text-stone-500">{order.status === "PENDING" ? "아직 주문하지 않았어요" : order.status === "SKIP" ? "오늘 안 마심" : order.status === "ABSENT" && order.markedByMemberId ? `${memberName(order.markedByMemberId)}님이 표시한 휴가 / 부재` : "휴가 / 부재"}</p>}{delegated && <p className="mt-1 text-[11px] text-stone-400">{memberName(order.selectedByMemberId)}님이 대신 선택</p>}</div><OrderStatusBadge status={order.status} /></div>
          {isOpen && <button type="button" onClick={() => setActionFor(actionFor === user.id ? null : user.id)} className="ml-[52px] mt-2 flex min-h-11 items-center gap-2 rounded-xl px-3 text-xs font-bold text-amber-800 transition hover:bg-amber-50 active:scale-95"><Pencil size={14} />{actionLabel}</button>}
          {isOpen && actionFor === user.id && <div className="ml-[52px] mt-2 rounded-2xl border border-stone-200 bg-stone-50 p-3">{rec.frequent && <Recommendation title="평소 먹던 메뉴" item={rec.frequent} menus={menus} merged={Boolean(same)} onPick={async () => { await choose(user.id, rec.frequent!); setActionFor(null); }} />}{rec.recent && !same && <div className="mt-2"><Recommendation title="최근 먹었던 메뉴" item={rec.recent} menus={menus} onPick={async () => { await choose(user.id, rec.recent!); setActionFor(null); }} /></div>}<p className="mb-2 mt-3 text-xs font-bold text-stone-500">다른 메뉴</p><MenuPicker cafeId={room.cafeId} menus={menus} onAddMenu={addRoomMenu} onSelect={async (menu, temperature) => { await updateOrder(room.id, user.id, "SELECTED", { menuId: menu.id, temperature }); setActionFor(null); }} /><div className="mt-3 grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => void updateOrder(room.id, user.id, "SKIP").then(() => setActionFor(null))} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white text-xs font-bold"><X size={15} />오늘은 안 마셔요</button><button type="button" onClick={() => void updateOrder(room.id, user.id, "PENDING").then(() => setActionFor(null))} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white text-xs font-bold"><Circle size={15} />미선택으로 되돌리기</button><button type="button" onClick={() => void updateOrder(room.id, user.id, "ABSENT").then(() => setActionFor(null))} className="flex min-h-11 items-center justify-center rounded-xl bg-white text-xs font-bold">휴가 / 부재</button><button type="button" onClick={() => setActionFor(null)} className="flex min-h-11 items-center justify-center rounded-xl bg-stone-200 text-xs font-bold">취소</button></div></div>}
        </div>;
      })}</div> : <div className="mt-3 rounded-3xl border border-stone-200 bg-white px-4">{Object.keys(summary).length ? Object.entries(summary).map(([key, people]) => { const [menuId, temperature] = key.split("|"); return <div key={key} className="flex justify-between gap-4 border-b border-stone-100 py-4 font-bold last:border-0"><div><p>{menus.find((item) => item.id === menuId)?.name ?? "추가 메뉴"} {temperature}</p><p className="mt-2 text-xs font-normal leading-5 text-stone-500">{people.join(" · ")}</p></div><span className="shrink-0 text-amber-700">× {people.length}</span></div>; }) : <p className="py-8 text-center text-sm text-stone-500">아직 선택된 메뉴가 없어요.</p>}</div>}
    </section>
  </main>;
}
