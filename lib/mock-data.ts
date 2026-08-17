import type { Cafe, Menu, MenuRecommendation, OrderRoom, PreferenceOrder, Team, TeamMember, User } from "@/types";
const seededAt = "2026-08-01T09:00:00";
export const users: User[] = [{ id: "eric", name: "Eric", createdAt: seededAt }, { id: "cheolsu", name: "철수", createdAt: seededAt }, { id: "young", name: "영희", createdAt: seededAt }, { id: "minsu", name: "민수", createdAt: seededAt }, { id: "jisu", name: "지수", createdAt: seededAt }];
export const demoTeam: Team = { id: "team-demo", code: "A7K29D", name: "브루 보드 팀", createdBy: "eric", createdAt: seededAt };
export const teamMembers: TeamMember[] = users.map((user) => ({ teamId: demoTeam.id, userId: user.id, isActive: true, createdAt: seededAt }));
export const cafes: Cafe[] = [{ id: "starbucks", name: "스타벅스", emoji: "☕", color: "bg-emerald-100" }, { id: "hollys", name: "할리스", emoji: "🫘", color: "bg-amber-100" }, { id: "mega", name: "메가커피", emoji: "🥤", color: "bg-sky-100" }];
export const menus: Menu[] = [
  { id: "sb-americano", cafeId: "starbucks", name: "아메리카노", supportedTemperatures: ["HOT", "ICED"] }, { id: "sb-latte", cafeId: "starbucks", name: "카페라떼", supportedTemperatures: ["HOT", "ICED"] }, { id: "sb-dolce", cafeId: "starbucks", name: "돌체라떼", supportedTemperatures: ["ICED"] }, { id: "sb-coldbrew", cafeId: "starbucks", name: "콜드브루", supportedTemperatures: ["ICED"] },
  { id: "hol-americano", cafeId: "hollys", name: "아메리카노", supportedTemperatures: ["HOT", "ICED"] }, { id: "hol-latte", cafeId: "hollys", name: "카페라떼", supportedTemperatures: ["HOT", "ICED"] }, { id: "hol-vanilla", cafeId: "hollys", name: "바닐라딜라이트", supportedTemperatures: ["ICED"] },
  { id: "mega-americano", cafeId: "mega", name: "아이스 아메리카노", supportedTemperatures: ["ICED"] }, { id: "mega-latte", cafeId: "mega", name: "카페라떼", supportedTemperatures: ["HOT", "ICED"] }, { id: "mega-cube", cafeId: "mega", name: "큐브라떼", supportedTemperatures: ["ICED"] },
];
// SELECTED history. Every recommendation lookup filters both userId and cafeId.
export const preferenceHistory: PreferenceOrder[] = [
  { userId: "eric", cafeId: "starbucks", menuId: "sb-dolce", temperature: "ICED", selectedAt: "2026-08-11T12:10:00" }, { userId: "eric", cafeId: "starbucks", menuId: "sb-dolce", temperature: "ICED", selectedAt: "2026-08-12T12:10:00" }, { userId: "eric", cafeId: "starbucks", menuId: "sb-dolce", temperature: "ICED", selectedAt: "2026-08-13T12:10:00" }, { userId: "eric", cafeId: "starbucks", menuId: "sb-coldbrew", temperature: "ICED", selectedAt: "2026-08-14T12:10:00" },
  { userId: "eric", cafeId: "hollys", menuId: "hol-americano", temperature: "ICED", selectedAt: "2026-08-14T12:10:00" }, { userId: "eric", cafeId: "hollys", menuId: "hol-americano", temperature: "ICED", selectedAt: "2026-08-13T12:10:00" },
  { userId: "jisu", cafeId: "starbucks", menuId: "sb-latte", temperature: "ICED", selectedAt: "2026-08-10T12:10:00" }, { userId: "jisu", cafeId: "starbucks", menuId: "sb-latte", temperature: "ICED", selectedAt: "2026-08-12T12:10:00" }, { userId: "jisu", cafeId: "starbucks", menuId: "sb-dolce", temperature: "ICED", selectedAt: "2026-08-14T12:10:00" },
  { userId: "cheolsu", cafeId: "starbucks", menuId: "sb-americano", temperature: "ICED", selectedAt: "2026-08-14T12:10:00" }, { userId: "young", cafeId: "starbucks", menuId: "sb-latte", temperature: "HOT", selectedAt: "2026-08-14T12:10:00" },
];
export function getRecommendations(userId: string, cafeId: string): { frequent: MenuRecommendation | null; recent: MenuRecommendation | null } {
  const grouped = new Map<string, MenuRecommendation>();
  preferenceHistory.filter((item) => item.userId === userId && item.cafeId === cafeId).forEach((item) => { const key = `${item.menuId}-${item.temperature}`; const previous = grouped.get(key); grouped.set(key, { menuId: item.menuId, temperature: item.temperature, orderCount: (previous?.orderCount ?? 0) + 1, lastSelectedAt: !previous || previous.lastSelectedAt < item.selectedAt ? item.selectedAt : previous.lastSelectedAt }); });
  const all = [...grouped.values()];
  return { frequent: all.sort((a, b) => b.orderCount - a.orderCount || b.lastSelectedAt.localeCompare(a.lastSelectedAt))[0] ?? null, recent: all.sort((a, b) => b.lastSelectedAt.localeCompare(a.lastSelectedAt))[0] ?? null };
}
const now = "오늘 13:20";
export const initialRooms: OrderRoom[] = [
  { id: "order-x8m2p1", teamId: demoTeam.id, orderCode: "X8M2P1", name: "Eric 커피 주문", cafeId: "starbucks", createdBy: "eric", deadline: "14:30", status: "OPEN", createdAt: "2026-08-16T12:00:00", orders: [{ userId: "eric", status: "SELECTED", menuId: "sb-dolce", temperature: "ICED", selectedBy: "eric", markedBy: "Eric", updatedAt: now }, { userId: "cheolsu", status: "SELECTED", menuId: "sb-americano", temperature: "ICED", selectedBy: "cheolsu", markedBy: "철수", updatedAt: now }, { userId: "young", status: "ABSENT", menuId: null, temperature: null, selectedBy: null, markedBy: "Eric", updatedAt: now }, { userId: "minsu", status: "SKIP", menuId: null, temperature: null, selectedBy: null, markedBy: "민수", updatedAt: now }, { userId: "jisu", status: "PENDING", menuId: null, temperature: null, selectedBy: null, markedBy: null, updatedAt: now }] },
  { id: "order-h7q4c2", teamId: demoTeam.id, orderCode: "H7Q4C2", name: "철수 오후 커피", cafeId: "hollys", createdBy: "cheolsu", deadline: "16:00", status: "OPEN", createdAt: "2026-08-16T13:00:00", orders: users.map((user) => ({ userId: user.id, status: user.id === "cheolsu" ? "SELECTED" : "PENDING", menuId: user.id === "cheolsu" ? "hol-vanilla" : null, temperature: user.id === "cheolsu" ? "ICED" : null, selectedBy: user.id === "cheolsu" ? "cheolsu" : null, markedBy: user.id === "cheolsu" ? "철수" : null, updatedAt: now })) },
];
