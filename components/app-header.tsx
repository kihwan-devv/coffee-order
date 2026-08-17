"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOrderRooms } from "./order-room-provider";
export function AppHeader({ teamCode }: { teamCode?: string }) { const { currentUser, clearUser } = useOrderRooms(); const router = useRouter(); return <header className="mb-7 flex items-center justify-between"><Link href="/" className="text-lg font-black tracking-tight">brew<span className="text-amber-600">.</span>board</Link>{currentUser && <div className="flex items-center gap-2"><span className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-bold">{currentUser.name}</span>{teamCode && <button onClick={() => { clearUser(teamCode); router.push(`/team/${teamCode}`); }} className="text-xs font-semibold text-stone-500 underline">사용자 변경</button>}</div>}</header>; }
