// One-time import of the Main Residence + ADU space breakdown into the live
// site's database via its public API. Safe to run more than once — it
// checks existing spaces first and skips anything already created
// (matched by name + building), so re-running won't create duplicates.
//
// Usage:
//   node scripts/import-spaces.mjs
//
// By default this targets the production site. To test against your local
// dev server instead, run: node scripts/import-spaces.mjs --local

const useLocal = process.argv.includes("--local");
const BASE_URL = useLocal ? "http://localhost:3000" : "https://1330paseodecaballo.com";

const spaces = [
  // --- Main Residence (4,344 SF) ---
  {
    name: "Primary Bedroom",
    building: "Main Residence",
    squareFootage: 318,
    description:
      "Dimensions: 15'4\" x 17'8\". Large primary sleeping suite with hardwood flooring and 10' ceiling. Plan calls for a Montigo 42\" fireplace, making this more of a true primary suite than just a bedroom.",
  },
  {
    name: "Primary Bathroom",
    building: "Main Residence",
    squareFootage: 176,
    description:
      "Dimensions: 15' x 20'. Oversized primary bath with freestanding tub, shower/glass enclosure, toilet area, and vanity cabinetry. Hardwood flooring, 10' ceiling.",
  },
  {
    name: "Primary Closet",
    building: "Main Residence",
    squareFootage: 225,
    description:
      "Dimensions: 19'9\" x 9'. Very large walk-in primary closet, essentially room-sized. Hardwood, 10' ceiling, with closet organizer systems called out on plan.",
  },
  {
    name: "Bedroom 2",
    building: "Main Residence",
    squareFootage: 220,
    description:
      "Dimensions: 15'9\" x 14'. Generously sized secondary bedroom with hardwood and 10' ceiling. Adjoining closet and nearby dedicated bathroom shown on plan.",
  },
  {
    name: "Bath 2",
    building: "Main Residence",
    squareFootage: 65,
    description:
      "Secondary full bathroom serving the Bedroom 2 side of the house. Hardwood specified, 10' ceiling.",
  },
  {
    name: "Bedroom 3",
    building: "Main Residence",
    squareFootage: 217,
    description:
      "Dimensions: 15'9\" x 12'3\". Another large secondary bedroom with hardwood, 10' ceiling, and its own closet/bathroom area.",
  },
  {
    name: "Bath 3",
    building: "Main Residence",
    squareFootage: 52,
    description:
      "Compact secondary bathroom. Specifically labeled tile flooring, 10' ceiling.",
  },
  {
    name: "Bath 4",
    building: "Main Residence",
    squareFootage: 55,
    description:
      "Additional bathroom located off the family-room/office side of the residence. Hardwood, 10' ceiling.",
  },
  {
    name: "Entry / Foyer",
    building: "Main Residence",
    squareFootage: 182,
    description:
      "Dimensions: 13'1\" x 13'10\". Substantial formal entry rather than a small hallway. Hardwood, 12' ceiling for added volume.",
  },
  {
    name: "Living Room",
    building: "Main Residence",
    squareFootage: 557,
    description:
      "Dimensions: 26'8\" x 22'1\". Largest interior room in the house. Open living/entertaining area with hardwood, 12' ceiling, and an Isokern Magnum 62\" fireplace.",
  },
  {
    name: "Kitchen",
    building: "Main Residence",
    squareFootage: 269,
    description:
      "Dimensions: 14'10\" x 22'6\". Large central kitchen with hardwood and 12' ceiling. Extensive cabinetry, island/work surfaces, sink, dishwasher, refrigeration, and cooking equipment shown on plan.",
  },
  {
    name: "Dining Room",
    building: "Main Residence",
    squareFootage: 262,
    description:
      "Dimensions: 19' x 13'3\". Dedicated dining space adjacent to the main living/kitchen zone. Hardwood, 10' ceiling, with direct relationship to covered outdoor living areas.",
  },
  {
    name: "Family Room",
    building: "Main Residence",
    squareFootage: 278,
    description:
      "Dimensions: 18' x 16'. Separate informal living/lounge space -- the house has both a formal living room and a secondary family room. Hardwood, 10' ceiling.",
  },
  {
    name: "Office",
    building: "Main Residence",
    squareFootage: 239,
    description:
      "Dimensions: 14'5\" x 14'7\". Large dedicated home office on the garage/family-room side of the plan. Hardwood, 10' ceiling. Comparable in size to one of the secondary bedrooms.",
  },
  {
    name: "Pantry",
    building: "Main Residence",
    squareFootage: 69,
    description:
      "Dimensions: 10'2\" x 6'9\". Walk-in pantry immediately supporting the kitchen. Hardwood, 10' ceiling, with built-in/cabinet storage shown on plan.",
  },
  {
    name: "Laundry Room",
    building: "Main Residence",
    squareFootage: 98,
    description:
      "Dimensions: 9'1\" x 10'. Full dedicated laundry room rather than a laundry closet. Hardwood, 10' ceiling, with washer/dryer and cabinetry/service functions shown.",
  },
  {
    name: "Mud Room",
    building: "Main Residence",
    squareFootage: null,
    description:
      "Not separately scheduled on the room schedule. Transition/drop-zone between the garage/service area and main house, labeled on A3.1 without an individual SF tag.",
  },
  {
    name: "Secondary Closets",
    building: "Main Residence",
    squareFootage: null,
    description:
      "Not separately scheduled. Multiple bedroom/hall closets shown throughout the plan, incorporated into the overall 4,344 SF living area but without individual area tags (unlike the 225 SF primary closet).",
  },
  {
    name: "3-Car Garage",
    building: "Main Residence",
    squareFootage: 981,
    description:
      "Large attached three-car garage with concrete floor and 10' ceiling. In addition to the 4,344 SF main-house living area.",
  },
  {
    name: "Deck / Outdoor Living",
    building: "Main Residence",
    squareFootage: 1254,
    description:
      "Extensive exterior deck system around the main living/dining side of the residence, including deck, covered deck, and trellis-covered outdoor areas.",
  },

  // --- Attached ADU (~1,196 SF living area) ---
  {
    name: "Living Room",
    building: "Detached ADU",
    squareFootage: 308,
    description:
      "Dimensions: 15'7\" x 17'9\". Main gathering space of the ADU. Hardwood, 10' ceiling. Plans specify a Montigo 46\" fireplace for the ADU living room.",
  },
  {
    name: "Kitchen",
    building: "Detached ADU",
    squareFootage: 139,
    description:
      "Full kitchen with hardwood and 10' ceiling -- a complete kitchen rather than a kitchenette, including cabinetry, cooking, sink, dishwasher, and refrigeration functions.",
  },
  {
    name: "Entry",
    building: "Detached ADU",
    squareFootage: 45,
    description: "Dedicated entry/foyer into the ADU. Hardwood, 10' ceiling.",
  },
  {
    name: "Bedroom 1",
    building: "Detached ADU",
    squareFootage: 170,
    description:
      "Dimensions: 13'2\" x 13'8\". Larger of the ADU's two bedrooms. Hardwood, 10' ceiling, with an adjacent closet.",
  },
  {
    name: "Bedroom 2",
    building: "Detached ADU",
    squareFootage: 139,
    description:
      "Dimensions: 12'10\" x 11'. Second ADU bedroom, hardwood, 10' ceiling.",
  },
  {
    name: "Bath 1",
    building: "Detached ADU",
    squareFootage: 42,
    description:
      "Compact bathroom serving the ADU bedroom/living area. Hardwood, 10' ceiling.",
  },
  {
    name: "Bath 2",
    building: "Detached ADU",
    squareFootage: 45,
    description: "Second full bathroom in the ADU. Hardwood, 10' ceiling.",
  },
  {
    name: "Closets",
    building: "Detached ADU",
    squareFootage: null,
    description:
      "Not separately scheduled. Bedroom/storage closets shown but not assigned individual square-foot areas on the room schedule.",
  },
  {
    name: "Linen",
    building: "Detached ADU",
    squareFootage: null,
    description:
      "Not separately scheduled. Dedicated linen storage shown between the bedroom/bath areas.",
  },
  {
    name: "Pantry",
    building: "Detached ADU",
    squareFootage: null,
    description:
      "Not separately scheduled. Dedicated kitchen pantry shown on A3.2 without an individual area tag.",
  },
  {
    name: "Mud Room",
    building: "Detached ADU",
    squareFootage: null,
    description:
      "Not separately scheduled. Small transition area connecting the garage/entry portion of the ADU.",
  },
  {
    name: "Storage",
    building: "Detached ADU",
    squareFootage: null,
    description:
      "Not separately scheduled. Substantial exterior/under-main-residence storage area adjacent to the ADU, labeled Storage on plan without a separate SF figure.",
  },
  {
    name: "2-Car Garage",
    building: "Detached ADU",
    squareFootage: 735,
    description:
      "Attached two-car garage with concrete floor and 10' ceiling, separate from the ADU living-area calculation.",
  },
];

async function main() {
  console.log(`Target: ${BASE_URL}`);

  const existingRes = await fetch(`${BASE_URL}/api/spaces`);
  if (!existingRes.ok) {
    throw new Error(`Failed to fetch existing spaces (${existingRes.status})`);
  }
  const existingJson = await existingRes.json();
  const existing = new Set(
    (existingJson.data || []).map((s) => `${s.name}::${s.building}`)
  );

  let created = 0;
  let skipped = 0;

  for (const space of spaces) {
    const key = `${space.name}::${space.building}`;
    if (existing.has(key)) {
      console.log(`SKIP (already exists): ${space.name} [${space.building}]`);
      skipped++;
      continue;
    }

    const res = await fetch(`${BASE_URL}/api/spaces`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(space),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error(
        `FAILED: ${space.name} [${space.building}] -> ${res.status} ${errBody}`
      );
      continue;
    }

    console.log(`CREATED: ${space.name} [${space.building}]`);
    created++;
  }

  console.log(`\nDone. Created ${created}, skipped ${skipped} (already existed).`);
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
