// Updates the trade budget line items with figures from
// SS_Homes_SLO_High_End_Budget_5700SF.xlsx (the "High-End Budget" sheet,
// "Adjusted Budget" column - a 5,700 SF high-end planning scenario:
// 4,500 SF main house + 1,200 SF ADU, benchmarked at $525/SF and $450/SF
// respectively).
//
// IMPORTANT: this replaces the budgetedAmount on the 35 trade items created
// earlier (from the original ~$355K permit-scope budget) with much larger
// "high-end planning" allowances, and adds 3 new trade lines that didn't
// exist before (Windows, Retaining Walls, Pool / Spa). Total adjusted hard
// cost across all 38 lines is $3,380,000 (+10% contingency per the
// spreadsheet's Summary tab = ~$3,718,000 planning total). The source sheet
// explicitly notes this is "a high-end conceptual hard-cost budget for
// budgeting/feasibility, not a bid."
//
// Matching existing items is done by description (with an alias map for the
// handful of trades renamed in the new sheet, e.g. "Foundation Slab" ->
// "Foundation / Slab"). Each updated item's notes are prefixed with a
// [High-End Budget marker so re-running this script is safe - it just
// re-applies the same numbers rather than stacking duplicate notes.
//
// Usage:
//   node scripts/update-budget-highend.mjs
//   node scripts/update-budget-highend.mjs --local   (targets localhost:3000)

const useLocal = process.argv.includes("--local");
const BASE_URL = useLocal ? "http://localhost:3000" : "https://1330paseodecaballo.com";

const MARKER = "[High-End Budget (5,700 SF) update";

// { newSheetTrade: existingDescription | null (null = new item, use newSheetTrade as description) }
const TRADE_ALIASES = {
  "Foundation / Slab": "Foundation Slab",
  "Underground Utilities": "Underground Utilities",
  "Framing Lumber": "Framing Lumber",
  "Framing Trusses": "Framing Trusses",
  "Framing Labor": "Framing Labor",
  "Site Cleanup": "Site Cleanup",
  "Plumbing": "Plumbing",
  "Fire Sprinklers": "Fire Sprinklers",
  "Electrical": "Electrical",
  "Grading / Fine Grading": "Fine Grading",
  "Light Fixtures": "Light Fixtures",
  "HVAC": "HVAC",
  "HVAC Testing": "HVAC Testing",
  "Roofing": "Roofing",
  "Solar - Purchase": "Solar - Purchase",
  "Windows": null,
  "Insulation": "Insulation",
  "Drywall": "Drywall",
  "Stucco": "Stucco - Conventional",
  "Veneer / Stone Tile": "Veneer Tile",
  "Garage Doors": "Garage Doors",
  "Finish Carpentry Labor": "Finish Carpentry Labor",
  "Finish Carpentry Materials": "Finish Carpentry Materials",
  "Mirrors & Shower Doors": "Mirrors & Shower Doors",
  "Cabinets": "Cabinets",
  "Countertops - Quartz": "Countertops: Quartz",
  "Countertops - Tile": "Countertops: Tile",
  "Painting": "Painting",
  "Flatwork / Exterior Concrete": "Flatwork: Concrete",
  "Appliances": "Appliances",
  "Fencing": "Fencing: Vinyl",
  "Flooring - Carpet": "Flooring: Carpet",
  "Flooring - Hard Surface": "Flooring: Tile - Hard Flooring",
  "Shower & Bath Wall Tile": "Shower & Bath Wall Tile",
  "Landscaping / Drains": "Landscaping, including drains",
  "Final Cleanup": "Final Cleanup",
  "Retaining Walls": null,
  "Pool / Spa": null,
};

// category, trade (as shown in the xlsx), original budget, adjusted budget, basis/notes
const rows = [
  ["Site & Structure", "Foundation / Slab", 82180, 250000, "Existing line retained and materially increased for a 5,700 SF high-end project; includes robust foundation/slab allowance, not specialty deep piers unless required."],
  ["Site & Structure", "Underground Utilities", 1600, 50000, null],
  ["Structure", "Framing Lumber", 31530, 180000, null],
  ["Structure", "Framing Trusses", 15540, 60000, null],
  ["Structure", "Framing Labor", 19345, 170000, null],
  ["Site & Exterior", "Site Cleanup", 3524, 20000, null],
  ["MEP", "Plumbing", 19847, 140000, null],
  ["MEP", "Fire Sprinklers", 2328, 25000, null],
  ["MEP", "Electrical", 11472, 160000, null],
  ["Site & Structure", "Grading / Fine Grading", 600, 100000, "Expanded from nominal fine grading to major site grading/earthwork allowance."],
  ["MEP", "Light Fixtures", 883, 90000, null],
  ["MEP", "HVAC", 18940, 100000, null],
  ["MEP", "HVAC Testing", 355, 5000, null],
  ["Envelope", "Roofing", 19987, 90000, null],
  ["MEP", "Solar - Purchase", 0, 60000, "Added planning allowance; final depends on Title 24/PV/storage design."],
  ["Envelope", "Windows", 10433, 160000, "High-end window/door package allowance; verify against final A7.1 schedule and selected manufacturer."],
  ["Envelope", "Insulation", 4880, 40000, null],
  ["Interiors", "Drywall", 17395, 80000, null],
  ["Envelope", "Stucco", 13097, 80000, null],
  ["Envelope", "Veneer / Stone Tile", 683, 50000, null],
  ["Envelope", "Garage Doors", 3365, 25000, null],
  ["Interiors", "Finish Carpentry Labor", 1634, 100000, null],
  ["Interiors", "Finish Carpentry Materials", 11260, 120000, null],
  ["Interiors", "Mirrors & Shower Doors", 3085, 45000, null],
  ["Interiors", "Cabinets", 13437, 180000, "High-end custom cabinetry allowance for main house + ADU."],
  ["Interiors", "Countertops - Quartz", 5636, 80000, null],
  ["Interiors", "Countertops - Tile", 1034, 15000, null],
  ["Interiors", "Painting", 9289, 90000, null],
  ["Site & Exterior", "Flatwork / Exterior Concrete", 6205, 80000, null],
  ["Interiors", "Appliances", 4780, 125000, "High-end appliance package allowance for main house + ADU."],
  ["Site & Exterior", "Fencing", 5397, 25000, null],
  ["Interiors", "Flooring - Carpet", 2083, 15000, null],
  ["Interiors", "Flooring - Hard Surface", 9126, 100000, null],
  ["Interiors", "Shower & Bath Wall Tile", 7447, 65000, null],
  ["Site & Exterior", "Landscaping / Drains", 6812, 120000, "Expanded for high-end exterior landscape, irrigation/drainage, and site finish work."],
  ["Site & Exterior", "Final Cleanup", 950, 15000, null],
  ["Site & Structure", "Retaining Walls", 0, 120000, "Added allowance; actual cost is highly dependent on wall length/height, soils, drainage, and structural design."],
  ["Site & Exterior", "Pool / Spa", 0, 150000, "Added high-end pool/spa allowance including equipment and basic surround allowance; premium finishes/features can exceed this."],
];

