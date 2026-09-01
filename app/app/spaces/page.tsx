export const dynamic = "force-dynamic";
import { getOrCreateHouseProject } from "@/lib/houseProject";
import { PortalHeader } from "@/app/components/portal/PortalHeader";
import { SpaceListWithForms } from "../../components/SpaceListWithForms";

export default async function SpacesPage() {
  const house = await getOrCreateHouseProject();

  return (
    <div>
      <PortalHeader projectName={house.name} pageTitle="Spaces" phase={house.phase} />
      <SpaceListWithForms />
    </div>
  );
}
