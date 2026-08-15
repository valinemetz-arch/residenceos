// One-time import of the Room Scope, Door Schedule, and Window Schedule
// sheets from Nemetz_Project_Scope_and_Schedules.xlsx (permit set dated
// 7/22/26) into the live site's database via its public API.
//
// What this does:
//   1. Room Scope sheet  -> enriches the 33 existing Space records (created
//      earlier by import-spaces.mjs) with a structured "Room Scope Detail"
//      block appended to each Space's `notes` field (floor finish, ceiling
//      height, cabinetry, plumbing, appliances, door/window refs, scope
//      description, review/coordination, source sheet). Also creates one
//      new Space, "Primary Closet" under Detached ADU, since it's newly
//      identified in this sheet with no earlier equivalent.
//   2. Door Schedule (50) + Window Schedule (32) -> each becomes its own
//      Asset record, linked to its matching Space AND to a "Doors" or
//      "Windows" System, so each opening can be tracked, priced, and bid on
//      independently by a vendor/installer.
//   3. Project Notes sheet -> saved as the description on a new Project
//      record ("Nemetz Residence - Plan Data & Coordination Notes") since
//      it's general project-level reference data, not tied to one space.
//
// Idempotent: safe to re-run. Spaces are matched/updated by name+building
// (notes are only appended once, guarded by a marker string). Assets are
// deduped by name+spaceId. The Project is deduped by name.
//
// Usage:
//   node scripts/import-scopes-schedules.mjs
//   node scripts/import-scopes-schedules.mjs --local   (targets localhost:3000)

const useLocal = process.argv.includes("--local");
const BASE_URL = useLocal ? "http://localhost:3000" : "https://1330paseodecaballo.com";

// ---------------------------------------------------------------------------
// Raw sheet data (extracted from Nemetz_Project_Scope_and_Schedules.xlsx)
// ---------------------------------------------------------------------------