function buildNotes(existingNotes, category, basis) {
  const lines = [
    `${MARKER}, ${new Date().toISOString().slice(0, 10)}] Category: ${category}. Adjusted for 5,700 SF high-end scope (4,500 SF main house @ $525/SF benchmark + 1,200 SF ADU @ $450/SF benchmark).`,
  ];
  if (basis) lines.push(`Basis: ${basis}`);
  const block = lines.join(" ");

  if (existingNotes && existingNotes.includes(MARKER)) {
    // Already updated by this script before - replace the old marker block
    // rather than stacking. Anything the user typed before/after is kept.
    const markerStart = existingNotes.indexOf(MARKER);
    const before = existingNotes.slice(0, markerStart).trim();
    return before ? `${before}\n\n${block}` : block;
  }
  return existingNotes ? `${existingNotes}\n\n${block}` : block;
}

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
  const json = await res.json();
  return json.data || [];
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`POST ${url} failed: ${res.status} ${errBody}`);
  }
  const json = await res.json();
  return json.data;
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

  const existingItems = await getJson(`${BASE_URL}/api/budget-items`);
  const byDescription = new Map(
    existingItems.map((b) => [b.description.trim().toLowerCase(), b])
  );

  let updated = 0, created = 0, notFound = 0;
  let totalAdjusted = 0;

  for (const [category, trade, original, adjusted, basis] of rows) {
    totalAdjusted += adjusted;
    const existingDescription = TRADE_ALIASES[trade];

    if (existingDescription === null) {
      // New trade line, not previously imported
      const key = trade.trim().toLowerCase();
      if (byDescription.has(key)) {
        console.log(`SKIP create (already exists): ${trade}`);
        continue;
      }
      const createdItem = await postJson(`${BASE_URL}/api/budget-items`, {
        category: "allowance",
        description: trade,
        budgetedAmount: adjusted,
        notes: buildNotes(null, category, basis),
      });
      console.log(`CREATED: ${trade} - $${adjusted.toLocaleString()}`);
      byDescription.set(key, createdItem);
      created++;
      continue;
    }

    const existing = byDescription.get(existingDescription.trim().toLowerCase());
    if (!existing) {
      console.warn(`NOT FOUND (expected existing item, creating instead): ${existingDescription}`);
      const createdItem = await postJson(`${BASE_URL}/api/budget-items`, {
        category: "allowance",
        description: existingDescription,
        budgetedAmount: adjusted,
        notes: buildNotes(null, category, basis),
      });
      byDescription.set(existingDescription.trim().toLowerCase(), createdItem);
      notFound++;
      continue;
    }

    await putJson(`${BASE_URL}/api/budget-items/${existing.id}`, {
      category: existing.category,
      description: existing.description,
      budgetedAmount: adjusted,
      actualAmount: existing.actualAmount,
      status: existing.status,
      spaceId: existing.spaceId,
      assetId: existing.assetId,
      systemId: existing.systemId,
      vendor: existing.vendor,
      notes: buildNotes(existing.notes, category, basis),
    });
    console.log(
      `UPDATED: ${existing.description} - $${(existing.budgetedAmount || 0).toLocaleString()} -> $${adjusted.toLocaleString()}`
    );
    updated++;
  }

  const contingency = totalAdjusted * 0.1;
  console.log(
    `\nDone. Updated ${updated}, created ${created} (new trades), ${notFound} expected-but-missing items created instead.`
  );
  console.log(`Total adjusted hard cost: $${totalAdjusted.toLocaleString()}`);
  console.log(`+10% contingency: $${contingency.toLocaleString()}`);
  console.log(`Planning total incl. contingency: $${(totalAdjusted + contingency).toLocaleString()}`);
}

main().catch((err) => {
  console.error("Update failed:", err);
  process.exit(1);
});
