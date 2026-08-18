"use client";

import { type FormEvent, useState } from "react";
import { useOrderRooms } from "@/components/order-room-provider";

export default function NewTeamPage() {
  const { createTeam } = useOrderRooms();
  const [teamName, setTeamName] = useState("");
  const [myName, setMyName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    if (!teamName.trim()) return setError("팀 이름을 입력해 주세요.");
    if (!myName.trim()) return setError("내 이름을 입력해 주세요.");
    setSubmitting(true);
    setError("");
    try {
      const teamCode = await createTeam(teamName.trim(), myName.trim());
      window.location.assign(`/team/${teamCode}`);
    } catch (value) {
      setError(value instanceof Error ? value.message : "팀을 만들지 못했습니다.");
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-xl p-5">
      <p className="text-sm font-bold text-amber-700">NEW TEAM</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight">우리 팀을 만들어볼까요?</h1>
      <form onSubmit={create} className="mt-7 space-y-7">
        <label className="block"><span className="mb-2 block text-sm font-bold">팀 이름</span><input required value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder="예: 카드디자인팀" className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3.5" /></label>
        <label className="block"><span className="mb-2 block text-sm font-bold">내 이름</span><input required value={myName} onChange={(event) => setMyName(event.target.value)} placeholder="예: Eric" className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3.5" /></label>
        {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <button type="submit" disabled={submitting} className="w-full rounded-2xl bg-amber-600 py-4 font-extrabold text-white disabled:opacity-60">{submitting ? "팀을 만드는 중..." : "팀 만들기"}</button>
      </form>
    </main>
  );
}
