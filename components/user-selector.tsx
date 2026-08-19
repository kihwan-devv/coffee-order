"use client";

import { type FormEvent, useState } from "react";
import type { TeamMember } from "@/types";
import { useOrderRooms } from "./order-room-provider";

export function UserSelector({ teamCode, teamName, members }: { teamCode: string; teamName: string; members: TeamMember[] }) {
  const { addUser, finishAddingUser, selectUser } = useOrderRooms();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [newMember, setNewMember] = useState<{ id: string; hasOpenOrders: boolean } | null>(null);

  const add = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return setError("이름을 입력해 주세요.");
    setSubmitting(true);
    setError("");
    try { setNewMember(await addUser(teamCode, name.trim())); }
    catch (value) { setError(value instanceof Error ? value.message : "팀원을 추가하지 못했습니다."); }
    finally { setSubmitting(false); }
  };

  const finish = async (includeOpenOrders: boolean) => {
    if (!newMember) return;
    setSubmitting(true);
    setError("");
    try { await finishAddingUser(newMember.id, includeOpenOrders); }
    catch (value) { setError(value instanceof Error ? value.message : "팀 참여를 완료하지 못했습니다."); setSubmitting(false); }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-5">
      <div className="mb-8"><p className="text-sm font-bold text-amber-700">{teamName}</p><h1 className="mt-2 text-3xl font-black tracking-tight">누구신가요?</h1><p className="mt-3 text-sm leading-6 text-stone-500">본인을 선택하면 이 브라우저에서 자동으로 기억해요.</p></div>
      <div className="space-y-3">{members.map((user) => <button key={user.id} type="button" onClick={() => void selectUser(user.id, teamCode)} className="flex w-full items-center gap-4 rounded-3xl border border-stone-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-amber-400"><span className="grid size-11 place-items-center rounded-full bg-amber-100 font-black text-amber-800">{user.name.slice(0, 1)}</span><span className="flex-1 font-bold">{user.name}</span><span className="text-xl text-stone-400">›</span></button>)}</div>
      <div className="my-6 border-t border-stone-200" />
      {!adding && !newMember && <button type="button" onClick={() => setAdding(true)} className="w-full rounded-2xl border border-dashed border-amber-400 bg-amber-50 px-4 py-3.5 font-bold text-amber-800">+ 내 이름 추가</button>}
      {adding && !newMember && <form onSubmit={add} className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm"><label className="block text-sm font-bold" htmlFor="new-member-name">내 이름</label><input id="new-member-name" autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="이름을 입력해 주세요" className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3" /><div className="mt-3 flex gap-2"><button type="button" onClick={() => { setAdding(false); setError(""); }} className="flex-1 rounded-2xl bg-stone-100 py-3 text-sm font-bold">취소</button><button type="submit" disabled={submitting} className="flex-1 rounded-2xl bg-amber-600 py-3 text-sm font-bold text-white disabled:opacity-60">추가하기</button></div></form>}
      {newMember && <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5">{newMember.hasOpenOrders ? <><h2 className="text-lg font-black">현재 진행 중인 주문에도 참여할까요?</h2><p className="mt-2 text-sm leading-6 text-stone-600">참여하면 진행 중인 모든 주문에 미응답 상태로 추가돼요.</p><div className="mt-4 grid grid-cols-2 gap-2"><button type="button" disabled={submitting} onClick={() => void finish(true)} className="rounded-2xl bg-amber-600 py-3 text-sm font-bold text-white disabled:opacity-60">참여하기</button><button type="button" disabled={submitting} onClick={() => void finish(false)} className="rounded-2xl bg-white py-3 text-sm font-bold text-stone-700 disabled:opacity-60">다음 주문부터</button></div></> : <button type="button" disabled={submitting} onClick={() => void finish(false)} className="w-full rounded-2xl bg-amber-600 py-3 font-bold text-white disabled:opacity-60">팀방으로 들어가기</button>}</section>}
      {error && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    </main>
  );
}
