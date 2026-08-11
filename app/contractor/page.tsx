"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import ContractorDashboard from "@/app/components/contractor/ContractorDashboard";

export default function ContractorPortal() {
  const [loading, setLoading] = useState(true);
  const [contractor, setContractor] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if contractor is authenticated
        const response = await fetch("/api/auth/contractor/me");
        if (response.ok) {
          const data = await response.json();
          setContractor(data.data);

          // Track portal access time for reminders
          await fetch("/api/contractor/track-access", { method: "POST" }).catch(
            () => {
              /* Silent fail - don't block if tracking fails */
            }
          );
        } else {
          // Redirect to contractor login
          window.location.href = "/contractor/login";
        }
      } catch (error) {
        console.error(error);
        window.location.href = "/contractor/login";
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!contractor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <ContractorDashboard contractor={contractor} />
    </div>
  );
}
