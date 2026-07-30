const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database with sample data...");

  // Clear existing data
  await prisma.asset.deleteMany({});
  await prisma.system.deleteMany({});
  await prisma.specification.deleteMany({});
  await prisma.space.deleteMany({});
  await prisma.user.deleteMany({});

  // Create user
  const user = await prisma.user.create({
    data: {
      email: "vali@legacyandlandgroup.com",
      password: "$2a$10$dXJ3SW6G7P50eS3BQRutKORE3k5WJUR6lQ6DFfp4pEPrYwIGGzfWi", // bcrypt "demo123"
      name: "Vali Nemetz",
      role: "owner",
    },
  });

  console.log("✓ Created user");

  // Create Building Systems
  const hvac = await prisma.system.create({
    data: {
      name: "HVAC",
      systemType: "Climate Control",
      description: "Heating, Ventilation, and Air Conditioning",
    },
  });

  const electrical = await prisma.system.create({
    data: {
      name: "Electrical",
      systemType: "Power Distribution",
      description: "Main electrical system and distribution",
    },
  });

  const plumbing = await prisma.system.create({
    data: {
      name: "Plumbing",
      systemType: "Water Systems",
      description: "Hot and cold water supply and drainage",
    },
  });

  const solar = await prisma.system.create({
    data: {
      name: "Solar",
      systemType: "Renewable Energy",
      description: "Solar panel installation and monitoring",
    },
  });

  const pool = await prisma.system.create({
    data: {
      name: "Pool",
      systemType: "Aquatic Systems",
      description: "Swimming pool and spa systems",
    },
  });

  console.log("✓ Created 5 building systems");

  // Create Spaces
  const kitchen = await prisma.space.create({
    data: {
      name: "Kitchen",
      building: "Main Residence",
      floor: "1st",
      squareFootage: 350,
      description: "Main kitchen with island and professional appliances",
    },
  });

  const primaryBath = await prisma.space.create({
    data: {
      name: "Primary Bath",
      building: "Main Residence",
      floor: "2nd",
      squareFootage: 200,
      description: "Luxury primary bathroom with heated floors",
    },
  });

  const garage = await prisma.space.create({
    data: {
      name: "Garage",
      building: "Main Residence",
      floor: "1st",
      squareFootage: 400,
      description: "3-car garage with epoxy flooring",
    },
  });

  const mechanicalRoom = await prisma.space.create({
    data: {
      name: "Mechanical Room",
      building: "Main Residence",
      floor: "Basement",
      squareFootage: 150,
      description: "HVAC and utility systems",
    },
  });

  const wineRoom = await prisma.space.create({
    data: {
      name: "Wine Room",
      building: "Main Residence",
      floor: "Basement",
      squareFootage: 120,
      description: "Climate-controlled wine storage",
    },
  });

  const outdoor_kitchen = await prisma.space.create({
    data: {
      name: "Outdoor Kitchen",
      building: "Main Residence",
      floor: "1st",
      squareFootage: 200,
      description: "Patio outdoor kitchen area",
    },
  });

  const aduKitchen = await prisma.space.create({
    data: {
      name: "ADU Kitchen",
      building: "Detached ADU",
      floor: "1st",
      squareFootage: 180,
      description: "Accessory dwelling unit kitchen",
    },
  });

  console.log("✓ Created 7 spaces");

  // Create Assets
  const subzeroFridge = await prisma.asset.create({
    data: {
      name: "Sub Zero Refrigerator",
      manufacturer: "Sub Zero",
      model: "BI-42SIDTID/S",
      finish: "Stainless Steel",
      cost: 6500,
      vendor: "High End Appliances",
      status: "ordered",
      spaceId: kitchen.id,
      systemId: electrical.id,
      notes: "Top-of-line refrigerator with ice maker",
    },
  });

  const thermador_range = await prisma.asset.create({
    data: {
      name: "Thermador Range",
      manufacturer: "Thermador",
      model: "PRD48",
      finish: "Stainless Steel",
      cost: 5200,
      vendor: "High End Appliances",
      status: "pending",
      spaceId: kitchen.id,
      systemId: electrical.id,
    },
  });

  const kitchen_faucet = await prisma.asset.create({
    data: {
      name: "Kitchen Faucet",
      manufacturer: "Kohler",
      model: "Stance K-22222",
      finish: "Polished Chrome",
      cost: 1800,
      vendor: "Ferguson Plumbing",
      status: "pending",
      spaceId: kitchen.id,
      systemId: plumbing.id,
    },
  });

  const toilet = await prisma.asset.create({
    data: {
      name: "Kohler Toilet",
      manufacturer: "Kohler",
      model: "Hatbox K-11917",
      finish: "Almond",
      cost: 450,
      vendor: "Ferguson Plumbing",
      status: "pending",
      spaceId: primaryBath.id,
      systemId: plumbing.id,
    },
  });

  const heated_floor = await prisma.asset.create({
    data: {
      name: "Heated Floor System",
      manufacturer: "Nuheat",
      model: "Signature",
      cost: 2500,
      vendor: "Specialty Flooring",
      status: "pending",
      spaceId: primaryBath.id,
      systemId: electrical.id,
    },
  });

  const solar_panels = await prisma.asset.create({
    data: {
      name: "Solar Panel Array",
      manufacturer: "Tesla",
      model: "Solar Roof",
      cost: 25000,
      vendor: "Tesla Energy",
      status: "pending",
      spaceId: garage.id,
      systemId: solar.id,
      notes: "10kW system with Powerwall backup",
    },
  });

  const pool_pump = await prisma.asset.create({
    data: {
      name: "Pool Pump",
      manufacturer: "Pentair",
      model: "IntelliFlo",
      cost: 1200,
      vendor: "Pool Supplies Plus",
      status: "pending",
      spaceId: garage.id,
      systemId: pool.id,
    },
  });

  console.log("✓ Created 7 assets");

  // Create Specifications
  await prisma.specification.create({
    data: {
      csiDivision: "22",
      trade: "Plumbing",
      title: "Kitchen Faucet Specification",
      text: "High-quality kitchen faucet with pull-down sprayer. Must be hot and cold supply capable.",
      spaceId: kitchen.id,
      systemId: plumbing.id,
    },
  });

  await prisma.specification.create({
    data: {
      csiDivision: "23",
      trade: "HVAC",
      title: "Mechanical Room HVAC",
      text: "Complete HVAC system with zoning for main residence and ADU.",
      spaceId: mechanicalRoom.id,
      systemId: hvac.id,
    },
  });

  console.log("✓ Created specifications");

  // Create Tasks
  await prisma.task.create({
    data: {
      title: "Kitchen Appliances Selection",
      category: "design",
      priority: "high",
      status: "completed",
      spaceId: kitchen.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Order kitchen faucet",
      category: "construction",
      priority: "medium",
      status: "in_progress",
      spaceId: kitchen.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.task.create({
    data: {
      title: "Schedule solar installation",
      category: "construction",
      priority: "high",
      status: "pending",
      spaceId: garage.id,
      systemId: solar.id,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("✓ Created tasks");

  // Create Budget Items
  await prisma.budgetItem.create({
    data: {
      category: "po",
      description: "Kitchen Appliances",
      budgetedAmount: 12000,
      actualAmount: 11700,
      status: "ordered",
      spaceId: kitchen.id,
      vendor: "High End Appliances",
    },
  });

  await prisma.budgetItem.create({
    data: {
      category: "allowance",
      description: "Solar System",
      budgetedAmount: 25000,
      actualAmount: 0,
      status: "pending",
      systemId: solar.id,
      vendor: "Tesla Energy",
    },
  });

  await prisma.budgetItem.create({
    data: {
      category: "po",
      description: "Plumbing Fixtures",
      budgetedAmount: 5000,
      actualAmount: 2700,
      status: "ordered",
      spaceId: primaryBath.id,
      vendor: "Ferguson Plumbing",
    },
  });

  console.log("✓ Created budget items");

  console.log("✅ Database seeded successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });