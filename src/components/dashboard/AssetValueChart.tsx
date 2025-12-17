import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAssets } from "@/hooks/useAssets";
import { useSettings } from "@/contexts/SettingsContext";
import { useMemo } from "react";

export function AssetValueChart() {
  const { t, theme } = useSettings();
  const { data: assets, isLoading } = useAssets();

  // Dynamic colors based on theme
  const axisColor = theme === 'dark' ? 'hsl(215, 20%, 65%)' : 'hsl(237, 42%, 40%)';
  const tooltipBg = theme === 'dark' ? 'hsl(222, 47%, 13%)' : 'hsl(0, 0%, 100%)';
  const tooltipTextColor = theme === 'dark' ? 'hsl(210, 40%, 98%)' : 'hsl(237, 42%, 20%)';
  const tooltipBorder = theme === 'dark' ? 'rgb(155, 93, 224)' : 'rgb(78, 86, 192)';

  // Calculate asset values for the past 12 months
  const chartData = useMemo(() => {
    if (!assets || assets.length === 0) {
      // Return empty data for all months if no assets
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const currentMonth = new Date().getMonth();
      return months.map((month, index) => {
        const monthIndex = (currentMonth - 11 + index + 12) % 12;
        return {
          month: months[monthIndex],
          value: 0,
        };
      });
    }

    const today = new Date();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const data: { month: string; value: number }[] = [];

    // Generate data for the past 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = monthNames[date.getMonth()];
      
      // Calculate total value of all assets at this point in time
      let totalValue = 0;
      
      assets.forEach(asset => {
        const purchaseDate = new Date(asset.purchase_date);
        
        // Only include assets that were purchased before or during this month
        if (purchaseDate <= date) {
          const purchasePrice = asset.purchase_price || 0;
          const currentValue = asset.current_value || 0;
          
          // Calculate depreciation per month
          const monthsSincePurchase = Math.max(1, 
            (today.getFullYear() - purchaseDate.getFullYear()) * 12 + 
            (today.getMonth() - purchaseDate.getMonth())
          );
          
          const monthsToDate = Math.max(0,
            (date.getFullYear() - purchaseDate.getFullYear()) * 12 + 
            (date.getMonth() - purchaseDate.getMonth())
          );
          
          // Calculate value at this specific month
          const totalDepreciation = purchasePrice - currentValue;
          const monthlyDepreciation = totalDepreciation / monthsSincePurchase;
          const valueAtMonth = purchasePrice - (monthlyDepreciation * monthsToDate);
          
          totalValue += Math.max(0, valueAtMonth);
        }
      });
      
      data.push({
        month: monthName,
        value: Math.round(totalValue),
      });
    }
    
    return data;
  }, [assets]);

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-6 animate-fade-in hover-lift">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground">{t("dashboard.assetValueTrend")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.assetValueDesc")}
          </p>
        </div>
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">{t("dashboard.loading")}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="glass rounded-xl p-6 animate-fade-in hover-lift hover-border group transition-all duration-300">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-300">{t("dashboard.assetValueTrend")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.assetValueDesc")}
        </p>
      </div>
      <div className="h-[300px] transition-transform duration-300 group-hover:scale-[1.02]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(78, 86, 192)" stopOpacity={0.4} />
                <stop offset="50%" stopColor="rgb(155, 93, 224)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="rgb(215, 143, 238)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: axisColor, fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: axisColor, fontSize: 12 }}
              tickFormatter={(value) => `RM${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                border: `2px solid ${tooltipBorder}`,
                borderRadius: "12px",
                color: tooltipTextColor,
                boxShadow: "0 8px 24px rgba(155, 93, 224, 0.3)",
                padding: "12px 16px",
              }}
              cursor={{ stroke: "rgb(215, 143, 238)", strokeWidth: 2, strokeDasharray: "5 5" }}
              formatter={(value: number) => [`RM${value.toLocaleString()}`, "Value"]}
              animationDuration={300}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="rgb(78, 86, 192)"
              strokeWidth={3}
              fill="url(#valueGradient)"
              animationDuration={1000}
              activeDot={{ 
                r: 8, 
                fill: "rgb(155, 93, 224)",
                stroke: "rgb(78, 86, 192)",
                strokeWidth: 2,
                className: "hover-scale"
              }}
              dot={{ 
                r: 4, 
                fill: "rgb(78, 86, 192)",
                strokeWidth: 0,
                className: "transition-all duration-300 hover:r-6"
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
