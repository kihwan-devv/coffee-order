"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOrderRooms } from "./order-room-provider";
export function AppHeader({ teamCode }: { teamCode?: string }) { const { currentUser, clearUser } = useOrderRooms(); const router = useRouter(); return <header className="mb-5 flex items-center justify-between sm:mb-7"><Link href="/" className="text-lg font-black tracking-tight">all<span className="text-amber-600">At</span>Once</Link>{currentUser && <div className="flex items-center gap-2"><span className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-bold">{currentUser.name}</span>{teamCode && <button onClick={() => { clearUser(); router.push(`/team/${teamCode}`); }} className="text-xs font-semibold text-stone-500 underline">사용자 변경</button>}</div>}</header>; }
