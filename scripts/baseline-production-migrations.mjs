import { spawnSync } from "node:child_process";

if (!process.env.VERCEL) {
  process.exit(0);
}

const prisma = "node_modules/.bin/prisma";
const configArgs = ["--config", "prisma.config.ts"];
const baselineMigrations = [
  "20260730220531_init",
  "20260809192249_add_budget_attachments",
  "20260809200521_add_budget_attachments",
  "20260810161837_add_contractor_portal",
  "20260811182342_add_docusign_contracts",
  "20260814220000_postgresql_baseline",
  "20260814230000_add_task_assignment",
  "20260816180000_add_asset_size",
  "20260821120000_add_asset_trade_and_bid_install",
  "20260821180000_add_plan_takeoffs",
];

function resolve(flag, migration) {
  return spawnSync(prisma, ["migrate", "resolve", flag, migration, ...configArgs], {
    stdio: "inherit",
  }).status === 0;
}

resolve("--rolled-back", baselineMigrations[0]);

for (const migration of baselineMigrations) {
  resolve("--applied", migration);
}
