export const dynamic = "force-dynamic";
import Link from "next/link";
import { getOrCreateHouseProject } from "@/lib/houseProject";
import { prisma } from "@/lib/prisma";
import { PortalHeader } from "@/app/components/portal/PortalHeader";
import { ReferenceExplorer } from "@/app/components/reference/ReferenceExplorer";

export default async function ReferencePage() {
  const house = await getOrCreateHouseProject();
  const trades = await prisma.trade.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <PortalHeader projectName={house.name} pageTitle="Field Reference" phase={house.phase} />
        <Link href="/app/reference/upload" className="btn btn-secondary" style={{ flexShrink: 0, marginTop: 4 }}>
          Upload Spec / Elevation Sheet
        </Link>
      </div>

      <ReferenceExplorer trades={trades} />
    </div>
  );
}
