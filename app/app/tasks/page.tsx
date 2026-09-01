export const dynamic = "force-dynamic";
import { getOrCreateHouseProject } from "@/lib/houseProject";
import { PortalHeader } from "@/app/components/portal/PortalHeader";
import { TaskListWithForms } from "../../components/TaskListWithForms";

export default async function TasksPage() {
  const house = await getOrCreateHouseProject();

  return (
    <div>
      <PortalHeader projectName={house.name} pageTitle="Tasks" phase={house.phase} />
      <TaskListWithForms />
    </div>
  );
}
