import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

let sessionPromise: Promise<Session> | null = null;

async function initializeSession(): Promise<Session> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("[Supabase auth.getSession]", error);
    throw error;
  }
  if (data.session?.access_token) return data.session;

  const result = await supabase.auth.signInAnonymously();
  if (result.error) {
    console.error("[Supabase auth.signInAnonymously]", result.error);
    throw result.error;
  }
  if (!result.data.session?.access_token) {
    const missingSession = new Error("익명 로그인은 완료됐지만 유효한 session/access_token이 없습니다.");
    console.error("[Supabase auth.signInAnonymously]", missingSession);
    throw missingSession;
  }
  return result.data.session;
}

export function ensureAnonymousSession() {
  if (!sessionPromise) {
    sessionPromise = initializeSession().catch((error) => {
      sessionPromise = null;
      throw error;
    });
  }
  return sessionPromise;
}

export function resetSessionInitialization() {
  sessionPromise = null;
}
