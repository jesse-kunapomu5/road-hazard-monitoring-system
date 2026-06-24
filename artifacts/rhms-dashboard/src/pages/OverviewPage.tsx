import { useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { AnimatedMap } from "@/components/AnimatedMap";
import { MarqueeFeed } from "@/components/MarqueeFeed";
import { AnimatedRankingPanel } from "@/components/AnimatedRankingPanel";
import { AnimatedSummaryCards } from "@/components/AnimatedSummaryCards";
import { DetectionPopup } from "@/components/DetectionPopup";
import { CountUp } from "@/components/CountUp";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { ArrowDown } from "lucide-react";

export function OverviewPage() {
  const [selectedDetectionId, setSelectedDetectionId] = useState<number | null>(null);
  const { data: summary } = useGetDashboardSummary({
    query: { refetchInterval: 30000, queryKey: getGetDashboardSummaryQueryKey() },
  });
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInView = useInView(mapRef, { once: true, margin: "-100px" });

  const breakdown = summary ? [
    { name: "Low", value: summary.severity_breakdown.Low, color: "#4caf50" },
    { name: "Medium", value: summary.severity_breakdown.Medium, color: "#ffc107" },
    { name: "High", value: summary.severity_breakdown.High, color: "#ff9800" },
    { name: "Critical", value: summary.severity_breakdown.Critical, color: "#f44336" },
  ] : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Map Section */}
      <motion.div
        ref={mapRef}
        initial={{ opacity: 0, y: 30 }}
        animate={mapInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="rounded-2xl overflow-hidden border border-[#e8e4df] shadow-sm bg-white relative"
        style={{ height: "55vh", minHeight: 400 }}
      >
        <AnimatedMap onMarkerClick={setSelectedDetectionId} />

        {/* Floating overlay */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="absolute top-4 left-4 bg-white/90 backdrop-blur-xl rounded-xl px-4 py-3 shadow-sm border border-[#e8e4df]"
        >
          <h2 className="text-sm font-bold text-[#2d2d2d] tracking-tight">Live Hazard Map</h2>
          <p className="text-[10px] text-[#8a8a8a] font-bold uppercase tracking-widest mt-0.5">Hyderabad Zone</p>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl rounded-full px-3 py-1.5 shadow-sm border border-[#e8e4df] flex items-center gap-1.5"
        >
          <motion.div
            animate={{ y: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          >
            <ArrowDown size={12} className="text-[#8a8a8a]" />
          </motion.div>
          <span className="text-[10px] text-[#8a8a8a] font-bold uppercase tracking-widest">Scroll for more</span>
        </motion.div>
      </motion.div>

      {/* Summary Cards */}
      <AnimatedSummaryCards />

      {/* Bottom Section - 3 columns */}
      <div className="grid grid-cols-3 gap-5 pb-6">
        {/* Left - Live Feed */}
        <div className="h-[380px]">
          <MarqueeFeed />
        </div>

        {/* Center - Severity Breakdown (Clickable) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl border border-[#e8e4df] shadow-sm p-5 h-[380px] flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-[#8a8a8a] uppercase tracking-widest">Severity Breakdown</span>
            <span className="text-xs font-bold text-[#2d4a7c] font-display"><CountUp end={summary?.total_potholes || 0} /> total</span>
          </div>
          <div className="flex-1 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {breakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} cursor="pointer" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-2xl font-display font-bold text-[#2d2d2d]">
                  <CountUp end={summary?.total_potholes || 0} />
                </p>
                <p className="text-[9px] font-bold text-[#8a8a8a] uppercase tracking-widest">Potholes</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 mt-3">
            {breakdown.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 cursor-pointer hover:bg-[#faf8f5] rounded-md px-2 py-1 transition-colors">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] font-bold text-[#6b6b6b]">{item.name}</span>
                <span className="text-[10px] font-bold text-[#2d2d2d] font-display">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right - Worst Roads */}
        <div className="h-[380px]">
          <AnimatedRankingPanel />
        </div>
      </div>

      {/* Popup Modal */}
      <DetectionPopup
        id={selectedDetectionId}
        onClose={() => setSelectedDetectionId(null)}
      />
    </div>
  );
}
