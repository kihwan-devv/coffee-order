"use client";
import { useState } from "react";

export function ShareOrderActions({ title = "커피 주문", path }: { title?: string; path?: string }) {
  const [copied, setCopied] = useState(false);
  const url = () => `${window.location.origin}${path ?? window.location.pathname}`;
  const copy = async () => {
    await navigator.clipboard?.writeText(url());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  const share = async () => {
    if (navigator.share) await navigator.share({ title, text: title, url: url() });
    else await copy();
  };
  return <div className="mt-3 flex gap-2"><button onClick={copy} className="rounded-xl bg-stone-100 px-3 py-2 text-xs font-bold text-stone-600">{copied ? "링크 복사됨" : "링크 복사"}</button><button onClick={share} className="rounded-xl bg-stone-100 px-3 py-2 text-xs font-bold text-stone-600">공유하기</button></div>;
}
