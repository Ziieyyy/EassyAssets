import { AssetDepreciationSchedule } from "@/components/dashboard/AssetDepreciationSchedule";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { useAssets } from "@/hooks/useAssets";

export default function AssetDepreciationSchedulePage() {
  const { t } = useSettings();
  const { data: assets } = useAssets();
  
  const handlePrint = () => {
    // Create a new window with just the table data
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Please allow popups for printing');
      return;
    }
    
    // Only proceed if we have assets
    if (!assets || assets.length === 0) {
      alert('No data to print');
      return;
    }
    
    // Get selected category and month from localStorage or use defaults
    const selectedCategory = localStorage.getItem('selectedCategory') || 'All Categories';
    const selectedMonth = localStorage.getItem('selectedMonth') || 'All Months';
    
    // Filter assets by selected category and month
    let filteredAssets = [...assets];
    
    if (selectedCategory && selectedCategory !== 'All Categories') {
      filteredAssets = filteredAssets.filter(asset => (asset.category || "") === selectedCategory);
    }
    
    if (selectedMonth && selectedMonth !== 'All Months') {
      filteredAssets = filteredAssets.filter(asset => {
        const assetDate = new Date(asset.purchase_date);
        const assetMonth = `${assetDate.getFullYear()}-${(assetDate.getMonth() + 1).toString().padStart(2, '0')}`;
        return assetMonth === selectedMonth;
      });
    }
    
    // Calculate depreciation schedule data similar to the component
    const depreciationSchedule = filteredAssets.map((asset, index) => {
      const isDisposed = asset.status === 'disposed';
      const usefulLife = asset.useful_life || 5;
      const depreciationRate = usefulLife > 0 ? (100 / usefulLife) : 0;
      const costFinalBalance = asset.purchase_price || 0;
      const disposal = isDisposed ? asset.current_value || 0 : 0;
      const remainingCost = isDisposed ? 0 : costFinalBalance - disposal;
      const annualDepreciation = (costFinalBalance * depreciationRate) / 100;
      const monthlyDepreciation = annualDepreciation / 12;
      
      let openingDepreciation = 0;
      let closingDepreciation = 0;
      
      if (isDisposed) {
        openingDepreciation = 0;
        closingDepreciation = 0;
      } else {
        const purchaseDate = new Date(asset.purchase_date);
        const currentDate = new Date();
        
        const monthsSincePurchase = 
          (currentDate.getFullYear() - purchaseDate.getFullYear()) * 12 +
          (currentDate.getMonth() - purchaseDate.getMonth());
        
        if (monthsSincePurchase <= 0) {
          openingDepreciation = 0;
          closingDepreciation = monthlyDepreciation;
        } else {
          openingDepreciation = monthlyDepreciation * Math.max(0, monthsSincePurchase - 1);
          closingDepreciation = openingDepreciation + monthlyDepreciation;
        }
        
        openingDepreciation = Math.min(openingDepreciation, costFinalBalance);
        closingDepreciation = Math.min(closingDepreciation, costFinalBalance);
      }
      
      const disposalDepreciation = 0;
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
    
    // Prepare the table data
    const tableRows = depreciationSchedule.map((record) => `
      <tr>
        <td>${record.no}</td>
        <td>${new Date(record.date).toLocaleDateString()}</td>
        <td>${record.assetDetail}</td>
        <td>${record.costFinalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>${record.disposal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>${record.remainingCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>${record.depreciationRate.toFixed(2)}%</td>
        <td>${record.openingDepreciation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>${record.monthlyDepreciation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>${record.disposalDepreciation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>${record.closingDepreciation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>${record.netBookValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>`).join('');
    
    // Prepare the summary row
    const summaryRow = `
      <tr class="summary-row">
        <td>${t("depreciation.schedule.jumlah")}</td>
        <td></td>
        <td></td>
        <td>${depreciationSchedule.filter(record => !record.isDisposed).reduce((sum, record) => sum + record.costFinalBalance, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>${depreciationSchedule.reduce((sum, record) => sum + record.disposal, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>${depreciationSchedule.filter(record => !record.isDisposed).reduce((sum, record) => sum + record.remainingCost, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td></td>
        <td>${depreciationSchedule.filter(record => !record.isDisposed).reduce((sum, record) => sum + record.openingDepreciation, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>${depreciationSchedule.filter(record => !record.isDisposed).reduce((sum, record) => sum + record.monthlyDepreciation, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>${depreciationSchedule.reduce((sum, record) => sum + record.disposalDepreciation, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>${depreciationSchedule.filter(record => !record.isDisposed).reduce((sum, record) => sum + record.closingDepreciation, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>${depreciationSchedule.filter(record => !record.isDisposed).reduce((sum, record) => sum + record.netBookValue, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>`;
    
    // Create the HTML content with embedded CSS
    const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${t("dashboard.assetDepreciationSchedule")}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          background: white;
          color: black;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        th, td {
          border: 1px solid #000;
          padding: 6px;
          text-align: center;
          vertical-align: top;
        }
        th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        .summary-row {
          font-weight: bold;
          background-color: #f9f9f9;
        }
        .filter-info {
          margin-bottom: 15px;
          font-size: 14px;
        }
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            margin: 0;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
        }
      </style>
    </head>
    <body>
      <h2>${t("dashboard.assetDepreciationSchedule")}</h2>
      <div class="filter-info">
        <strong>${t('print.filterApplied')}:</strong><br/>
        ${t('assets.category')}: ${selectedCategory}<br/>
        ${t('print.month')}: ${selectedMonth}
      </div>
      <p>${t("dashboard.depreciationScheduleDescription")}</p>
      <table>
        <thead>
          <tr>
            <th rowspan="2">${t("depreciation.schedule.bil")}</th>
            <th rowspan="2">${t("depreciation.schedule.tarikh")}</th>
            <th rowspan="2">${t("depreciation.schedule.assetDetail")}</th>
            <th colspan="3">${t("depreciation.schedule.kos")}</th>
            <th rowspan="2">${t("depreciation.schedule.kadarSusut")}</th>
            <th colspan="4">${t("depreciation.schedule.susutNilai")}</th>
            <th rowspan="2">${t("depreciation.schedule.nilaiBukuBersih")}</th>
          </tr>
          <tr>
            <th>${t("depreciation.schedule.kosAset")}</th>
            <th>${t("depreciation.schedule.lupus")}</th>
            <th>${t("depreciation.schedule.bakiAkhir")}</th>
            <th>${t("depreciation.schedule.bakiAwal")}</th>
            <th>${t("depreciation.schedule.tambahan")}</th>
            <th>${t("depreciation.schedule.lupus")}</th>
            <th>${t("depreciation.schedule.bakiAkhir2")}</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
          ${summaryRow}
        </tbody>
      </table>
    </body>
    </html>`;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.print();
    };
  };
  
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
          <Button 
            className="gap-2 rounded-full"
            onClick={handlePrint}
          >
            <Download className="w-4 h-4" />
            Print
          </Button>
        </div>
        <AssetDepreciationSchedule />
      </div>
    </MainLayout>
  );
}