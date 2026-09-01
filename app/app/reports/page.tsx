export const dynamic = "force-dynamic";
import { getOrCreateHouseProject } from "@/lib/houseProject";
import { PortalHeader } from "@/app/components/portal/PortalHeader";
import { ReportBuilder } from "@/app/components/ReportBuilder";

export default async function ReportsPage() {
  const house = await getOrCreateHouseProject();

  return (
    <div>
      <PortalHeader projectName={house.name} pageTitle="Reports" phase={house.phase} />
      <ReportBuilder />
    </div>
  );
}
