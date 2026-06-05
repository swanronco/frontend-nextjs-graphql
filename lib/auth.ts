// lib/auth.ts
const KEY = 'auth.token';
const COOKIE = 'auth_logged=1; path=/; SameSite=Lax';
const COOKIE_CLEAR = 'auth_logged=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem(KEY); } catch { return null; }
}
export function setToken(token: string) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(KEY, token); document.cookie = COOKIE; } catch {}
}
export function clearToken() {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(KEY); document.cookie = COOKIE_CLEAR; } catch {}
}
export function isLoggedFromCookie(): boolean {
  if (typeof window === 'undefined') return false;
  return document.cookie.split(';').some(c => c.trim().startsWith('auth_logged=1'));
}
