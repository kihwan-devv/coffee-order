"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ensureAnonymousSession } from "@/lib/data/auth";
import { createCafe, createMenu, listCafesAndMenus } from "@/lib/data/cafes";
import { closeOrder, createOrder, deleteOrder, listOrders, updateResponse } from "@/lib/data/orders";
import { addMemberToOpenOrders, addTeamMember, createTeam as createTeamRpc, getTeamLanding, TeamNotFoundError } from "@/lib/data/teams";
import { clearTeamMemberId, loadTeamMemberId, saveTeamMemberId } from "@/lib/data/team-member-storage";
import { createClient } from "@/lib/supabase/client";
import type { Cafe, Menu, OrderRoom, OrderStatus, Team, TeamMember, Temperature } from "@/types";

export type TeamLoadStatus = "idle" | "authenticating" | "loading-team" | "ready" | "not-found" | "joining" | "error";
type Context = {
  currentUser: TeamMember | null;
  memberJoinPending: boolean;
  ready: boolean;
  loading: boolean;
  error: string | null;
  teamLoadStatus: TeamLoadStatus;
  users: TeamMember[];
  teams: Team[];
  rooms: OrderRoom[];
  cafes: Cafe[];
  menus: Menu[];
  activateTeam: (code: string) => Promise<void>;
  selectUser: (id: string, code: string) => Promise<void>;
  addUser: (code: string, name: string) => Promise<{ id: string; hasOpenOrders: boolean }>;
  finishAddingUser: (id: string, includeOpenOrders: boolean) => Promise<void>;
  clearUser: () => void;
  createTeam: (name: string, creator: string) => Promise<string>;
  getTeamMembers: (id: string) => TeamMember[];
  createRoom: (teamId: string, name: string, cafeId: string) => Promise<string>;
  deleteRoom: (id: string) => Promise<void>;
  updateOrder: (roomId: string, userId: string, status: OrderStatus, selection?: { menuId: string; temperature: Temperature }) => Promise<void>;
  toggleRoom: (id: string) => Promise<void>;
  addCafe: (name: string, url?: string) => Promise<Cafe>;
  addMenu: (cafeId: string, name: string, temperatures: Temperature[]) => Promise<Menu>;
};

const OrderContext = createContext<Context | null>(null);

function errorMessage(value: unknown) {
  if (value instanceof Error) return value.message;
  if (value && typeof value === "object" && "message" in value) return String(value.message);
  return "요청을 처리하지 못했습니다.";
}

