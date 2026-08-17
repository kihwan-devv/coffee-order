export type RoomStatus = "OPEN" | "CLOSED";
export type OrderStatus = "PENDING" | "SELECTED" | "SKIP" | "ABSENT";
export type Temperature = "HOT" | "ICED";
export interface User { id: string; name: string; createdAt: string; }
export interface Team { id: string; code: string; name: string; createdBy: string; createdAt: string; }
export interface TeamMember { teamId: string; userId: string; isActive: boolean; createdAt: string; }
export interface Cafe { id: string; name: string; emoji: string; color: string; }
export interface Menu { id: string; cafeId: string; name: string; supportedTemperatures: Temperature[]; }
// Future DB mapping: userId = order target, selectedBy = person who selected it.
export interface UserOrder { userId: string; status: OrderStatus; menuId: string | null; temperature: Temperature | null; selectedBy: string | null; markedBy: string | null; updatedAt: string; }
export interface OrderRoom { id: string; teamId: string; orderCode: string; name: string; cafeId: string; createdBy: string; deadline: string; status: RoomStatus; createdAt: string; orders: UserOrder[]; }
export interface PreferenceOrder { userId: string; cafeId: string; menuId: string; temperature: Temperature; selectedAt: string; }
export interface MenuRecommendation { menuId: string; temperature: Temperature; orderCount: number; lastSelectedAt: string; }
