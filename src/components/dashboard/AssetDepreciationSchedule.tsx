import { useMemo } from "react";
import { Loader2, CalendarIcon, X } from "lucide-react";
import { useAssets } from "@/hooks/useAssets";
import { useSettings } from "@/contexts/SettingsContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DepreciationRecord {
  no: number;
  date: string;
  assetDetail: string;
  costFinalBalance: number;
  disposal: number;
  remainingCost: number;
  depreciationRate: number;
  openingDepreciation: number;
  monthlyDepreciation: number;
  disposalDepreciation: number;
  closingDepreciation: number;
  netBookValue: number;
  isDisposed: boolean;
}

interface AssetDepreciationScheduleProps {
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  selectedDate: Date | null;
  setSelectedDate: (value: Date | null) => void;
}

export function AssetDepreciationSchedule({
  selectedCategory,
  setSelectedCategory,
  selectedDate,
  setSelectedDate,
}: AssetDepreciationScheduleProps) {
  const { t, language } = useSettings();
  const { data: assets, isLoading } = useAssets();
  
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatSelectedDate = (date: Date) => {
    return date.toLocaleDateString(language === 'ms' ? 'ms-MY' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Get unique categories from assets
  const categories = useMemo(() => {
    if (!assets) return [];
    const uniqueCategories = Array.from(new Set(assets.map(asset => asset.category || "")));
    return ["All Categories", ...uniqueCategories.filter(cat => cat !== "")];
  }, [assets]);

  // Calculate depreciation schedule data
  const depreciationSchedule = useMemo<DepreciationRecord[]>(() => {
    if (!assets || assets.length === 0) return [];
    
    // Filter assets by selected category if not 'All Categories'
    let filteredAssets = selectedCategory === 'All Categories' || selectedCategory === t('assets.allCategories')
      ? assets 
      : assets.filter(asset => (asset.category || "") === selectedCategory);
      
    // Further filter by selected date: show assets purchased on or before the selected date
    if (selectedDate) {
      filteredAssets = filteredAssets.filter(asset => {
        if (!asset.purchase_date) return false;
        const assetDate = new Date(asset.purchase_date);
        const compareAssetDate = new Date(assetDate.getFullYear(), assetDate.getMonth(), assetDate.getDate());
        const compareSelectedDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        return compareAssetDate <= compareSelectedDate;
      });
    }

    // Calculate depreciation schedule for each asset based on Excel logic
    return filteredAssets.map((asset, index) => {
      // Check if asset is disposed
      const isDisposed = asset.status === 'disposed';
      
      // Calculate depreciation rate based on useful life
      const usefulLife = asset.useful_life || 5; // Default to 5 years if not specified
      const depreciationRate = usefulLife > 0 ? (100 / usefulLife) : 0;
      
      // Cost (Final Balance) is the purchase price
      const costFinalBalance = asset.purchase_price || 0;
      
      // For disposal, we'll use current_value as disposal price if disposed
      const disposal = isDisposed ? asset.current_value || 0 : 0;
      
      // Calculate remaining cost after disposal
      const remainingCost = isDisposed ? 0 : costFinalBalance - disposal;
      
      // Calculate annual depreciation amount
      const annualDepreciation = (costFinalBalance * depreciationRate) / 100;
      
      // Calculate monthly depreciation
      const monthlyDepreciation = annualDepreciation / 12;
      
      // Declare variables
      let openingDepreciation = 0;
      let closingDepreciation = 0;
      let disposalDepreciation = 0;
      let currentPeriodAddition = monthlyDepreciation;
      
      const purchaseDate = asset.purchase_date ? new Date(asset.purchase_date) : null;
      const disposalDate = asset.status_date ? new Date(asset.status_date) : null;
      const referenceDate = selectedDate || new Date();

      if (purchaseDate) {
        const refYear = referenceDate.getFullYear();
        const refMonth = referenceDate.getMonth();
        const refMonthStart = new Date(refYear, refMonth, 1);

        const purchaseYear = purchaseDate.getFullYear();
        const purchaseMonth = purchaseDate.getMonth();

        const disposalMonthStart = disposalDate ? new Date(disposalDate.getFullYear(), disposalDate.getMonth(), 1) : null;

        const isDisposedInCurrentMonth = isDisposed && (!disposalMonthStart || refMonthStart.getTime() === disposalMonthStart.getTime());
        const isAlreadyDisposed = isDisposed && disposalMonthStart && refMonthStart > disposalMonthStart;

        if (isAlreadyDisposed) {
          openingDepreciation = 0;
          currentPeriodAddition = 0;
          disposalDepreciation = 0;
          closingDepreciation = 0;
        } else if (isDisposedInCurrentMonth) {
          const monthsSincePurchase = (refYear - purchaseYear) * 12 + (refMonth - purchaseMonth);
          openingDepreciation = monthlyDepreciation * Math.max(0, monthsSincePurchase);
          openingDepreciation = Math.min(openingDepreciation, costFinalBalance);
          
          disposalDepreciation = Math.min(openingDepreciation + currentPeriodAddition, costFinalBalance);
          closingDepreciation = 0;
        } else {
          const monthsSincePurchase = (refYear - purchaseYear) * 12 + (refMonth - purchaseMonth);
          openingDepreciation = monthlyDepreciation * Math.max(0, monthsSincePurchase);
          openingDepreciation = Math.min(openingDepreciation, costFinalBalance);
          
          closingDepreciation = Math.min(openingDepreciation + currentPeriodAddition, costFinalBalance);
          disposalDepreciation = 0;
        }
      }
      
      const netBookValue = isDisposed ? 0 : Math.max(0, remainingCost - closingDepreciation);

      return {
        no: index + 1,
        date: asset.purchase_date,
        assetDetail: asset.name,
        costFinalBalance,
        disposal,
        remainingCost,
        depreciationRate,
        openingDepreciation,
        monthlyDepreciation: currentPeriodAddition,
        disposalDepreciation,
        closingDepreciation,
        netBookValue,
        isDisposed
      };
    });
  }, [assets, selectedCategory, selectedDate]);

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">{t("dashboard.assetDepreciationSchedule")}</h3>
          <div className="flex gap-2">
            <div className="w-48">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === 'All Categories' ? t('assets.allCategories') : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              disabled
              className="w-56 justify-start text-left font-normal border border-neutral-300 dark:border-neutral-700 bg-background text-muted-foreground"
            >
              <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <span>{t('print.allMonths') || 'All Months'}</span>
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t("dashboard.assetDepreciationSchedule")}</h3>
          <p className="text-sm text-muted-foreground">{t("dashboard.depreciationScheduleDescription")}</p>
        </div>
        <div className="flex gap-2">
          <div className="w-48">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === 'All Categories' ? t('assets.allCategories') : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-56">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal border border-neutral-300 dark:border-neutral-700 bg-background hover:bg-accent hover:text-accent-foreground",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  {selectedDate ? (
                    <span className="truncate">{formatSelectedDate(selectedDate)}</span>
                  ) : (
                    <span>{t('print.allMonths') || 'All Months'}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-2 border-b border-border flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t('assets.selectDate') || 'Select Date'}
                  </span>
                  {selectedDate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1 text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDate(null);
                      }}
                    >
                      <X className="h-3 w-3" />
                      {t('common.clear') || 'Clear'}
                    </Button>
                  )}
                </div>
                <Calendar
                  mode="single"
                  selected={selectedDate || undefined}
                  onSelect={(date) => setSelectedDate(date || null)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-400 dark:border-neutral-600">
              <th className="text-center py-3 px-2 font-semibold text-foreground text-sm border-r border-neutral-350 dark:border-neutral-650" colSpan={3}>{t("depreciation.schedule.jenisAset")}</th>
              <th className="text-center py-3 px-2 font-semibold text-foreground text-sm border-r border-neutral-350 dark:border-neutral-650" colSpan={3}>{t("depreciation.schedule.kos")}</th>
              <th className="text-center py-3 px-2 font-semibold text-foreground text-sm border-r border-neutral-350 dark:border-neutral-650">{t("depreciation.schedule.kadarSusut")}</th>
              <th className="text-center py-3 px-2 font-semibold text-foreground text-sm border-r border-neutral-350 dark:border-neutral-650" colSpan={4}>{t("depreciation.schedule.susutNilai")}</th>
              <th className="text-center py-3 px-2 font-semibold text-foreground text-sm">{t("depreciation.schedule.nilaiBukuBersih")}</th>
            </tr>
            <tr className="border-b border-neutral-400 dark:border-neutral-600">
              <th className="py-3 px-2 text-foreground font-semibold text-center">{t("depreciation.schedule.bil")}</th>
              <th className="py-3 px-2 text-foreground font-semibold text-center">{t("depreciation.schedule.tarikh")}</th>
              <th className="py-3 px-2 text-foreground font-semibold text-center border-r border-neutral-350 dark:border-neutral-650">{t("depreciation.schedule.assetDetail")}</th>
              <th className="py-3 px-2 text-foreground font-semibold text-center">{t("depreciation.schedule.kosAset")}</th>
              <th className="py-3 px-2 text-foreground font-semibold text-center">{t("depreciation.schedule.lupus")}</th>
              <th className="py-3 px-2 text-foreground font-semibold text-center border-r border-neutral-350 dark:border-neutral-650">{t("depreciation.schedule.bakiAkhir")}</th>
              <th className="py-3 px-2 text-foreground font-semibold text-center border-r border-neutral-350 dark:border-neutral-650">{t("depreciation.schedule.percentageSusut")}</th>
              <th className="py-3 px-2 text-foreground font-semibold text-center">{t("depreciation.schedule.bakiAwal")}</th>
              <th className="py-3 px-2 text-foreground font-semibold text-center">{t("depreciation.schedule.tambahan")}</th>
              <th className="py-3 px-2 text-foreground font-semibold text-center">{t("depreciation.schedule.lupus")}</th>
              <th className="py-3 px-2 text-foreground font-semibold text-center border-r border-neutral-350 dark:border-neutral-650">{t("depreciation.schedule.bakiAkhir2")}</th>
              <th className="py-3 px-2 text-foreground font-semibold text-center">{t("depreciation.schedule.nilaiBukuBersih2")}</th>
            </tr>
          </thead>
          <tbody>
            {depreciationSchedule.map((record) => (
              <tr key={record.no} className={`border-b border-neutral-300 dark:border-neutral-700 hover:bg-accent/10 transition-colors ${record.isDisposed ? "line-through text-muted-foreground" : ""}`}>
                <td className="py-3 px-2 text-foreground text-center">{record.no}</td>
                <td className="py-3 px-2 text-foreground text-center">{formatDate(record.date)}</td>
                <td className="py-3 px-2 text-foreground text-center border-r border-neutral-300 dark:border-neutral-700">{record.assetDetail}</td>
                <td className="py-3 px-2 text-foreground text-center">{record.costFinalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="py-3 px-2 text-foreground text-center">{record.disposal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="py-3 px-2 text-foreground text-center border-r border-neutral-300 dark:border-neutral-700">{record.remainingCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="py-3 px-2 text-foreground text-center border-r border-neutral-300 dark:border-neutral-700">{record.depreciationRate.toFixed(2)}%</td>
                <td className="py-3 px-2 text-foreground text-center">{record.openingDepreciation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="py-3 px-2 text-foreground text-center">{record.monthlyDepreciation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="py-3 px-2 text-foreground text-center">{record.disposalDepreciation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="py-3 px-2 text-foreground text-center border-r border-neutral-300 dark:border-neutral-700">{record.closingDepreciation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="py-3 px-2 text-foreground text-center font-medium">{record.netBookValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
            
            <tr className="accounting-total-row font-semibold bg-neutral-50/50 dark:bg-neutral-900/30">
              <td className="py-3 px-6 text-left border-r border-neutral-350 dark:border-neutral-650" colSpan={3}>{t("depreciation.schedule.jumlah")}</td>
              <td className="py-3 px-2 text-center">{depreciationSchedule.filter(record => !record.isDisposed).reduce((sum, record) => sum + record.costFinalBalance, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="py-3 px-2 text-center">{depreciationSchedule.reduce((sum, record) => sum + record.disposal, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="py-3 px-2 text-center border-r border-neutral-300 dark:border-neutral-700">{depreciationSchedule.filter(record => !record.isDisposed).reduce((sum, record) => sum + record.remainingCost, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="py-3 px-2 border-r border-neutral-300 dark:border-neutral-700"></td>
              <td className="py-3 px-2 text-center">{depreciationSchedule.filter(record => !record.isDisposed).reduce((sum, record) => sum + record.openingDepreciation, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="py-3 px-2 text-center">{depreciationSchedule.filter(record => !record.isDisposed).reduce((sum, record) => sum + record.monthlyDepreciation, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="py-3 px-2 text-center">{depreciationSchedule.reduce((sum, record) => sum + record.disposalDepreciation, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="py-3 px-2 text-center border-r border-neutral-300 dark:border-neutral-700">{depreciationSchedule.filter(record => !record.isDisposed).reduce((sum, record) => sum + record.closingDepreciation, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="py-3 px-2 text-center font-medium">{depreciationSchedule.filter(record => !record.isDisposed).reduce((sum, record) => sum + record.netBookValue, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {depreciationSchedule.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {t("dashboard.noDepreciationData")}
        </div>
      )}
    </div>
  );
}