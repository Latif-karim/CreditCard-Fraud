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

/** Sync cookie with localStorage (e.g. legacy tab had token before cookie existed). */
export function mirrorSessionCookieFromStorage(): void {
  if (typeof window === "undefined") return;
  writeSessionPresenceCookie(Boolean(localStorage.getItem("access_token")));
}

export function setClientSession(accessToken: string, role: string): void {
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("role", role);
  writeSessionPresenceCookie(true);
  emitAuthChanged();
}

export function clearClientSession(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("role");
  writeSessionPresenceCookie(false);
  emitAuthChanged();
}
