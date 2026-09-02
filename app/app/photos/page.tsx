"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PortalHeader } from "@/app/components/portal/PortalHeader";
import { PhotoPlateGrid } from "@/app/components/portal/PhotoPlateGrid";
import { PhotoUploadButton } from "@/app/components/portal/PhotoUploadButton";

interface Photo {
  id: string;
  url: string;
  caption: string | null;
  space: { id: string; name: string } | null;
}

interface Space {
  id: string;
  name: string;
}

export default function PhotosPage() {
  const [groups, setGroups] = useState<[string, Photo[]][]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [houseName, setHouseName] = useState("Nemetz Residence");
  const [phase, setPhase] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [photosRes, spacesRes, houseRes] = await Promise.all([
      fetch("/api/photos"),
      fetch("/api/spaces"),
      fetch("/api/projects/house"),
    ]);
    const [photosData, spacesData, houseData] = await Promise.all([
      photosRes.json(),
      spacesRes.json(),
      houseRes.json(),
    ]);

    if (photosData.success) {
      const byGroup = new Map<string, Photo[]>();
      for (const photo of photosData.data as Photo[]) {
        const key = photo.space?.name ?? "Unassigned";
        if (!byGroup.has(key)) byGroup.set(key, []);
        byGroup.get(key)!.push(photo);
      }
      setGroups(Array.from(byGroup.entries()));
    }
    if (spacesData.success) setSpaces(spacesData.data);
    if (houseData.success) {
      setHouseName(houseData.data.name);
      setPhase(houseData.data.phase);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="classical">
      <PortalHeader projectName={houseName} pageTitle="Photos" phase={phase} />

      <PhotoUploadButton spaces={spaces} onUploaded={load} />

      {loading ? (
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
            <PhotoPlateGrid
              photos={photos.map((p) => ({ id: p.id, url: p.url, caption: p.caption }))}
            />
          </div>
        ))
      )}
    </div>
  );
}
