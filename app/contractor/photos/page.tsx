"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PortalShell } from "@/app/components/portal/PortalShell";
import { PortalHeader } from "@/app/components/portal/PortalHeader";
import { PhotoPlateGrid } from "@/app/components/portal/PhotoPlateGrid";
import { useContractorAuth } from "@/app/components/portal/useContractorAuth";

interface Photo {
  id: string;
  url: string;
  caption: string | null;
  space: { id: string; name: string } | null;
}

export default function ContractorPhotosPage() {
  const { loading: authLoading, contractor, tradeNames } = useContractorAuth();
  const [groups, setGroups] = useState<[string, Photo[]][]>([]);
  const [houseName, setHouseName] = useState("Nemetz Residence");
  const [phase, setPhase] = useState<string | null>(null);
  const [loadingPhotos, setLoadingPhotos] = useState(true);

  useEffect(() => {
    if (authLoading || !contractor) return;
    (async () => {
      const [photosRes, houseRes] = await Promise.all([
        fetch("/api/photos"),
        fetch("/api/projects/house"),
      ]);
      const photosData = await photosRes.json();
      const houseData = await houseRes.json();

      if (photosData.success) {
        const byGroup = new Map<string, Photo[]>();
        for (const photo of photosData.data as Photo[]) {
          const key = photo.space?.name ?? "Unassigned";
          if (!byGroup.has(key)) byGroup.set(key, []);
          byGroup.get(key)!.push(photo);
        }
        setGroups(Array.from(byGroup.entries()));
      }
      if (houseData.success) {
        setHouseName(houseData.data.name);
        setPhase(houseData.data.phase);
      }
      setLoadingPhotos(false);
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
      <PortalHeader projectName={houseName} pageTitle="Photos" phase={phase} />

      {loadingPhotos ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <p className="card-meta">No photos yet.</p>
      ) : (
        groups.map(([spaceName, photos]) => (
          <div key={spaceName} style={{ marginBottom: 26 }}>
            <div
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--color-accent-700)",
                marginBottom: 10,
              }}
            >
              {spaceName}
            </div>
            <PhotoPlateGrid photos={photos.map((p) => ({ id: p.id, url: p.url, caption: p.caption }))} />
          </div>
        ))
      )}
    </PortalShell>
  );
}
