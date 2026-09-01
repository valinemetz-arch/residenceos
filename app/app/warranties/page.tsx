export const dynamic = "force-dynamic";
import { getOrCreateHouseProject } from "@/lib/houseProject";
import { PortalHeader } from "@/app/components/portal/PortalHeader";
import { WarrantyListWithForms } from "../../components/WarrantyListWithForms";

export default async function WarrantiesPage() {
  const house = await getOrCreateHouseProject();

  return (
    <div>
      <PortalHeader projectName={house.name} pageTitle="Warranties" phase={house.phase} />
      <WarrantyListWithForms />
    </div>
  );
}