const roomScopeRows = [
  {
    "Dwelling": "Main Residence",
    "Space": "Primary Bedroom",
    "Area (SF)": 318,
    "Plan Dimensions": "15'4\" x 17'8\"",
    "Floor Finish": "Hardwood",
    "Ceiling Height": "10'-0\"",
    "Cabinetry / Built-ins": "Closet access; fireplace surround/finish per selections",
    "Plumbing": null,
    "Appliances / Equipment": "Montigo 42\" fireplace (plan note)",
    "Door & Window References": "Doors 02, 16; Windows 07, 08",
    "Scope Description": "Large primary sleeping suite. Coordinate flooring, base/trim, fireplace, glazing, doors, electrical/lighting and final paint/finish selections.",
    "Review / Coordination": "Verify fireplace finish and owner selections.",
    "Source Sheet": "A3.1 / A7.1"
  },
  {
    "Dwelling": "Main Residence",
    "Space": "Primary Bathroom",
    "Area (SF)": 176,
    "Plan Dimensions": "15' x 20'",
    "Floor Finish": "Hardwood",
    "Ceiling Height": "10'-0\"",
    "Cabinetry / Built-ins": "Vanity / bath cabinetry per plan",
    "Plumbing": "Lavatory(s), WC compartment, shower, freestanding tub",
    "Appliances / Equipment": "Bath exhaust / accessories per plan",
    "Door & Window References": "Door 17; Toilet Door 14; Windows 01-03",
    "Scope Description": "Primary bath build-out including vanity, plumbing trim, shower glass/partition, freestanding tub, accessories, waterproofing at wet areas, lighting and ventilation.",
    "Review / Coordination": "Plan room tag lists hardwood; verify final wet-area finish selection.",
    "Source Sheet": "A3.1 / A7.1"
  },
  {
    "Dwelling": "Main Residence",
    "Space": "Primary Closet",
    "Area (SF)": 225,
    "Plan Dimensions": "19'9\" x 9'",
    "Floor Finish": "Hardwood",
    "Ceiling Height": "10'-0\"",
    "Cabinetry / Built-ins": "Closet organizer systems / built-ins",
    "Plumbing": null,
    "Appliances / Equipment": null,
    "Door & Window References": "Door 18; Windows 04-06",
    "Scope Description": "Large walk-in closet. Include organizer system, shelving/rods, trim, lighting, outlets as required, flooring and paint.",
    "Review / Coordination": "Closet organizer configuration to be verified with owner.",
    "Source Sheet": "A3.1 / A7.1"
  },
  {
    "Dwelling": "Main Residence",
    "Space": "Bedroom 2",
    "Area (SF)": 220,
    "Plan Dimensions": "15'9\" x 14'",
    "Floor Finish": "Hardwood",
    "Ceiling Height": "10'-0\"",
    "Cabinetry / Built-ins": "Associated closet",
    "Plumbing": null,
    "Appliances / Equipment": null,
    "Door & Window References": "Door 22; Closet Door 21; Windows 20-22",
    "Scope Description": "Secondary bedroom with associated closet. Include flooring, trim, paint, lighting/electrical and scheduled openings.",
    "Review / Coordination": "Window 20 is noted EGRESS.",
    "Source Sheet": "A3.1 / A7.1"
  },
  {
    "Dwelling": "Main Residence",
    "Space": "Bath 2",
    "Area (SF)": 65,
    "Plan Dimensions": null,
    "Floor Finish": "Hardwood",
    "Ceiling Height": "10'-0\"",
    "Cabinetry / Built-ins": "Vanity / storage per plan",
    "Plumbing": "Lavatory, WC, shower where shown",
    "Appliances / Equipment": "Bath exhaust / accessories",
    "Door & Window References": "Doors 19, 20",
    "Scope Description": "Secondary bathroom build-out including plumbing fixtures, wet-area backing/waterproofing, accessories, lighting and exhaust.",
    "Review / Coordination": "Verify final floor/wall finish selections.",
    "Source Sheet": "A3.1 / A7.1"
  },
  {
    "Dwelling": "Main Residence",
    "Space": "Bedroom 3",
    "Area (SF)": 217,
    "Plan Dimensions": "15'9\" x 12'3\"",
    "Floor Finish": "Hardwood",
    "Ceiling Height": "10'-0\"",
    "Cabinetry / Built-ins": "Associated closet",
    "Plumbing": null,
    "Appliances / Equipment": null,
    "Door & Window References": "Door 23; Closet Door 25; Windows 17-19",
    "Scope Description": "Secondary bedroom with associated closet. Include flooring, trim, paint, lighting/electrical and scheduled openings.",
    "Review / Coordination": "Window 17 is noted EGRESS.",
    "Source Sheet": "A3.1 / A7.1"
  },
  {
    "Dwelling": "Main Residence",
    "Space": "Bath 3",
    "Area (SF)": 52,
    "Plan Dimensions": null,
    "Floor Finish": "Tile",
    "Ceiling Height": "10'-0\"",
    "Cabinetry / Built-ins": "Vanity / storage per plan",
    "Plumbing": "Lavatory, WC, shower where shown",
    "Appliances / Equipment": "Bath exhaust / accessories",
    "Door & Window References": "Door 24",
    "Scope Description": "Secondary bathroom. Include tile floor as tagged, plumbing fixtures, waterproofing at wet areas, accessories, lighting and exhaust.",
    "Review / Coordination": "Verify tile selection and wall finish extents.",
    "Source Sheet": "A3.1 / A7.1"
  },
  {
    "Dwelling": "Main Residence",
    "Space": "Bath 4",
    "Area (SF)": 55,
    "Plan Dimensions": null,
    "Floor Finish": "Hardwood",
    "Ceiling Height": "10'-0\"",
    "Cabinetry / Built-ins": "Vanity / storage per plan",
    "Plumbing": "Lavatory, WC, shower where shown",
    "Appliances / Equipment": "Bath exhaust / accessories",
    "Door & Window References": "Door 34; Window 13",
    "Scope Description": "Bathroom near family room/office. Include plumbing, cabinetry, wet-area protection, lighting, exhaust and scheduled window/door.",
    "Review / Coordination": "Window 13 noted TEMP.",
    "Source Sheet": "A3.1 / A7.1"
  },
  {
    "Dwelling": "Main Residence",
    "Space": "Entry / Foyer",
    "Area (SF)": 182,
    "Plan Dimensions": "13'1\" x 13'10\"",
    "Floor Finish": "Hardwood",
    "Ceiling Height": "12'-0\"",
    "Cabinetry / Built-ins": "Entry trim / millwork per plan",
    "Plumbing": null,
    "Appliances / Equipment": null,
    "Door & Window References": "Door 01; Windows 23, 24",
    "Scope Description": "Formal entry with 12-foot ceiling. Include custom entry door, fixed glazing, flooring, trim, lighting and wall/ceiling finishes.",
    "Review / Coordination": "Door 01 noted CUSTOM ENTRY PER OWNER; windows 23-24 TEMP.",
    "Source Sheet": "A3.1 / A7.1"
  },
  {
    "Dwelling": "Main Residence",
    "Space": "Living Room",
    "Area (SF)": 557,
    "Plan Dimensions": "26'8\" x 22'1\"",
    "Floor Finish": "Hardwood",
    "Ceiling Height": "12'-0\"",
    "Cabinetry / Built-ins": "Custom cabinetry / fireplace surround as shown",
    "Plumbing": null,
    "Appliances / Equipment": "Isokern Magnum 62\" fireplace",
    "Door & Window References": "Doors 03, 04",
    "Scope Description": "Primary entertaining space. Include large-format glazed door systems, fireplace, flooring, trim, electrical/AV, lighting and finish work.",
    "Review / Coordination": "Doors 03-04 are tempered glazed systems.",
    "Source Sheet": "A3.1 / A7.1"
  },
  {
    "Dwelling": "Main Residence",
    "Space": "Kitchen",
    "Area (SF)": 269,
    "Plan Dimensions": "14'10\" x 22'6\"",
    "Floor Finish": "Hardwood",
    "Ceiling Height": "12'-0\"",
    "Cabinetry / Built-ins": "Base/upper/full-height/custom cabinetry; island; built-in trash",
    "Plumbing": "Kitchen sink / island sink as shown",
    "Appliances / Equipment": "Range/cooktop + hood; dishwasher; disposal; refrigerator; wall oven/microwave; undercabinet equipment where shown",
    "Door & Window References": "See floor plan; adjacent openings per A7.1",
    "Scope Description": "Full kitchen scope: cabinets, counters, island, appliances, sinks/faucets, backsplash, electrical/lighting, hood/exhaust, flooring and trim.",
    "Review / Coordination": "Verify owner appliance package, cabinet layout and countertop/backsplash selections.",
    "Source Sheet": "A3.1"
  },
  {
    "Dwelling": "Main Residence",
    "Space": "Dining Room",
    "Area (SF)": 262,
    "Plan Dimensions": "19' x 13'3\"",
    "Floor Finish": "Hardwood",
    "Ceiling Height": "10'-0\"",
    "Cabinetry / Built-ins": "Trim / built-ins where shown",
    "Plumbing": null,
    "Appliances / Equipment": null,
    "Door & Window References": "Door 05; Windows 09-12",
    "Scope Description": "Dedicated dining area tied to exterior living. Include flooring, trim, lighting and large glazed opening/window assemblies.",
    "Review / Coordination": "Door 05 tempered; windows 09-12 include tempered/fixed/transom/awning conditions.",
    "Source Sheet": "A3.1 / A7.1"
  },
  {
    "Dwelling": "Main Residence",
    "Space": "Family Room",
    "Area (SF)": 278,
    "Plan Dimensions": "18' x 16'",
    "Floor Finish": "Hardwood",
    "Ceiling Height": "10'-0\"",
    "Cabinetry / Built-ins": "Built-in bench / cabinetry where shown",
    "Plumbing": null,
    "Appliances / Equipment": null,
    "Door & Window References": "Doors 06, 30",
    "Scope Description": "Informal family/lounge space. Include flooring, built-ins where shown, lighting/electrical and glazed pocket opening.",
    "Review / Coordination": "Door 06 is tempered glass pocket system.",
    "Source Sheet": "A3.1 / A7.1"
  },
  {
    "Dwelling": "Main Residence",
    "Space": "Office",
    "Area (SF)": 239,
    "Plan Dimensions": "14'5\" x 14'7\"",
    "Floor Finish": "Hardwood",
    "Ceiling Height": "10'-0\"",
    "Cabinetry / Built-ins": "Cabinetry / shelving where shown",
    "Plumbing": null,
    "Appliances / Equipment": null,
    "Door & Window References": "Doors 07, 33; Windows 14-16",
    "Scope Description": "Dedicated office. Include flooring, built-ins, data/power, lighting, full-lite exterior door and window assemblies.",
    "Review / Coordination": "Window 16 height appears visually overlapped on A7.1; verify before ordering.",
    "Source Sheet": "A3.1 / A7.1"
  },
  {
    "Dwelling": "Main Residence",
    "Space": "Pantry",
    "Area (SF)": 69,
    "Plan Dimensions": "10'2\" x 6'9\"",
    "Floor Finish": "Hardwood",
    "Ceiling Height": "10'-0\"",
    "Cabinetry / Built-ins": "Pantry shelving / cabinetry",
    "Plumbing": null,
    "Appliances / Equipment": null,
    "Door & Window References": "Door 29",
    "Scope Description": "Walk-in pantry supporting kitchen. Include shelving/cabinetry, flooring, lighting and full-lite door.",
    "Review / Coordination": "Door 29 noted FULL LITE - SINGLE, TEMP.",
    "Source Sheet": "A3.1 / A7.1"
  },
  {
    "Dwelling": "Main Residence",
    "Space": "Laundry",
    "Area (SF)": 98,
    "Plan Dimensions": "9'1\" x 10'",
    "Floor Finish": "Hardwood",
    "Ceiling Height": "10'-0\"",
    "Cabinetry / Built-ins": "Base/upper cabinetry and storage where shown",
    "Plumbing": "Utility connections / service sink where shown",
    "Appliances / Equipment": "Washer and dryer",
    "Door & Window References": "Door 27",
    "Scope Description": "Dedicated laundry room. Include appliance connections, cabinetry, counter/storage, ventilation, electrical, flooring and pocket door.",
    "Review / Coordination": "Verify appliance models and service sink/cabinet configuration.",
    "Source Sheet": "A3.1 / A7.1"
  },
  {
    "Dwelling": "Main Residence",
    "Space": "Mud Room",
    "Area (SF)": null,
    "Plan Dimensions": null,
    "Floor Finish": "Not separately tagged",
    "Ceiling Height": null,
    "Cabinetry / Built-ins": "Bench/cubbies/cabinetry where shown",
    "Plumbing": null,
    "Appliances / Equipment": null,
    "Door & Window References": "Adjacent Garage Door 28",
    "Scope Description": "Garage-to-house transition/drop zone. Include durable finishes, storage/bench items shown, trim, lighting and self-closing garage separation door.",
    "Review / Coordination": "No separate room SF tag on A3.1.",
    "Source Sheet": "A3.1 / A7.1"
  },
  {
    "Dwelling": "Main Residence",
    "Space": "Secondary / Hall Closets",
    "Area (SF)": null,
    "Plan Dimensions": null,
    "Floor Finish": "Not separately tagged",
    "Ceiling Height": null,
    "Cabinetry / Built-ins": "Shelf/pole, organizer systems, linen shelving as applicable",
    "Plumbing": null,
    "Appliances / Equipment": null,
    "Door & Window References": "Doors 13, 21, 25, 31, 32 as applicable",
    "Scope Description": "Closet and linen storage distributed through the plan. Include shelving/organizers, trim, paint and doors.",
    "Review / Coordination": "Individual closet areas are not separately scheduled.",
    "Source Sheet": "A3.1 / A7.1"
  },
  {
    "Dwelling": "Main Residence",
    "Space": "3-Car Garage",
    "Area (SF)": 981,
    "Plan Dimensions": null,
    "Floor Finish": "Concrete",
    "Ceiling Height": "10'-0\"",
    "Cabinetry / Built-ins": "Utility/storage items as shown",
    "Plumbing": "Utility connections as shown",
    "Appliances / Equipment": "Electrical panels/battery/storage equipment as shown",
    "Door & Window References": "Doors 08-12, 28",
    "Scope Description": "Attached 3-car garage. Include concrete slab finish, sectional garage doors/operators, fire separation, utility/electrical equipment, lighting and self-closing house door.",
    "Review / Coordination": "Garage is outside 4,344 SF main living area.",
    "Source Sheet": "A3.1 / A7.1"
  },
  {
    "Dwelling": "Main Residence",
    "Space": "Deck / Covered Deck / Trellis",
    "Area (SF)": 1254,
    "Plan Dimensions": null,
    "Floor Finish": "Exterior deck finish per plans",
    "Ceiling Height": "Exterior",
    "Cabinetry / Built-ins": "Exterior built-ins / BBQ area where shown",
    "Plumbing": "Exterior plumbing/gas where shown",
    "Appliances / Equipment": "Outdoor BBQ by owner where shown",
    "Door & Window References": "Multiple exterior openings from living/dining/bedroom",
    "Scope Description": "Exterior living/deck system including covered and trellis areas, guardrails, exterior lighting, finish decking and interfaces with glazed openings.",
    "Review / Coordination": "Area is plan-tagged deck total; verify finish and guardrail packages.",
    "Source Sheet": "A3.1"
  },
  {
    "Dwelling": "ADU",
    "Space": "Living Room",
    "Area (SF)": 308,
    "Plan Dimensions": "15'7\" x 17'9\"",
    "Floor Finish": "Hardwood",
    "Ceiling Height": "10'-0\"",
    "Cabinetry / Built-ins": "Fireplace surround / cabinetry where shown",
    "Plumbing": null,
    "Appliances / Equipment": "Montigo 46\" fireplace",
    "Door & Window References": "Door 52; Windows 55, 56",
    "Scope Description": "Main ADU gathering space. Include fireplace, hardwood, trim, lighting/electrical and glazed pocket/window systems.",
    "Review / Coordination": "Door 52 and windows 55-56 are tempered glazed conditions.",
    "Source Sheet": "A3.2 / A7.1"
  },
  {
    "Dwelling": "ADU",
    "Space": "Kitchen",
    "Area (SF)": 139,
    "Plan Dimensions": null,
    "Floor Finish": "Hardwood",
    "Ceiling Height": "10'-0\"",
    "Cabinetry / Built-ins": "Kitchen cabinetry, pantry interface, counters",
    "Plumbing": "Kitchen sink",
    "Appliances / Equipment": "Range/cooktop + hood; dishwasher; disposal; refrigerator; other appliances as shown",
    "Door & Window References": "Window 54; Pantry Door 57",
    "Scope Description": "Full ADU kitchen scope including cabinets, counters, appliances, plumbing, backsplash, electrical/lighting and ventilation.",
    "Review / Coordination": "Window 54 and Door 57 noted TEMP.",
    "Source Sheet": "A3.2 / A7.1"
  },
  {
    "Dwelling": "ADU",
    "Space": "Entry",
    "Area (SF)": 45,
    "Plan Dimensions": null,
    "Floor Finish": "Hardwood",
    "Ceiling Height": "10'-0\"",
    "Cabinetry / Built-ins": "Entry trim / millwork",
    "Plumbing": null,
    "Appliances / Equipment": null,
    "Door & Window References": "Door 51",
    "Scope Description": "Dedicated ADU entry. Include custom entry door, flooring, trim, lighting and finishes.",
    "Review / Coordination": "Door 51 noted CUSTOM ENTRY PER OWNER.",
    "Source Sheet": "A3.2 / A7.1"
  },
  {
    "Dwelling": "ADU",
    "Space": "Bedroom 1 / Primary",
    "Area (SF)": 170,
    "Plan Dimensions": "13'2\" x 13'8\"",
    "Floor Finish": "Hardwood",
    "Ceiling Height": "10'-0\"",
    "Cabinetry / Built-ins": "Associated primary closet",
    "Plumbing": null,
    "Appliances / Equipment": null,
    "Door & Window References": "Doors 53, 59; Window 53",
    "Scope Description": "Larger ADU bedroom, treated as primary in door schedule. Include flooring, trim, closet, lighting/electrical and exterior sliding glass door.",
    "Review / Coordination": "Door 53 is tempered sliding glass.",
    "Source Sheet": "A3.2 / A7.1"
  },
  {
    "Dwelling": "ADU",
    "Space": "Primary Closet",
    "Area (SF)": null,
    "Plan Dimensions": null,
    "Floor Finish": "Not separately tagged",
    "Ceiling Height": null,
    "Cabinetry / Built-ins": "Closet organizer / shelving",
    "Plumbing": null,
    "Appliances / Equipment": null,
    "Door & Window References": "Door 60",
    "Scope Description": "Closet associated with ADU Bedroom 1 / Primary. Include organizer system, trim, paint and pocket door.",
    "Review / Coordination": "No separate SF tag on A3.2.",
    "Source Sheet": "A3.2 / A7.1"
  },
  {
    "Dwelling": "ADU",
    "Space": "Bath 1 / Primary Bath",
    "Area (SF)": 42,
    "Plan Dimensions": null,
    "Floor Finish": "Hardwood",
    "Ceiling Height": "10'-0\"",
    "Cabinetry / Built-ins": "Vanity / linen storage per plan",
    "Plumbing": "Lavatory, WC compartment, shower where shown",
    "Appliances / Equipment": "Bath exhaust / accessories",
    "Door & Window References": "Door 61; Toilet Door 62; Windows 51, 52",
    "Scope Description": "Primary-side ADU bathroom. Include vanity, plumbing fixtures, wet-area protection, accessories, lighting and ventilation.",
    "Review / Coordination": "A3.2 labels BATH 1; A7.1 door schedule uses ADU PRIMARY BATH/TOILET.",
    "Source Sheet": "A3.2 / A7.1"
  },
  {
    "Dwelling": "ADU",
    "Space": "Bedroom 2",
    "Area (SF)": 139,
    "Plan Dimensions": "12'10\" x 11'",
    "Floor Finish": "Hardwood",
    "Ceiling Height": "10'-0\"",
    "Cabinetry / Built-ins": "Associated closet",
    "Plumbing": null,
    "Appliances / Equipment": null,
    "Door & Window References": "Door 64; Closet Door 65; Window 50",
    "Scope Description": "Second ADU bedroom. Include flooring, trim, closet, lighting/electrical and scheduled openings.",
    "Review / Coordination": "Window 50 is double single-hung.",
    "Source Sheet": "A3.2 / A7.1"
  },
  {
    "Dwelling": "ADU",
    "Space": "Bath 2",
    "Area (SF)": 45,
    "Plan Dimensions": null,
    "Floor Finish": "Hardwood",
    "Ceiling Height": "10'-0\"",
    "Cabinetry / Built-ins": "Vanity / storage per plan",
    "Plumbing": "Lavatory, WC, shower where shown",
    "Appliances / Equipment": "Bath exhaust / accessories",
    "Door & Window References": "Door 63",
    "Scope Description": "Second ADU bathroom. Include plumbing fixtures, cabinetry, wet-area protection, lighting, exhaust and accessories.",
    "Review / Coordination": "Verify final wet-area floor/wall finish selections.",
    "Source Sheet": "A3.2 / A7.1"
  },
  {
    "Dwelling": "ADU",
    "Space": "Mud Room",
    "Area (SF)": null,
    "Plan Dimensions": null,
    "Floor Finish": "Not separately tagged",
    "Ceiling Height": null,
    "Cabinetry / Built-ins": "Storage/bench items where shown",
    "Plumbing": null,
    "Appliances / Equipment": null,
    "Door & Window References": "Door 56",
    "Scope Description": "Transition space at garage/ADU connection. Include storage, trim, lighting and self-closing separation door.",
    "Review / Coordination": "No separate SF tag on A3.2.",
    "Source Sheet": "A3.2 / A7.1"
  },
  {
    "Dwelling": "ADU",
    "Space": "Pantry",
    "Area (SF)": null,
    "Plan Dimensions": null,
    "Floor Finish": "Not separately tagged",
    "Ceiling Height": null,
    "Cabinetry / Built-ins": "Pantry shelving / cabinetry",
    "Plumbing": null,
    "Appliances / Equipment": null,
    "Door & Window References": "Door 57",
    "Scope Description": "Kitchen pantry/storage. Include shelving/cabinetry and full-lite door.",
    "Review / Coordination": "No separate SF tag on A3.2.",
    "Source Sheet": "A3.2 / A7.1"
  },
  {
    "Dwelling": "ADU",
    "Space": "Linen / Hall Storage",
    "Area (SF)": null,
    "Plan Dimensions": null,
    "Floor Finish": "Not separately tagged",
    "Ceiling Height": null,
    "Cabinetry / Built-ins": "Linen shelving / storage",
    "Plumbing": null,
    "Appliances / Equipment": null,
    "Door & Window References": "Hallway Doors 54, 58 as applicable",
    "Scope Description": "Hall linen/storage and circulation support spaces. Include shelving, trim, paint, lighting and doors.",
    "Review / Coordination": "No separate SF tag on A3.2.",
    "Source Sheet": "A3.2 / A7.1"
  },
  {
    "Dwelling": "ADU",
    "Space": "Storage Area",
    "Area (SF)": null,
    "Plan Dimensions": null,
    "Floor Finish": "Exterior/utility area per plan",
    "Ceiling Height": null,
    "Cabinetry / Built-ins": "Storage build-out as shown",
    "Plumbing": null,
    "Appliances / Equipment": null,
    "Door & Window References": "Door 35 may serve ADU/service exterior condition; verify plan",
    "Scope Description": "Large area labeled STORAGE adjacent/under main residence. Scope per architectural/structural conditions shown.",
    "Review / Coordination": "No separate SF tag on A3.2; relationship to Door 35 should be verified before procurement.",
    "Source Sheet": "A3.2 / A7.1"
  },
  {
    "Dwelling": "ADU",
    "Space": "2-Car Garage",
    "Area (SF)": 735,
    "Plan Dimensions": null,
    "Floor Finish": "Concrete",
    "Ceiling Height": "10'-0\"",
    "Cabinetry / Built-ins": "Utility/storage items as shown",
    "Plumbing": "Utility connections as shown",
    "Appliances / Equipment": "Garage equipment",
    "Door & Window References": "Doors 50, 55, 56",
    "Scope Description": "Attached 2-car garage. Include slab, sectional door/operator, fire separation, lighting, utility work and self-closing connection to mud room.",
    "Review / Coordination": "Garage is outside ADU living area.",
    "Source Sheet": "A3.2 / A7.1"
  }
];

