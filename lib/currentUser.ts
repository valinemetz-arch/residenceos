// Reads the logged-in internal user (owner/admin/viewer) that app/page.tsx
// stores in localStorage at login. Client-side only — used to decide what
// to show in nav and to gate the /admin pages. This is a UX convenience,
// not a security boundary: the real enforcement happens server-side via
// requireAuth()/checkAdminAccess() in lib/auth.ts.
export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export function getCurrentUser(): CurrentUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CurrentUser;
  } catch {
    return null;
  }
}

export function isAdminUser(user: CurrentUser | null): boolean {
  return !!user && (user.role === "owner" || user.role === "admin");
}
