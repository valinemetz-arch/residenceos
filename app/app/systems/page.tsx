export const dynamic = "force-dynamic";
import { getOrCreateHouseProject } from "@/lib/houseProject";
import { PortalHeader } from "@/app/components/portal/PortalHeader";
import { SystemListWithForms } from "@/app/components/SystemListWithForms";

export default async function SystemsPage() {
  const house = await getOrCreateHouseProject();

  return (
    <div>
      <PortalHeader projectName={house.name} pageTitle="Systems" phase={house.phase} />
      <SystemListWithForms />
    </div>
  );
}
