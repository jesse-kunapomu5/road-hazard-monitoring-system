import { useGetDetectionFeed } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const SEVERITY_COLORS: Record<string, string> = {
  Low: "bg-green-50 text-green-700 border-green-200",
  Medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
  High: "bg-orange-50 text-orange-700 border-orange-200",
  Critical: "bg-red-50 text-red-700 border-red-200"
};

export function FeedPanel() {
  const { data, isLoading } = useGetDetectionFeed({ params: { limit: 20 } }, { query: { refetchInterval: 10000 } });

  return (
    <Card className="h-full border-0 shadow-sm bg-white overflow-hidden flex flex-col">
      <CardHeader className="py-3 px-4 border-b border-border shrink-0 bg-gray-50/50 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold text-foreground uppercase tracking-wide">Live Detection Feed</CardTitle>
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
        </span>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-16 w-full rounded-md" />
            <Skeleton className="h-16 w-full rounded-md" />
            <Skeleton className="h-16 w-full rounded-md" />
          </div>
        ) : !data || data.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No recent detections
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {data.map((item) => (
              <div key={item.id} className="p-3 hover:bg-muted/30 transition-colors animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-medium text-foreground">{item.road_name}</span>
                  <span className="text-[10px] font-display text-muted-foreground">
                    {format(new Date(item.detected_at), "h:mm a")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground font-display">{item.pothole_count}</span> potholes detected
                  </span>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${SEVERITY_COLORS[item.severity] || "bg-gray-50 text-gray-700"}`}>
                    {item.severity}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
