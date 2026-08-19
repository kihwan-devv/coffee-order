"use client";

import { type FormEvent, useState } from "react";
import type { TeamMember } from "@/types";
import { useOrderRooms } from "./order-room-provider";

export function UserSelector({ teamCode, teamName, members, orderCode }: { teamCode: string; teamName: string; members: TeamMember[]; orderCode?: string }) {
  const { addUser, finishAddingUser, rooms, selectUser } = useOrderRooms();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [newMember, setNewMember] = useState<{ id: string; hasOpenOrders: boolean } | null>(null);
  const canJoinCurrentOrders = orderCode ? rooms.some((room) => room.orderCode === orderCode && room.status === "OPEN") : newMember?.hasOpenOrders;

  const joinAsSelected = async () => {
    if (!selectedMemberId || submitting) return;
    setSubmitting(true);
    setError("");
    try { await selectUser(selectedMemberId, teamCode); }
    catch (value) { setError(value instanceof Error ? value.message : "팀원을 선택하지 못했습니다."); setSubmitting(false); }
  };

  const add = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return setError("이름을 입력해 주세요.");
    setSubmitting(true);
    setError("");
    try {
      const addedMember = await addUser(teamCode, name.trim());
      setSelectedMemberId(addedMember.id);
      setNewMember(addedMember);
    }
    catch (value) { setError(value instanceof Error ? value.message : "팀원을 추가하지 못했습니다."); }
    finally { setSubmitting(false); }
  };

  const finish = async (includeCurrentOrders: boolean) => {
    if (!newMember || submitting) return;
    setSubmitting(true);
    setError("");
    try { await finishAddingUser(newMember.id, includeCurrentOrders, orderCode); }
    catch (value) { setError(value instanceof Error ? value.message : "팀 참여를 완료하지 못했습니다."); setSubmitting(false); }
  };

  return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-5">
    <div className="mb-8"><p className="text-sm font-bold text-amber-700">{teamName}</p><h1 className="mt-2 text-3xl font-black tracking-tight">누구신가요?</h1><p className="mt-3 text-sm leading-6 text-stone-500">본인을 선택하면 이 브라우저에서 팀별로 기억해요.</p></div>
    <div className="space-y-3">{members.filter((member) => member.isActive).map((member) => { const selected = member.id === selectedMemberId; return <button key={member.id} type="button" disabled={submitting} onClick={() => setSelectedMemberId(member.id)} className={`flex w-full items-center gap-4 rounded-3xl border p-4 text-left shadow-sm transition ${selected ? "border-amber-500 bg-amber-50 ring-2 ring-amber-200" : "border-stone-200 bg-white hover:-translate-y-0.5 hover:border-amber-400"}`}><span className={`grid size-11 place-items-center rounded-full font-black ${selected ? "bg-amber-600 text-white" : "bg-amber-100 text-amber-800"}`}>{selected ? "✓" : member.name.slice(0, 1)}</span><span className="flex-1 font-bold">{member.name}</span><span className="text-xl text-stone-400">›</span></button>; })}</div>
    {!adding && !newMember && <button type="button" disabled={!selectedMemberId || submitting} onClick={() => void joinAsSelected()} className="mt-4 w-full rounded-2xl bg-stone-800 py-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{submitting ? "참여 중..." : "이 이름으로 참여하기"}</button>}
    <div className="my-6 border-t border-stone-200" />
    {!adding && !newMember && <button type="button" onClick={() => setAdding(true)} className="w-full rounded-2xl border border-dashed border-amber-400 bg-amber-50 px-4 py-3.5 font-bold text-amber-800">+ 내 이름 추가</button>}
    {adding && !newMember && <form onSubmit={add} className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm"><label className="block text-sm font-bold" htmlFor="new-member-name">내 이름</label><input id="new-member-name" autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="이름을 입력해 주세요" className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3" /><div className="mt-3 flex gap-2"><button type="button" onClick={() => { setAdding(false); setError(""); }} className="flex-1 rounded-2xl bg-stone-100 py-3 text-sm font-bold">취소</button><button type="submit" disabled={submitting} className="flex-1 rounded-2xl bg-amber-600 py-3 text-sm font-bold text-white disabled:opacity-60">{submitting ? "추가 중..." : "추가하기"}</button></div></form>}
    {newMember && <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5">{canJoinCurrentOrders ? <><h2 className="text-lg font-black">{orderCode ? "이번 주문부터 참여할까요?" : "진행 중인 주문에도 참여할까요?"}</h2><p className="mt-2 text-sm leading-6 text-stone-600">{orderCode ? "참여하면 이 주문에 미응답 상태로 추가돼요." : "참여하면 진행 중인 모든 주문에 미응답 상태로 추가돼요."}</p><div className="mt-4 grid grid-cols-2 gap-2"><button type="button" disabled={submitting} onClick={() => void finish(true)} className="rounded-2xl bg-amber-600 py-3 text-sm font-bold text-white disabled:opacity-60">{orderCode ? "이번 주문부터 참여" : "참여"}</button><button type="button" disabled={submitting} onClick={() => void finish(false)} className="rounded-2xl bg-white py-3 text-sm font-bold text-stone-700 disabled:opacity-60">다음 주문부터</button></div></> : <button type="button" disabled={submitting} onClick={() => void finish(false)} className="w-full rounded-2xl bg-amber-600 py-3 font-bold text-white disabled:opacity-60">{orderCode ? "주문 결과 보기" : "팀방으로 들어가기"}</button>}</section>}
    {error && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
  </main>;
}
