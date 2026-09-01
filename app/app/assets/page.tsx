export const dynamic = "force-dynamic";
import { getOrCreateHouseProject } from "@/lib/houseProject";
import { PortalHeader } from "@/app/components/portal/PortalHeader";
import { AssetListWithForms } from "../../components/AssetListWithForms";

export default async function AssetsPage() {
  const house = await getOrCreateHouseProject();

  return (
    <div>
      <PortalHeader projectName={house.name} pageTitle="Assets" phase={house.phase} />
      <AssetListWithForms />
    </div>
  );
}
