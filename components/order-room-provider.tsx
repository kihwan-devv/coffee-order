"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  cafes as initialCafes,
  demoTeam,
  initialRooms,
  menus as initialMenus,
  teamMembers as initialMembers,
  users as initialUsers,
} from "@/lib/mock-data";
import type { Cafe, Menu, OrderRoom, OrderStatus, Team, TeamMember, Temperature, User } from "@/types";

const userKey = (teamCode: string) => `coffee-order/current-user-id:${teamCode}`;
const prototypeKey = "coffee-order/prototype-teams";
const code = () => Math.random().toString(36).slice(2, 8).toUpperCase();

type Context = {
  currentUser: User | null;
  ready: boolean;
  users: User[];
  teams: Team[];
  members: TeamMember[];
  rooms: OrderRoom[];
  cafes: Cafe[];
  menus: Menu[];
  activateTeam: (teamCode: string) => void;
  selectUser: (userId: string, teamCode: string) => void;
  clearUser: (teamCode?: string) => void;
  createTeam: (name: string, memberNames: string[], creatorName: string) => string;
  getTeamMembers: (teamId: string) => User[];
  createRoom: (teamId: string, name: string, cafeId: string, deadline: string) => string;
  updateOrder: (roomId: string, userId: string, status: OrderStatus, selection?: { menuId: string; temperature: Temperature }) => void;
  toggleRoom: (roomId: string) => void;
  addCafe: (name: string, officialMenuUrl?: string) => Cafe;
  addMenu: (cafeId: string, name: string, supportedTemperatures: Temperature[]) => Menu;
};

const OrderContext = createContext<Context | null>(null);

export function OrderRoomProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [teams, setTeams] = useState<Team[]>([demoTeam]);
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [rooms, setRooms] = useState<OrderRoom[]>(initialRooms);
  const [cafes, setCafes] = useState<Cafe[]>(initialCafes);
  const [menus, setMenus] = useState<Menu[]>(initialMenus);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.sessionStorage.getItem(prototypeKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<{ users: User[]; teams: Team[]; members: TeamMember[]; rooms: OrderRoom[]; cafes: Cafe[]; menus: Menu[] }>;
        if (parsed.users) setUsers(parsed.users);
        if (parsed.teams) setTeams(parsed.teams);
        if (parsed.members) setMembers(parsed.members);
        if (parsed.rooms) setRooms(parsed.rooms);
        if (parsed.cafes) setCafes(parsed.cafes);
        if (parsed.menus) setMenus(parsed.menus);
      } catch {
        window.sessionStorage.removeItem(prototypeKey);
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.sessionStorage.setItem(prototypeKey, JSON.stringify({ users, teams, members, rooms, cafes, menus }));
  }, [cafes, members, menus, ready, rooms, teams, users]);

  const value = useMemo<Context>(() => ({
    currentUser, ready, users, teams, members, rooms, cafes, menus,
    activateTeam: (teamCode) => {
      const id = window.localStorage.getItem(userKey(teamCode));
      setCurrentUser(users.find((user) => user.id === id) ?? null);
    },
    selectUser: (userId, teamCode) => {
      const user = users.find((item) => item.id === userId) ?? null;
      if (user) window.localStorage.setItem(userKey(teamCode), userId);
      setCurrentUser(user);
    },
    clearUser: (teamCode) => {
      if (teamCode) window.localStorage.removeItem(userKey(teamCode));
      setCurrentUser(null);
    },
    createTeam: (name, memberNames, creatorName) => {
      let teamCode = code();
      while (teams.some((team) => team.code === teamCode)) teamCode = code();
      const teamId = `team-${teamCode.toLowerCase()}`;
      const createdAt = new Date().toISOString();
      const newUsers = memberNames.map((memberName, index) => ({ id: `user-${teamCode.toLowerCase()}-${index}`, name: memberName, createdAt }));
      const creator = newUsers.find((user) => user.name === creatorName)!;
      const nextUsers = [...users, ...newUsers];
      const nextTeams = [...teams, { id: teamId, code: teamCode, name, createdBy: creator.id, createdAt }];
      const nextMembers = [...members, ...newUsers.map((user) => ({ teamId, userId: user.id, isActive: true, createdAt }))];
      // The creation page immediately navigates to the new team URL, so save first.
      window.sessionStorage.setItem(prototypeKey, JSON.stringify({ users: nextUsers, teams: nextTeams, members: nextMembers, rooms, cafes, menus }));
      setUsers(nextUsers);
      setTeams(nextTeams);
      setMembers(nextMembers);
      window.localStorage.setItem(userKey(teamCode), creator.id);
      setCurrentUser(creator);
      return teamCode;
    },
    getTeamMembers: (teamId) => members.filter((member) => member.teamId === teamId && member.isActive).map((member) => users.find((user) => user.id === member.userId)).filter((user): user is User => Boolean(user)),
    createRoom: (teamId, name, cafeId, deadline) => {
      const orderCode = code();
      const activeUsers = members.filter((member) => member.teamId === teamId && member.isActive).map((member) => users.find((user) => user.id === member.userId)).filter((user): user is User => Boolean(user));
      setRooms((previous) => [{
        id: `order-${orderCode.toLowerCase()}`,
        teamId, orderCode, name, cafeId, deadline, status: "OPEN",
        createdBy: currentUser?.id ?? activeUsers[0]?.id ?? "",
        createdAt: new Date().toISOString(),
        orders: activeUsers.map((user) => ({ userId: user.id, status: "PENDING", menuId: null, temperature: null, selectedBy: null, markedBy: null, updatedAt: "방금 전" })),
      }, ...previous]);
      return orderCode;
    },
    updateOrder: (roomId, userId, status, selection) => setRooms((previous) => previous.map((room) => room.id !== roomId ? room : {
      ...room,
      orders: room.orders.map((order) => order.userId !== userId ? order : {
        ...order,
        status,
        menuId: status === "SELECTED" ? selection?.menuId ?? null : null,
        temperature: status === "SELECTED" ? selection?.temperature ?? null : null,
        selectedBy: status === "SELECTED" ? currentUser?.id ?? null : null,
        markedBy: currentUser?.name ?? null,
        updatedAt: "방금 전",
      }),
    })),
    toggleRoom: (roomId) => setRooms((previous) => previous.map((room) => room.id === roomId ? { ...room, status: room.status === "OPEN" ? "CLOSED" : "OPEN" } : room)),
    addCafe: (name) => {
      const cafe: Cafe = { id: `cafe-${Date.now()}`, name, emoji: "☕", color: "bg-amber-100" };
      setCafes((previous) => [...previous, cafe]);
      return cafe;
    },
    addMenu: (cafeId, name, supportedTemperatures) => {
      const menu: Menu = { id: `menu-${Date.now()}`, cafeId, name, supportedTemperatures };
      setMenus((previous) => [...previous, menu]);
      return menu;
    },
  }), [cafes, currentUser, members, menus, ready, rooms, teams, users]);

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrderRooms() {
  const context = useContext(OrderContext);
  if (!context) throw new Error("OrderRoomProvider is required");
  return context;
}
