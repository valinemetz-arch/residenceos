// The internal app (owner/admin/viewer) stores its JWT in localStorage after
// login (see app/page.tsx), but nothing was attaching it to subsequent API
// calls, so every requireAuth()-gated endpoint (admin user management, trade
// creation, etc.) was silently 401ing. This wrapper is a drop-in replacement
// for fetch() that adds the Authorization header when a token is present.
export function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(input, { ...init, headers });
}
