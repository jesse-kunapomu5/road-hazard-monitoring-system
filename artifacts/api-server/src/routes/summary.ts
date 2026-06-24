import { Router } from "express";
import { db } from "@workspace/db";
import { detectionsTable } from "@workspace/db";
import { sql, desc } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const [stats] = await db
    .select({
      total_roads: sql<number>`count(distinct ${detectionsTable.road_name})::int`,
      total_potholes: sql<number>`sum(${detectionsTable.pothole_count})::int`,
      critical_zones: sql<number>`count(case when ${detectionsTable.severity} = 'Critical' then 1 end)::int`,
      avg_diameter_cm: sql<number>`round(avg(${detectionsTable.avg_diameter_cm})::numeric, 1)::float`,
    })
    .from(detectionsTable);

  const [lastDetection] = await db
    .select({ detected_at: detectionsTable.detected_at })
    .from(detectionsTable)
    .orderBy(desc(detectionsTable.detected_at))
    .limit(1);

  const breakdown = await db
    .select({
      severity: detectionsTable.severity,
      count: sql<number>`count(*)::int`,
    })
    .from(detectionsTable)
    .groupBy(detectionsTable.severity);

  const severityBreakdown = { Low: 0, Medium: 0, High: 0, Critical: 0 } as Record<string, number>;
  for (const row of breakdown) {
    severityBreakdown[row.severity] = row.count;
  }

  res.json({
    total_roads: stats?.total_roads ?? 0,
    total_potholes: stats?.total_potholes ?? 0,
    critical_zones: stats?.critical_zones ?? 0,
    avg_diameter_cm: stats?.avg_diameter_cm ?? 0,
    last_detection_at: lastDetection?.detected_at?.toISOString() ?? null,
    severity_breakdown: severityBreakdown,
  });
});

export default router;
