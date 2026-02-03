import { useState } from "react";
import { AssetDepreciationSchedule } from "@/components/dashboard/AssetDepreciationSchedule";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { useAssets } from "@/hooks/useAssets";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AssetDepreciationSchedulePage() {
  const { t } = useSettings();
  const { data: assets = [] } = useAssets();

  // Lifted state — same pattern as in Assets.tsx
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedMonth, setSelectedMonth] = useState("All Months");

  // -------------------------------------------------------------------------
  // Shared filtering + calculation — uses current React state (not localStorage)
  // -------------------------------------------------------------------------
  const getFilteredDepreciationData = () => {
    if (assets.length === 0) return [];

    let filtered = [...assets];

    // Category filter (exactly like Assets.tsx pattern)
    if (selectedCategory && selectedCategory !== "All Categories" && selectedCategory !== t('assets.allCategories')) {
      filtered = filtered.filter(asset => (asset.category || "") === selectedCategory);
    }

    // Month filter
    if (selectedMonth && selectedMonth !== "All Months" && selectedMonth !== t('print.allMonths')) {
      filtered = filtered.filter(asset => {
        if (!asset.purchase_date) return false;
        const date = new Date(asset.purchase_date);
        const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return yearMonth === selectedMonth;
      });
    }

    // Depreciation calculation
    return filtered.map((asset, index) => {
      const isDisposed = asset.status === 'disposed';
      const usefulLife = asset.useful_life || 5;
      const rate = usefulLife > 0 ? 100 / usefulLife : 0;
      const cost = asset.purchase_price || 0;
      const disposalValue = isDisposed ? (asset.current_value || 0) : 0;
      const remaining = isDisposed ? 0 : cost - disposalValue;
      const annualDep = (cost * rate) / 100;
      const monthlyDep = annualDep / 12;

      let openingDep = 0;
      let closingDep = 0;

      if (!isDisposed && asset.purchase_date) {
        const purchase = new Date(asset.purchase_date);
        const now = new Date();
        const monthsElapsed =
          (now.getFullYear() - purchase.getFullYear()) * 12 +
          (now.getMonth() - purchase.getMonth());

        if (monthsElapsed > 0) {
          openingDep = monthlyDep * Math.max(0, monthsElapsed - 1);
          closingDep = openingDep + monthlyDep;
        } else {
          closingDep = monthlyDep;
        }

        openingDep = Math.min(openingDep, cost);
        closingDep = Math.min(closingDep, cost);
      }

      const nbv = isDisposed ? 0 : Math.max(0, remaining - closingDep);

      return {
        no: index + 1,
        date: asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : '-',
        assetDetail: asset.name || 'Unnamed Asset',
        costFinalBalance: cost,
        disposal: disposalValue,
        remainingCost: remaining,
        depreciationRate: rate,
        openingDepreciation: openingDep,
        monthlyDepreciation: monthlyDep,
        disposalDepreciation: 0,
        closingDepreciation: closingDep,
        netBookValue: nbv,
        isDisposed,
      };
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) {
      alert('Please allow popups for printing');
      return;
    }

    const schedule = getFilteredDepreciationData();
    if (schedule.length === 0) {
      alert('No data to print');
      printWindow.close();
      return;
    }

    const rows = schedule.map(r => `
      <tr>
        <td>${r.no}</td>
        <td>${r.date}</td>
        <td>${r.assetDetail}</td>
        <td>${r.costFinalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>${r.disposal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>${r.remainingCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>${r.depreciationRate.toFixed(2)}%</td>
        <td>${r.openingDepreciation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>${r.monthlyDepreciation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>${r.disposalDepreciation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>${r.closingDepreciation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>${r.netBookValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    `).join('');

    const summary = `
      <tr class="summary-row">
        <td>${t("depreciation.schedule.jumlah")}</td>
        <td></td><td></td>
        <td>${schedule.filter(r => !r.isDisposed).reduce((a, b) => a + b.costFinalBalance, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>${schedule.reduce((a, b) => a + b.disposal, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>${schedule.filter(r => !r.isDisposed).reduce((a, b) => a + b.remainingCost, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td></td>
        <td>${schedule.filter(r => !r.isDisposed).reduce((a, b) => a + b.openingDepreciation, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>${schedule.filter(r => !r.isDisposed).reduce((a, b) => a + b.monthlyDepreciation, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>${schedule.reduce((a, b) => a + b.disposalDepreciation, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>${schedule.filter(r => !r.isDisposed).reduce((a, b) => a + b.closingDepreciation, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>${schedule.filter(r => !r.isDisposed).reduce((a, b) => a + b.netBookValue, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>`;

    // Format filter display
    const categoryDisplay = selectedCategory === "All Categories" || selectedCategory === t('assets.allCategories') 
      ? t('assets.allCategories') || 'All Categories' 
      : selectedCategory;
    
    const monthDisplay = selectedMonth === "All Months" || selectedMonth === t('print.allMonths')
      ? t('print.allMonths') || 'All Months'
      : (() => {
          const [year, monthNum] = selectedMonth.split('-');
          const monthName = new Date(parseInt(year), parseInt(monthNum) - 1, 1).toLocaleString('default', { month: 'long' });
          return `${monthName} ${year}`;
        })();

    const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${t("dashboard.assetDepreciationSchedule")}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: white; color: black; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th, td { border: 1px solid #000; padding: 5px; text-align: center; vertical-align: middle; }
        th { background-color: #f0f0f0; font-weight: bold; }
        .summary-row { font-weight: bold; background-color: #f9f9f9; }
        .filter-info { margin-bottom: 15px; font-size: 14px; }
        @media print {
          @page { size: A4 landscape; margin: 12mm; }
          body { margin: 0; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
        }
      </style>
    </head>
    <body>
      <h2>${t("dashboard.assetDepreciationSchedule")}</h2>
      <div class="filter-info">
        <strong>${t('print.filterApplied') || 'Filters applied'}:</strong><br/>
        ${t('assets.category')}: ${categoryDisplay}<br/>
        ${t('print.month') || 'Month'}: ${monthDisplay}
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
          ${rows}${summary}
        </tbody>
      </table>
    </body>
    </html>`;

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => printWindow.print();
  };

  const handleExportPDF = () => {
    const schedule = getFilteredDepreciationData();
    if (schedule.length === 0) {
      alert(t("assets.noDataToExport") || 'No data to export');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // Format filter display for PDF
    const categoryDisplay = selectedCategory === "All Categories" || selectedCategory === t('assets.allCategories') 
      ? t('assets.allCategories') || 'All Categories' 
      : selectedCategory;
    
    const monthDisplay = selectedMonth === "All Months" || selectedMonth === t('print.allMonths')
      ? t('print.allMonths') || 'All Months'
      : (() => {
          const [year, monthNum] = selectedMonth.split('-');
          const monthName = new Date(parseInt(year), parseInt(monthNum) - 1, 1).toLocaleString('default', { month: 'long' });
          return `${monthName} ${year}`;
        })();

    doc.setFontSize(16);
    doc.text(t("dashboard.assetDepreciationSchedule"), 14, 15);

    doc.setFontSize(11);
    doc.setTextColor(80);
    doc.text(
      `${t('assets.category')}: ${categoryDisplay}   |   ${t('print.month') || 'Month'}: ${monthDisplay}`,
      14,
      22
    );

    const head = [
      [
        t("depreciation.schedule.bil"),
        t("depreciation.schedule.tarikh"),
        t("depreciation.schedule.assetDetail"),
        t("depreciation.schedule.kosAset"),
        t("depreciation.schedule.lupus"),
        t("depreciation.schedule.bakiAkhir"),
        t("depreciation.schedule.kadarSusut"),
        t("depreciation.schedule.bakiAwal"),
        t("depreciation.schedule.tambahan"),
        t("depreciation.schedule.lupus"),
        t("depreciation.schedule.bakiAkhir2"),
        t("depreciation.schedule.nilaiBukuBersih"),
      ],
      ["", "", "", "", "", "", "", t("depreciation.schedule.bakiAwal"), t("depreciation.schedule.tambahan"), t("depreciation.schedule.lupus"), t("depreciation.schedule.bakiAkhir2"), ""]
    ];

    const body = schedule.map(r => [
      r.no,
      r.date,
      r.assetDetail,
      r.costFinalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      r.disposal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      r.remainingCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      `${r.depreciationRate.toFixed(2)}%`,
      r.openingDepreciation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      r.monthlyDepreciation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      r.disposalDepreciation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      r.closingDepreciation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      r.netBookValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    ]);

    body.push([
      t("depreciation.schedule.jumlah"),
      "", "",
      schedule.filter(r => !r.isDisposed).reduce((a, b) => a + b.costFinalBalance, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      schedule.reduce((a, b) => a + b.disposal, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      schedule.filter(r => !r.isDisposed).reduce((a, b) => a + b.remainingCost, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      "",
      schedule.filter(r => !r.isDisposed).reduce((a, b) => a + b.openingDepreciation, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      schedule.filter(r => !r.isDisposed).reduce((a, b) => a + b.monthlyDepreciation, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      schedule.reduce((a, b) => a + b.disposalDepreciation, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      schedule.filter(r => !r.isDisposed).reduce((a, b) => a + b.closingDepreciation, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      schedule.filter(r => !r.isDisposed).reduce((a, b) => a + b.netBookValue, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    ]);

    autoTable(doc, {
      head,
      body,
      startY: 28,
      theme: 'grid',
      headStyles: { fillColor: [240,240,240], textColor: 0, fontStyle: 'bold', fontSize: 8, halign: 'center', valign: 'middle' },
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak', halign: 'center', valign: 'middle' },
      columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 22 }, 2: { cellWidth: 38 }, 6: { cellWidth: 18 } },
      margin: { top: 28, left: 12, right: 12 },
      didParseCell: data => {
        if (data.row.index === body.length - 1) {
          data.cell.styles.fillColor = [249,249,249];
          data.cell.styles.fontStyle = 'bold';
        }
      },
      showHead: 'everyPage',
      rowPageBreak: 'avoid',
    });

    doc.save(`depreciation-schedule-${new Date().toISOString().split('T')[0]}.pdf`);
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

          <div className="flex items-center gap-3">
            <Button className="gap-2" onClick={handleExportPDF}>
              <Printer className="h-4 w-4" />
              {t("Print") || "Print"}
            </Button>

            <Button className="gap-2" onClick={handleExportPDF}>
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Pass current filters + setters to child component */}
        <AssetDepreciationSchedule
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
        />
      </div>
    </MainLayout>
  );
}