const doorRows = [
  {
    "Mark": "01",
    "Location": "ENTRY",
    "Width": "5'",
    "Height": "9'",
    "Type": "SC - ENTRY",
    "Notes": "CUSTOM ENTRY PER OWNER",
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "02",
    "Location": "PRIMARY BEDROOM",
    "Width": "8'",
    "Height": "8'",
    "Type": "SLIDING GLASS-XO",
    "Notes": "TEMP",
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "03",
    "Location": "LIVING ROOM",
    "Width": "16'",
    "Height": "9'",
    "Type": "FOLDING GLASS",
    "Notes": "TEMP",
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "04",
    "Location": "LIVING ROOM",
    "Width": "18'",
    "Height": "9'",
    "Type": "GLASS - POCKET",
    "Notes": "TEMP",
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "05",
    "Location": "DINING ROOM",
    "Width": "10'",
    "Height": "9'",
    "Type": "FOLDING GLASS",
    "Notes": "TEMP",
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "06",
    "Location": "FAMILY ROOM",
    "Width": "12'",
    "Height": "8'",
    "Type": "GLASS - POCKET",
    "Notes": "TEMP",
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "07",
    "Location": "OFFICE",
    "Width": "3'",
    "Height": "8'",
    "Type": "FULL LITE SINGLE",
    "Notes": "TEMP",
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "08",
    "Location": "GARAGE",
    "Width": "8'",
    "Height": "8'",
    "Type": "SEC - GARAGE",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "09",
    "Location": "GARAGE",
    "Width": "9'",
    "Height": "8'",
    "Type": "SEC - GARAGE",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "10",
    "Location": "GARAGE",
    "Width": "9'",
    "Height": "8'",
    "Type": "SEC - GARAGE",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "11",
    "Location": "GARAGE",
    "Width": "9'",
    "Height": "8'",
    "Type": "SEC - GARAGE",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "12",
    "Location": "GARAGE",
    "Width": "3'",
    "Height": "8'",
    "Type": "SC",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "13",
    "Location": "CLOSET",
    "Width": "2'-8\"",
    "Height": "8'",
    "Type": "SC",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "14",
    "Location": "PRIMARY TOILET",
    "Width": "2'-8\"",
    "Height": "8'",
    "Type": "SC",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "15",
    "Location": "PRIMARY W/D",
    "Width": "3'",
    "Height": "8'",
    "Type": "SC",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "16",
    "Location": "PRIMARY BEDROOM",
    "Width": "3'",
    "Height": "8'",
    "Type": "SC",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "17",
    "Location": "PRIMARY BATH",
    "Width": "3'",
    "Height": "8'",
    "Type": "SC - POCKET",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "18",
    "Location": "PRIMARY CLOSET",
    "Width": "3'",
    "Height": "8'",
    "Type": "SC",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "19",
    "Location": "BATH 2",
    "Width": "2'-8\"",
    "Height": "8'",
    "Type": "SC",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "20",
    "Location": "BATH 2",
    "Width": "3'",
    "Height": "8'",
    "Type": "SC - POCKET",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "21",
    "Location": "CLOSET 2",
    "Width": "2'-8\"",
    "Height": "8'",
    "Type": "SC",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "22",
    "Location": "BEDROOM 2",
    "Width": "2'-8\"",
    "Height": "8'",
    "Type": "SC",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "23",
    "Location": "BEDROOM 3",
    "Width": "2'-8\"",
    "Height": "8'",
    "Type": "SC",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "24",
    "Location": "BATH 3",
    "Width": "2'-8\"",
    "Height": "8'",
    "Type": "SC",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "25",
    "Location": "CLOSET 3",
    "Width": "2'-8\"",
    "Height": "8'",
    "Type": "SC",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "27",
    "Location": "LAUNDRY",
    "Width": "3'",
    "Height": "8'",
    "Type": "SC - POCKET",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "28",
    "Location": "GARAGE",
    "Width": "3'",
    "Height": "8'",
    "Type": "SC",
    "Notes": "SELF - CLOSING",
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "29",
    "Location": "PANTRY",
    "Width": "2'-8\"",
    "Height": "8'",
    "Type": "FULL LITE - SINGLE",
    "Notes": "TEMP",
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "30",
    "Location": "FAMILY ROOM",
    "Width": "2'-8\"",
    "Height": "8'",
    "Type": "SC",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "31",
    "Location": "CLOSET",
    "Width": "5'",
    "Height": "8'",
    "Type": "SC",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "32",
    "Location": "CLOSET",
    "Width": "2'-8\"",
    "Height": "8'",
    "Type": "SC",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "33",
    "Location": "OFFICE",
    "Width": "2'-8\"",
    "Height": "8'",
    "Type": "SC",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "34",
    "Location": "BATH 4",
    "Width": "2'-8\"",
    "Height": "8'",
    "Type": "SC",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "35",
    "Location": "ADU",
    "Width": "5'",
    "Height": "6'-8\"",
    "Type": "SC - DBL DOOR",
    "Notes": "EXTERIOR",
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "50",
    "Location": "ADU GARAGE",
    "Width": "18'",
    "Height": "8'",
    "Type": "SEC - GARAGE",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "51",
    "Location": "ADU ENTRY",
    "Width": "4'",
    "Height": "8'",
    "Type": "SC - ENTRY",
    "Notes": "CUSTOM ENTRY PER OWNER",
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "52",
    "Location": "ADU LIVING ROOM",
    "Width": "12'",
    "Height": "8'",
    "Type": "GLASS - POCKET",
    "Notes": "TEMP",
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "53",
    "Location": "ADU BEDROOM 1",
    "Width": "8'",
    "Height": "8'",
    "Type": "SLIDING GLASS",
    "Notes": "TEMP",
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "54",
    "Location": "ADU HALLWAY",
    "Width": "3'",
    "Height": "8'",
    "Type": "FULL LITE SINGLE",
    "Notes": "TEMP",
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "55",
    "Location": "ADU GARAGE",
    "Width": "3'",
    "Height": "8'",
    "Type": "SC - EXTERIOR",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "56",
    "Location": "ADU MUD ROOM",
    "Width": "3'",
    "Height": "8'",
    "Type": "SC",
    "Notes": "SELF CLOSING",
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "57",
    "Location": "ADU PANTRY",
    "Width": "2'-6\"",
    "Height": "8'",
    "Type": "FULL LITE SINGLE",
    "Notes": "TEMP",
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "58",
    "Location": "ADU HALLWAY",
    "Width": "5'",
    "Height": "6'-8\"",
    "Type": "SC - BYPASS",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "59",
    "Location": "ADU PRIMARY",
    "Width": "2'-10\"",
    "Height": "8'",
    "Type": "SC",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "60",
    "Location": "ADU PRIMARY CLOSET",
    "Width": "2'-10\"",
    "Height": "8'",
    "Type": "SC - POCKET",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "61",
    "Location": "ADU PRIMARY BATH",
    "Width": "3'",
    "Height": "8'",
    "Type": "SC - POCKET",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "62",
    "Location": "ADU PRIMARY TOILET",
    "Width": "2'-10\"",
    "Height": "8'",
    "Type": "SC",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "63",
    "Location": "ADU BATH 2",
    "Width": "2'-10\"",
    "Height": "8'",
    "Type": "SC",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "64",
    "Location": "ADU BEDROOM 2",
    "Width": "2'-10\"",
    "Height": "8'",
    "Type": "SC",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "Mark": "65",
    "Location": "ADU BEDROOM 2 CLOSET",
    "Width": "6'",
    "Height": "6'-8\"",
    "Type": "SC - BYPASS",
    "Notes": null,
    "Source Sheet": "A7.1"
  }
];

