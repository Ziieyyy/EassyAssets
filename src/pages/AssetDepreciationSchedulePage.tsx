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
  const { t, language } = useSettings();
  const { data: assets = [] } = useAssets();

  // Lifted state — same pattern as in Assets.tsx
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // -------------------------------------------------------------------------
  // Shared filtering + calculation — uses current React state (not localStorage)
  // -------------------------------------------------------------------------
  const getFilteredDepreciationData = () => {
    if (assets.length === 0) return [];

    const formatDate = (dateString: string | null | undefined) => {
      if (!dateString) return "-";
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "-";
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    let filtered = [...assets];

    // Category filter (exactly like Assets.tsx pattern)
    if (selectedCategory && selectedCategory !== "All Categories" && selectedCategory !== t('assets.allCategories')) {
      filtered = filtered.filter(asset => (asset.category || "") === selectedCategory);
    }

    // Date filter - only show assets purchased on or before the selected date
    if (selectedDate) {
      filtered = filtered.filter(asset => {
        if (!asset.purchase_date) return false;
        const assetDate = new Date(asset.purchase_date);
        const compareAssetDate = new Date(assetDate.getFullYear(), assetDate.getMonth(), assetDate.getDate());
        const compareSelectedDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        return compareAssetDate <= compareSelectedDate;
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
      let disposalDep = 0;
      let currentPeriodAddition = monthlyDep;

      const purchase = asset.purchase_date ? new Date(asset.purchase_date) : null;
      const disposalDate = asset.status_date ? new Date(asset.status_date) : null;
      const referenceDate = selectedDate || new Date();

      if (purchase) {
        const refYear = referenceDate.getFullYear();
        const refMonth = referenceDate.getMonth();
        const refMonthStart = new Date(refYear, refMonth, 1);

        const purchaseYear = purchase.getFullYear();
        const purchaseMonth = purchase.getMonth();

        const disposalMonthStart = disposalDate ? new Date(disposalDate.getFullYear(), disposalDate.getMonth(), 1) : null;

        const isDisposedInCurrentMonth = isDisposed && (!disposalMonthStart || refMonthStart.getTime() === disposalMonthStart.getTime());
        const isAlreadyDisposed = isDisposed && disposalMonthStart && refMonthStart > disposalMonthStart;

        if (isAlreadyDisposed) {
          openingDep = 0;
          currentPeriodAddition = 0;
          disposalDep = 0;
          closingDep = 0;
        } else if (isDisposedInCurrentMonth) {
          const monthsElapsed = (refYear - purchaseYear) * 12 + (refMonth - purchaseMonth);
          openingDep = monthlyDep * Math.max(0, monthsElapsed);
          openingDep = Math.min(openingDep, cost);
          
          disposalDep = Math.min(openingDep + currentPeriodAddition, cost);
          closingDep = 0;
        } else {
          const monthsElapsed = (refYear - purchaseYear) * 12 + (refMonth - purchaseMonth);
          openingDep = monthlyDep * Math.max(0, monthsElapsed);
          openingDep = Math.min(openingDep, cost);
          
          closingDep = Math.min(openingDep + currentPeriodAddition, cost);
          disposalDep = 0;
        }
      }

      const nbv = isDisposed ? 0 : Math.max(0, remaining - closingDep);

      return {
        no: index + 1,
        date: formatDate(asset.purchase_date),
        assetDetail: asset.name || 'Unnamed Asset',
        costFinalBalance: cost,
        disposal: disposalValue,
        remainingCost: remaining,
        depreciationRate: rate,
        openingDepreciation: openingDep,
        monthlyDepreciation: currentPeriodAddition,
        disposalDepreciation: disposalDep,
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
      <tr class="${r.isDisposed ? 'disposed-row' : ''}">
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
        <td colspan="3" style="text-align: left; padding-left: 15px;">${t("depreciation.schedule.jumlah")}</td>
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
    
    const monthDisplay = selectedDate
      ? selectedDate.toLocaleDateString(language === 'ms' ? 'ms-MY' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })
      : t('print.allMonths') || 'All Months';

    const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${t("dashboard.assetDepreciationSchedule")}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: white; color: black; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th, td { border: 1.5px solid #111; padding: 6px; text-align: center; vertical-align: middle; }
        th { background-color: #e5e5e5; font-weight: bold; }
        .summary-row { font-weight: bold; background-color: #f9f9f9; }
        .summary-row td {
          border-top: 1.5px solid #111 !important;
          border-bottom: 4px double #111 !important;
        }
        .disposed-row { text-decoration: line-through; color: #888; }
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
    
    const monthDisplay = selectedDate
      ? selectedDate.toLocaleDateString(language === 'ms' ? 'ms-MY' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })
      : t('print.allMonths') || 'All Months';

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
      ]
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
      { content: t("depreciation.schedule.jumlah"), colSpan: 3, styles: { halign: 'left', fontStyle: 'bold' } },
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
      headStyles: { 
        fillColor: [220, 220, 220], 
        textColor: [0, 0, 0], 
        fontStyle: 'bold', 
        fontSize: 8, 
        halign: 'center', 
        valign: 'middle',
        lineColor: [60, 60, 60],
        lineWidth: 0.2
      },
      styles: { 
        fontSize: 8, 
        cellPadding: 2.5, 
        overflow: 'linebreak', 
        halign: 'center', 
        valign: 'middle',
        textColor: [0, 0, 0],
        lineColor: [100, 100, 100],
        lineWidth: 0.2
      },
      columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 22 }, 2: { cellWidth: 38 }, 6: { cellWidth: 18 } },
      margin: { top: 28, left: 12, right: 12 },
      didParseCell: data => {
        if (data.row.index === body.length - 1) {
          data.cell.styles.fillColor = [235, 235, 235];
          data.cell.styles.fontStyle = 'bold';
        } else if (data.section === 'body') {
          const record = schedule[data.row.index];
          if (record && record.isDisposed) {
            data.cell.styles.textColor = [128, 128, 128]; // Muted text color
          }
        }
      },
      didDrawCell: data => {
        if (data.section === 'body' && data.row.index < schedule.length) {
          const record = schedule[data.row.index];
          if (record && record.isDisposed) {
            const { x, y, width, height } = data.cell;
            const textStr = data.cell.text.join(' ');
            const textWidth = doc.getTextWidth(textStr);
            const halign = data.cell.styles.halign;
            
            let startX = x + 2.5;
            let endX = x + width - 2.5;
            
            if (halign === 'center') {
              startX = x + (width - textWidth) / 2;
              endX = x + (width + textWidth) / 2;
            } else if (halign === 'right') {
              startX = x + width - textWidth - 2.5;
              endX = x + width - 2.5;
            } else if (halign === 'left') {
              startX = x + 2.5;
              endX = x + 2.5 + textWidth;
            }

            const lineY = y + height / 2;
            doc.setDrawColor(128, 128, 128); // Muted line color
            doc.setLineWidth(0.15);
            doc.line(startX, lineY, endX, lineY);
          }
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
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
      </div>
    </MainLayout>
  );
}