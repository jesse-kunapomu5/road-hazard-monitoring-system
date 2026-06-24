import { pgTable, serial, text, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { detectionsTable } from "./detections";

export const potholesTable = pgTable("potholes", {
  id: serial("id").primaryKey(),
  detection_id: integer("detection_id").notNull().references(() => detectionsTable.id, { onDelete: "cascade" }),
  pothole_code: text("pothole_code").notNull(),
  diameter_cm: real("diameter_cm").notNull(),
  area_m2: real("area_m2").notNull(),
  perimeter_m: real("perimeter_m").notNull(),
  mask_coverage: real("mask_coverage").notNull(),
  confidence: real("confidence").notNull(),
  severity: text("severity").notNull().default("Low"),
});

export const insertPotholeSchema = createInsertSchema(potholesTable).omit({ id: true });
export type InsertPothole = z.infer<typeof insertPotholeSchema>;
export type Pothole = typeof potholesTable.$inferSelect;
