-- Add a "size" column to assets for tracking dimensions/selection size
-- (e.g. door/window rough opening, appliance width, fixture size) separate
-- from the free-text notes field.
ALTER TABLE "assets" ADD COLUMN "size" TEXT;
