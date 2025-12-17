import { Wrench, Calendar, AlertTriangle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useUpcomingMaintenance } from "@/hooks/useMaintenance";



const priorityStyles = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-muted text-muted-foreground border-border",
};

export function UpcomingMaintenance() {
  const { data: maintenanceTasks, isLoading } = useUpcomingMaintenance(10); // Show up to 10 upcoming tasks

  return (
    <div className="glass rounded-xl p-6 animate-fade-in hover-lift hover-border group transition-all duration-300">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 rounded-lg bg-primary/10 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110 group-hover:rotate-12">
          <Wrench className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-300">Upcoming Maintenance</h3>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : maintenanceTasks && maintenanceTasks.length > 0 ? (
      <div className="space-y-4">
        {maintenanceTasks.map((task, index) => (
          <div
            key={task.id}
            className="flex items-start justify-between p-3 rounded-lg bg-surface/20 transition-all duration-300 ease-out hover:bg-accent/20 hover:shadow-md hover:translate-x-2 cursor-pointer group/item"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="space-y-1">
              <p className="font-medium text-foreground group-hover/item:text-primary transition-colors duration-300">{task.asset_name}</p>
              <p className="text-sm text-muted-foreground">{task.task}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3 transition-transform duration-300 group-hover/item:scale-110" />
                <span>{new Date(task.due_date).toLocaleDateString()}</span>
                {task.daysUntilDue !== undefined && task.daysUntilDue <= 3 && (
                  <span className="flex items-center gap-1 text-warning transition-all duration-300 group-hover/item:scale-105">
                    <AlertTriangle className="w-3 h-3 animate-pulse" />
                    Due soon
                  </span>
                )}
              </div>
            </div>
            <Badge
              variant="outline"
              className={cn("capitalize text-xs transition-all duration-300 group-hover/item:scale-110", priorityStyles[task.priority as keyof typeof priorityStyles])}
            >
              {task.priority}
            </Badge>
          </div>
        ))}
      </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Wrench className="w-12 h-12 text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No upcoming maintenance</p>
          <p className="text-xs text-muted-foreground/70 mt-1">All maintenance tasks are completed</p>
        </div>
      )}
    </div>
  );
}
