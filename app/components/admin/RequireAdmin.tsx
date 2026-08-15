"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getCurrentUser, isAdminUser } from "@/lib/currentUser";

// Client-side gate for the /admin pages. This is a UX guard, not the real
// security boundary — the actual enforcement is server-side via
// requireAuth()/checkAdminAccess() on each admin API route. This just keeps
// viewers (and logged-out visitors) from landing on a page full of 403s.
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (isAdminUser(user)) {
      setAllowed(true);
    } else {
      router.replace("/app");
    }
    setChecked(true);
  }, [router]);

  if (!checked || !allowed) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return <>{children}</>;
}
