// One-time import of the trade budget list (35 line items, ~$355,399 total)
// into the live site's database via its public API.
//
// Category is set to "allowance" for all items (these are budgeted trade
// allowances, not yet-invoiced/paid amounts). Solar - Purchase had no dollar
// figure in the source list, per your instruction it's created with a $0
// placeholder budgetedAmount to be updated later.
//
// Idempotent: safe to re-run. Dedupes by exact description match against
// existing budget items, so re-running won't create duplicates.
//
// Usage:
//   node scripts/import-budget-items.mjs
//   node scripts/import-budget-items.mjs --local   (targets localhost:3000)

const useLocal = process.argv.includes("--local");
const BASE_URL = useLocal ? "http://localhost:3000" : "https://1330paseodecaballo.com";

const budgetItems = [
  { description: "Foundation Slab", budgetedAmount: 82180 },
  { description: "Underground Utilities", budgetedAmount: 1600 },
  { description: "Framing Lumber", budgetedAmount: 30143 },
  { description: "Framing Trusses", budgetedAmount: 15540 },
  { description: "Framing Labor", budgetedAmount: 19000 },
  { description: "Site Cleanup", budgetedAmount: 3524 },
  { description: "Plumbing", budgetedAmount: 19847 },
  { description: "Fire Sprinklers", budgetedAmount: 2328 },
  { description: "Electrical", budgetedAmount: 11472 },
  { description: "Fine Grading", budgetedAmount: 600 },
  { description: "Light Fixtures", budgetedAmount: 650 },
  { description: "HVAC", budgetedAmount: 18940 },
  { description: "HVAC Testing", budgetedAmount: 355 },
  { description: "Roofing", budgetedAmount: 20300 },
  { description: "Solar - Purchase", budgetedAmount: 0, notes: "No amount provided yet - placeholder, update once known." },
  { description: "Insulation", budgetedAmount: 4880 },
  { description: "Drywall", budgetedAmount: 17395 },
  { description: "Stucco - Conventional", budgetedAmount: 15590 },
  { description: "Veneer Tile", budgetedAmount: 683 },
  { description: "Garage Doors", budgetedAmount: 3295 },
  { description: "Finish Carpentry Labor", budgetedAmount: 1634 },
  { description: "Finish Carpentry Materials", budgetedAmount: 11085 },
  { description: "Mirrors & Shower Doors", budgetedAmount: 3085 },
  { description: "Cabinets", budgetedAmount: 13437 },
  { description: "Countertops: Quartz", budgetedAmount: 5636 },
  { description: "Countertops: Tile", budgetedAmount: 1034 },
  { description: "Painting", budgetedAmount: 8366 },
  { description: "Flatwork: Concrete", budgetedAmount: 6205, notes: "1,379 SF total" },
  { description: "Appliances", budgetedAmount: 4780 },
  { description: "Fencing: Vinyl", budgetedAmount: 5397 },
  { description: "Flooring: Carpet", budgetedAmount: 2083 },
  { description: "Flooring: Tile - Hard Flooring", budgetedAmount: 9126 },
  { description: "Shower & Bath Wall Tile", budgetedAmount: 7447 },
  { description: "Landscaping, including drains", budgetedAmount: 6812 },
  { description: "Final Cleanup", budgetedAmount: 950 },
];

async function main() {
  console.log(`Target: ${BASE_URL}`);

  const existingRes = await fetch(`${BASE_URL}/api/budget-items`);
  if (!existingRes.ok) {
    throw new Error(`Failed to fetch existing budget items (${existingRes.status})`);
  }
  const existingJson = await existingRes.json();
  const existing = new Set(
    (existingJson.data || []).map((b) => b.description.trim().toLowerCase())
  );

  let created = 0;
  let skipped = 0;
  let total = 0;

  for (const item of budgetItems) {
    total += item.budgetedAmount;

    if (existing.has(item.description.trim().toLowerCase())) {
      console.log(`SKIP (already exists): ${item.description}`);
      skipped++;
      continue;
    }

    const res = await fetch(`${BASE_URL}/api/budget-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "allowance",
        description: item.description,
        budgetedAmount: item.budgetedAmount,
        notes: item.notes || null,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`FAILED: ${item.description} -> ${res.status} ${errBody}`);
      continue;
    }

    console.log(`CREATED: ${item.description} - $${item.budgetedAmount.toLocaleString()}`);
    created++;
  }

  console.log(
    `\nDone. Created ${created}, skipped ${skipped} (already existed). Total budgeted across all ${budgetItems.length} line items: $${total.toLocaleString()}.`
  );
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
