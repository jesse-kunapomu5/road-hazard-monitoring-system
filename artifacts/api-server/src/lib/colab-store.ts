import { execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type ColabLocation = {
  location_id: string;
  latitude: number;
  longitude: number;
};

export type ColabDetection = {
  id: number;
  location_id: string;
  timestamp: string;
  pothole_count: number;
  avg_diameter: number;
  severity: string;
};

export type ColabMedia = {
  id: number;
  location_id: string;
  original_file: string | null;
  detected_file: string | null;
  pothole_csv: string | null;
  upload_time: string | null;
};

export type ColabPotholeRow = {
  id: number;
  detection_id: number | null;
  source_media_id: number | null;
  pothole_code: string;
  frame: number;
  class_name: string;
  confidence: number;
  approx_diameter_pixels: number;
  detected_at: string | null;
  road_name: string | null;
};

export type ColabSnapshot = {
  locations: ColabLocation[];
  detections: ColabDetection[];
  media: ColabMedia[];
  potholes: ColabPotholeRow[];
};

type SnapshotCache = {
  signature: string;
  snapshot: ColabSnapshot;
};

const ARTIFACT_DIR = path.dirname(fileURLToPath(import.meta.url));
// dist → api-server → artifacts → Road-Hazard-Dashboard
const MAIN_REPO_ROOT = path.resolve(ARTIFACT_DIR, "..", "..", "..");
export const YOLO_DIR = process.env["COLAB_YOLO_DIR"] ?? path.join(MAIN_REPO_ROOT, "YOLO");
export const DB_PATH = process.env["COLAB_DATABASE_PATH"] ?? path.join(YOLO_DIR, "database.db");
const DB_DIR = path.dirname(DB_PATH);
const POTHOLE_CSV_CANDIDATES = [
  path.join(DB_DIR, "pothole_segmentation_results.csv"),
  path.join(DB_DIR, "pothole_video_results.csv"),
];

const PYTHON_SNAPSHOT_SCRIPT = String.raw`
import csv
import json
import os
import sqlite3
import sys

db_path = sys.argv[1]
data_dir = sys.argv[2]
csv_paths = sys.argv[3:]

snapshot = {
    "locations": [],
    "detections": [],
    "media": [],
    "potholes": [],
}

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    for table in ("locations", "detections", "media"):
        try:
            cursor.execute(f"SELECT * FROM {table}")
            snapshot[table] = [dict(row) for row in cursor.fetchall()]
        except sqlite3.Error:
            snapshot[table] = []

    conn.close()

def resolve_csv_path(ref):
    if not ref:
        return None
    if os.path.isabs(ref):
        return os.path.abspath(ref)
    return os.path.abspath(os.path.join(data_dir, ref))

media_by_csv = {}
for media in snapshot["media"]:
    resolved = resolve_csv_path(media.get("pothole_csv"))
    if resolved:
        media_by_csv[resolved] = media

candidate_paths = []
for media in snapshot["media"]:
    resolved = resolve_csv_path(media.get("pothole_csv"))
    if resolved:
        candidate_paths.append(resolved)

candidate_paths.extend(csv_paths)

seen_paths = set()
for raw_path in candidate_paths:
    csv_path = os.path.abspath(raw_path)
    if csv_path in seen_paths or not os.path.exists(csv_path):
        continue
    seen_paths.add(csv_path)

    media = media_by_csv.get(csv_path)
    detected_at = media.get("upload_time") if media is not None else None
    road_name = media.get("location_id") if media is not None else None
    source_media_id = media.get("id") if media is not None else None

    with open(csv_path, newline="", encoding="utf-8-sig") as handle:
        for index, row in enumerate(csv.DictReader(handle)):
            snapshot["potholes"].append({
                "id": (source_media_id or 0) * 1000 + index + 1,
                "detection_id": source_media_id,
                "source_media_id": source_media_id,
                "pothole_code": f"{os.path.splitext(os.path.basename(csv_path))[0]}-{index + 1:03d}",
                "frame": int(row.get("Frame", 0) or 0),
                "class_name": str(row.get("Class", "") or ""),
                "confidence": float(row.get("Confidence", 0) or 0),
                "approx_diameter_pixels": float(row.get("Approx_Diameter_pixels", 0) or 0),
                "detected_at": detected_at,
                "road_name": road_name,
            })

print(json.dumps(snapshot))
`;

const PYTHON_INSERT_SCRIPT = String.raw`
import json
import os
import sqlite3
import sys

db_path = sys.argv[1]
location_id = sys.argv[2]
latitude = float(sys.argv[3])
longitude = float(sys.argv[4])
pothole_count = int(sys.argv[5])
avg_diameter = float(sys.argv[6])
severity = sys.argv[7]
timestamp = sys.argv[8]
original_file = sys.argv[9] if len(sys.argv) > 9 else ""
detected_file = sys.argv[10] if len(sys.argv) > 10 else ""
pothole_csv = sys.argv[11] if len(sys.argv) > 11 else ""

os.makedirs(os.path.dirname(db_path), exist_ok=True)
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute(
    "CREATE TABLE IF NOT EXISTS locations (location_id TEXT PRIMARY KEY, latitude REAL NOT NULL, longitude REAL NOT NULL)"
)
cursor.execute(
    "CREATE TABLE IF NOT EXISTS detections (id INTEGER PRIMARY KEY AUTOINCREMENT, location_id TEXT NOT NULL, timestamp TEXT NOT NULL, pothole_count INTEGER NOT NULL DEFAULT 0, avg_diameter REAL NOT NULL DEFAULT 0, severity TEXT NOT NULL DEFAULT 'Low')"
)
cursor.execute(
    "CREATE TABLE IF NOT EXISTS media (id INTEGER PRIMARY KEY AUTOINCREMENT, location_id TEXT NOT NULL, original_file TEXT, detected_file TEXT, pothole_csv TEXT, upload_time TEXT DEFAULT CURRENT_TIMESTAMP)"
)

cursor.execute(
    "INSERT OR REPLACE INTO locations (location_id, latitude, longitude) VALUES (?, ?, ?)",
    (location_id, latitude, longitude),
)
cursor.execute(
    "INSERT INTO detections (location_id, timestamp, pothole_count, avg_diameter, severity) VALUES (?, ?, ?, ?, ?)",
    (location_id, timestamp, pothole_count, avg_diameter, severity),
)
detection_id = cursor.lastrowid

cursor.execute(
    "INSERT INTO media (location_id, original_file, detected_file, pothole_csv, upload_time) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)",
    (location_id, original_file or None, detected_file or None, pothole_csv or None),
)

conn.commit()
conn.close()

print(json.dumps({"id": detection_id}))
`;

let cachedSnapshot: SnapshotCache | null = null;

function fileSignature(filePath: string): string {
  if (!existsSync(filePath)) {
    return `${filePath}:missing`;
  }

  const stats = statSync(filePath);
  return `${filePath}:${stats.mtimeMs}:${stats.size}`;
}

function snapshotSignature(): string {
  return [fileSignature(DB_PATH), ...POTHOLE_CSV_CANDIDATES.map(fileSignature)].join("|");
}

function runPython(script: string, args: string[]): string {
  const commands = ["python", "python3", "py"];
  let lastError: unknown = null;

  for (const command of commands) {
    try {
      const commandArgs = command === "py" ? ["-3", "-c", script, ...args] : ["-c", script, ...args];
      return execFileSync(command, commandArgs, { encoding: "utf8" });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unable to run Python for Colab data access");
}

function resolveDetectionId(snapshot: ColabSnapshot, row: ColabPotholeRow): number | null {
  if (!row.road_name || !row.detected_at) {
    return null;
  }

  const exact = snapshot.detections.find(
    (item) => item.location_id === row.road_name && item.timestamp === row.detected_at,
  );
  if (exact) {
    return exact.id;
  }

  const fallback = [...snapshot.detections]
    .filter((item) => item.location_id === row.road_name)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

  return fallback?.id ?? null;
}

export function loadColabSnapshot(): ColabSnapshot {
  const signature = snapshotSignature();
  if (cachedSnapshot?.signature === signature) {
    return cachedSnapshot.snapshot;
  }

  const raw = JSON.parse(
    runPython(PYTHON_SNAPSHOT_SCRIPT, [DB_PATH, DB_DIR, ...POTHOLE_CSV_CANDIDATES]),
  ) as Partial<ColabSnapshot>;

  const snapshot: ColabSnapshot = {
    locations: raw.locations ?? [],
    detections: raw.detections ?? [],
    media: raw.media ?? [],
    potholes: raw.potholes ?? [],
  };

  snapshot.potholes = snapshot.potholes.map((row) => ({
    ...row,
    detection_id: resolveDetectionId(snapshot, row),
  }));

  cachedSnapshot = { signature, snapshot };
  return snapshot;
}

export function saveDetectionToColab(input: {
  location_id: string;
  latitude: number;
  longitude: number;
  pothole_count: number;
  avg_diameter: number;
  severity: string;
  timestamp: string;
  original_file?: string | null;
  detected_file?: string | null;
  pothole_csv?: string | null;
}): ColabDetection {
  const output = runPython(PYTHON_INSERT_SCRIPT, [
    DB_PATH,
    input.location_id,
    String(input.latitude),
    String(input.longitude),
    String(input.pothole_count),
    String(input.avg_diameter),
    input.severity,
    input.timestamp,
    input.original_file ?? "",
    input.detected_file ?? "",
    input.pothole_csv ?? "",
  ]);

  const parsed = JSON.parse(output) as { id?: number };
  cachedSnapshot = null;

  return {
    id: parsed.id ?? Date.now(),
    location_id: input.location_id,
    timestamp: input.timestamp,
    pothole_count: input.pothole_count,
    avg_diameter: input.avg_diameter,
    severity: input.severity,
  };
}

export function getLatestMediaByLocation(snapshot: ColabSnapshot, locationId: string): ColabMedia | null {
  const matches = snapshot.media
    .filter((item) => item.location_id === locationId)
    .sort((a, b) => {
      const aTime = new Date(a.upload_time ?? 0).getTime();
      const bTime = new Date(b.upload_time ?? 0).getTime();
      return bTime - aTime;
    });

  return matches[0] ?? null;
}
