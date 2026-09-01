// Organizes existing assets into printable schedule categories:
//   1. Ensures "Appliances" and "Plumbing" Systems exist (Doors/Windows were
//      already created by import-scopes-schedules.mjs).
//   2. Assigns the 20 appliances imported by import-appliance-assets.mjs to
//      the "Appliances" system (they were created with no systemId).
//   3. Backfills the new `size` field on doors, windows, and appliances
//      using the dimensions already captured when those assets were
//      imported (door/window Width x Height, appliance W x H x D from the
//      spec-sheet PDF). A few appliances had no clearly-confirmed overall
//      dimensions in the source PDF and are left blank rather than guessed.
//
// This does NOT touch spaceId/notes/cost/etc - only size and (for
// appliances only) systemId, and only fields that are currently empty, so
// it's safe to re-run and won't clobber any manual edits you've made.
//
// Usage:
//   node scripts/organize-asset-categories.mjs
//   node scripts/organize-asset-categories.mjs --local   (targets localhost:3000)

const useLocal = process.argv.includes("--local");
const BASE_URL = useLocal ? "http://localhost:3000" : "https://1330paseodecaballo.com";

const DOOR_SIZES = {
  "Door 01 - ENTRY": "5' x 9'",
  "Door 02 - PRIMARY BEDROOM": "8' x 8'",
  "Door 03 - LIVING ROOM": "16' x 9'",
  "Door 04 - LIVING ROOM": "18' x 9'",
  "Door 05 - DINING ROOM": "10' x 9'",
  "Door 06 - FAMILY ROOM": "12' x 8'",
  "Door 07 - OFFICE": "3' x 8'",
  "Door 08 - GARAGE": "8' x 8'",
  "Door 09 - GARAGE": "9' x 8'",
  "Door 10 - GARAGE": "9' x 8'",
  "Door 11 - GARAGE": "9' x 8'",
  "Door 12 - GARAGE": "3' x 8'",
  "Door 13 - CLOSET": "2'-8\" x 8'",
  "Door 14 - PRIMARY TOILET": "2'-8\" x 8'",
  "Door 15 - PRIMARY W/D": "3' x 8'",
  "Door 16 - PRIMARY BEDROOM": "3' x 8'",
  "Door 17 - PRIMARY BATH": "3' x 8'",
  "Door 18 - PRIMARY CLOSET": "3' x 8'",
  "Door 19 - BATH 2": "2'-8\" x 8'",
  "Door 20 - BATH 2": "3' x 8'",
  "Door 21 - CLOSET 2": "2'-8\" x 8'",
  "Door 22 - BEDROOM 2": "2'-8\" x 8'",
  "Door 23 - BEDROOM 3": "2'-8\" x 8'",
  "Door 24 - BATH 3": "2'-8\" x 8'",
  "Door 25 - CLOSET 3": "2'-8\" x 8'",
  "Door 27 - LAUNDRY": "3' x 8'",
  "Door 28 - GARAGE": "3' x 8'",
  "Door 29 - PANTRY": "2'-8\" x 8'",
  "Door 30 - FAMILY ROOM": "2'-8\" x 8'",
  "Door 31 - CLOSET": "5' x 8'",
  "Door 32 - CLOSET": "2'-8\" x 8'",
  "Door 33 - OFFICE": "2'-8\" x 8'",
  "Door 34 - BATH 4": "2'-8\" x 8'",
  "Door 35 - ADU": "5' x 6'-8\"",
  "Door 50 - ADU GARAGE": "18' x 8'",
  "Door 51 - ADU ENTRY": "4' x 8'",
  "Door 52 - ADU LIVING ROOM": "12' x 8'",
  "Door 53 - ADU BEDROOM 1": "8' x 8'",
  "Door 54 - ADU HALLWAY": "3' x 8'",
  "Door 55 - ADU GARAGE": "3' x 8'",
  "Door 56 - ADU MUD ROOM": "3' x 8'",
  "Door 57 - ADU PANTRY": "2'-6\" x 8'",
  "Door 58 - ADU HALLWAY": "5' x 6'-8\"",
  "Door 59 - ADU PRIMARY": "2'-10\" x 8'",
  "Door 60 - ADU PRIMARY CLOSET": "2'-10\" x 8'",
  "Door 61 - ADU PRIMARY BATH": "3' x 8'",
  "Door 62 - ADU PRIMARY TOILET": "2'-10\" x 8'",
  "Door 63 - ADU BATH 2": "2'-10\" x 8'",
  "Door 64 - ADU BEDROOM 2": "2'-10\" x 8'",
  "Door 65 - ADU BEDROOM 2 CLOSET": "6' x 6'-8\"",
};

