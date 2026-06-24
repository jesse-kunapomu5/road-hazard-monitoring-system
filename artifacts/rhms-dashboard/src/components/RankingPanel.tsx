import { useGetRoadRanking } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function RankingPanel() {
  const { data, isLoading } = useGetRoadRanking({ query: { refetchInterval: 30000 } });

  if (isLoading) {
    return (
      <Card className="h-full border-0 shadow-sm bg-white overflow-hidden flex flex-col">
        <CardHeader className="py-3 px-4 border-b border-border bg-gray-50/50">
          <CardTitle className="text-sm font-semibold text-foreground">Road Ranking</CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-auto">
          <div className="p-4 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className="h-full border-0 shadow-sm bg-white overflow-hidden flex flex-col">
      <CardHeader className="py-3 px-4 border-b border-border bg-gray-50/50 shrink-0">
        <CardTitle className="text-sm font-semibold text-foreground uppercase tracking-wide">Road Ranking</CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 overflow-auto">
        <div className="flex flex-col">
          {/* Worst Roads */}
          <div className="p-4 bg-red-50/30 border-b border-border/50">
            <h3 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-3 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></span>
              Worst Roads
            </h3>
            <div className="space-y-3">
              {data.worst.map((road, i) => (
                <div key={road.road_name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-display font-medium text-muted-foreground w-4">{i + 1}</span>
                    <span className="text-sm font-medium text-foreground">{road.road_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-red-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, road.severity_score)}%` }}></div>
                    </div>
                    <span className="text-xs font-display text-muted-foreground w-8 text-right">{road.pothole_count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Best Roads */}
          <div className="p-4 bg-green-50/30">
            <h3 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-3 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2"></span>
              Best Roads
            </h3>
            <div className="space-y-3">
              {data.best.map((road, i) => (
                <div key={road.road_name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-display font-medium text-muted-foreground w-4">{i + 1}</span>
                    <span className="text-sm font-medium text-foreground">{road.road_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-green-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, road.severity_score)}%` }}></div>
                    </div>
                    <span className="text-xs font-display text-muted-foreground w-8 text-right">{road.pothole_count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
