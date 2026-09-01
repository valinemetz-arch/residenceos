export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getOrCreateHouseProject } from "@/lib/houseProject";
import { PortalHeader } from "@/app/components/portal/PortalHeader";
import { PhotoPlateGrid } from "@/app/components/portal/PhotoPlateGrid";

export default async function PhotosPage() {
  const [house, photos] = await Promise.all([
    getOrCreateHouseProject(),
    prisma.photo.findMany({
      include: { space: { select: { id: true, name: true } } },
      orderBy: { takeDate: "desc" },
    }),
  ]);

  const groups = new Map<string, typeof photos>();
  for (const photo of photos) {
    const key = photo.space?.name ?? "Unassigned";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(photo);
  }

  return (
    <div className="classical">
      <PortalHeader projectName={house.name} pageTitle="Photos" phase={house.phase} />

      {groups.size === 0 ? (
        <p className="card-meta">No photos yet.</p>
      ) : (
        Array.from(groups.entries()).map(([spaceName, spacePhotos]) => (
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
              photos={spacePhotos.map((p) => ({ id: p.id, url: p.url, caption: p.caption }))}
            />
          </div>
        ))
      )}
    </div>
  );
}
