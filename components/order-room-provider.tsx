"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ensureAnonymousSession, resetSessionInitialization } from "@/lib/data/auth";
import { createCafe, createMenu, listCafesAndMenus } from "@/lib/data/cafes";
import { closeOrder, createOrder, deleteOrder, listOrders, updateResponse } from "@/lib/data/orders";
import { addMemberToOpenOrders, addTeamMemberAndJoin, createTeam as createTeamRpc, getCurrentTeamMember, getTeamLanding, joinTeam, TeamNotFoundError } from "@/lib/data/teams";
import { createClient } from "@/lib/supabase/client";
import type { Cafe, Menu, OrderRoom, OrderStatus, Team, Temperature, User } from "@/types";

export type TeamLoadStatus = "idle" | "authenticating" | "loading-team" | "ready" | "not-found" | "joining" | "error";
type Context = { currentUser: User | null; ready: boolean; loading: boolean; error: string | null; teamLoadStatus: TeamLoadStatus; users: User[]; teams: Team[]; rooms: OrderRoom[]; cafes: Cafe[]; menus: Menu[]; activateTeam: (code: string) => Promise<void>; selectUser: (id: string, code: string) => Promise<void>; addUser: (code: string, name: string) => Promise<{ id: string; hasOpenOrders: boolean }>; finishAddingUser: (id: string, includeOpenOrders: boolean) => Promise<void>; clearUser: () => void; createTeam: (name: string, creator: string) => Promise<string>; getTeamMembers: (id: string) => User[]; createRoom: (teamId: string, name: string, cafeId: string) => Promise<string>; deleteRoom: (id: string) => Promise<void>; updateOrder: (roomId: string, userId: string, status: OrderStatus, selection?: { menuId: string; temperature: Temperature }) => Promise<void>; toggleRoom: (id: string) => Promise<void>; addCafe: (name: string, url?: string) => Promise<Cafe>; addMenu: (cafeId: string, name: string, temperatures: Temperature[]) => Promise<Menu>; };
const OrderContext = createContext<Context | null>(null);

function errorMessage(value: unknown) {
  if (value instanceof Error) return value.message;
  if (value && typeof value === "object" && "message" in value) return String(value.message);
  return "요청을 처리하지 못했습니다.";
}