const windowRows = [
  {
    "ID": "01",
    "Location": "PRIMARY BATH",
    "Width": "2'-6\"",
    "Height": "6'-6\"",
    "Type": "SINGLE HUNG W/ 2-6 X 2' H FIXED ABV",
    "Material": "FIBERGLASS",
    "Notes": "TEMP",
    "Source Sheet": "A7.1"
  },
  {
    "ID": "02",
    "Location": "PRIMARY BATH",
    "Width": "2'-6\"",
    "Height": "6'-6\"",
    "Type": "SINGLE HUNG W/ 2-6 X 2' H FIXED ABV",
    "Material": "FIBERGLASS",
    "Notes": "TEMP",
    "Source Sheet": "A7.1"
  },
  {
    "ID": "03",
    "Location": "PRIMARY BATH",
    "Width": "2'-6\"",
    "Height": "6'-6\"",
    "Type": "SINGLE HUNG W/ 2-6 X 2' H FIXED ABV",
    "Material": "FIBERGLASS",
    "Notes": "TEMP",
    "Source Sheet": "A7.1"
  },
  {
    "ID": "04",
    "Location": "PRIMARY CLOSET",
    "Width": "2'-6\"",
    "Height": "7'",
    "Type": "SINGLE HUNG W/ 2-6 X 2' H FIXED ABV",
    "Material": "FIBERGLASS",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "ID": "05",
    "Location": "PRIMARY CLOSET",
    "Width": "2'-6\"",
    "Height": "7'",
    "Type": "SINGLE HUNG W/ 2-6 X 2' H FIXED ABV",
    "Material": "FIBERGLASS",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "ID": "06",
    "Location": "PRIMARY CLOSET",
    "Width": "2'-6\"",
    "Height": "7'",
    "Type": "SINGLE HUNG W/ 2-6 X 2' H FIXED ABV",
    "Material": "FIBERGLASS",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "ID": "07",
    "Location": "PRIMARY BEDROOM",
    "Width": "2'",
    "Height": "4'",
    "Type": "SINGLE HUNG",
    "Material": "FIBERGLASS",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "ID": "08",
    "Location": "PRIMARY BEDROOM",
    "Width": "2'",
    "Height": "4'",
    "Type": "SINGLE HUNG",
    "Material": "FIBERGLASS",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "ID": "09",
    "Location": "DINING ROOM",
    "Width": "2'-6\"",
    "Height": "8'",
    "Type": "SINGLE HUNG W/ TRANSOM ABV",
    "Material": "FIBERGLASS",
    "Notes": "BOTTOM FIXED PANEL TEMP",
    "Source Sheet": "A7.1"
  },
  {
    "ID": "10",
    "Location": "DINING ROOM",
    "Width": "6'",
    "Height": "8'",
    "Type": "FIXED W/ TRANSOM ABV",
    "Material": "FIBERGLASS",
    "Notes": "UPPER AWNING 2' HIGH - TEMP",
    "Source Sheet": "A7.1"
  },
  {
    "ID": "11",
    "Location": "DINING ROOM",
    "Width": "2'-6\"",
    "Height": "8'",
    "Type": "SINGLE HUNG W/ TRANSOM ABV",
    "Material": "FIBERGLASS",
    "Notes": "BOTTOM FIXED PANEL TEMP",
    "Source Sheet": "A7.1"
  },
  {
    "ID": "12",
    "Location": "DINING ROOM",
    "Width": "6'",
    "Height": "4'",
    "Type": "AWNING",
    "Material": "FIBERGLASS",
    "Notes": "TEMP",
    "Source Sheet": "A7.1"
  },
  {
    "ID": "13",
    "Location": "BATH 4",
    "Width": "2'",
    "Height": "4'",
    "Type": "SINGLE HUNG",
    "Material": "FIBERGLASS",
    "Notes": "TEMP",
    "Source Sheet": "A7.1"
  },
  {
    "ID": "14",
    "Location": "OFFICE",
    "Width": "2'-6\"",
    "Height": "4'-6\"",
    "Type": "SINGLE HUNG W/ 2-6 X 2' H FIXED BLW",
    "Material": "FIBERGLASS",
    "Notes": "BOTTOM FIXED PANEL TEMP",
    "Source Sheet": "A7.1"
  },
  {
    "ID": "15",
    "Location": "OFFICE",
    "Width": "6'",
    "Height": "6'-6\"",
    "Type": "FIXED W/ AWNING TRANSOM ABV",
    "Material": "FIBERGLASS",
    "Notes": "UPPER AWNING 2' HIGH - TEMP",
    "Source Sheet": "A7.1"
  },
  {
    "ID": "16",
    "Location": "OFFICE",
    "Width": "2'-6\"",
    "Height": "4'-6\"*",
    "Type": "SINGLE HUNG W/ 2-6 X 2' H FIXED BLW",
    "Material": "FIBERGLASS",
    "Notes": "BOTTOM FIXED PANEL TEMP; *HEIGHT TEXT OVERLAPS ON A7.1 - VERIFY",
    "Source Sheet": "A7.1"
  },
  {
    "ID": "17",
    "Location": "BEDROOM 3",
    "Width": "2'-6\"",
    "Height": "7'",
    "Type": "SINGLE HUNG W/ 2-6 X 2' H FIXED ABV",
    "Material": "FIBERGLASS",
    "Notes": "EGRESS",
    "Source Sheet": "A7.1"
  },
  {
    "ID": "18",
    "Location": "BEDROOM 3",
    "Width": "2'-6\"",
    "Height": "6'-6\"",
    "Type": "SINGLE HUNG W/ 2-6 X 2' H FIXED ABV",
    "Material": "FIBERGLASS",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "ID": "19",
    "Location": "BEDROOM 3",
    "Width": "2'-6\"",
    "Height": "7'",
    "Type": "SINGLE HUNG W/ 2-6 X 2' H FIXED ABV",
    "Material": "FIBERGLASS",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "ID": "20",
    "Location": "BEDROOM 2",
    "Width": "2'-6\"",
    "Height": "6'-6\"",
    "Type": "SINGLE HUNG W/ 2-6 X 2' H FIXED ABV",
    "Material": "FIBERGLASS",
    "Notes": "EGRESS",
    "Source Sheet": "A7.1"
  },
  {
    "ID": "21",
    "Location": "BEDROOM 2",
    "Width": "2'-6\"",
    "Height": "6'-6\"",
    "Type": "SINGLE HUNG W/ 2-6 X 2' H FIXED ABV",
    "Material": "FIBERGLASS",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "ID": "22",
    "Location": "BEDROOM 2",
    "Width": "2'-6\"",
    "Height": "6'-6\"",
    "Type": "SINGLE HUNG W/ 2-6 X 2' H FIXED ABV",
    "Material": "FIBERGLASS",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "ID": "23",
    "Location": "ENTRY",
    "Width": "2'-6\"",
    "Height": "9'-2\"",
    "Type": "FIXED",
    "Material": "FIBERGLASS",
    "Notes": "TEMP",
    "Source Sheet": "A7.1"
  },
  {
    "ID": "24",
    "Location": "ENTRY",
    "Width": "2'-6\"",
    "Height": "9'-2\"",
    "Type": "FIXED",
    "Material": "FIBERGLASS",
    "Notes": "TEMP",
    "Source Sheet": "A7.1"
  },
  {
    "ID": "50",
    "Location": "ADU BEDROOM 2",
    "Width": "5'",
    "Height": "5'",
    "Type": "DBL SINGLE HUNG",
    "Material": "FIBERGLASS",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "ID": "51",
    "Location": "ADU BATH 1",
    "Width": "2'",
    "Height": "4'",
    "Type": "SINGLE HUNG",
    "Material": "FIBERGLASS",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "ID": "52",
    "Location": "ADU BATH 1",
    "Width": "2'",
    "Height": "4'",
    "Type": "SINGLE HUNG",
    "Material": "FIBERGLASS",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "ID": "53",
    "Location": "ADU BEDROOM 1",
    "Width": "7'",
    "Height": "2'",
    "Type": "SINGLE HUNG W/ TRANSOM ABV",
    "Material": "FIBERGLASS",
    "Notes": null,
    "Source Sheet": "A7.1"
  },
  {
    "ID": "54",
    "Location": "ADU KITCHEN",
    "Width": "5'-6\"",
    "Height": "4'",
    "Type": "AWNING",
    "Material": "FIBERGLASS",
    "Notes": "TEMP",
    "Source Sheet": "A7.1"
  },
  {
    "ID": "55",
    "Location": "ADU LIVING ROOM",
    "Width": "2'-6\"",
    "Height": "7'",
    "Type": "SINGLE HUNG W/ TRANSOM ABV",
    "Material": "FIBERGLASS",
    "Notes": "BOTTOM FIXED PANEL TEMP",
    "Source Sheet": "A7.1"
  },
  {
    "ID": "56",
    "Location": "ADU LIVING ROOM",
    "Width": "2'-6\"",
    "Height": "7'",
    "Type": "SINGLE HUNG W/ TRANSOM ABV",
    "Material": "FIBERGLASS",
    "Notes": "BOTTOM FIXED PANEL TEMP",
    "Source Sheet": "A7.1"
  },
  {
    "ID": "57",
    "Location": "ADU GARAGE",
    "Width": "7'",
    "Height": "2'",
    "Type": "FIXED",
    "Material": "FIBERGLASS",
    "Notes": "TEMP",
    "Source Sheet": "A7.1"
  }
];

