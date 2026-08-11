import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_TRADES = [
  { name: "Plumbing", description: "Plumbing services and installations" },
  {
    name: "Electrical",
    description: "Electrical work and installations",
  },
  { name: "HVAC", description: "Heating, ventilation, and air conditioning" },
  {
    name: "Fire Sprinklers",
    description: "Fire suppression system installation and maintenance",
  },
  {
    name: "Roofing",
    description: "Roof installation, repair, and maintenance",
  },
  { name: "Framing", description: "Structural framing work" },
  {
    name: "Drywall",
    description: "Drywall installation and finishing",
  },
  {
    name: "Painting",
    description: "Interior and exterior painting services",
  },
  {
    name: "Masonry",
    description: "Brick, stone, and concrete work",
  },
  {
    name: "Carpentry",
    description: "Custom woodwork and carpentry services",
  },
  {
    name: "Doors/Windows",
    description: "Door and window installation",
  },
  {
    name: "General Labor",
    description: "General construction and labor services",
  },
];

async function main() {
  console.log("Starting database seed...");

  try {
    // Create default trades
    for (const trade of DEFAULT_TRADES) {
      const existingTrade = await prisma.trade.findUnique({
        where: { name: trade.name },
      });

      if (!existingTrade) {
        await prisma.trade.create({
          data: trade,
        });
        console.log(`✓ Created trade: ${trade.name}`);
      } else {
        console.log(`✓ Trade already exists: ${trade.name}`);
      }
    }

    console.log("\nDatabase seed completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
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
