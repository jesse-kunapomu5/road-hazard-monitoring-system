import { Router } from "express";
import { db } from "@workspace/db";
import { detectionsTable, insertDetectionSchema } from "@workspace/db";
import { CreateDetectionBody } from "@workspace/api-zod";
import { desc, eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const detections = await db.select().from(detectionsTable).orderBy(desc(detectionsTable.detected_at));
  res.json(detections);
});

router.post("/", async (req, res) => {
  const parsed = CreateDetectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    return;
  }

  const { road_name, latitude, longitude, pothole_count, avg_diameter_cm, severity } = parsed.data;

  const score = avg_diameter_cm + 10 * pothole_count;
  const severity_score = parsed.data.severity_score ?? score;

  const [created] = await db.insert(detectionsTable).values({
    road_name,
    latitude,
    longitude,
    pothole_count,
    avg_diameter_cm,
    severity,
    severity_score,
    original_image_url: parsed.data.original_image_url ?? null,
    detected_image_url: parsed.data.detected_image_url ?? null,
    mask_image_url: parsed.data.mask_image_url ?? null,
  }).returning();

  res.status(201).json(created);
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const [detection] = await db.select().from(detectionsTable).where(eq(detectionsTable.id, id));
  if (!detection) {
    res.status(404).json({ error: "Detection not found" });
    return;
  }
  res.json(detection);
});

export default router;
