import { Router } from "express";
import { db } from "@workspace/db";
import { potholesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const detectionIdParam = req.query.detection_id;
  if (detectionIdParam !== undefined) {
    const detectionId = parseInt(String(detectionIdParam), 10);
    if (isNaN(detectionId)) {
      res.status(400).json({ error: "Invalid detection_id" });
      return;
    }
    const potholes = await db.select().from(potholesTable).where(eq(potholesTable.detection_id, detectionId));
    res.json(potholes);
    return;
  }
  const potholes = await db.select().from(potholesTable);
  res.json(potholes);
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const [pothole] = await db.select().from(potholesTable).where(eq(potholesTable.id, id));
  if (!pothole) {
    res.status(404).json({ error: "Pothole not found" });
    return;
  }
  res.json(pothole);
});

export default router;
