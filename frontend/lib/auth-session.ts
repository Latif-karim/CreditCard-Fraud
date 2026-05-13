export const AUTH_CHANGED_EVENT = "fraudshield-auth-changed";

export function emitAuthChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function setClientSession(accessToken: string, role: string): void {
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("role", role);
  emitAuthChanged();
}

export function clearClientSession(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("role");
  emitAuthChanged();
}
