import "dotenv/config";
import { defineConfig } from "prisma/config";
import { config } from "dotenv";

config({ path: ".env.local", override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations-sqlite",
  },
  datasource: {
    url: "file:./prisma/dev.db",
  },
});
