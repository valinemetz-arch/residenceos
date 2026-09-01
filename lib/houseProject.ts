import { prisma } from "./prisma";

// The app is single-tenant: Spaces/Assets/Tasks/Photos/etc. all belong to
// "the one house" with no projectId of their own. `Project` is otherwise
// used for the contractor bidding/contract/takeoff subsystem, but Site Info
// (gate code, phase, timeline, contacts) and Messages need a Project row to
// anchor to. This finds (or creates, on first use) that canonical row.
const HOUSE_PROJECT_NAME =
  process.env.NEXT_PUBLIC_PROPERTY_NAME ?? "Nemetz Residence — Paseo de Caballo";

export async function getOrCreateHouseProject() {
  const existing = await prisma.project.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;

  return prisma.project.create({
    data: {
      name: HOUSE_PROJECT_NAME,
    },
  });
}