const WINDOW_SIZES = {
  "Window 01 - PRIMARY BATH": "2'-6\" x 6'-6\"",
  "Window 02 - PRIMARY BATH": "2'-6\" x 6'-6\"",
  "Window 03 - PRIMARY BATH": "2'-6\" x 6'-6\"",
  "Window 04 - PRIMARY CLOSET": "2'-6\" x 7'",
  "Window 05 - PRIMARY CLOSET": "2'-6\" x 7'",
  "Window 06 - PRIMARY CLOSET": "2'-6\" x 7'",
  "Window 07 - PRIMARY BEDROOM": "2' x 4'",
  "Window 08 - PRIMARY BEDROOM": "2' x 4'",
  "Window 09 - DINING ROOM": "2'-6\" x 8'",
  "Window 10 - DINING ROOM": "6' x 8'",
  "Window 11 - DINING ROOM": "2'-6\" x 8'",
  "Window 12 - DINING ROOM": "6' x 4'",
  "Window 13 - BATH 4": "2' x 4'",
  "Window 14 - OFFICE": "2'-6\" x 4'-6\"",
  "Window 15 - OFFICE": "6' x 6'-6\"",
  "Window 16 - OFFICE": "2'-6\" x 4'-6\" (height overlaps on A7.1 - verify)",
  "Window 17 - BEDROOM 3": "2'-6\" x 7'",
  "Window 18 - BEDROOM 3": "2'-6\" x 6'-6\"",
  "Window 19 - BEDROOM 3": "2'-6\" x 7'",
  "Window 20 - BEDROOM 2": "2'-6\" x 6'-6\"",
  "Window 21 - BEDROOM 2": "2'-6\" x 6'-6\"",
  "Window 22 - BEDROOM 2": "2'-6\" x 6'-6\"",
  "Window 23 - ENTRY": "2'-6\" x 9'-2\"",
  "Window 24 - ENTRY": "2'-6\" x 9'-2\"",
  "Window 50 - ADU BEDROOM 2": "5' x 5'",
  "Window 51 - ADU BATH 1": "2' x 4'",
  "Window 52 - ADU BATH 1": "2' x 4'",
  "Window 53 - ADU BEDROOM 1": "7' x 2'",
  "Window 54 - ADU KITCHEN": "5'-6\" x 4'",
  "Window 55 - ADU LIVING ROOM": "2'-6\" x 7'",
  "Window 56 - ADU LIVING ROOM": "2'-6\" x 7'",
  "Window 57 - ADU GARAGE": "7' x 2'",
};

