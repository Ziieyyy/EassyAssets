import { Cell, Pie, PieChart, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useAssetsByCategory } from "@/hooks/useAssets";
import { useSettings } from "@/contexts/SettingsContext";
import { Loader2 } from "lucide-react";



const colors = [
  "rgb(78, 86, 192)",   // Primary
  "rgb(155, 93, 224)",  // Secondary
  "rgb(215, 143, 238)", // Accent
  "rgb(253, 207, 250)", // Surface
  "rgb(88, 96, 202)",   // Primary lighter
  "rgb(165, 103, 234)", // Secondary lighter
];

export function AssetCategoryChart() {
  const { t, theme } = useSettings();
  const { data: categoryData, isLoading } = useAssetsByCategory();
  
  const chartData = categoryData?.map((item, index) => ({
    ...item,
    color: colors[index % colors.length]
  })) || [];

  // Dynamic text color based on theme
  const textColor = theme === 'dark' ? 'hsl(210, 40%, 98%)' : 'hsl(237, 42%, 20%)';
  const tooltipBg = theme === 'dark' ? 'hsl(222, 47%, 13%)' : 'hsl(0, 0%, 100%)';
  const tooltipBorder = theme === 'dark' ? 'rgb(155, 93, 224)' : 'rgb(78, 86, 192)';

  return (
    <div className="glass rounded-xl p-6 animate-fade-in hover-lift hover-border group transition-all duration-300">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-300">{t("dashboard.assetsByCategory")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.categoryDistribution")}
        </p>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
      <div className="h-[300px] transition-transform duration-300 group-hover:scale-[1.02]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
              animationBegin={0}
              animationDuration={1000}
              activeIndex={undefined}
              activeShape={{
                outerRadius: 100,
                stroke: "rgb(78, 86, 192)",
                strokeWidth: 3,
                fill: undefined,
              }}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                border: `2px solid ${tooltipBorder}`,
                borderRadius: "12px",
                color: textColor,
                boxShadow: "0 8px 24px rgba(155, 93, 224, 0.3)",
                padding: "12px 16px",
              }}
              formatter={(value: number) => [`RM${value.toLocaleString()}`, "Value"]}
              animationDuration={300}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              wrapperStyle={{
                paddingTop: "16px",
              }}
              formatter={(value) => (
                <span style={{ 
                  color: textColor, 
                  fontSize: "12px",
                  transition: "color 0.3s ease"
                }} className="hover:!text-primary cursor-pointer">{value}</span>
              )}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      )}
    </div>
  );
}
