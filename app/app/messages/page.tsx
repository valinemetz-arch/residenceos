export const dynamic = "force-dynamic";

import { getOrCreateHouseProject } from "@/lib/houseProject";
import { PortalHeader } from "@/app/components/portal/PortalHeader";
import ProjectMessaging from "@/app/components/ProjectMessaging";

export default async function MessagesPage() {
  const house = await getOrCreateHouseProject();

  return (
    <div className="classical" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 76px)" }}>
      <PortalHeader projectName={house.name} pageTitle="Messages" phase={house.phase} />
      <div style={{ flex: 1, minHeight: 0 }}>
        <ProjectMessaging projectId={house.id} viewerType="owner" />
      </div>
    </div>
  );
}
