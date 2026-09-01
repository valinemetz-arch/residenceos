import { prisma } from "@/lib/prisma";
import { getOrCreateHouseProject } from "@/lib/houseProject";
import { PortalHeader } from "@/app/components/portal/PortalHeader";
import { OverviewRecentTasks } from "@/app/components/portal/OverviewRecentTasks";

const taskInclude = {
  space: { select: { id: true, name: true } },
  system: { select: { id: true, name: true } },
  assignedToUser: { select: { id: true, name: true, email: true, role: true } },
  assignedToContractor: {
    select: { id: true, companyName: true, contactName: true, email: true },
  },
} as const;

async function getOverviewData() {
  const [openTaskCount, urgentCount, documentCount, photoCount, recentTasks, houseProject] =
    await Promise.all([
      prisma.task.count({ where: { status: { not: "completed" } } }),
      prisma.task.count({
        where: { status: { not: "completed" }, priority: { in: ["high", "critical"] } },
      }),
      prisma.document.count(),
      prisma.photo.count(),
      prisma.task.findMany({
        orderBy: { createdAt: "desc" },
        take: 4,
        include: taskInclude,
      }),
      getOrCreateHouseProject().then((house) =>
        prisma.project.findUnique({
          where: { id: house.id },
          include: { contacts: { orderBy: { order: "asc" }, take: 2 } },
        })
      ),
    ]);

  return { openTaskCount, urgentCount, documentCount, photoCount, recentTasks, houseProject };
}

export async function Dashboard() {
  const { openTaskCount, urgentCount, documentCount, photoCount, recentTasks, houseProject } =
    await getOverviewData();

  // Client components expect the same JSON-serialized shape the API routes
  // return (dates as ISO strings), not raw Prisma Date objects.
  const serializedTasks = recentTasks.map((t) => ({
    ...t,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    completedDate: t.completedDate ? t.completedDate.toISOString() : null,
    assignedAt: t.assignedAt ? t.assignedAt.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  return (
    <div>
      <PortalHeader
        projectName={houseProject?.name ?? "Nemetz Residence"}
        pageTitle="Overview"
        phase={houseProject?.phase}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 30 }}>
        <StatCard value={openTaskCount} label="Open Tasks" />
        <StatCard value={urgentCount} label="Urgent" />
        <StatCard value={documentCount} label="Documents" />
        <StatCard value={photoCount} label="Photos" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24 }}>
        <div>
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>Recent tasks</h2>
          <OverviewRecentTasks initialTasks={serializedTasks} canAct={false} />
        </div>
        <div>
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>Site Info</h2>
          {houseProject?.gateCode && (
            <div className="card" style={{ marginBottom: 14 }}>
              <div className="card-kicker">Gate Code</div>
              <div className="card-title" style={{ fontSize: 24, marginTop: 4 }}>
                {houseProject.gateCode}
              </div>
            </div>
          )}
          {houseProject?.contacts && houseProject.contacts.length > 0 && (
            <div className="card">
              <div className="card-kicker">Contacts</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                {houseProject.contacts.map((c) => (
                  <div key={c.id}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
                    <div className="card-meta">
                      {c.role} · {c.phone}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="card" style={{ padding: "18px 20px" }}>
      <div className="card-title" style={{ fontSize: 28 }}>
        {value}
      </div>
      <div className="card-meta" style={{ marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}
