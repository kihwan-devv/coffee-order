"use client";
import { useState } from "react";
import { Check, Link as LinkIcon, Share2 } from "lucide-react";

export function ShareOrderActions({ title = "커피 주문", path, compact = false }: { title?: string; path?: string; compact?: boolean }) {
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
  if (compact) return <button type="button" onClick={() => void share()} aria-label="주문 공유" title={copied ? "링크 복사됨" : "주문 공유"} className="grid size-11 place-items-center rounded-full bg-white/80 text-stone-700 transition hover:bg-white active:scale-95">{copied ? <Check size={18} /> : <Share2 size={18} />}</button>;
  return <div className="mt-3 flex gap-2"><button type="button" onClick={() => void copy()} className="flex min-h-11 items-center gap-2 rounded-xl bg-stone-100 px-3 text-xs font-bold text-stone-600 transition hover:bg-stone-200 active:scale-95">{copied ? <Check size={15} /> : <LinkIcon size={15} />}{copied ? "링크 복사됨" : "링크 복사"}</button><button type="button" onClick={() => void share()} className="flex min-h-11 items-center gap-2 rounded-xl bg-stone-100 px-3 text-xs font-bold text-stone-600 transition hover:bg-stone-200 active:scale-95"><Share2 size={15} />공유하기</button></div>;
}
