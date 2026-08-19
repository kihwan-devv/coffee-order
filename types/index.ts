export type RoomStatus = "OPEN" | "CLOSED";
export type OrderStatus = "PENDING" | "SELECTED" | "SKIP" | "ABSENT";
export type Temperature = "HOT" | "ICED";
export interface TeamMember { id: string; teamId: string; name: string; isActive: boolean; createdAt: string; }
export interface Team { id: string; code: string; name: string; createdBy: string; createdAt: string; }
export interface Cafe { id: string; name: string; emoji: string; color: string; logoUrl: string | null; imageUrl: string | null; officialMenuUrl: string | null; isActive: boolean; sortOrder: number; }
export interface Menu { id: string; cafeId: string; name: string; category: string | null; imageUrl: string | null; supportedTemperatures: Temperature[]; isActive: boolean; sortOrder: number; }
export interface UserOrder { teamMemberId: string; status: OrderStatus; menuId: string | null; temperature: Temperature | null; selectedByMemberId: string | null; markedByMemberId: string | null; updatedAt: string; }
export interface OrderRoom { id: string; teamId: string; orderCode: string; name: string; cafeId: string; createdBy: string; status: RoomStatus; createdAt: string; orders: UserOrder[]; }
export interface PreferenceOrder { userId: string; cafeId: string; menuId: string; temperature: Temperature; selectedAt: string; }
export interface MenuRecommendation { menuId: string; temperature: Temperature; orderCount: number; lastSelectedAt: string; }
