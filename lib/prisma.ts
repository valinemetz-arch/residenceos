import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "node:path";
import { existsSync } from "node:fs";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const localDbUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";
const sqlitePath = localDbUrl.startsWith("file:") ? localDbUrl.replace("file:", "") : null;

if (sqlitePath && !sqlitePath.startsWith("//") && !sqlitePath.startsWith("./") && !sqlitePath.startsWith("/")) {
  const resolvedPath = path.resolve(process.cwd(), sqlitePath);
  if (!existsSync(resolvedPath)) {
    console.warn(`Prisma SQLite database not found at ${resolvedPath}`);
  }
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error"],
    adapter: new PrismaBetterSqlite3({
      url: localDbUrl,
    }),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
