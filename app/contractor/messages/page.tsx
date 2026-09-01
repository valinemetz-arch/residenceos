"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PortalShell } from "@/app/components/portal/PortalShell";
import { PortalHeader } from "@/app/components/portal/PortalHeader";
import { useContractorAuth } from "@/app/components/portal/useContractorAuth";
import ProjectMessaging from "@/app/components/ProjectMessaging";

export default function ContractorMessagesPage() {
  const { loading: authLoading, contractor, tradeNames } = useContractorAuth();
  const [houseId, setHouseId] = useState<string | null>(null);
  const [houseName, setHouseName] = useState("Nemetz Residence");
  const [phase, setPhase] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !contractor) return;
    (async () => {
      const res = await fetch("/api/projects/house");
      const data = await res.json();
      if (data.success) {
        setHouseId(data.data.id);
        setHouseName(data.data.name);
        setPhase(data.data.phase);
      }
    })();
  }, [authLoading, contractor]);

  if (authLoading || !contractor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <PortalShell role="contractor" identityName={contractor.companyName} trade={tradeNames.join(", ")}>
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 76px)" }}>
        <PortalHeader projectName={houseName} pageTitle="Messages" phase={phase} />
        <div style={{ flex: 1, minHeight: 0 }}>
          {houseId ? (
            <ProjectMessaging projectId={houseId} viewerType="contractor" contractorId={contractor.id} />
          ) : (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
        </div>
      </div>
    </PortalShell>
  );
}
