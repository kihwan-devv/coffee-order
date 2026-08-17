"use client";
import { use } from "react";
import { NewOrderPage } from "@/components/new-order-page";
export default function Page({ params }: { params: Promise<{ teamCode: string }> }) { const { teamCode } = use(params); return <NewOrderPage teamCode={teamCode} />; }