const projectNoteRows = [
  {
    "Item": "Main residence living area",
    "Value / Requirement": "4,344 SF",
    "Source": "A3.1 / A1.0",
    "Status": "PLAN DATA",
    "Owner / Trade": null,
    "Notes": null
  },
  {
    "Item": "Main residence garage",
    "Value / Requirement": "981 SF",
    "Source": "A3.1 / A1.0",
    "Status": "PLAN DATA",
    "Owner / Trade": null,
    "Notes": null
  },
  {
    "Item": "Main residence deck",
    "Value / Requirement": "1,254 SF",
    "Source": "A3.1",
    "Status": "PLAN DATA",
    "Owner / Trade": null,
    "Notes": null
  },
  {
    "Item": "ADU living area (A3.2 room tag)",
    "Value / Requirement": "1,196 SF",
    "Source": "A3.2",
    "Status": "PLAN DATA",
    "Owner / Trade": null,
    "Notes": null
  },
  {
    "Item": "ADU project data / energy model area",
    "Value / Requirement": "1,200 SF",
    "Source": "A1.0 / energy docs",
    "Status": "PLAN DATA",
    "Owner / Trade": null,
    "Notes": null
  },
  {
    "Item": "ADU garage",
    "Value / Requirement": "735 SF",
    "Source": "A3.2 / A1.0",
    "Status": "PLAN DATA",
    "Owner / Trade": null,
    "Notes": null
  },
  {
    "Item": "Window material",
    "Value / Requirement": "Fiberglass",
    "Source": "A7.1",
    "Status": "PLAN DATA",
    "Owner / Trade": null,
    "Notes": null
  },
  {
    "Item": "WUI note",
    "Value / Requirement": "Exterior windows and exterior glazed door assemblies must comply with one of the listed WUI glazing/fire-resistance pathways on A7.1.",
    "Source": "A7.1",
    "Status": "VERIFY / COORDINATE",
    "Owner / Trade": null,
    "Notes": null
  },
  {
    "Item": "Procurement caution",
    "Value / Requirement": "Verify every opening dimension, handing, operation, tempering/egress note, rough opening and field condition before ordering.",
    "Source": "Coordination note",
    "Status": "VERIFY / COORDINATE",
    "Owner / Trade": null,
    "Notes": null
  }
];

