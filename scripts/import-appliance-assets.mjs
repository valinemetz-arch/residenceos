// Imports the 20 appliances documented in the uploaded spec-sheet PDF
// (SpecificationSheets_build_2026816_...pdf, 16 product listings across 71
// pages - a few listings bundle multiple physical units, e.g. a washer+dryer
// set or a refrigerator+freezer column pair, which are split here into their
// own Asset records since each is a separate installed item).
//
// IMPORTANT - room placement is INFERRED, not stated in the source PDF. The
// spec sheets have no room/location info at all, so each asset was assigned
// to the space that best fits its capacity/branding relative to the rooms
// already in the app (e.g. the two identical Fisher & Paykel DishDrawer
// units are assumed to be a stacked pair in the ADU kitchen, since the Bosch
// dishwasher covers the Main Kitchen; the compact Asko washer/dryer set is
// assumed to be the in-suite "PRIMARY W/D" nook off the Primary Closet per
// Door 15 from the door schedule, while the larger Samsung set with pedestal
// goes to the dedicated Laundry Room). Every asset's notes field is tagged
// "(placement inferred - verify)" so these are easy to find and correct.
//
// Idempotent: safe to re-run. Assets are deduped by name+spaceId.
//
// Usage:
//   node scripts/import-appliance-assets.mjs
//   node scripts/import-appliance-assets.mjs --local   (targets localhost:3000)

const useLocal = process.argv.includes("--local");
const BASE_URL = useLocal ? "http://localhost:3000" : "https://1330paseodecaballo.com";

