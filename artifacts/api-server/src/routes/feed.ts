import { Router } from "express";
import { db } from "@workspace/db";
import { detectionsTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const limitParam = req.query.limit;
  const limit = limitParam ? Math.min(parseInt(String(limitParam), 10), 50) : 20;

  const feed = await db
    .select({
      id: detectionsTable.id,
      road_name: detectionsTable.road_name,
      pothole_count: detectionsTable.pothole_count,
      severity: detectionsTable.severity,
      detected_at: detectionsTable.detected_at,
      latitude: detectionsTable.latitude,
      longitude: detectionsTable.longitude,
    })
    .from(detectionsTable)
    .orderBy(desc(detectionsTable.detected_at))
    .limit(isNaN(limit) ? 20 : limit);

  res.json(feed);
});

export default router;