// ---------------------------------------------------------------------------
// Mapping: xlsx (Dwelling, Space) -> already-imported (building, Space name)
// A `isNew: true` entry means this space doesn't exist yet and should be
// created rather than matched.
// ---------------------------------------------------------------------------

const SPACE_ALIASES = {
  "Main Residence::Primary Bedroom": { building: "Main Residence", name: "Primary Bedroom" },
  "Main Residence::Primary Bathroom": { building: "Main Residence", name: "Primary Bathroom" },
  "Main Residence::Primary Closet": { building: "Main Residence", name: "Primary Closet" },
  "Main Residence::Bedroom 2": { building: "Main Residence", name: "Bedroom 2" },
  "Main Residence::Bath 2": { building: "Main Residence", name: "Bath 2" },
  "Main Residence::Bedroom 3": { building: "Main Residence", name: "Bedroom 3" },
  "Main Residence::Bath 3": { building: "Main Residence", name: "Bath 3" },
  "Main Residence::Bath 4": { building: "Main Residence", name: "Bath 4" },
  "Main Residence::Entry / Foyer": { building: "Main Residence", name: "Entry / Foyer" },
  "Main Residence::Living Room": { building: "Main Residence", name: "Living Room" },
  "Main Residence::Kitchen": { building: "Main Residence", name: "Kitchen" },
  "Main Residence::Dining Room": { building: "Main Residence", name: "Dining Room" },
  "Main Residence::Family Room": { building: "Main Residence", name: "Family Room" },
  "Main Residence::Office": { building: "Main Residence", name: "Office" },
  "Main Residence::Pantry": { building: "Main Residence", name: "Pantry" },
  "Main Residence::Laundry": { building: "Main Residence", name: "Laundry Room" },
  "Main Residence::Mud Room": { building: "Main Residence", name: "Mud Room" },
  "Main Residence::Secondary / Hall Closets": { building: "Main Residence", name: "Secondary Closets" },
  "Main Residence::3-Car Garage": { building: "Main Residence", name: "3-Car Garage" },
  "Main Residence::Deck / Covered Deck / Trellis": { building: "Main Residence", name: "Deck / Outdoor Living" },

  "ADU::Living Room": { building: "Detached ADU", name: "Living Room" },
  "ADU::Kitchen": { building: "Detached ADU", name: "Kitchen" },
  "ADU::Entry": { building: "Detached ADU", name: "Entry" },
  "ADU::Bedroom 1 / Primary": { building: "Detached ADU", name: "Bedroom 1" },
  "ADU::Primary Closet": { building: "Detached ADU", name: "Primary Closet", isNew: true },
  "ADU::Bath 1 / Primary Bath": { building: "Detached ADU", name: "Bath 1" },
  "ADU::Bedroom 2": { building: "Detached ADU", name: "Bedroom 2" },
  "ADU::Bath 2": { building: "Detached ADU", name: "Bath 2" },
  "ADU::Mud Room": { building: "Detached ADU", name: "Mud Room" },
  "ADU::Pantry": { building: "Detached ADU", name: "Pantry" },
  "ADU::Linen / Hall Storage": { building: "Detached ADU", name: "Linen" },
  "ADU::Storage Area": { building: "Detached ADU", name: "Storage" },
  "ADU::2-Car Garage": { building: "Detached ADU", name: "2-Car Garage" },
};

