import { Router } from "express";
import { db } from "@workspace/db";
import { detectionsTable } from "@workspace/db";
import { desc, asc, sql } from "drizzle-orm";

const router = Router();

router.get("/ranking", async (req, res) => {
  const rows = await db
    .select({
      road_name: detectionsTable.road_name,
      total_potholes: sql<number>`sum(${detectionsTable.pothole_count})::int`,
      avg_score: sql<number>`avg(${detectionsTable.severity_score})::float`,
      dominant_severity: sql<string>`mode() within group (order by ${detectionsTable.severity})`,
    })
    .from(detectionsTable)
    .groupBy(detectionsTable.road_name)
    .orderBy(desc(sql`avg(${detectionsTable.severity_score})`));

  const worst = rows.slice(0, 5).map((r, i) => ({
    rank: i + 1,
    road_name: r.road_name,
    severity_score: Math.round(r.avg_score),
    pothole_count: r.total_potholes,
    dominant_severity: r.dominant_severity,
  }));

  const best = [...rows].reverse().slice(0, 5).map((r, i) => ({
    rank: i + 1,
    road_name: r.road_name,
    severity_score: Math.round(r.avg_score),
    pothole_count: r.total_potholes,
    dominant_severity: r.dominant_severity,
  }));

  res.json({ worst, best });
});

export default router;
