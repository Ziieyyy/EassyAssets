import { AssetDepreciationSchedule } from "@/components/dashboard/AssetDepreciationSchedule";
import { MainLayout } from "@/components/layout/MainLayout";
import { useSettings } from "@/contexts/SettingsContext";

export default function AssetDepreciationSchedulePage() {
  const { t } = useSettings();
  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("nav.depreciationSchedule")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("dashboard.depreciationScheduleDescription")}
            </p>
          </div>
        </div>
        <AssetDepreciationSchedule />
      </div>
    </MainLayout>
  );
}