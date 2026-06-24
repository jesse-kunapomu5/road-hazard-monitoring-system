import { X, MapPin, Layers, Circle, Calendar, Gauge, TrendingUp } from "lucide-react";
import { useGetDetection, useListPotholes, getGetDetectionQueryKey, getListPotholesQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { CountUp } from "@/components/CountUp";

const SEVERITY_COLORS: Record<string, string> = {
  Low: "bg-[#e8f5e9] text-[#2e7d32] border-[#a5d6a7]",
  Medium: "bg-[#fff8e1] text-[#f57f17] border-[#ffe082]",
  High: "bg-[#fff3e0] text-[#e65100] border-[#ffcc80]",
  Critical: "bg-[#ffebee] text-[#c62828] border-[#ef9a9a]",
};

const SEVERITY_ACCENT: Record<string, string> = {
  Low: "#4caf50",
  Medium: "#ffc107",
  High: "#ff9800",
  Critical: "#f44336",
};

interface DetectionPopupProps {
  id: number | null;
  onClose: () => void;
}

export function DetectionPopup({ id, onClose }: DetectionPopupProps) {
  const { data: detection, isLoading: loadingDetection } = useGetDetection(id || 0, {
    query: { queryKey: getGetDetectionQueryKey(id || 0), enabled: id !== null },
  });
  const { data: potholes, isLoading: loadingPotholes } = useListPotholes(
    { detection_id: id || 0 },
    { query: { queryKey: getListPotholesQueryKey({ detection_id: id || 0 }), enabled: id !== null } },
  );

  const accent = detection ? SEVERITY_ACCENT[detection.severity] || "#2d4a7c" : "#2d4a7c";
  const totalArea = potholes?.reduce((s, p) => s + p.area_m2, 0) || 0;
  const avgConfidence = potholes?.length ? potholes.reduce((s, p) => s + p.confidence, 0) / potholes.length : 0;
  const maxDiameter = potholes?.length ? Math.max(...potholes.map((p) => p.diameter_cm)) : 0;

  return (
    <AnimatePresence>
      {id !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

          {/* Popup Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative bg-white rounded-3xl shadow-2xl border border-[#e8e4df] w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with accent bar */}
            <div className="relative shrink-0">
              <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />
              <div className="flex items-center justify-between p-5 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${accent}14` }}>
                    <MapPin size={18} style={{ color: accent }} />
                  </div>
                  <div>
                    {loadingDetection ? (
                      <Skeleton className="h-5 w-32 mb-1" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#2d2d2d] text-sm">{detection?.road_name}</span>
                        {detection && (
                          <Badge variant="outline" className={`text-[10px] font-bold px-1.5 py-0 border ${SEVERITY_COLORS[detection.severity]}`}>
                            {detection.severity}
                          </Badge>
                        )}
                      </div>
                    )}
                    <span className="text-[10px] text-[#8a8a8a] font-bold uppercase tracking-widest">Detection #{id}</span>
                  </div>
                </div>
                <motion.button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-[#f0ece5] text-[#8a8a8a] transition-colors"
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={18} />
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-5 pt-0 space-y-4">
              {loadingDetection ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full rounded-xl" />
                  <Skeleton className="h-32 w-full rounded-xl" />
                </div>
              ) : detection ? (
                <>
                  {/* Key Stats Row */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { icon: Layers, label: "Potholes", value: detection.pothole_count, isCount: true },
                      { icon: Circle, label: "Avg Diam", value: `${detection.avg_diameter_cm.toFixed(1)}cm` },
                      { icon: Gauge, label: "Score", value: detection.severity_score.toFixed(0), isCount: true },
                      { icon: Calendar, label: "Time", value: format(new Date(detection.detected_at), "h:mm a") },
                    ].map((stat, i) => {
                      const Icon = stat.icon;
                      return (
                        <motion.div
                          key={stat.label}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="bg-[#faf8f5] rounded-xl p-3 border border-[#f0ece5] text-center"
                        >
                          <Icon size={14} className="text-[#8a8a8a] mx-auto mb-1" />
                          <p className="text-xs font-bold text-[#2d2d2d]">
                            {stat.isCount && typeof stat.value === "number" ? (
                              <CountUp end={stat.value} />
                            ) : (
                              stat.value
                            )}
                          </p>
                          <p className="text-[9px] text-[#8a8a8a] font-bold uppercase tracking-widest mt-0.5">{stat.label}</p>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-[10px] text-[#8a8a8a] font-mono bg-[#faf8f5] rounded-lg p-2 border border-[#f0ece5]">
                    <MapPin size={12} className="text-[#c8a97e]" />
                    {detection.latitude.toFixed(4)}, {detection.longitude.toFixed(4)}
                  </div>

                  {/* Pothole summary */}
                  {!loadingPotholes && potholes && potholes.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-[#faf8f5] rounded-xl p-4 border border-[#f0ece5]"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp size={12} className="text-[#c8a97e]" />
                        <span className="text-[10px] font-bold text-[#2d2d2d] uppercase tracking-widest">Pothole Summary</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: "Total Area", value: `${totalArea.toFixed(2)} m\u00b2` },
                          { label: "Max Diameter", value: `${maxDiameter.toFixed(1)} cm` },
                          { label: "Avg Confidence", value: `${(avgConfidence * 100).toFixed(0)}%` },
                        ].map((item, i) => (
                          <div key={i} className="text-center">
                            <p className="text-xs font-bold text-[#2d2d2d]">{item.value}</p>
                            <p className="text-[9px] text-[#8a8a8a] font-bold uppercase tracking-widest">{item.label}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Pothole list - compact */}
                  {!loadingPotholes && potholes && potholes.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-[#2d2d2d] uppercase tracking-widest mb-2 block">Individual Potholes</span>
                      <div className="space-y-1.5 max-h-40 overflow-auto">
                        {potholes.slice(0, 6).map((p, i) => (
                          <motion.div
                            key={p.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="flex items-center justify-between p-2.5 rounded-lg bg-[#faf8f5] border border-[#f0ece5]"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-[#8a8a8a]">{p.pothole_code}</span>
                              <span className="text-xs font-bold text-[#2d2d2d]">{p.diameter_cm.toFixed(1)} cm</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${SEVERITY_COLORS[p.severity]}`}>
                                {p.severity}
                              </span>
                              <span className="text-[9px] font-bold text-[#8a8a8a]">{(p.confidence * 100).toFixed(0)}%</span>
                            </div>
                          </motion.div>
                        ))}
                        {potholes.length > 6 && (
                          <p className="text-[10px] text-[#8a8a8a] text-center py-1">+ {potholes.length - 6} more potholes</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Images */}
                  <div>
                    <span className="text-[10px] font-bold text-[#2d2d2d] uppercase tracking-widest mb-2 block">Vision Output</span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Original", url: detection.original_image_url },
                        { label: "Detected", url: detection.detected_image_url },
                        { label: "Mask", url: detection.mask_image_url },
                      ].map((img, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 + i * 0.08 }}
                          whileHover={{ scale: 1.05 }}
                          className="aspect-square bg-[#f0ece5] rounded-xl border border-[#e8e4df] overflow-hidden cursor-pointer"
                        >
                          {img.url ? (
                            <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-[9px] text-[#8a8a8a] font-bold uppercase tracking-widest">No Image</span>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
