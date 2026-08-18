import type { Metadata } from "next";
import "./globals.css";
import { AppVersionGuard } from "@/components/app-version-guard";
import { OrderRoomProvider } from "@/components/order-room-provider";
export const metadata: Metadata = { title: "Brew Board", description: "사내용 커피 공동주문 프로토타입" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ko"><body><AppVersionGuard /><OrderRoomProvider>{children}</OrderRoomProvider></body></html>; }
