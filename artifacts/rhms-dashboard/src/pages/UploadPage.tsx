import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListDetectionsQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetRoadRankingQueryKey,
} from "@workspace/api-client-react";
import { Upload, MapPin, CheckCircle, AlertCircle, Loader2, ImageIcon, Video } from "lucide-react";

type UploadState = "idle" | "uploading" | "success" | "error";

interface DetectionResult {
  detection_id: number;
  location_id: string;
  latitude: number;
  longitude: number;
  pothole_count: number;
  avg_diameter: number;
  severity: string;
  timestamp: string;
  error?: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  Low: "bg-[#e8f5e9] text-[#2e7d32] border-[#a5d6a7]",
  Medium: "bg-[#fff8e1] text-[#f57f17] border-[#ffe082]",
  High: "bg-[#fff3e0] text-[#e65100] border-[#ffcc80]",
  Critical: "bg-[#ffebee] text-[#c62828] border-[#ef9a9a]",
};

const SEVERITY_DOT: Record<string, string> = {
  Low: "#4caf50", Medium: "#ffc107", High: "#ff9800", Critical: "#f44336",
};

export function UploadPage() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [locationId, setLocationId] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [state, setState] = useState<UploadState>("idle");
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isVideo = file?.type.startsWith("video/");

  function pickFile(f: File) {
    setFile(f);
    setState("idle");
    setResult(null);
    if (!locationId) setLocationId(`Road-${Date.now().toString().slice(-4)}`);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) pickFile(f);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !locationId || !latitude || !longitude) return;
    setState("uploading");
    setErrorMsg("");

    const form = new FormData();
    form.append("file", file);
    form.append("location_id", locationId);
    form.append("latitude", latitude);
    form.append("longitude", longitude);

    try {
      const base = import.meta.env.VITE_API_BASE ?? "http://localhost:3001";
      const res = await fetch(`${base}/api/upload`, { method: "POST", body: form });
      const data: DetectionResult = await res.json();
      if (!res.ok || data.error) {
        setState("error");
        setErrorMsg(data.error ?? "Upload failed");
      } else {
        setResult(data);
        setState("success");
        // Immediately refresh the map and summary without waiting for the 30s poll
        queryClient.invalidateQueries({ queryKey: getListDetectionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRoadRankingQueryKey() });
      }
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Network error");
    }
  }

  return (
    <div className="space-y-5 lg:space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#8a8a8a]">Road Hazard Monitoring System</p>
        <h2 className="text-3xl font-bold tracking-tight text-[#2d2d2d]">Upload & Detect</h2>
        <p className="text-sm text-[#6b6b6b]">
          Upload a road image or video — the YOLO model runs automatically and saves results to the dashboard.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {/* Drop zone */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
            dragOver
              ? "border-[#2d4a7c] bg-[#eef2f9]"
              : file
              ? "border-[#4caf50] bg-[#f0faf0]"
              : "border-[#e0dcd5] bg-white hover:border-[#2d4a7c] hover:bg-[#f5f8ff]"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }}
          />
          {file ? (
            <div className="flex flex-col items-center gap-2">
              {isVideo
                ? <Video size={36} className="text-[#4caf50]" />
                : <ImageIcon size={36} className="text-[#4caf50]" />}
              <p className="font-semibold text-[#2d2d2d]">{file.name}</p>
              <p className="text-xs text-[#8a8a8a]">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              <p className="text-xs text-[#4caf50] font-medium">Click to change file</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#f0f4ff] flex items-center justify-center">
                <Upload size={26} className="text-[#2d4a7c]" />
              </div>
              <div>
                <p className="font-semibold text-[#2d2d2d]">Drop image or video here</p>
                <p className="text-xs text-[#8a8a8a] mt-1">or click to browse • JPG, PNG, MP4, MOV, AVI</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Location fields */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-2xl border border-[#e8e4df] p-5 space-y-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={14} className="text-[#2d4a7c]" />
            <h3 className="text-sm font-bold text-[#2d2d2d]">Location Details</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wider block mb-1">Location ID</label>
              <input
                type="text"
                value={locationId}
                onChange={e => setLocationId(e.target.value)}
                placeholder="e.g. MG Road Hyderabad, NH-48, LOC006…"
                required
                className="w-full rounded-xl border border-[#e8e4df] bg-[#faf8f5] px-3 py-2.5 text-sm text-[#2d2d2d] outline-none focus:border-[#2d4a7c] focus:ring-1 focus:ring-[#2d4a7c] transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wider block mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={e => setLatitude(e.target.value)}
                  placeholder="e.g. 17.385"
                  required
                  className="w-full rounded-xl border border-[#e8e4df] bg-[#faf8f5] px-3 py-2.5 text-sm text-[#2d2d2d] outline-none focus:border-[#2d4a7c] focus:ring-1 focus:ring-[#2d4a7c] transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wider block mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={e => setLongitude(e.target.value)}
                  placeholder="e.g. 78.486"
                  required
                  className="w-full rounded-xl border border-[#e8e4df] bg-[#faf8f5] px-3 py-2.5 text-sm text-[#2d2d2d] outline-none focus:border-[#2d4a7c] focus:ring-1 focus:ring-[#2d4a7c] transition-colors"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={!file || !locationId || !latitude || !longitude || state === "uploading"}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#2d4a7c] px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#243d6a] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {state === "uploading" ? (
            <><Loader2 size={16} className="animate-spin" /> Processing with YOLO…</>
          ) : (
            <><Upload size={16} /> Upload & Run Detection</>
          )}
        </motion.button>
      </form>

      {/* Result */}
      <AnimatePresence>
        {state === "success" && result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-2xl border border-[#e8e4df] p-5 space-y-4"
          >
            <div className="flex items-center gap-2">
              <CheckCircle size={18} className="text-[#4caf50]" />
              <h3 className="font-bold text-[#2d2d2d]">Detection Complete</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Location", value: result.location_id },
                { label: "Potholes Found", value: result.pothole_count },
                { label: "Avg Diameter", value: `${result.avg_diameter} px` },
                { label: "Coords", value: `${result.latitude}, ${result.longitude}` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#faf8f5] rounded-xl p-3">
                  <p className="text-[10px] font-bold text-[#8a8a8a] uppercase tracking-widest mb-1">{label}</p>
                  <p className="text-sm font-semibold text-[#2d2d2d]">{String(value)}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wider">Severity</span>
              <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-bold ${SEVERITY_COLORS[result.severity] ?? ""}`}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SEVERITY_DOT[result.severity] }} />
                {result.severity}
              </span>
            </div>

            <p className="text-xs text-[#8a8a8a]">
              Saved to database • Dashboard auto-refreshes in ~30 s
            </p>
          </motion.div>
        )}

        {state === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-3 rounded-2xl border border-[#ef9a9a] bg-[#ffebee] p-4"
          >
            <AlertCircle size={18} className="text-[#c62828] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[#c62828]">Processing failed</p>
              <p className="text-xs text-[#c62828]/80 mt-0.5">{errorMsg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
