import { Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAssets } from "@/hooks/useAssets";
import { useSettings } from "@/contexts/SettingsContext";
import { useNavigate } from "react-router-dom";



const statusStyles = {
  active: "bg-success/10 text-success border-success/20",
  maintenance: "bg-warning/10 text-warning border-warning/20",
  inactive: "bg-muted text-muted-foreground border-border",
};

export function RecentAssets() {
  const { t } = useSettings();
  const { data: allAssets, isLoading } = useAssets();
  const navigate = useNavigate();
  const recentAssets = allAssets?.slice(0, 5) || [];

  return (
    <div className="glass rounded-xl p-6 animate-fade-in hover-lift hover-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t("dashboard.recentAssets")}</h3>
          <p className="text-sm text-muted-foreground">{t("dashboard.latestAdditions")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/assets")}>
          {t("dashboard.viewAll")}
        </Button>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
      <div className="space-y-4">
        {recentAssets.map((asset, index) => (
          <div
            key={asset.id}
            className="flex items-center justify-between p-4 rounded-lg bg-surface/30 transition-all duration-300 ease-out hover:bg-accent/20 hover:shadow-md hover:translate-x-2 cursor-pointer group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground group-hover:text-primary transition-colors duration-300">{asset.name}</p>
                <p className="text-sm text-muted-foreground">
                  {asset.id} • {asset.category}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="font-medium text-foreground">
                  RM {asset.current_value?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-muted-foreground">{asset.assigned_to}</p>
              </div>
              <Badge
                variant="outline"
                className={cn("capitalize", statusStyles[asset.status])}
              >
                {t(`status.${asset.status}`)}
              </Badge>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
