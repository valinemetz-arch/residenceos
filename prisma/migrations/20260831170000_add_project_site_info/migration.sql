-- Site Info for the Owner Dashboard / Contractor Portal "Project" tab:
-- a gate code + construction phase on Project, plus timeline steps and
-- contacts as their own tables.

ALTER TABLE "projects" ADD COLUMN "gateCode" TEXT;
ALTER TABLE "projects" ADD COLUMN "phase" TEXT;

CREATE TABLE "project_timeline_steps" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "dateLabel" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_timeline_steps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_contacts" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_contacts_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "project_timeline_steps" ADD CONSTRAINT "project_timeline_steps_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "project_contacts" ADD CONSTRAINT "project_contacts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
