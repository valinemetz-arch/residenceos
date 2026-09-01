// Best-effort backfill: tags existing Assets with a Trade (Plumbing Labor,
// Plumbing Finishes, Electrical, HVAC, etc) by keyword-matching the asset's name and its
// System's name/systemType, so contractors can filter "everything for my
// trade" (assets, takeoffs, selections) even for assets created before the
// Trade field existed.
//
// Only sets `tradeId` where it is currently unset AND a confident keyword
// match is found - never overwrites a manually-set trade, and leaves
// ambiguous assets untagged (same as today) rather than guessing. Safe to
// re-run.
//
// Usage:
//   node scripts/backfill-asset-trades.mjs --local   (targets localhost:3000)
//   node scripts/backfill-asset-trades.mjs           (targets production)

const useLocal = process.argv.includes("--local");
const BASE_URL = useLocal ? "http://localhost:3000" : "https://1330paseodecaballo.com";

// Appliance names often contain "door"/"window"/"cabinet" as a style
// descriptor ("French Door Refrigerator", "Built-In Coffee Machine") -
// never let those fall into a door/cabinet trade instead of Appliances.
const APPLIANCE_NOUNS = [
  "refrigerator", "freezer", "dishwasher", "dishdrawer", "dish drawer",
  "range", "oven", "microwave", "washer", "dryer", "laundry pedestal",
  "cooler", "ice maker", "coffee machine",
];

// Checked in order - first match wins. More specific trades are listed
// before generic catch-alls (e.g. "landscape light" -> Landscape Lighting
// is checked before the generic "light" -> Electrical fallback).
const TRADE_KEYWORDS = [
  ["Appliances", APPLIANCE_NOUNS],
  ["Garage Doors", ["garage door"]],
  ["Windows & Exterior Doors", ["window", "skylight", "entry door", "sliding glass door", "folding glass door"]],
  ["Interior Doors", ["interior door"]],
  ["Plumbing Finishes", ["faucet", "sink", "toilet", "tub", "shower valve", "shower trim", "shower head"]],
  ["Plumbing Labor", ["water heater", "drain", "plumbing", "garbage disposal", "hose bib", "gas line", "water line", "rough-in"]],
  ["HVAC", ["hvac", "furnace", "air condition", "mini split", "heat pump", "duct", "thermostat", "ventilation"]],
  ["Roofing", ["roof", "shingle"]],
  ["Gutters & Downspouts", ["gutter", "downspout"]],
  ["Fire Sprinklers", ["sprinkler head", "fire suppression"]],
  ["Framing", ["framing", "truss", "joist", "structural beam"]],
  ["Structural Steel", ["structural steel", "steel beam", "steel column"]],
  ["Foundation", ["foundation", "footing", "slab"]],
  ["Retaining Walls", ["retaining wall"]],
  ["Waterproofing", ["waterproofing", "moisture barrier"]],
  ["Drywall", ["drywall", "sheetrock"]],
  ["Insulation", ["insulation"]],
  ["Painting", ["paint"]],
  ["Stucco / Exterior Finish", ["stucco"]],
  ["Exterior Stone / Masonry", ["exterior stone", "brick veneer", "stone veneer"]],
  ["Tile", ["tile"]],
  ["Flooring", ["flooring", "hardwood floor", "carpet"]],
  ["Countertops", ["countertop"]],
  ["Cabinets", ["cabinet"]],
  ["Finish Carpentry", ["millwork", "finish carpentry", "built-in shelving", "built-in bench", "molding", "trim carpentry"]],
  ["Glass & Mirrors", ["mirror", "shower glass", "shower door"]],
  ["Fireplaces", ["fireplace"]],
  ["Decking", ["decking", "deck board"]],
  ["Deck / Balcony Railings", ["deck railing", "balcony railing"]],
  ["Exterior Metalwork", ["exterior railing", "wrought iron"]],
  ["Flatwork", ["driveway concrete", "flatwork", "walkway concrete"]],
  ["Pool Cover", ["pool cover"]],
  ["Pool & Spa", ["pool pump", "pool heater", "spa", "pool"]],
  ["Fencing & Gates", ["fence", "fencing", "gate"]],
  ["Irrigation", ["irrigation", "sprinkler system"]],
  ["Landscape Lighting", ["landscape light", "path light", "uplighting"]],
  ["Landscape", ["landscape", "planting", "sod", "tree"]],
  ["Outdoor Kitchen / BBQ", ["outdoor kitchen", "bbq", "outdoor grill"]],
  ["Patio Covers / Pergolas", ["patio cover", "pergola"]],
  ["Window Coverings", ["blind", "shade", "drape", "window covering"]],
  ["Grading", ["grading", "earthwork"]],
  ["Underground Utilities", ["underground utility", "underground utilities"]],
  ["Solar & Battery", ["solar panel", "battery backup", "powerwall", "solar roof"]],
  ["Low Voltage / Audio / Security", ["speaker", "home theater", "audio/visual", " av ", "projector", "television", " tv ", "network rack", "data wiring", "security camera", "low voltage", "low-voltage", "ev charger", "tesla charger"]],
  ["Electrical", ["panel", "outlet", "breaker", "wiring", "electric blind", "motorized shade", "motorized blind", "generator", "light fixture", "lighting", "ceiling fan", "chandelier", "sconce", "recessed light"]],
  ["Final Cleaning", ["final cleaning", "construction cleaning"]],
];

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
  const json = await res.json();
  return json.data || json.trades || [];
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

function matchTrade(haystack, tradeByName) {
  // Appliances is checked first (see TRADE_KEYWORDS order) so an appliance
  // whose name happens to contain a style descriptor like "French Door
  // Refrigerator" or "Built-In Coffee Machine" is claimed by Appliances
  // before any door/cabinet keyword gets a chance to match it.
  for (const [tradeName, keywords] of TRADE_KEYWORDS) {
    const trade = tradeByName.get(tradeName.toLowerCase());
    if (!trade) continue; // trade not seeded in this DB, skip
    if (keywords.some((kw) => haystack.includes(kw))) return trade;
  }
  return null;
}

async function main() {
  console.log(`Target: ${BASE_URL}\n`);

  const trades = await getJson(`${BASE_URL}/api/trades`);
  const tradeByName = new Map(trades.map((t) => [t.name.toLowerCase(), t]));
  console.log(`Loaded ${trades.length} trades.\n`);

  const assets = await getJson(`${BASE_URL}/api/assets`);

  const taggedByTrade = {};
  let alreadyTagged = 0;
  let unmatched = 0;

  for (const asset of assets) {
    if (asset.tradeId) {
      alreadyTagged++;
      continue;
    }

    const haystack = [
      asset.name,
      asset.system?.name,
      asset.system?.systemType,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const trade = matchTrade(` ${haystack} `, tradeByName);

    if (!trade) {
      unmatched++;
      continue;
    }

    await putJson(`${BASE_URL}/api/assets/${asset.id}`, { tradeId: trade.id });
    taggedByTrade[trade.name] = (taggedByTrade[trade.name] || 0) + 1;
    console.log(`TAGGED: ${asset.name} -> ${trade.name}`);
  }

  console.log("\nSummary:");
  for (const [name, count] of Object.entries(taggedByTrade).sort()) {
    console.log(`  ${name}: ${count}`);
  }
  console.log(`  Already tagged (skipped): ${alreadyTagged}`);
  console.log(`  Left unmatched (no confident keyword match): ${unmatched}`);
  console.log(
    "\nUnmatched assets are unchanged - same as before this script ran. Tag them manually via the asset edit form when convenient."
  );
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
