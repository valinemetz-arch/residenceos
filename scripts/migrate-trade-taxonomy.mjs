// One-time migration: reconciles the live Trade table with the new
// custom-home bid-category taxonomy in prisma/seed.ts (45 categories,
// replacing the original 14-trade placeholder list).
//
// Steps:
//   1. Create any of the 45 target trades that don't exist yet (idempotent).
//   2. Rename trades that map 1:1 onto a new name, preserving their id so
//      any existing references (Asset.tradeId, ContractorTrade, etc.) stay
//      intact: Masonry -> Exterior Stone / Masonry, Carpentry -> Finish
//      Carpentry, Doors/Windows -> Windows & Exterior Doors.
//   3. Splits the old combined "Doors/Windows" tagging into three real
//      categories using the door model/name (see classifyDoor below):
//      actual garage doors -> Garage Doors, plain interior doors ->
//      Interior Doors, everything else (windows, glazed/entry door
//      assemblies) stays on the renamed Windows & Exterior Doors trade.
//   4. Deletes now-obsolete trades that aren't in the new list and have
//      zero references (General Labor, Audio/Visual, Low Voltage - the
//      old un-merged AV/low-voltage split).
//
// Safe to re-run - every step checks current state before acting.
//
// Usage: node scripts/migrate-trade-taxonomy.mjs

import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

config({ path: ".env.local", override: true });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const RENAMES = [
  ["Masonry", "Exterior Stone / Masonry"],
  ["Carpentry", "Finish Carpentry"],
  ["Doors/Windows", "Windows & Exterior Doors"],
];

const OBSOLETE_TRADES = ["General Labor", "Audio/Visual", "Low Voltage"];

// Actual overhead/roll-up garage doors (wide, per the door schedule sizes) -
// as opposed to a plain man-door that just happens to be located in/near
// the garage.
const GARAGE_DOOR_NAMES = new Set([
  "Door 08 - GARAGE",
  "Door 09 - GARAGE",
  "Door 10 - GARAGE",
  "Door 11 - GARAGE",
  "Door 50 - ADU GARAGE",
]);

function classifyDoor(asset) {
  if (GARAGE_DOOR_NAMES.has(asset.name)) return "Garage Doors";

  const model = (asset.model || "").toLowerCase();
  // Glazed/entry assemblies (sliding glass, folding glass, glass pocket,
  // entry) are typically supplied/installed with the window package, not
  // as a plain interior door - stay on Windows & Exterior Doors.
  if (model.includes("glass") || model.includes("entry") || model.includes("exterior")) {
    return "Windows & Exterior Doors";
  }
  // Plain solid-core doors (SC, SC - POCKET, SC - BYPASS, FULL LITE, etc)
  return "Interior Doors";
}

async function main() {
  const byName = new Map(
    (await prisma.trade.findMany()).map((t) => [t.name, t])
  );

  // 1. Rename 1:1 matches in place (preserves id + existing references)
  for (const [oldName, newName] of RENAMES) {
    const existing = byName.get(oldName);
    if (!existing) continue;
    if (byName.has(newName)) {
      console.log(`SKIP rename ${oldName} -> ${newName}: target name already exists`);
      continue;
    }
    const updated = await prisma.trade.update({
      where: { id: existing.id },
      data: { name: newName },
    });
    byName.delete(oldName);
    byName.set(newName, updated);
    console.log(`RENAMED: ${oldName} -> ${newName}`);
  }

  // 2. Split Doors/Windows (now renamed to Windows & Exterior Doors) into
  // Interior Doors / Garage Doors where appropriate.
  const windowsExteriorTrade = byName.get("Windows & Exterior Doors");
  if (windowsExteriorTrade) {
    const doorAssets = await prisma.asset.findMany({
      where: { tradeId: windowsExteriorTrade.id, name: { startsWith: "Door " } },
      select: { id: true, name: true, model: true },
    });

    const moves = { "Interior Doors": [], "Garage Doors": [] };
    for (const asset of doorAssets) {
      const target = classifyDoor(asset);
      if (target !== "Windows & Exterior Doors") {
        moves[target].push(asset);
      }
    }

    for (const [targetName, assets] of Object.entries(moves)) {
      if (assets.length === 0) continue;
      // Interior Doors / Garage Doors are created fresh below if missing -
      // ensure they exist before reassigning.
      let targetTrade = byName.get(targetName);
      if (!targetTrade) {
        targetTrade = await prisma.trade.create({
          data: { name: targetName, description: `${targetName} - split out of Doors/Windows` },
        });
        byName.set(targetName, targetTrade);
        console.log(`CREATED (early, for split): ${targetName}`);
      }
      await prisma.asset.updateMany({
        where: { id: { in: assets.map((a) => a.id) } },
        data: { tradeId: targetTrade.id },
      });
      console.log(`RECLASSIFIED ${assets.length} asset(s) -> ${targetName}: ${assets.map((a) => a.name).join(", ")}`);
    }
  }

  // 3. Create the rest of the target trades that don't exist yet. (Kept in
  // sync with prisma/seed.ts DEFAULT_TRADES - duplicated here since that
  // file is TS and this is a plain script.)
  const TARGET_TRADE_NAMES = [
    "Grading", "Underground Utilities", "Foundation", "Retaining Walls",
    "Framing", "Structural Steel", "Roofing", "Waterproofing",
    "Windows & Exterior Doors", "Stucco / Exterior Finish", "Exterior Stone / Masonry",
    "Plumbing", "Electrical", "HVAC", "Fire Sprinklers", "Solar & Battery",
    "Low Voltage / Audio / Security", "Insulation", "Drywall", "Interior Doors",
    "Finish Carpentry", "Cabinets", "Countertops", "Tile", "Flooring", "Painting",
    "Glass & Mirrors", "Appliances", "Fireplaces", "Garage Doors", "Decking",
    "Deck / Balcony Railings", "Exterior Metalwork", "Flatwork", "Pool & Spa",
    "Pool Cover", "Fencing & Gates", "Landscape", "Irrigation", "Landscape Lighting",
    "Outdoor Kitchen / BBQ", "Patio Covers / Pergolas", "Window Coverings",
    "Gutters & Downspouts", "Final Cleaning",
  ];

  for (const name of TARGET_TRADE_NAMES) {
    if (byName.has(name)) continue;
    const created = await prisma.trade.create({ data: { name } });
    byName.set(name, created);
    console.log(`CREATED: ${name}`);
  }

  // 4. Delete obsolete trades (not in the new list) that have zero
  // references anywhere - never delete one that's actually in use.
  for (const name of OBSOLETE_TRADES) {
    const trade = byName.get(name);
    if (!trade) continue;
    const [assetCount, contractorCount, projectCount] = await Promise.all([
      prisma.asset.count({ where: { tradeId: trade.id } }),
      prisma.contractorTrade.count({ where: { tradeId: trade.id } }),
      prisma.projectTrade.count({ where: { tradeId: trade.id } }),
    ]);
    if (assetCount + contractorCount + projectCount > 0) {
      console.log(`SKIP delete ${name}: still referenced (assets=${assetCount}, contractors=${contractorCount}, projects=${projectCount})`);
      continue;
    }
    await prisma.trade.delete({ where: { id: trade.id } });
    console.log(`DELETED (obsolete, unreferenced): ${name}`);
  }

  const finalTrades = await prisma.trade.findMany({ orderBy: { name: "asc" } });
  console.log(`\nDone. ${finalTrades.length} trades now in the taxonomy.`);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Migration failed:", err);
  await prisma.$disconnect();
  process.exit(1);
});