const assets = [
  {
    name: "Fisher & Paykel CoolDrawer Refrigerator Drawer - RB36S25MKIW1_N",
    manufacturer: "Fisher & Paykel",
    model: "RB36S25MKIW1_N",
    finish: "Panel Ready",
    space: { building: "Main Residence", name: "Pantry" },
    warrantyMonths: 24,
    notes:
      "34\" wide, 3.1 cu ft multi-temp cooling drawer (Chill/Freezer/Fridge/Pantry/Wine modes). Dimensions (W x H x D): 33-21/32\" x 25-3/16\" x 21-15/16\". Part 840545, SKU 24877, UPC 822843213221. Warranty: 2 yr parts & labor, 5 yr sealed system. (placement inferred as auxiliary pantry cold-storage drawer - verify)",
  },
  {
    name: "Asko Washer - W2084W",
    manufacturer: "Asko",
    model: "W2084W",
    finish: "White",
    space: { building: "Main Residence", name: "Primary Closet" },
    notes:
      "24\" front-load washer, Classic Series, 2.1 cu ft drum, up to 1400 rpm spin. Dimensions 23-1/2\"W x 33-1/2\"H x 22-1/2\"D, 170 lb. Stacks with dryer T208VW. (placement inferred as primary-suite in-closet W/D pair, matching \"PRIMARY W/D\" Door 15 from the door schedule - verify)",
  },
  {
    name: "Asko Dryer - T208VW",
    manufacturer: "Asko",
    model: "T208VW",
    finish: "White",
    space: { building: "Main Residence", name: "Primary Closet" },
    notes:
      "24\" vented electric dryer, Classic Series, stacks with washer W2084W, stack kit included. Dimensions 23-1/2\"W x 33-1/2\"H x 23-1/2\"D, 88 lb, 4.1 cu ft drum. (placement inferred as primary-suite in-closet W/D pair, matching \"PRIMARY W/D\" Door 15 - verify)",
  },
  {
    name: "Samsung Washer - WF45B6300AW",
    manufacturer: "Samsung",
    model: "WF45B6300AW",
    finish: "White",
    space: { building: "Main Residence", name: "Laundry Room" },
    notes:
      "27\" front-load washer, 4.5 cu ft, Steam Sanitize+, ADA compliant (with 27\" riser), ships as a pair with gas dryer DVG45B6300W and pedestal WE402NW. Dimensions 27\"W x 38-3/4\"H x 31-3/8\"D, 200.6 lbs. Warranty: 3 yr stainless tub (parts only), 10 yr digital inverter motor (purchases 4/1/26+). (placement: main Laundry Room - verify)",
  },
  {
    name: "Samsung Gas Dryer - DVG45B6300W",
    manufacturer: "Samsung",
    model: "DVG45B6300W",
    finish: "White",
    space: { building: "Main Residence", name: "Laundry Room" },
    notes:
      "27\" front-load gas dryer, 7.5 cu ft, pairs with washer WF45B6300AW. Requires natural gas connection. (placement: main Laundry Room - verify)",
  },
  {
    name: "Samsung Laundry Pedestal - WE402NW",
    manufacturer: "Samsung",
    model: "WE402NW",
    finish: "White",
    space: { building: "Main Residence", name: "Laundry Room" },
    notes:
      "Storage pedestal accessory raising the WF45B6300AW washer / DVG45B6300W dryer pair to a comfortable loading height.",
  },
  {
    name: "Viking Nugget Ice Maker - FGNI515",
    manufacturer: "Viking",
    model: "FGNI515",
    finish: "Panel Ready",
    space: { building: "Main Residence", name: "Kitchen" },
    notes:
      "15\" built-in or freestanding nugget ice maker, 26 lb ice bin capacity, 5.0 max amps. Cutout: 15\"W x 34-1/4\"-35-1/4\"H x 24\"D. (placement: main kitchen - verify)",
  },
  {
    name: "Zephyr Wine & Beverage Cooler - PRB24F01BPG",
    manufacturer: "Zephyr",
    model: "PRB24F01BPG",
    finish: "Panel Ready",
    space: { building: "Detached ADU", name: "Kitchen" },
    warrantyMonths: 24,
    notes:
      "24\" wide Presrv wine & beverage cooler, 14 bottle + 98 can capacity (168 total 12oz bottle equivalent). Dimensions 23-7/8\"W x 69-1/4\"H x 27-3/8\"D, 223 lbs. Warranty: 2 yr parts, 2 yr labor. (placement inferred as ADU beverage cooler - verify)",
  },
  {
    name: "Fisher & Paykel DishDrawer - DD24DI9N (Unit 1 of 2)",
    manufacturer: "Fisher & Paykel",
    model: "DD24DI9N",
    finish: "Panel Ready",
    space: { building: "Detached ADU", name: "Kitchen" },
    notes:
      "24\" ADA-compliant single DishDrawer, 14 place settings, adjustable-height foldable cup racks, flow-through detergent dispenser. Dimensions 23-9/16\"W x 32-5/16\"-34-5/8\"H x 21-3/4\"D. SKU 82339, 100-120V. Installed as a stacked pair with Unit 2. (placement inferred as ADU kitchen double dish-drawer install, since the Bosch dishwasher covers the Main Kitchen - verify)",
  },
  {
    name: "Fisher & Paykel French Door Refrigerator - RS36A72J1N",
    manufacturer: "Fisher & Paykel",
    model: "RS36A72J1_N",
    finish: "Panel Ready",
    space: { building: "Detached ADU", name: "Kitchen" },
    notes:
      "36\" wide, 16.8 cu ft total (11.7 fridge / 5.1 freezer), 72\" tall French door ActiveSmart refrigerator with adaptive defrost. Dimensions 35-21/32\"W x 71-13/16\"H x 23-3/4\"D. SKU 25075, UPC 822843243372. (placement inferred as the ADU's primary refrigerator, since the Thermador columns cover the Main Kitchen - verify)",
  },
  {
    name: "Cafe Microwave Drawer Oven - CWL112P4RW5",
    manufacturer: "Cafe",
    model: "CWL112P4RW5",
    finish: "Matte White",
    space: { building: "Main Residence", name: "Kitchen" },
    warrantyMonths: 24,
    notes:
      "24\" wide, 1.2 cu ft built-in microwave drawer, glass touch controls. Dimensions 23-7/8\"W x 15-15/16\"H x 23-5/16\"D, 69 lb net / 80 lb shipping. Warranty: 5 yr magnetron tube (parts), 2 yr entire appliance (labor). (placement: main kitchen, brand-paired with the Cafe range - verify)",
  },
  {
    name: "Zephyr Wine Cooler - PRW24C02CPG",
    manufacturer: "Zephyr",
    model: "PRW24C02CPG",
    finish: "Panel Ready",
    space: { building: "Main Residence", name: "Kitchen" },
    notes:
      "24\" wide Presrv wine cooler, 45 bottle capacity, built-in or freestanding, 3-color LED lighting. (placement: main kitchen wine cooler - verify)",
  },
  {
    name: "KitchenAid Electric Oven & Microwave Combo - KOEC530PWH",
    manufacturer: "KitchenAid",
    model: "KOEC530PWH",
    finish: "White",
    space: { building: "Detached ADU", name: "Kitchen" },
    notes:
      "30\" wide, 6.4 cu ft combination electric wall oven + microwave with air fry. Overall height ~41\", width 29-3/4\", cutout depth 24\". Combined installed weight 249 lbs. (placement inferred as the ADU's oven/microwave combo, more modest in scale than the Main Kitchen's Cafe range + Thermador columns - verify)",
  },
  {
    name: "Bosch 800 Series Dishwasher - SGV78C53UC",
    manufacturer: "Bosch",
    model: "SGV78C53UC",
    finish: "Panel Ready",
    space: { building: "Main Residence", name: "Kitchen" },
    notes:
      "24\" ADA-compliant top-control dishwasher, 800 Series, 15 place settings, CrystalDry & PrecisionWash, 24/7 AquaStop leak protection, 12 amps, 83 lb net, 5 wash options. (placement: main kitchen - verify)",
  },
  {
    name: "Fisher & Paykel DishDrawer - DD24DI9N (Unit 2 of 2)",
    manufacturer: "Fisher & Paykel",
    model: "DD24DI9N",
    finish: "Panel Ready",
    space: { building: "Detached ADU", name: "Kitchen" },
    notes:
      "24\" ADA-compliant single DishDrawer, 14 place settings. Same spec as Unit 1; installed as a stacked pair. Dimensions 23-9/16\"W x 32-5/16\"-34-5/8\"H x 21-3/4\"D. SKU 82339, 100-120V. (placement inferred as ADU kitchen double dish-drawer install - verify)",
  },
  {
    name: "Cafe 48\" Dual-Fuel Professional Range - C2Y486P4TW2",
    manufacturer: "Cafe",
    model: "C2Y486P4TW2",
    finish: "Matte White / Brushed Bronze",
    space: { building: "Main Residence", name: "Kitchen" },
    warrantyMonths: 12,
    notes:
      "48\" smart dual-fuel commercial-style range, 6 burners + griddle, 8.25 cu ft total oven capacity (5.75 cu ft caterer oven + 2.5 cu ft everyday oven), no-preheat air fry, 240V electric + natural gas, 50A. Dimensions 47-7/8\"W x 35-1/4\"H x 28-1/4\"D, 672 lb shipping / 576 lb net. Warranty: 1 yr parts & labor (entire appliance). (placement: main kitchen centerpiece range - verify)",
  },
  {
    name: "KitchenAid Double Drawer Refrigerator - KUDR204KPA",
    manufacturer: "KitchenAid",
    model: "KUDR204KPA",
    finish: "Panel Ready",
    space: { building: "Detached ADU", name: "Kitchen" },
    notes:
      "24\" wide, 4.44 cu ft Energy Star rated double drawer refrigerator with door alarm. Min. opening 24\"W x 24\"D. (placement inferred as ADU secondary/compact refrigeration alongside the RS36A72J1N fridge - verify)",
  },
  {
    name: "Thermador Column Refrigerator - T36IR905SP",
    manufacturer: "Thermador",
    model: "T36IR905SP",
    finish: "Panel Ready",
    space: { building: "Main Residence", name: "Kitchen" },
    notes:
      "36\" wide reversible-hinge column refrigerator, 20.6 cu ft, Cool Air Flow technology, SoftClose drawers. Dimensions 83-3/4\"H x 35-3/4\"W x 24\"D, 406/449 lb net/gross. Warranty: 2 yr full, 3rd-6th yr sealed system parts+labor, 7th-12th yr sealed system parts only, lifetime stainless rust-through. Pairs with freezer column T36IF905SP. (placement: main kitchen refrigeration column - verify)",
  },
  {
    name: "Thermador Column Freezer - T36IF905SP",
    manufacturer: "Thermador",
    model: "T36IF905SP",
    finish: "Panel Ready",
    space: { building: "Main Residence", name: "Kitchen" },
    notes:
      "36\" wide reversible-hinge column freezer, 19.4 cu ft, twist-tray diamond ice, smooth filtered lighting. Dimensions 83-3/4\"H x 35-3/4\"W x 24\"D, 395/437 lb net/gross. Same warranty terms as its pair, refrigerator column T36IR905SP. (placement: main kitchen refrigeration column - verify)",
  },
  {
    name: "Fisher & Paykel Built-In Coffee Machine - EB24MSB1",
    manufacturer: "Fisher & Paykel",
    model: "EB24MSB1",
    finish: "Black",
    space: { building: "Main Residence", name: "Kitchen" },
    notes:
      "24\" wide built-in coffee machine, Series 9, 13 programmable settings, water filtration, standby timer, integrated grinder. Cabinet cutout min. 22-1/16\"W x 17-3/4\"H x 21-7/16\"D. (placement: main kitchen - verify)",
  },
];

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