// Door Schedule "Location" -> Space. A couple are best-effort matches where
// the schedule's location label doesn't cleanly correspond to one Space;
// those get a "(location matched by best guess - verify)" note appended.
const DOOR_LOCATION_MAP = {
  "ENTRY": { building: "Main Residence", name: "Entry / Foyer" },
  "PRIMARY BEDROOM": { building: "Main Residence", name: "Primary Bedroom" },
  "LIVING ROOM": { building: "Main Residence", name: "Living Room" },
  "DINING ROOM": { building: "Main Residence", name: "Dining Room" },
  "FAMILY ROOM": { building: "Main Residence", name: "Family Room" },
  "OFFICE": { building: "Main Residence", name: "Office" },
  "GARAGE": { building: "Main Residence", name: "3-Car Garage" },
  "CLOSET": { building: "Main Residence", name: "Secondary Closets" },
  "CLOSET 2": { building: "Main Residence", name: "Secondary Closets" },
  "CLOSET 3": { building: "Main Residence", name: "Secondary Closets" },
  "PRIMARY TOILET": { building: "Main Residence", name: "Primary Bathroom" },
  "PRIMARY W/D": { building: "Main Residence", name: "Primary Closet", guess: true },
  "PRIMARY BATH": { building: "Main Residence", name: "Primary Bathroom" },
  "PRIMARY CLOSET": { building: "Main Residence", name: "Primary Closet" },
  "BATH 2": { building: "Main Residence", name: "Bath 2" },
  "BEDROOM 2": { building: "Main Residence", name: "Bedroom 2" },
  "BEDROOM 3": { building: "Main Residence", name: "Bedroom 3" },
  "BATH 3": { building: "Main Residence", name: "Bath 3" },
  "LAUNDRY": { building: "Main Residence", name: "Laundry Room" },
  "PANTRY": { building: "Main Residence", name: "Pantry" },
  "BATH 4": { building: "Main Residence", name: "Bath 4" },
  "ADU": { building: "Detached ADU", name: "Storage", guess: true },
  "ADU GARAGE": { building: "Detached ADU", name: "2-Car Garage" },
  "ADU ENTRY": { building: "Detached ADU", name: "Entry" },
  "ADU LIVING ROOM": { building: "Detached ADU", name: "Living Room" },
  "ADU BEDROOM 1": { building: "Detached ADU", name: "Bedroom 1" },
  "ADU HALLWAY": { building: "Detached ADU", name: "Linen" },
  "ADU MUD ROOM": { building: "Detached ADU", name: "Mud Room" },
  "ADU PANTRY": { building: "Detached ADU", name: "Pantry" },
  "ADU PRIMARY": { building: "Detached ADU", name: "Bedroom 1" },
  "ADU PRIMARY CLOSET": { building: "Detached ADU", name: "Primary Closet" },
  "ADU PRIMARY BATH": { building: "Detached ADU", name: "Bath 1" },
  "ADU PRIMARY TOILET": { building: "Detached ADU", name: "Bath 1" },
  "ADU BATH 2": { building: "Detached ADU", name: "Bath 2" },
  "ADU BEDROOM 2": { building: "Detached ADU", name: "Bedroom 2" },
  "ADU BEDROOM 2 CLOSET": { building: "Detached ADU", name: "Bedroom 2", guess: true },
};

const WINDOW_LOCATION_MAP = {
  "ADU BATH 1": { building: "Detached ADU", name: "Bath 1" },
  "ADU BEDROOM 1": { building: "Detached ADU", name: "Bedroom 1" },
  "ADU BEDROOM 2": { building: "Detached ADU", name: "Bedroom 2" },
  "ADU GARAGE": { building: "Detached ADU", name: "2-Car Garage" },
  "ADU KITCHEN": { building: "Detached ADU", name: "Kitchen" },
  "ADU LIVING ROOM": { building: "Detached ADU", name: "Living Room" },
  "BATH 4": { building: "Main Residence", name: "Bath 4" },
  "BEDROOM 2": { building: "Main Residence", name: "Bedroom 2" },
  "BEDROOM 3": { building: "Main Residence", name: "Bedroom 3" },
  "DINING ROOM": { building: "Main Residence", name: "Dining Room" },
  "ENTRY": { building: "Main Residence", name: "Entry / Foyer" },
  "OFFICE": { building: "Main Residence", name: "Office" },
  "PRIMARY BATH": { building: "Main Residence", name: "Primary Bathroom" },
  "PRIMARY BEDROOM": { building: "Main Residence", name: "Primary Bedroom" },
  "PRIMARY CLOSET": { building: "Main Residence", name: "Primary Closet" },
};

const NOTES_MARKER = "[Imported from Room Scope sheet";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(label, value) {
  if (value === null || value === undefined || value === "") return null;
  return `${label}: ${value}`;
}

