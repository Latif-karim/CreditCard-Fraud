import { SESSION_COOKIE_NAME } from "./session-constants";

export { SESSION_COOKIE_NAME } from "./session-constants";

export const AUTH_CHANGED_EVENT = "fraudshield-auth-changed";

const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function writeSessionPresenceCookie(present: boolean): void {
  if (typeof document === "undefined") return;
  if (present) {
    document.cookie = `${SESSION_COOKIE_NAME}=1; Path=/; Max-Age=${SESSION_COOKIE_MAX_AGE}; SameSite=Lax`;
  } else {
    document.cookie = `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
  }
}

export function emitAuthChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

/** Sync cookie with localStorage; clear cookie when token is missing or too short. */
export function mirrorSessionCookieFromStorage(): void {
  if (typeof window === "undefined") return;
  const token = localStorage.getItem("access_token") || "";
  writeSessionPresenceCookie(token.length > 20);
}

export function setClientSession(accessToken: string, role: string, userId?: number): void {
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("role", role);
  if (userId != null) {
    localStorage.setItem("user_id", String(userId));
  }
  writeSessionPresenceCookie(true);
  emitAuthChanged();
}

export function clearClientSession(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("role");
  localStorage.removeItem("user_id");
  writeSessionPresenceCookie(false);
  emitAuthChanged();
}

export function getClientUserId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user_id");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
