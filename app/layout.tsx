import type { Metadata } from "next";
import "./globals.css";
import { AppVersionGuard } from "@/components/app-version-guard";
import { OrderRoomProvider } from "@/components/order-room-provider";
export const metadata: Metadata = { title: "allAtOnce", description: "팀 커피 공동주문 서비스" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ko"><body><AppVersionGuard /><OrderRoomProvider>{children}</OrderRoomProvider></body></html>; }
