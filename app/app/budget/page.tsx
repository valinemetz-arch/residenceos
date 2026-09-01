export const dynamic = "force-dynamic";
import { getOrCreateHouseProject } from "@/lib/houseProject";
import { PortalHeader } from "@/app/components/portal/PortalHeader";
import { BudgetListWithForms } from "../../components/BudgetListWithForms";

export default async function BudgetPage() {
  const house = await getOrCreateHouseProject();

  return (
    <div>
      <PortalHeader projectName={house.name} pageTitle="Budget" phase={house.phase} />
      <BudgetListWithForms />
    </div>
  );
}
