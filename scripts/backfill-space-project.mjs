// Best-effort backfill: links every Space that has no Project yet to the
// project (there must be exactly one Project in the system for this script
// to run - it refuses to guess if there are zero or several).
//
// Space.projectId is what scopes the contractor portal (assets, floor
// plans, docs) to a project - spaces created before that field existed are
// otherwise invisible to contractors even once they're assigned a trade.
// Only touches spaces where projectId is currently null. Safe to re-run.
//
// Usage:
//   node scripts/backfill-space-project.mjs --local   (targets localhost:3000)
//   node scripts/backfill-space-project.mjs           (targets production)

const useLocal = process.argv.includes("--local");
const BASE_URL = useLocal ? "http://localhost:3000" : "https://1330paseodecaballo.com";

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
  const json = await res.json();
  return json.data || [];
}

async function putJson(url, body) {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`PUT ${url} failed: ${res.status} ${errBody}`);
  }
  const json = await res.json();
  return json.data;
}

async function main() {
  console.log(`Target: ${BASE_URL}\n`);

  const projects = await getJson(`${BASE_URL}/api/projects`);
  if (projects.length !== 1) {
    console.error(
      `Expected exactly 1 project, found ${projects.length}. Refusing to guess which project spaces belong to - link them manually.`
    );
    process.exit(1);
  }
  const project = projects[0];
  console.log(`Target project: ${project.name} (${project.id})\n`);

  const spaces = await getJson(`${BASE_URL}/api/spaces`);
  const unlinked = spaces.filter((s) => !s.projectId);

  console.log(`${spaces.length} spaces total, ${unlinked.length} unlinked.\n`);

  for (const space of unlinked) {
    await putJson(`${BASE_URL}/api/spaces/${space.id}`, { projectId: project.id });
    console.log(`LINKED: ${space.name}`);
  }

  console.log(`\nDone. Linked ${unlinked.length} space(s) to "${project.name}".`);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
