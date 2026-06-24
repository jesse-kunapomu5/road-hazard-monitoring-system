import { X, ChevronDown, ChevronRight } from "lucide-react";
import { useGetDetection, useListPotholes } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useState, Fragment } from "react";

const SEVERITY_COLORS: Record<string, string> = {
  Low: "bg-green-50 text-green-700 border-green-200",
  Medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
  High: "bg-orange-50 text-orange-700 border-orange-200",
  Critical: "bg-red-50 text-red-700 border-red-200"
};

interface DetectionDrawerProps {
  id: number;
  onClose: () => void;
}

export function DetectionDrawer({ id, onClose }: DetectionDrawerProps) {
  const { data: detection, isLoading: loadingDetection } = useGetDetection(id);
  const { data: potholes, isLoading: loadingPotholes } = useListPotholes({ detection_id: id });
  
  const [expandedPotholeId, setExpandedPotholeId] = useState<number | null>(null);

  return (
    <div className="absolute top-0 right-0 w-[450px] h-full bg-white shadow-2xl z-50 flex flex-col border-l border-border animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between p-4 border-b border-border bg-gray-50/50 shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Zone {id}</h2>
          {loadingDetection ? (
            <Skeleton className="h-6 w-48" />
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-foreground">{detection?.road_name}</span>
              {detection && (
                <Badge variant="outline" className={`${SEVERITY_COLORS[detection.severity]}`}>
                  {detection.severity}
                </Badge>
              )}
            </div>
          )}
        </div>
        <button 
          onClick={onClose}
          className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-5 space-y-6">
        {loadingDetection ? (
          <Skeleton className="h-32 w-full" />
        ) : detection ? (
          <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-lg">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Detected</p>
              <p className="font-medium text-foreground">{format(new Date(detection.detected_at), "MMM d, yyyy h:mm a")}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Total Potholes</p>
              <p className="font-display font-medium text-foreground">{detection.pothole_count}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Avg Diameter</p>
              <p className="font-display font-medium text-foreground">{detection.avg_diameter_cm.toFixed(1)} cm</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Coordinates</p>
              <p className="font-display text-xs text-foreground mt-0.5">
                {detection.latitude.toFixed(4)}, {detection.longitude.toFixed(4)}
              </p>
            </div>
          </div>
        ) : null}

        <div>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide mb-3">Vision Output</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Original", url: detection?.original_image_url },
              { label: "Detected", url: detection?.detected_image_url },
              { label: "Mask", url: detection?.mask_image_url }
            ].map((img, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="aspect-square bg-muted rounded border border-border flex items-center justify-center overflow-hidden relative group">
                  {img.url ? (
                    <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest text-center px-2">No Image</span>
                  )}
                </div>
                <span className="text-[10px] text-center text-muted-foreground font-medium uppercase tracking-wider">{img.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide mb-3">Pothole Details</h3>
          {loadingPotholes ? (
            <Skeleton className="h-48 w-full" />
          ) : potholes && potholes.length > 0 ? (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="w-8"></th>
                    <th className="px-4 py-2 font-semibold text-xs text-muted-foreground uppercase tracking-wider">ID</th>
                    <th className="px-4 py-2 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Diam (cm)</th>
                    <th className="px-4 py-2 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {potholes.map(p => {
                    const isExpanded = expandedPotholeId === p.id;
                    return (
                      <Fragment key={p.id}>
                        <tr 
                          className="hover:bg-muted/20 cursor-pointer transition-colors"
                          onClick={() => setExpandedPotholeId(isExpanded ? null : p.id)}
                        >
                          <td className="pl-3 text-muted-foreground">
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </td>
                          <td className="px-4 py-2.5 font-display text-muted-foreground text-xs">{p.pothole_code}</td>
                          <td className="px-4 py-2.5 font-display font-medium text-foreground">{p.diameter_cm.toFixed(1)}</td>
                          <td className="px-4 py-2.5">
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${SEVERITY_COLORS[p.severity]}`}>
                              {p.severity}
                            </Badge>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-muted/10 border-t-0">
                            <td colSpan={4} className="px-4 pb-4 pt-1">
                              <div className="grid grid-cols-2 gap-y-2 gap-x-4 bg-white p-3 rounded border border-border shadow-sm">
                                <div className="flex justify-between">
                                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Area</span>
                                  <span className="text-xs font-display font-medium">{p.area_m2.toFixed(2)} m²</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Perimeter</span>
                                  <span className="text-xs font-display font-medium">{p.perimeter_m.toFixed(2)} m</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Mask Coverage</span>
                                  <span className="text-xs font-display font-medium">{(p.mask_coverage * 100).toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Confidence</span>
                                  <span className="text-xs font-display font-medium text-green-600">{(p.confidence * 100).toFixed(1)}%</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4 bg-muted/20 rounded-lg border border-border border-dashed">No detailed metrics available</p>
          )}
        </div>
      </div>
    </div>
  );
}
