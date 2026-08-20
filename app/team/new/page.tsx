"use client";

import { type FormEvent, type KeyboardEvent, useRef, useState } from "react";
import { useOrderRooms } from "@/components/order-room-provider";

export default function NewTeamPage() {
  const { createTeam } = useOrderRooms();
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState([""]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const memberInputs = useRef<Array<HTMLInputElement | null>>([]);

  const updateMember = (index: number, value: string) => setMembers((items) => items.map((item, itemIndex) => itemIndex === index ? value : item));
  const removeMember = (index: number) => setMembers((items) => items.length === 1 ? [""] : items.filter((_, itemIndex) => itemIndex !== index));
  const continueMemberEntry = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (!members[index].trim()) return setError("팀원 이름을 입력해 주세요.");
    setError("");
    if (index === members.length - 1) setMembers((items) => [...items, ""]);
    requestAnimationFrame(() => memberInputs.current[index + 1]?.focus());
  };

  const create = async (event: FormEvent) => {
    event.preventDefault();
    const names = members.map((name) => name.trim());
    if (!teamName.trim()) return setError("팀 이름을 입력해 주세요.");
    if (names.some((name) => !name)) return setError("모든 팀원의 이름을 입력해 주세요.");
    if (new Set(names.map((name) => name.toLocaleLowerCase())).size !== names.length) return setError("같은 이름은 한 팀에 한 번만 등록할 수 있어요.");
    setSubmitting(true);
    setError("");
    try {
      const teamCode = await createTeam(teamName.trim(), names);
      window.location.assign(`/team/${teamCode}`);
    } catch (value) {
      setError(value instanceof Error ? value.message : "팀을 만들지 못했습니다.");
      setSubmitting(false);
    }
  };

  return <main className="mx-auto min-h-screen max-w-xl p-4 sm:p-5">
    <p className="text-sm font-bold text-amber-700">NEW TEAM</p>
    <h1 className="mt-2 text-3xl font-black tracking-tight">우리 팀을 만들어볼까요?</h1>
    <form onSubmit={create} className="mt-5 space-y-5 sm:mt-7 sm:space-y-7">
      <label className="block"><span className="mb-2 block text-sm font-bold">팀 이름</span><input required value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder="예: 카드디지털팀" className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3.5" /></label>
      <section><p className="mb-2 text-sm font-bold">팀원</p><div className="space-y-2">{members.map((member, index) => <div key={index} className="flex gap-2"><input ref={(element) => { memberInputs.current[index] = element; }} value={member} onChange={(event) => updateMember(index, event.target.value)} onKeyDown={(event) => continueMemberEntry(event, index)} placeholder="팀원 이름" className="min-w-0 flex-1 rounded-2xl border border-stone-200 bg-white px-4 py-3" /><button type="button" onClick={() => removeMember(index)} className="rounded-2xl bg-stone-100 px-4 text-sm font-bold text-rose-600">삭제</button></div>)}</div><button type="button" onClick={() => { setMembers((items) => [...items, ""]); requestAnimationFrame(() => memberInputs.current[members.length]?.focus()); }} className="mt-3 rounded-2xl border border-dashed border-amber-400 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">+ 팀원 추가</button></section>
      {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <button type="submit" disabled={submitting} className="w-full rounded-2xl bg-amber-600 py-4 font-extrabold text-white disabled:opacity-60">{submitting ? "팀을 만드는 중..." : "팀 만들기"}</button>
    </form>
  </main>;
}
