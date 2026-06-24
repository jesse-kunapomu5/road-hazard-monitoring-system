import { pgTable, serial, text, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const detectionsTable = pgTable("detections", {
  id: serial("id").primaryKey(),
  road_name: text("road_name").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  pothole_count: integer("pothole_count").notNull().default(0),
  avg_diameter_cm: real("avg_diameter_cm").notNull().default(0),
  severity: text("severity").notNull().default("Low"),
  severity_score: real("severity_score").notNull().default(0),
  original_image_url: text("original_image_url"),
  detected_image_url: text("detected_image_url"),
  mask_image_url: text("mask_image_url"),
  detected_at: timestamp("detected_at").notNull().defaultNow(),
});

export const insertDetectionSchema = createInsertSchema(detectionsTable).omit({ id: true, detected_at: true });
export type InsertDetection = z.infer<typeof insertDetectionSchema>;
export type Detection = typeof detectionsTable.$inferSelect;
