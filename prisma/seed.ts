import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

// Custom home contractor bid categories - high-level trades used to scope
// bids, not every possible sub-scope.
const DEFAULT_TRADES = [
  { name: "Grading", description: "Site grading and earthwork" },
  { name: "Underground Utilities", description: "Underground water, sewer, gas, and electrical utility runs" },
  { name: "Foundation", description: "Foundation and slab work" },
  { name: "Retaining Walls", description: "Retaining wall construction" },
  { name: "Framing", description: "Structural framing work" },
  { name: "Structural Steel", description: "Structural steel fabrication and installation" },
  { name: "Roofing", description: "Roof installation, repair, and maintenance" },
  { name: "Waterproofing", description: "Waterproofing and moisture barriers" },
  { name: "Windows & Exterior Doors", description: "Windows and exterior door/glazed assembly installation" },
  { name: "Stucco / Exterior Finish", description: "Stucco and exterior finish systems" },
  { name: "Exterior Stone / Masonry", description: "Exterior stone veneer, brick, and masonry work" },
  { name: "Plumbing Labor", description: "Rough-in plumbing, pipe runs, drain/waste/vent, water heater install" },
  { name: "Plumbing Finishes", description: "Faucets, sinks, toilets, tubs, shower trim, and other visible plumbing fixtures" },
  { name: "Electrical", description: "Electrical work and installations" },
  { name: "HVAC", description: "Heating, ventilation, and air conditioning" },
  { name: "Fire Sprinklers", description: "Fire suppression system installation and maintenance" },
  { name: "Solar & Battery", description: "Solar panel and battery backup installation" },
  { name: "Low Voltage / Audio / Security", description: "Low-voltage wiring, audio/visual, networking, and security systems" },
  { name: "Insulation", description: "Insulation installation" },
  { name: "Drywall", description: "Drywall installation and finishing" },
  { name: "Interior Doors", description: "Interior door installation" },
  { name: "Finish Carpentry", description: "Trim, millwork, and finish carpentry" },
  { name: "Cabinets", description: "Cabinet fabrication and installation" },
  { name: "Countertops", description: "Countertop fabrication and installation" },
  { name: "Tile", description: "Tile installation" },
  { name: "Flooring", description: "Flooring installation" },
  { name: "Painting", description: "Interior and exterior painting services" },
  { name: "Glass & Mirrors", description: "Glass, mirrors, and shower glass installation" },
  { name: "Appliances", description: "Appliance delivery and installation" },
  { name: "Fireplaces", description: "Fireplace installation" },
  { name: "Garage Doors", description: "Garage door installation" },
  { name: "Decking", description: "Deck construction and decking material installation" },
  { name: "Deck / Balcony Railings", description: "Deck and balcony railing installation" },
  { name: "Exterior Metalwork", description: "Exterior metalwork and railings" },
  { name: "Flatwork", description: "Concrete flatwork - driveways, walkways, patios" },
  { name: "Pool & Spa", description: "Pool and spa construction" },
  { name: "Pool Cover", description: "Pool cover installation" },
  { name: "Fencing & Gates", description: "Fencing and gate installation" },
  { name: "Landscape", description: "Landscaping and planting" },
  { name: "Irrigation", description: "Irrigation system installation" },
  { name: "Landscape Lighting", description: "Landscape and exterior lighting" },
  { name: "Outdoor Kitchen / BBQ", description: "Outdoor kitchen and BBQ installation" },
  { name: "Patio Covers / Pergolas", description: "Patio covers and pergolas" },
  { name: "Window Coverings", description: "Window coverings and treatments" },
  { name: "Gutters & Downspouts", description: "Gutter and downspout installation" },
  { name: "Final Cleaning", description: "Final construction cleaning" },
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
