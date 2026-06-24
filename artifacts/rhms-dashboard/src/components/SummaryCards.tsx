import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export function SummaryCards() {
  const { data, isLoading } = useGetDashboardSummary({ query: { refetchInterval: 30000 } });

  if (isLoading) {
    return (
      <div className="grid grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="rounded-lg shadow-sm border-0">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const cards = [
    { label: "Total Roads Monitored", value: data.total_roads },
    { label: "Total Potholes", value: data.total_potholes },
    { label: "Critical Zones", value: data.critical_zones, color: "text-red-600" },
    { label: "Avg Diameter", value: `${data.avg_diameter_cm.toFixed(1)} cm` },
    { 
      label: "Last Detection Time", 
      value: data.last_detection_at ? format(new Date(data.last_detection_at), "h:mm a") : "--"
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-4">
      {cards.map((card, i) => (
        <Card key={i} className="rounded-lg shadow-sm border-0 bg-white">
          <CardContent className="p-4 flex flex-col justify-center">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{card.label}</p>
            <p className={`text-2xl font-display font-semibold ${card.color || 'text-foreground'}`}>
              {card.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