export function OrderRoomProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]), [teams, setTeams] = useState<Team[]>([]), [rooms, setRooms] = useState<OrderRoom[]>([]), [cafes, setCafes] = useState<Cafe[]>([]), [menus, setMenus] = useState<Menu[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null), [ready, setReady] = useState(false), [error, setError] = useState<string | null>(null), [teamLoadStatus, setTeamLoadStatus] = useState<TeamLoadStatus>("idle");
  const fail = useCallback((value: unknown) => { const message = errorMessage(value); setError(message); return message; }, []);

  useEffect(() => {
    void (async () => {
      try {
        await ensureAnonymousSession();
        const data = await listCafesAndMenus();
        setCafes(data.cafes); setMenus(data.menus);
      } catch (value) {
        console.error("[Supabase initialization]", value);
        fail(value);
      } finally { setReady(true); }
    })();
  }, [fail]);

  const activateTeam = useCallback(async (code: string) => {
    setError(null); setTeamLoadStatus("authenticating");
    try {
      const session = await ensureAnonymousSession();
      if (!session.access_token) throw new Error("인증 세션에 access_token이 없습니다.");
      setTeamLoadStatus("loading-team");
      const landing = await getTeamLanding(code);
      const [nextRooms, member, cafeData] = await Promise.all([listOrders(landing.team.id), getCurrentTeamMember(landing.team.id), listCafesAndMenus()]);
      setTeams([landing.team]); setUsers(landing.members); setRooms(nextRooms); setCurrentUser(member); setCafes(cafeData.cafes); setMenus(cafeData.menus); setTeamLoadStatus("ready");
    } catch (value) {
      setTeams([]); setUsers([]); setRooms([]); setCurrentUser(null);
      if (value instanceof TeamNotFoundError) { setError(null); setTeamLoadStatus("not-found"); }
      else { console.error("[Team activation]", value); fail(value); setTeamLoadStatus("error"); }
    }
  }, [fail]);

  const reload = useCallback(async (roomId: string) => { const found = rooms.find((item) => item.id === roomId); if (found) setRooms(await listOrders(found.teamId)); }, [rooms]);
  useEffect(() => { const teamId = teams[0]?.id; if (!teamId) return; const channel = createClient().channel(`responses:${teamId}`).on("postgres_changes", { event: "*", schema: "public", table: "order_responses" }, () => { void listOrders(teamId).then(setRooms).catch(fail); }).subscribe(); return () => { void createClient().removeChannel(channel); }; }, [fail, teams]);

  const value = useMemo<Context>(() => ({ currentUser, ready, loading: teamLoadStatus === "authenticating" || teamLoadStatus === "loading-team" || teamLoadStatus === "joining", error, teamLoadStatus, users, teams, rooms, cafes, menus, activateTeam,
    selectUser: async (id, code) => { setError(null); setTeamLoadStatus("joining"); try { await ensureAnonymousSession(); await joinTeam(code, id); setCurrentUser(users.find((item) => item.id === id) ?? null); setTeamLoadStatus("ready"); } catch (value) { console.error("[Team join]", value); fail(value); setTeamLoadStatus("error"); } },
    addUser: async (code, name) => {
      setError(null);
      await ensureAnonymousSession();
      const result = await addTeamMemberAndJoin(code, name);
      const member = { id: result.teamMemberId, name, createdAt: new Date().toISOString() };
      setUsers((items) => [...items, member]);
      return { id: member.id, hasOpenOrders: rooms.some((room) => room.teamId === result.teamId && room.status === "OPEN") };
    },
    finishAddingUser: async (id, includeOpenOrders) => {
      if (includeOpenOrders) await addMemberToOpenOrders(id);
      const teamId = teams[0]?.id;
      if (!teamId) throw new Error("현재 팀을 찾을 수 없습니다.");
      const member = await getCurrentTeamMember(teamId);
      if (!member || member.id !== id) throw new Error("추가한 팀원 세션을 확인할 수 없습니다.");
      setCurrentUser(member);
      setTeamLoadStatus("ready");
      setRooms(await listOrders(teamId));
    },
    clearUser: async () => { await createClient().auth.signOut(); resetSessionInitialization(); await ensureAnonymousSession(); setCurrentUser(null); },
    createTeam: async (name, creator) => { await ensureAnonymousSession(); const result = await createTeamRpc(name, creator); await activateTeam(result.teamCode); return result.teamCode; }, getTeamMembers: () => users,
    createRoom: async (teamId, name, cafeId) => {
      const sessionMember = await getCurrentTeamMember(teamId);
      if (!sessionMember?.id) throw new Error("현재 팀 사용자를 확인할 수 없습니다.");
      if (!currentUser || currentUser.id !== sessionMember.id) throw new Error("현재 화면의 팀 사용자와 인증 세션의 TeamMember가 일치하지 않습니다.");
      const result = await createOrder({ teamId, title: name, cafeId, currentMemberId: sessionMember.id });
      return result.orderCode;
    },
    deleteRoom: async (id) => { await deleteOrder(id); setRooms((items) => items.filter((item) => item.id !== id)); },
    updateOrder: async (roomId, userId, status, selection) => { if (!currentUser) throw new Error("현재 팀 사용자를 확인할 수 없습니다."); try { await updateResponse(roomId, userId, currentUser.id, status, selection); const updatedAt = new Date().toISOString(); setRooms((items) => items.map((room) => room.id !== roomId ? room : { ...room, orders: room.orders.map((response) => response.userId !== userId ? response : { ...response, status, menuId: status === "SELECTED" ? selection?.menuId ?? null : null, temperature: status === "SELECTED" ? selection?.temperature ?? null : null, selectedBy: status === "SELECTED" || status === "SKIP" ? currentUser.id : null, markedBy: status === "ABSENT" ? currentUser.id : null, updatedAt }) })); const teamId = rooms.find((room) => room.id === roomId)?.teamId; if (teamId) void listOrders(teamId).then(setRooms).catch(fail); } catch (value) { fail(value); throw value; } }, toggleRoom: async (id) => { try { await closeOrder(id); await reload(id); } catch (value) { fail(value); } },
    addCafe: async (name, url) => { const item = await createCafe(name, url); setCafes((all) => [...all, item]); return item; }, addMenu: async (cafeId, name, temperatures) => { const item = await createMenu(cafeId, name, temperatures); setMenus((all) => [...all, item]); return item; },
  }), [activateTeam, cafes, currentUser, error, fail, menus, ready, reload, rooms, teamLoadStatus, teams, users]);
  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}
export function useOrderRooms() { const value = useContext(OrderContext); if (!value) throw new Error("OrderRoomProvider is required"); return value; }
