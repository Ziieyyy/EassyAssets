import { Package, DollarSign, TrendingDown, AlertTriangle, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { AssetValueChart } from "@/components/dashboard/AssetValueChart";
import { AssetCategoryChart } from "@/components/dashboard/AssetCategoryChart";
import { RecentAssets } from "@/components/dashboard/RecentAssets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAssetStats, useAssets } from "@/hooks/useAssets";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo } from "react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useSettings();
  const { profile } = useAuth();
  const { data: stats } = useAssetStats();
  const { data: assets } = useAssets();

  // Count assets with status = "maintenance"
  const maintenanceCount = useMemo(() => {
    if (!assets) return 0;
    return assets.filter(asset => asset.status === 'maintenance').length;
  }, [assets]);

  // Calculate assets added this month
  const assetsThisMonth = useMemo(() => {
    if (!assets) return 0;
    const today = new Date();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();
    
    return assets.filter(asset => {
      const createdDate = new Date(asset.created_at);
      return createdDate.getMonth() === thisMonth && createdDate.getFullYear() === thisYear;
    }).length;
  }, [assets]);

  // Calculate depreciation percentage
  const depreciationPercentage = useMemo(() => {
    if (!stats || !stats.totalValue || stats.totalValue === 0) return "0.0";
    const percentage = (stats.totalDepreciation / (stats.totalValue + stats.totalDepreciation)) * 100;
    return percentage.toFixed(1);
  }, [stats]);

  // Calculate fiscal year depreciation
  const fiscalYearDepreciation = useMemo(() => {
    if (!assets) return "RM 0";
    const today = new Date();
    const fiscalYearStart = new Date(today.getFullYear(), 0, 1); // January 1st of current year
    
    // Pre-calculate depreciation data to avoid repeated calculations
    const depreciationData = assets.map(asset => {
      const purchaseDate = new Date(asset.purchase_date);
      const purchasePrice = asset.purchase_price || 0;
      const currentValue = asset.current_value || 0;
      
      // Calculate depreciation parameters once
      const totalMonths = Math.max(1,
        (today.getFullYear() - purchaseDate.getFullYear()) * 12 +
        (today.getMonth() - purchaseDate.getMonth()) + 1 // +1 to include purchase month
      );
      
      const totalDepreciation = purchasePrice - currentValue;
      const monthlyDepreciation = totalDepreciation / totalMonths;
      
      return {
        purchaseDate,
        monthlyDepreciation,
        fiscalYearMonths: purchaseDate < fiscalYearStart ? Math.max(0,
          (today.getFullYear() - fiscalYearStart.getFullYear()) * 12 +
          (today.getMonth() - fiscalYearStart.getMonth()) + 1 // +1 to include start month
        ) : 0
      };
    });
    
    // Calculate total depreciation using pre-calculated data
    const depreciation = depreciationData.reduce((sum, asset) => {
      return sum + (asset.monthlyDepreciation * asset.fiscalYearMonths);
    }, 0);
    
    return `RM ${Math.round(depreciation).toLocaleString()}`;
  }, [assets]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("dashboard.welcome")}! Here's an overview of your assets.
          </p>
          {profile?.company_name && (
            <p className="text-sm text-primary font-medium mt-1">
              {profile.company_name}
            </p>
          )}
        </div>
        <Button 
          className="gap-2 rounded-full"
          onClick={() => navigate("/assets/add")}
        >
          <Plus className="w-4 h-4" />
          {t("dashboard.addAsset")}
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title={t("dashboard.totalAssets")}
          value={stats?.totalAssets.toLocaleString() || '0'}
          change={assetsThisMonth > 0 ? `+${assetsThisMonth} ${t("dashboard.thisMonth")}` : `No new assets ${t("dashboard.thisMonth")}`}
          changeType={assetsThisMonth > 0 ? "positive" : "neutral"}
          icon={Package}
        />
        <MetricCard
          title={t("dashboard.totalValue")}
          value={`RM ${(stats?.totalValue || 0).toLocaleString()}`}
          change={stats?.totalDepreciation ? `-${depreciationPercentage}% ${t("dashboard.depreciation")}` : `No ${t("dashboard.depreciation")}`}
          changeType={stats?.totalDepreciation ? "negative" : "neutral"}
          icon={DollarSign}
        />
        <MetricCard
          title={t("dashboard.depreciatedValue")}
          value={`RM ${(stats?.totalDepreciation || 0).toLocaleString()}`}
          change={fiscalYearDepreciation !== "RM 0" ? `${fiscalYearDepreciation} ${t("dashboard.thisFiscalYear")}` : t("dashboard.thisFiscalYear")}
          changeType="neutral"
          icon={TrendingDown}
        />
        <MetricCard
          title={t("dashboard.maintenanceDue")}
          value={maintenanceCount.toString()}
          change={maintenanceCount ? `${maintenanceCount} ${t("dashboard.highPriority")}` : t("dashboard.noHighPriority")}
          changeType={maintenanceCount ? "negative" : "neutral"}
          icon={AlertTriangle}
          iconColor="text-warning"
          onClick={() => navigate("/assets?status=maintenance")}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AssetValueChart />
        <AssetCategoryChart />
      </div>

      {/* Recent Assets */}
      <div className="grid grid-cols-1 gap-6">
        <RecentAssets />
      </div>
    </div>
  );
}