function buildRoomScopeBlock(row, sourceKey) {
  const lines = [
    `${NOTES_MARKER} - ${sourceKey}, imported ${new Date().toISOString().slice(0, 10)}]`,
    fmt("Plan dimensions", row["Plan Dimensions"]),
    fmt("Floor finish", row["Floor Finish"]),
    fmt("Ceiling height", row["Ceiling Height"]),
    fmt("Cabinetry / built-ins", row["Cabinetry / Built-ins"]),
    fmt("Plumbing", row["Plumbing"]),
    fmt("Appliances / equipment", row["Appliances / Equipment"]),
    fmt("Door & window references", row["Door & Window References"]),
    fmt("Scope description", row["Scope Description"]),
    fmt("Review / coordination", row["Review / Coordination"]),
    fmt("Source sheet", row["Source Sheet"]),
  ].filter(Boolean);
  return lines.join("\n");
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

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`Target: ${BASE_URL}\n`);

  // --- 1. Load existing spaces, assets, systems, projects ---
  const spaces = await getJson(`${BASE_URL}/api/spaces`);
  const spaceByKey = new Map(spaces.map((s) => [`${s.building}::${s.name}`, s]));

  let assets = await getJson(`${BASE_URL}/api/assets`);
  const assetKey = (name, spaceId) => `${name}::${spaceId}`;
  const assetSet = new Set(assets.map((a) => assetKey(a.name, a.spaceId)));

  let systems = await getJson(`${BASE_URL}/api/systems`);
  const systemByName = new Map(systems.map((s) => [s.name, s]));

  const projects = await getJson(`${BASE_URL}/api/projects`);
  const projectNames = new Set(projects.map((p) => p.name));

  // --- 2. Room Scope: enrich existing spaces, create the one new space ---
  console.log("=== Room Scope ===");
  let roomUpdated = 0, roomSkipped = 0, roomCreated = 0, roomUnmatched = 0;

  for (const row of roomScopeRows) {
    const sourceKey = `${row.Dwelling}::${row.Space}`;
    const alias = SPACE_ALIASES[sourceKey];
    if (!alias) {
      console.warn(`  UNMATCHED room scope row (no alias): ${sourceKey}`);
      roomUnmatched++;
      continue;
    }

    const key = `${alias.building}::${alias.name}`;
    let space = spaceByKey.get(key);

    if (alias.isNew && !space) {
      const created = await postJson(`${BASE_URL}/api/spaces`, {
        name: alias.name,
        building: alias.building,
        squareFootage: typeof row["Area (SF)"] === "number" ? row["Area (SF)"] : null,
        description: row["Scope Description"] || null,
      });
      console.log(`  CREATED new space: ${alias.name} [${alias.building}]`);
      spaceByKey.set(key, created);
      space = created;
      roomCreated++;
    }

    if (!space) {
      console.warn(`  UNMATCHED room scope row (space not found): ${key}`);
      roomUnmatched++;
      continue;
    }

    if ((space.notes || "").includes(NOTES_MARKER)) {
      console.log(`  SKIP (already enriched): ${space.name} [${space.building}]`);
      roomSkipped++;
      continue;
    }

    const block = buildRoomScopeBlock(row, sourceKey);
    const newNotes = space.notes ? `${space.notes}\n\n${block}` : block;

    await putJson(`${BASE_URL}/api/spaces/${space.id}`, {
      name: space.name,
      building: space.building,
      floor: space.floor,
      squareFootage: space.squareFootage,
      description: space.description,
      status: space.status,
      notes: newNotes,
    });
    console.log(`  UPDATED notes: ${space.name} [${space.building}]`);
    roomUpdated++;
  }

  console.log(
    `Room Scope done. Updated ${roomUpdated}, created ${roomCreated}, skipped ${roomSkipped}, unmatched ${roomUnmatched}.\n`
  );

  // --- 3. Ensure "Doors" and "Windows" systems exist ---
  async function ensureSystem(name, description) {
    if (systemByName.has(name)) return systemByName.get(name);
    const created = await postJson(`${BASE_URL}/api/systems`, {
      name,
      systemType: name,
      description,
    });
    console.log(`  CREATED system: ${name}`);
    systemByName.set(name, created);
    return created;
  }

  console.log("=== Systems ===");
  const doorsSystem = await ensureSystem(
    "Doors",
    "All scheduled interior and exterior doors, tracked as individually biddable assets (see Door Schedule, sheet A7.1)."
  );
  const windowsSystem = await ensureSystem(
    "Windows",
    "All scheduled fiberglass windows, tracked as individually biddable assets (see Window Schedule, sheet A7.1)."
  );
  console.log("");

  // --- 4. Door Schedule -> Assets ---
  console.log("=== Door Schedule ===");
  let doorCreated = 0, doorSkipped = 0, doorUnmatched = 0;

  for (const row of doorRows) {
    const loc = (row.Location || "").trim().toUpperCase();
    const map = DOOR_LOCATION_MAP[loc];
    if (!map) {
      console.warn(`  UNMATCHED door location: "${row.Location}" (Mark ${row.Mark})`);
      doorUnmatched++;
      continue;
    }
    const space = spaceByKey.get(`${map.building}::${map.name}`);
    if (!space) {
      console.warn(`  Space not found for door Mark ${row.Mark}: ${map.building}::${map.name}`);
      doorUnmatched++;
      continue;
    }

    const name = `Door ${row.Mark} - ${row.Location}`;
    if (assetSet.has(assetKey(name, space.id))) {
      doorSkipped++;
      continue;
    }

    const notesParts = [
      `Size: ${row.Width} x ${row.Height}`,
      row.Notes ? `Notes: ${row.Notes}` : null,
      `Source: ${row["Source Sheet"]}`,
      map.guess ? "(location matched by best guess from schedule - verify against plan)" : null,
    ].filter(Boolean);

    const created = await postJson(`${BASE_URL}/api/assets`, {
      name,
      model: row.Type,
      spaceId: space.id,
      systemId: doorsSystem.id,
      notes: notesParts.join(" | "),
      status: "pending",
    });
    assetSet.add(assetKey(name, space.id));
    doorCreated++;
  }
  console.log(`Door Schedule done. Created ${doorCreated}, skipped ${doorSkipped} (existing), unmatched ${doorUnmatched}.\n`);

  // --- 5. Window Schedule -> Assets ---
  console.log("=== Window Schedule ===");
  let winCreated = 0, winSkipped = 0, winUnmatched = 0;

  for (const row of windowRows) {
    const loc = (row.Location || "").trim().toUpperCase();
    const map = WINDOW_LOCATION_MAP[loc];
    if (!map) {
      console.warn(`  UNMATCHED window location: "${row.Location}" (ID ${row.ID})`);
      winUnmatched++;
      continue;
    }
    const space = spaceByKey.get(`${map.building}::${map.name}`);
    if (!space) {
      console.warn(`  Space not found for window ID ${row.ID}: ${map.building}::${map.name}`);
      winUnmatched++;
      continue;
    }

    const name = `Window ${row.ID} - ${row.Location}`;
    if (assetSet.has(assetKey(name, space.id))) {
      winSkipped++;
      continue;
    }

    const notesParts = [
      `Size: ${row.Width} x ${row.Height}`,
      row.Notes ? `Notes: ${row.Notes}` : null,
      `Source: ${row["Source Sheet"]}`,
    ].filter(Boolean);

    const created = await postJson(`${BASE_URL}/api/assets`, {
      name,
      model: row.Type,
      finish: row.Material,
      spaceId: space.id,
      systemId: windowsSystem.id,
      notes: notesParts.join(" | "),
      status: "pending",
    });
    assetSet.add(assetKey(name, space.id));
    winCreated++;
  }
  console.log(`Window Schedule done. Created ${winCreated}, skipped ${winSkipped} (existing), unmatched ${winUnmatched}.\n`);

  // --- 6. Project Notes -> a Project record ---
  console.log("=== Project Notes ===");
  const projectName = "Nemetz Residence - Plan Data & Coordination Notes";
  if (projectNames.has(projectName)) {
    console.log(`  SKIP (already exists): ${projectName}\n`);
  } else {
    const lines = projectNoteRows.map((n) => {
      const parts = [`${n.Item}: ${n["Value / Requirement"]}`];
      if (n.Source) parts.push(`(Source: ${n.Source})`);
      if (n.Status) parts.push(`[${n.Status}]`);
      return parts.join(" ");
    });
    const description = [
      "Plan data and coordination notes extracted from the 7/22/26 permit drawing set (Nemetz_Project_Scope_and_Schedules.xlsx). For estimating/coordination reference; architectural drawings remain controlling.",
      "",
      ...lines,
    ].join("\n");

    await postJson(`${BASE_URL}/api/projects`, {
      name: projectName,
      description,
    });
    console.log(`  CREATED project: ${projectName}\n`);
  }

  console.log("All done.");
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