// Appliance overall dimensions (W x H x D), from the spec-sheet PDF. A few
// appliances (Samsung pedestal, Zephyr PRW24C02CPG, Bosch dishwasher) had no
// clearly-legible full W x H x D in the extracted text, so they're left out
// here rather than guessed - their size field will stay blank.
const APPLIANCE_SIZES = {
  "Fisher & Paykel CoolDrawer Refrigerator Drawer - RB36S25MKIW1_N":
    "33-21/32\" W x 25-3/16\" H x 21-15/16\" D",
  "Asko Washer - W2084W": "23-1/2\" W x 33-1/2\" H x 22-1/2\" D",
  "Asko Dryer - T208VW": "23-1/2\" W x 33-1/2\" H x 23-1/2\" D",
  "Samsung Washer - WF45B6300AW": "27\" W x 38-3/4\" H x 31-3/8\" D",
  "Samsung Gas Dryer - DVG45B6300W": "27\" W x 38-3/4\" H x 31-3/8\" D (approx., matched pair)",
  "Viking Nugget Ice Maker - FGNI515": "15\" W x 34-1/4\"-35-1/4\" H x 24\" D (cutout)",
  "Zephyr Wine & Beverage Cooler - PRB24F01BPG": "23-7/8\" W x 69-1/4\" H x 27-3/8\" D",
  "Fisher & Paykel DishDrawer - DD24DI9N (Unit 1 of 2)":
    "23-9/16\" W x 32-5/16\"-34-5/8\" H x 21-3/4\" D",
  "Fisher & Paykel French Door Refrigerator - RS36A72J1N":
    "35-21/32\" W x 71-13/16\" H x 23-3/4\" D",
  "Cafe Microwave Drawer Oven - CWL112P4RW5": "23-7/8\" W x 15-15/16\" H x 23-5/16\" D",
  "KitchenAid Electric Oven & Microwave Combo - KOEC530PWH":
    "29-3/4\" W x 41-3/8\" H x 24\" D (cutout)",
  "Fisher & Paykel DishDrawer - DD24DI9N (Unit 2 of 2)":
    "23-9/16\" W x 32-5/16\"-34-5/8\" H x 21-3/4\" D",
  "Cafe 48\" Dual-Fuel Professional Range - C2Y486P4TW2": "47-7/8\" W x 35-1/4\" H x 28-1/4\" D",
  "KitchenAid Double Drawer Refrigerator - KUDR204KPA": "24\" W (min. opening 24\"W x 24\"D)",
  "Thermador Column Refrigerator - T36IR905SP": "35-3/4\" W x 83-3/4\" H x 24\" D",
  "Thermador Column Freezer - T36IF905SP": "35-3/4\" W x 83-3/4\" H x 24\" D",
  "Fisher & Paykel Built-In Coffee Machine - EB24MSB1": "23-7/16\" W x 18\" H x 18-7/8\" D",
};

const APPLIANCE_NAMES = new Set(Object.keys(APPLIANCE_SIZES).concat([
  "Samsung Laundry Pedestal - WE402NW",
  "Zephyr Wine Cooler - PRW24C02CPG",
  "Bosch 800 Series Dishwasher - SGV78C53UC",
]));

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

  let systems = await getJson(`${BASE_URL}/api/systems`);
  const systemByName = new Map(systems.map((s) => [s.name, s]));

  async function ensureSystem(name, description) {
    if (systemByName.has(name)) return systemByName.get(name);
    const created = await postJson(`${BASE_URL}/api/systems`, {
      name,
      systemType: name,
      description,
    });
    console.log(`CREATED system: ${name}`);
    systemByName.set(name, created);
    return created;
  }

  const appliancesSystem = await ensureSystem(
    "Appliances",
    "Kitchen and laundry appliances, tracked as individually biddable/orderable assets."
  );
  await ensureSystem(
    "Plumbing",
    "Plumbing fixtures and trim (faucets, sinks, tubs, toilets, shower systems). No fixtures selected yet - add assets here as selections are made."
  );

  const assets = await getJson(`${BASE_URL}/api/assets`);

  let sizesSet = 0, systemsSet = 0, skipped = 0;

  for (const asset of assets) {
    const patch = {};

    let targetSize = null;
    if (DOOR_SIZES[asset.name]) targetSize = DOOR_SIZES[asset.name];
    else if (WINDOW_SIZES[asset.name]) targetSize = WINDOW_SIZES[asset.name];
    else if (APPLIANCE_SIZES[asset.name]) targetSize = APPLIANCE_SIZES[asset.name];

    if (targetSize && !asset.size) {
      patch.size = targetSize;
    }

    if (APPLIANCE_NAMES.has(asset.name) && !asset.systemId) {
      patch.systemId = appliancesSystem.id;
    }

    if (Object.keys(patch).length === 0) {
      skipped++;
      continue;
    }

    await putJson(`${BASE_URL}/api/assets/${asset.id}`, patch);
    if (patch.size) sizesSet++;
    if (patch.systemId) systemsSet++;
    console.log(
      `UPDATED: ${asset.name}${patch.size ? ` [size: ${patch.size}]` : ""}${
        patch.systemId ? " [system: Appliances]" : ""
      }`
    );
  }

  console.log(
    `\nDone. Set size on ${sizesSet} assets, set Appliances system on ${systemsSet} assets, skipped ${skipped} (already organized or no known data).`
  );
}

main().catch((err) => {
  console.error("Update failed:", err);
  process.exit(1);
});