async function main() {
  console.log(`Target: ${BASE_URL}\n`);

  const spaces = await getJson(`${BASE_URL}/api/spaces`);
  const spaceByKey = new Map(spaces.map((s) => [`${s.building}::${s.name}`, s]));

  const existingAssets = await getJson(`${BASE_URL}/api/assets`);
  const assetKey = (name, spaceId) => `${name}::${spaceId}`;
  const existingSet = new Set(existingAssets.map((a) => assetKey(a.name, a.spaceId)));

  let created = 0, skipped = 0, unmatched = 0;

  for (const item of assets) {
    const spaceKey = `${item.space.building}::${item.space.name}`;
    const space = spaceByKey.get(spaceKey);
    if (!space) {
      console.warn(`SPACE NOT FOUND for "${item.name}": ${spaceKey}`);
      unmatched++;
      continue;
    }

    if (existingSet.has(assetKey(item.name, space.id))) {
      console.log(`SKIP (already exists): ${item.name}`);
      skipped++;
      continue;
    }

    await postJson(`${BASE_URL}/api/assets`, {
      name: item.name,
      manufacturer: item.manufacturer,
      model: item.model,
      finish: item.finish,
      spaceId: space.id,
      warrantyMonths: item.warrantyMonths || null,
      notes: item.notes,
      status: "pending",
    });
    console.log(`CREATED: ${item.name} -> ${item.space.building} / ${item.space.name}`);
    existingSet.add(assetKey(item.name, space.id));
    created++;
  }

  console.log(`\nDone. Created ${created}, skipped ${skipped} (already existed), ${unmatched} unmatched (space not found).`);
  console.log(`\nReminder: room placement for every asset above was INFERRED, not stated in the source PDF. Review the "(placement ... - verify)" notes and move any assets (via Edit on the Assets page) that landed in the wrong room.`);
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