export function OrderRoomProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<TeamMember[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [rooms, setRooms] = useState<OrderRoom[]>([]);
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamLoadStatus, setTeamLoadStatus] = useState<TeamLoadStatus>("idle");
  const [memberJoinPending, setMemberJoinPending] = useState(false);
  const ordersRequestId = useRef(0);
  const fail = useCallback((value: unknown) => { const message = errorMessage(value); setError(message); return message; }, []);

  const refreshOrders = useCallback(async (teamId: string) => {
    const requestId = ++ordersRequestId.current;
    const nextRooms = await listOrders(teamId);
    if (requestId === ordersRequestId.current) setRooms(nextRooms);
    return nextRooms;
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await ensureAnonymousSession();
        const data = await listCafesAndMenus();
        setCafes(data.cafes);
        setMenus(data.menus);
      } catch (value) {
        console.error("[Supabase initialization]", value);
        fail(value);
      } finally {
        setReady(true);
      }
    })();
  }, [fail]);

  const activateTeam = useCallback(async (code: string) => {
    setError(null);
    setTeamLoadStatus("authenticating");
    try {
      await ensureAnonymousSession();
      setTeamLoadStatus("loading-team");
      const landing = await getTeamLanding(code);
      const [nextRooms, cafeData] = await Promise.all([listOrders(landing.team.id), listCafesAndMenus()]);
      const storedMemberId = loadTeamMemberId(landing.team.code);
      const member = storedMemberId ? landing.members.find((item) => item.id === storedMemberId && item.isActive) ?? null : null;
      if (storedMemberId && !member) clearTeamMemberId(landing.team.code);
      ordersRequestId.current += 1;
      setTeams([landing.team]);
      setUsers(landing.members);
      setRooms(nextRooms);
      setCurrentUser(member);
      setCafes(cafeData.cafes);
      setMenus(cafeData.menus);
      setMemberJoinPending(false);
      setTeamLoadStatus("ready");
    } catch (value) {
      setTeams([]);
      setUsers([]);
      setRooms([]);
      setCurrentUser(null);
      if (value instanceof TeamNotFoundError) { setError(null); setTeamLoadStatus("not-found"); }
      else { console.error("[Team activation]", value); fail(value); setTeamLoadStatus("error"); }
    }
  }, [fail]);

  const reload = useCallback(async (roomId: string) => {
    const found = rooms.find((item) => item.id === roomId);
    if (found) await refreshOrders(found.teamId);
  }, [refreshOrders, rooms]);

  useEffect(() => {
    const teamId = teams[0]?.id;
    if (!teamId) return;
    const channel = createClient().channel(`responses:${teamId}`).on("postgres_changes", { event: "*", schema: "public", table: "order_responses" }, () => { void refreshOrders(teamId).catch(fail); }).subscribe();
    return () => { void createClient().removeChannel(channel); };
  }, [fail, refreshOrders, teams]);

  const value = useMemo<Context>(() => ({
    currentUser, memberJoinPending, ready,
    loading: teamLoadStatus === "authenticating" || teamLoadStatus === "loading-team" || teamLoadStatus === "joining",
    error, teamLoadStatus, users, teams, rooms, cafes, menus, activateTeam,
    selectUser: async (id, code) => {
      const member = users.find((item) => item.id === id && item.isActive);
      if (!member) throw new Error("현재 팀에서 선택한 팀원을 찾을 수 없습니다.");
      saveTeamMemberId(code, member.id);
      setCurrentUser(member);
      setTeamLoadStatus("ready");
      const teamId = teams.find((item) => item.code === code)?.id;
      if (teamId) await refreshOrders(teamId);
    },
    addUser: async (code, name) => {
      setError(null);
      await ensureAnonymousSession();
      const result = await addTeamMember(code, name);
      const member: TeamMember = { id: result.teamMemberId, teamId: result.teamId, name, isActive: true, createdAt: new Date().toISOString() };
      saveTeamMemberId(code, member.id);
      setCurrentUser(member);
      setMemberJoinPending(true);
      setUsers((items) => [...items, member]);
      const nextRooms = await refreshOrders(result.teamId);
      return { id: member.id, hasOpenOrders: nextRooms.some((room) => room.status === "OPEN") };
    },
    finishAddingUser: async (id, includeOpenOrders) => {
      if (includeOpenOrders) await addMemberToOpenOrders(id);
      const team = teams[0];
      if (!team) throw new Error("현재 팀을 찾을 수 없습니다.");
      const landing = await getTeamLanding(team.code);
      const member = landing.members.find((item) => item.id === id) ?? null;
      if (!member) { clearTeamMemberId(team.code); throw new Error("추가한 팀원을 찾을 수 없습니다."); }
      saveTeamMemberId(team.code, member.id);
      setCurrentUser(member);
      setTeams([landing.team]);
      setUsers(landing.members);
      await refreshOrders(team.id);
      setMemberJoinPending(false);
      setTeamLoadStatus("ready");
    },
    clearUser: () => {
      const teamCode = teams[0]?.code;
      if (teamCode) clearTeamMemberId(teamCode);
      setCurrentUser(null);
    },
    createTeam: async (name, creator) => {
      await ensureAnonymousSession();
      const result = await createTeamRpc(name, creator);
      saveTeamMemberId(result.teamCode, result.teamMemberId);
      await activateTeam(result.teamCode);
      return result.teamCode;
    },
    getTeamMembers: () => users,
    createRoom: async (teamId, name, cafeId) => {
      if (!currentUser || currentUser.teamId !== teamId) throw new Error("현재 팀 사용자를 확인할 수 없습니다.");
      const result = await createOrder({ teamId, title: name, cafeId, currentMemberId: currentUser.id });
      return result.orderCode;
    },
    deleteRoom: async (id) => { await deleteOrder(id); setRooms((items) => items.filter((item) => item.id !== id)); },
    updateOrder: async (roomId, userId, status, selection) => {
      if (!currentUser) throw new Error("현재 팀 사용자를 확인할 수 없습니다.");
      await updateResponse(roomId, userId, currentUser.id, status, selection);
      const teamId = rooms.find((room) => room.id === roomId)?.teamId;
      if (teamId) await refreshOrders(teamId);
    },
    toggleRoom: async (id) => { try { await closeOrder(id); await reload(id); } catch (value) { fail(value); } },
    addCafe: async (name, url) => { const item = await createCafe(name, url); setCafes((all) => [...all, item]); return item; },
    addMenu: async (cafeId, name, temperatures) => { const item = await createMenu(cafeId, name, temperatures); setMenus((all) => [...all, item]); return item; },
  }), [activateTeam, cafes, currentUser, error, fail, memberJoinPending, menus, ready, refreshOrders, reload, rooms, teamLoadStatus, teams, users]);

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrderRooms() {
  const value = useContext(OrderContext);
  if (!value) throw new Error("OrderRoomProvider is required");
  return value;
}
