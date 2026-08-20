"use client";

import { type FormEvent, useState } from "react";
import { Check, Coffee, Eye, EyeOff, Pencil, Plus, Snowflake, Trash2, X } from "lucide-react";
import type { Cafe, Menu, Temperature } from "@/types";
import { useOrderRooms } from "./order-room-provider";

type MenuDraft = { name: string; category: string; imageUrl: string; temperatures: Temperature[]; isActive: boolean };
const emptyMenu = (): MenuDraft => ({ name: "", category: "", imageUrl: "", temperatures: ["HOT", "ICED"], isActive: true });
const menuDraft = (menu: Menu): MenuDraft => ({ name: menu.name, category: menu.category ?? "", imageUrl: menu.imageUrl ?? "", temperatures: menu.supportedTemperatures, isActive: menu.isActive });

function TemperatureFields({ value, onChange }: { value: Temperature[]; onChange: (value: Temperature[]) => void }) {
  return <div className="flex gap-2">{(["HOT", "ICED"] as Temperature[]).map((temperature) => {
    const selected = value.includes(temperature);
    const Icon = temperature === "HOT" ? Coffee : Snowflake;
    return <button key={temperature} type="button" onClick={() => onChange(selected ? value.filter((item) => item !== temperature) : [...value, temperature])} className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border text-sm font-bold transition active:scale-[0.98] ${selected ? "border-amber-500 bg-amber-50 text-amber-800" : "border-stone-200 bg-white text-stone-500"}`}><Icon size={16} />{temperature}{selected && <Check size={14} />}</button>;
  })}</div>;
}

export function MenuEditor({ cafeId, menu, onClose }: { cafeId: string; menu?: Menu; onClose: () => void }) {
  const { addMenu, editMenu } = useOrderRooms();
  const [draft, setDraft] = useState<MenuDraft>(() => menu ? menuDraft(menu) : emptyMenu());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim()) return setError("메뉴 이름을 입력해 주세요.");
    if (!draft.temperatures.length) return setError("HOT 또는 ICED를 하나 이상 선택해 주세요.");
    setSaving(true); setError("");
    try {
      const input = { name: draft.name.trim(), category: draft.category.trim(), imageUrl: draft.imageUrl.trim(), temperatures: draft.temperatures, isActive: draft.isActive };
      if (menu) await editMenu(menu.id, input); else await addMenu(cafeId, input);
      onClose();
    } catch (value) { setError(value instanceof Error ? value.message : "메뉴를 저장하지 못했습니다."); setSaving(false); }
  };
  return <form onSubmit={submit} className="mt-3 space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
    <div className="flex items-center justify-between"><h4 className="font-black">{menu ? "메뉴 수정" : "메뉴 추가"}</h4><button type="button" onClick={onClose} aria-label="편집 닫기" title="편집 닫기" className="grid size-11 place-items-center rounded-full hover:bg-white active:scale-95"><X size={18} /></button></div>
    <input autoFocus required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="메뉴 이름" className="w-full rounded-xl border border-stone-200 px-3 py-3" />
    <input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} placeholder="카테고리 (선택)" className="w-full rounded-xl border border-stone-200 px-3 py-3" />
    <input type="url" value={draft.imageUrl} onChange={(event) => setDraft({ ...draft, imageUrl: event.target.value })} placeholder="이미지 URL (선택)" className="w-full rounded-xl border border-stone-200 px-3 py-3" />
    <TemperatureFields value={draft.temperatures} onChange={(temperatures) => setDraft({ ...draft, temperatures })} />
    {error && <p className="text-sm font-bold text-rose-600">{error}</p>}
    <button disabled={saving} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-600 font-bold text-white transition hover:bg-amber-700 active:scale-[0.98] disabled:opacity-50"><Check size={17} />{saving ? "저장 중..." : "저장"}</button>
  </form>;
}

type BatchMenuDraft = MenuDraft & { id?: string; key: string };

function MenuBatchEditor({ cafeId, menus, onClose }: { cafeId: string; menus: Menu[]; onClose: () => void }) {
  const { saveCafeMenus } = useOrderRooms();
  const [drafts, setDrafts] = useState<BatchMenuDraft[]>(() => menus.filter((menu) => menu.isActive).map((menu) => ({ ...menuDraft(menu), id: menu.id, key: menu.id })));
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const add = () => setDrafts((items) => [...items, { ...emptyMenu(), key: crypto.randomUUID() }]);
  const remove = (draft: BatchMenuDraft) => { setDrafts((items) => items.filter((item) => item.key !== draft.key)); if (draft.id) setDeletedIds((items) => [...items, draft.id!]); };
  const update = (key: string, patch: Partial<MenuDraft>) => setDrafts((items) => items.map((item) => item.key === key ? { ...item, ...patch } : item));
  const save = async () => {
    if (drafts.some((draft) => !draft.name.trim())) return setError("모든 메뉴 이름을 입력해 주세요.");
    if (drafts.some((draft) => draft.temperatures.length === 0)) return setError("모든 메뉴에 HOT 또는 ICED를 하나 이상 선택해 주세요.");
    setSaving(true); setError("");
    try { await saveCafeMenus(cafeId, drafts.map((draft) => ({ id: draft.id, name: draft.name.trim(), category: draft.category.trim(), imageUrl: draft.imageUrl.trim(), temperatures: draft.temperatures, isActive: true })), deletedIds); onClose(); }
    catch (value) { setError(value instanceof Error ? value.message : "메뉴 변경사항을 저장하지 못했습니다."); setSaving(false); }
  };
  return <section className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3"><div className="flex items-center justify-between"><div><h4 className="font-black">메뉴 일괄 편집</h4><p className="mt-1 text-xs text-stone-500">추가·수정·삭제 후 한 번에 저장해요.</p></div><button type="button" onClick={onClose} aria-label="일괄 편집 닫기" className="grid size-11 place-items-center rounded-full hover:bg-white"><X size={18} /></button></div><div className="mt-3 space-y-3">{drafts.map((draft) => <div key={draft.key} className="rounded-2xl border border-stone-200 bg-white p-3"><div className="flex gap-2"><input value={draft.name} onChange={(event) => update(draft.key, { name: event.target.value })} placeholder="메뉴 이름" className="min-w-0 flex-1 rounded-xl border px-3 py-2.5 text-sm" /><button type="button" onClick={() => remove(draft)} aria-label={`${draft.name || "새 메뉴"} 삭제`} title="메뉴 삭제" className="grid size-11 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100"><Trash2 size={17} /></button></div><div className="mt-2 grid gap-2 sm:grid-cols-2"><input value={draft.category} onChange={(event) => update(draft.key, { category: event.target.value })} placeholder="카테고리 (선택)" className="rounded-xl border px-3 py-2.5 text-sm" /><input type="url" value={draft.imageUrl} onChange={(event) => update(draft.key, { imageUrl: event.target.value })} placeholder="이미지 URL (선택)" className="rounded-xl border px-3 py-2.5 text-sm" /></div><div className="mt-2"><TemperatureFields value={draft.temperatures} onChange={(temperatures) => update(draft.key, { temperatures })} /></div></div>)}</div><button type="button" onClick={add} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-amber-400 bg-white text-sm font-bold text-amber-800"><Plus size={16} />메뉴 더 추가</button>{error && <p className="mt-3 text-sm font-bold text-rose-600">{error}</p>}<button type="button" disabled={saving} onClick={() => void save()} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-600 font-bold text-white disabled:opacity-50"><Check size={17} />{saving ? "저장 중..." : "변경사항 한 번에 저장"}</button></section>;
}

export function CafeManager({ cafe }: { cafe: Cafe }) {
  const { menus, editCafe, editMenu } = useOrderRooms();
  const cafeMenus = menus.filter((item) => item.cafeId === cafe.id && item.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  const [editingCafe, setEditingCafe] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [addingMenu, setAddingMenu] = useState(false);
  const [batchEditing, setBatchEditing] = useState(false);
  const [cafeDraft, setCafeDraft] = useState({ name: cafe.name, logoUrl: cafe.logoUrl ?? "", imageUrl: cafe.imageUrl ?? "", officialMenuUrl: cafe.officialMenuUrl ?? "", isActive: cafe.isActive });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const saveCafe = async (event: FormEvent) => { event.preventDefault(); if (!cafeDraft.name.trim()) return; setSaving(true); setError(""); try { await editCafe(cafe.id, cafeDraft); setEditingCafe(false); } catch (value) { setError(value instanceof Error ? value.message : "카페를 저장하지 못했습니다."); } finally { setSaving(false); } };
  const toggleMenu = async (menu: Menu) => { await editMenu(menu.id, { ...menuDraft(menu), isActive: !menu.isActive }); };

  return <section className="mt-3 rounded-3xl border border-stone-200 bg-white p-4">
    <div className="flex items-center justify-between gap-3"><div><h3 className="font-black">{cafe.name}</h3><p className="mt-1 text-xs text-stone-500">메뉴 {cafeMenus.length}개 · {cafe.isActive ? "사용 중" : "숨김"}</p></div><button type="button" onClick={() => setEditingCafe((value) => !value)} aria-label="카페 수정" title="카페 수정" className="grid size-11 place-items-center rounded-full border border-stone-200 transition hover:bg-stone-50 active:scale-95"><Pencil size={17} /></button></div>
    {!batchEditing && <button type="button" onClick={() => setBatchEditing(true)} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-stone-100 text-sm font-bold text-stone-700"><Pencil size={16} />여러 메뉴 추가·수정·삭제</button>}
    {batchEditing && <MenuBatchEditor cafeId={cafe.id} menus={cafeMenus} onClose={() => setBatchEditing(false)} />}
    {editingCafe && <form onSubmit={saveCafe} className="mt-4 space-y-2 rounded-2xl bg-stone-50 p-3"><input required value={cafeDraft.name} onChange={(event) => setCafeDraft({ ...cafeDraft, name: event.target.value })} placeholder="카페 이름" className="w-full rounded-xl border px-3 py-3" /><input type="url" value={cafeDraft.logoUrl} onChange={(event) => setCafeDraft({ ...cafeDraft, logoUrl: event.target.value })} placeholder="로고 URL" className="w-full rounded-xl border px-3 py-3" /><input type="url" value={cafeDraft.imageUrl} onChange={(event) => setCafeDraft({ ...cafeDraft, imageUrl: event.target.value })} placeholder="이미지 URL" className="w-full rounded-xl border px-3 py-3" /><input type="url" value={cafeDraft.officialMenuUrl} onChange={(event) => setCafeDraft({ ...cafeDraft, officialMenuUrl: event.target.value })} placeholder="공식 메뉴 URL" className="w-full rounded-xl border px-3 py-3" /><label className="flex min-h-11 items-center gap-2 text-sm font-bold"><input type="checkbox" checked={cafeDraft.isActive} onChange={(event) => setCafeDraft({ ...cafeDraft, isActive: event.target.checked })} /> 활성 카페</label>{error && <p className="text-sm text-rose-600">{error}</p>}<button disabled={saving} className="min-h-11 w-full rounded-xl bg-stone-800 font-bold text-white disabled:opacity-50">{saving ? "저장 중..." : "카페 저장"}</button></form>}
    <div className="mt-4 space-y-2">{cafeMenus.length ? cafeMenus.map((menu) => <div key={menu.id}><div className={`flex items-center gap-3 rounded-2xl border p-3 ${menu.isActive ? "border-stone-200" : "border-stone-100 bg-stone-50 opacity-70"}`}><div className="min-w-0 flex-1"><p className="font-bold">{menu.name}</p><p className="mt-1 text-xs text-stone-500">{menu.category || "카테고리 없음"} · {menu.supportedTemperatures.join(" / ")}</p></div><button type="button" onClick={() => setEditingMenuId(editingMenuId === menu.id ? null : menu.id)} aria-label={`${menu.name} 수정`} title="메뉴 수정" className="grid size-11 place-items-center rounded-full hover:bg-stone-100 active:scale-95"><Pencil size={16} /></button><button type="button" onClick={() => void toggleMenu(menu)} aria-label={`${menu.name} ${menu.isActive ? "숨기기" : "판매 재개"}`} title={menu.isActive ? "메뉴 숨기기" : "판매 재개"} className="grid size-11 place-items-center rounded-full hover:bg-stone-100 active:scale-95">{menu.isActive ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{editingMenuId === menu.id && <MenuEditor cafeId={cafe.id} menu={menu} onClose={() => setEditingMenuId(null)} />}</div>) : <div className="rounded-2xl border border-dashed border-stone-300 p-5 text-center"><p className="text-sm text-stone-500">등록된 메뉴가 없습니다.</p></div>}</div>
    {addingMenu ? <MenuEditor cafeId={cafe.id} onClose={() => setAddingMenu(false)} /> : <button type="button" onClick={() => setAddingMenu(true)} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-amber-400 bg-amber-50 text-sm font-bold text-amber-800 transition hover:bg-amber-100 active:scale-[0.98]"><Plus size={17} />메뉴 추가</button>}
  </section>;
}
