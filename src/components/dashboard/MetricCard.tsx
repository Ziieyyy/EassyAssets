import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "text-primary",
}: MetricCardProps) {
  return (
    <div className="glass rounded-xl p-6 animate-fade-in hover-lift hover-glow hover-border group cursor-pointer">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300">{title}</p>
          <p className="text-3xl font-bold text-foreground transition-transform duration-300 group-hover:scale-105">{value}</p>
          {change && (
            <p
              className={cn(
                "text-sm font-medium transition-all duration-300",
                changeType === "positive" && "text-success",
                changeType === "negative" && "text-destructive",
                changeType === "neutral" && "text-muted-foreground"
              )}
            >
              {change}
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-xl bg-primary/10 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110 group-hover:rotate-6", iconColor)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
