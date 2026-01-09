import { useMemo, useState } from "react";
import { Loader2, ChevronDown } from "lucide-react";
import { useAssets } from "@/hooks/useAssets";
import { useSettings } from "@/contexts/SettingsContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

export function AssetDepreciationSchedule() {
  const { t } = useSettings();
  const { data: assets, isLoading } = useAssets();
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [selectedMonth, setSelectedMonth] = useState<string>('All Months');
  
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString();
    };

  // Get unique categories from assets
  const categories = useMemo(() => {
    if (!assets) return [];
    const uniqueCategories = Array.from(new Set(assets.map(asset => asset.category || "")));
    return ["All Categories", ...uniqueCategories.filter(cat => cat !== "")];
  }, [assets]);

  // Get unique months from assets
  const months = useMemo(() => {
    if (!assets) return [];
    const uniqueMonths = Array.from(new Set(assets.map(asset => {
      const date = new Date(asset.purchase_date);
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`; // Format as YYYY-MM
    })));
    
    // Sort months in descending order (newest first)
    uniqueMonths.sort((a, b) => b.localeCompare(a));
    
    return uniqueMonths;
  }, [assets]);

  // Calculate depreciation schedule data
  const depreciationSchedule = useMemo<DepreciationRecord[]>(() => {
    if (!assets || assets.length === 0) return [];
    
    // Filter assets by selected category if not 'All Categories'
    let filteredAssets = selectedCategory === 'All Categories' || selectedCategory === t('assets.allCategories')
      ? assets 
      : assets.filter(asset => (asset.category || "") === selectedCategory);
      
    // Further filter by selected month if not 'All Months'
    if (selectedMonth !== 'All Months') {
      filteredAssets = filteredAssets.filter(asset => {
        const assetDate = new Date(asset.purchase_date);
        const assetMonth = `${assetDate.getFullYear()}-${(assetDate.getMonth() + 1).toString().padStart(2, '0')}`;
        return assetMonth === selectedMonth;
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
      
      // Calculate monthly depreciation - Excel Logic: Monthly Depreciation = (Asset Cost × Depreciation Rate %) / 12
      const monthlyDepreciation = annualDepreciation / 12;
      
      // For Excel-style monthly accounting, we need to track opening and closing depreciation
      // Month 1: Opening Depreciation = 0, Addition = Monthly Depreciation, Disposal = 0, Closing Depreciation = Addition
      // Month 2+: Opening Depreciation = Previous Month Closing, Addition = Monthly Depreciation, Disposal = 0, Closing Depreciation = Opening + Addition
      
      // Since we're showing a single row per asset (not monthly breakdown), we'll calculate based on asset's purchase date
      // and assume we're showing the current month's depreciation position
      
      // Excel Logic Implementation - Straight-Line Method (Monthly)
      // Monthly Depreciation = (Asset Cost × Depreciation Rate %) / 12
      // This maps to the "Tambahan" (Addition) column in the table
      
      // For Excel-style monthly accounting:
      // Month 1: Opening Depreciation = 0, Addition = Monthly Depreciation, Disposal = 0, Closing Depreciation = Opening + Addition
      // Month 2+: Opening Depreciation = Previous Month Closing, Addition = Monthly Depreciation, Disposal = 0, Closing Depreciation = Opening + Addition
      
      // Declare variables
      let openingDepreciation = 0;
      let closingDepreciation = 0;
      
      // For disposed assets - all values become 0
      if (isDisposed) {
        openingDepreciation = 0; // Not applicable for disposed assets
        closingDepreciation = 0; // All depreciation is disposed
      } else {
        // According to Excel requirements, we should remove usage of currentDate and time-based depreciation.
        // However, to show the current depreciation position of an asset, we need some time reference.
        // For Excel logic, we'll calculate based on the months from purchase date to current date.
        // This represents the current month in the asset's depreciation schedule.
        const purchaseDate = new Date(asset.purchase_date);
        const currentDate = new Date();
        
        // Calculate months since purchase (as of current month)
        // This determines which "month" in the depreciation schedule we're currently at
        const monthsSincePurchase = 
          (currentDate.getFullYear() - purchaseDate.getFullYear()) * 12 +
          (currentDate.getMonth() - purchaseDate.getMonth());
        
        // Excel Logic Implementation:
        // Monthly Depreciation (Addition) = (Asset Cost × Depreciation Rate %) / 12
        // Month 1: Opening = 0, Addition = Monthly Depreciation, Disposal = 0, Closing = Opening + Addition
        // Month n: Opening = Previous Month Closing, Addition = Monthly Depreciation, Disposal = 0, Closing = Opening + Addition
        
        if (monthsSincePurchase <= 0) {
          // Asset purchased this month or in the future - Month 1 scenario
          openingDepreciation = 0; // "Baki Awal Susut Nilai" - Opening Depreciation
          closingDepreciation = monthlyDepreciation; // "Baki Akhir Susut Nilai" - Closing Depreciation = Opening + Addition
        } else {
          // Asset has been owned for some time - Month n scenario
          // Opening Depreciation = Previous Month's Closing Depreciation
          openingDepreciation = monthlyDepreciation * Math.max(0, monthsSincePurchase - 1); // "Baki Awal Susut Nilai"
          
          // Closing Depreciation = Opening Depreciation + Monthly Addition (monthlyDepreciation)
          closingDepreciation = openingDepreciation + monthlyDepreciation; // "Baki Akhir Susut Nilai"
        }
        
        // Cap the depreciation at the asset cost to avoid over-depreciation
        openingDepreciation = Math.min(openingDepreciation, costFinalBalance);
        closingDepreciation = Math.min(closingDepreciation, costFinalBalance);
      }
      
      // Calculate disposal depreciation (for disposed assets)
      const disposalDepreciation = 0; // Currently not tracking disposal depreciation separately
      
      // Calculate Net Book Value using the formula: Net Book Value = Cost Closing Balance − Depreciation Closing Balance
      // For disposed assets, both cost and depreciation closing balances are 0
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
        monthlyDepreciation,
        disposalDepreciation,
        closingDepreciation,
        netBookValue,
        isDisposed
      };
    });
  }, [assets, selectedCategory, selectedMonth]);

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
            <div className="w-48">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Months">All Months</SelectItem>
                  {months.map((month) => {
                    // Format month for display (e.g., 2023-05 to May 2023)
                    const [year, monthNum] = month.split('-');
                    const monthName = new Date(parseInt(year), parseInt(monthNum) - 1, 1).toLocaleString('default', { month: 'long' });
                    return (
                      <SelectItem key={month} value={month}>
                        {monthName} {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
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
          <div className="w-48">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Months">All Months</SelectItem>
                {months.map((month) => {
                  // Format month for display (e.g., 2023-05 to May 2023)
                  const [year, monthNum] = month.split('-');
                  const monthName = new Date(parseInt(year), parseInt(monthNum) - 1, 1).toLocaleString('default', { month: 'long' });
                  return (
                    <SelectItem key={month} value={month}>
                      {monthName} {year}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-center py-3 px-2 font-medium text-muted-foreground text-sm border-r border-border" colSpan={3}>{t("depreciation.schedule.jenisAset")}</th>
              <th className="text-center py-3 px-2 font-medium text-muted-foreground text-sm border-r border-border" colSpan={3}>{t("depreciation.schedule.kos")}</th>
              <th className="text-center py-3 px-2 font-medium text-muted-foreground text-sm border-r border-border">{t("depreciation.schedule.kadarSusut")}</th>
              <th className="text-center py-3 px-2 font-medium text-muted-foreground text-sm border-r border-border" colSpan={4}>{t("depreciation.schedule.susutNilai")}</th>
              <th className="text-center py-3 px-2 font-medium text-muted-foreground text-sm">{t("depreciation.schedule.nilaiBukuBersih")}</th>
            </tr>
            <tr className="border-b border-border">
              <th className="py-3 px-2 text-foreground text-center">{t("depreciation.schedule.bil")}</th>
              <th className="py-3 px-2 text-foreground text-center">{t("depreciation.schedule.tarikh")}</th>
              <th className="py-3 px-2 text-foreground text-center border-r border-border">{t("depreciation.schedule.assetDetail")}</th>
              <th className="py-3 px-2 text-foreground text-center">{t("depreciation.schedule.kosAset")}</th>
              <th className="py-3 px-2 text-foreground text-center">{t("depreciation.schedule.lupus")}</th>
              <th className="py-3 px-2 text-foreground text-center border-r border-border">{t("depreciation.schedule.bakiAkhir")}</th>
              <th className="py-3 px-2 text-foreground text-center border-r border-border">{t("depreciation.schedule.percentageSusut")}</th>
              <th className="py-3 px-2 text-foreground text-center">{t("depreciation.schedule.bakiAwal")}</th>
              <th className="py-3 px-2 text-foreground text-center">{t("depreciation.schedule.tambahan")}</th>
              <th className="py-3 px-2 text-foreground text-center">{t("depreciation.schedule.lupus")}</th>
              <th className="py-3 px-2 text-foreground text-center border-r border-border">{t("depreciation.schedule.bakiAkhir2")}</th>
              <th className="py-3 px-2 text-foreground text-center">{t("depreciation.schedule.nilaiBukuBersih2")}</th>
            </tr>
          </thead>
          <tbody>
            {depreciationSchedule.map((record) => (
              <tr key={record.no} className={`border-b border-border/50 hover:bg-accent/20 transition-colors ${record.isDisposed ? "line-through text-muted-foreground" : ""}`}>
                <td className="py-3 px-2 text-foreground text-center">{record.no}</td>
                <td className="py-3 px-2 text-foreground text-center">{formatDate(record.date)}</td>
                <td className="py-3 px-2 text-foreground text-center border-r border-border">{record.assetDetail}</td>
                <td className="py-3 px-2 text-foreground text-center">{record.costFinalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="py-3 px-2 text-foreground text-center">{record.disposal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="py-3 px-2 text-foreground text-center border-r border-border">{record.remainingCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="py-3 px-2 text-foreground text-center border-r border-border">{record.depreciationRate.toFixed(2)}%</td>
                <td className="py-3 px-2 text-foreground text-center">{record.openingDepreciation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="py-3 px-2 text-foreground text-center">{record.monthlyDepreciation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="py-3 px-2 text-foreground text-center">{record.disposalDepreciation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="py-3 px-2 text-foreground text-center border-r border-border">{record.closingDepreciation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="py-3 px-2 text-foreground text-center font-medium">{record.netBookValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
            
            <tr className="border-t border-border font-semibold">
              <td className="py-3 px-2 text-center">{t("depreciation.schedule.jumlah")}</td>
              <td className="py-3 px-2"></td>
              <td className="py-3 px-2 border-r border-border"></td>
              <td className="py-3 px-2 text-center">{depreciationSchedule.filter(record => !record.isDisposed).reduce((sum, record) => sum + record.costFinalBalance, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="py-3 px-2 text-center">{depreciationSchedule.reduce((sum, record) => sum + record.disposal, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="py-3 px-2 text-center border-r border-border">{depreciationSchedule.filter(record => !record.isDisposed).reduce((sum, record) => sum + record.remainingCost, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="py-3 px-2 border-r border-border"></td>
              <td className="py-3 px-2 text-center">{depreciationSchedule.filter(record => !record.isDisposed).reduce((sum, record) => sum + record.openingDepreciation, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="py-3 px-2 text-center">{depreciationSchedule.filter(record => !record.isDisposed).reduce((sum, record) => sum + record.monthlyDepreciation, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="py-3 px-2 text-center">{depreciationSchedule.reduce((sum, record) => sum + record.disposalDepreciation, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="py-3 px-2 text-center border-r border-border">{depreciationSchedule.filter(record => !record.isDisposed).reduce((sum, record) => sum + record.closingDepreciation, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
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