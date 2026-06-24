import { useState } from "react";
import { SummaryCards } from "@/components/SummaryCards";
import { RankingPanel } from "@/components/RankingPanel";
import { FeedPanel } from "@/components/FeedPanel";
import { Map } from "@/components/Map";
import { DetectionDrawer } from "@/components/DetectionDrawer";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { format } from "date-fns";

export default function Dashboard() {
  const [selectedDetectionId, setSelectedDetectionId] = useState<number | null>(null);
  const { data: summary } = useGetDashboardSummary({ query: { refetchInterval: 30000 } });

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }} className="bg-background font-sans overflow-hidden">
      {/* Header */}
      <header className="shrink-0 bg-white border-b border-border px-6 flex items-center justify-between shadow-sm z-10" style={{ height: 56 }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm tracking-tighter">
              RH
            </div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">RHMS</h1>
          </div>
          <div className="h-4 w-px bg-border" />
          <span className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">Road Hazard Monitoring System</span>
        </div>

        <div className="flex items-center gap-6">
          {summary?.last_detection_at && (
            <div className="text-xs text-muted-foreground font-medium flex items-center gap-2">
              <span className="uppercase tracking-wider">Last updated:</span>
              <span className="font-mono font-semibold text-foreground">{format(new Date(summary.last_detection_at), "h:mm a")}</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest">Live</span>
          </div>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="shrink-0 px-4 pt-3 pb-0">
        <SummaryCards />
      </div>

      {/* Main Map + Panels */}
      <div className="flex-1 flex gap-3 p-4 pt-3 min-h-0">
        {/* Map — 70% */}
        <div className="relative min-h-0" style={{ flex: "0 0 70%" }}>
          <div style={{ position: "absolute", inset: 0 }}>
            <Map onMarkerClick={setSelectedDetectionId} />
          </div>
          {selectedDetectionId && (
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
              <div style={{ pointerEvents: "auto", position: "absolute", top: 0, right: 0, bottom: 0, width: 420 }}>
                <DetectionDrawer
                  id={selectedDetectionId}
                  onClose={() => setSelectedDetectionId(null)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right panels — 30% */}
        <div className="flex flex-col gap-3 min-h-0" style={{ flex: "0 0 calc(30% - 12px)" }}>
          <div className="min-h-0" style={{ flex: "0 0 50%" }}>
            <FeedPanel />
          </div>
          <div className="min-h-0" style={{ flex: "0 0 calc(50% - 12px)" }}>
            <RankingPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
