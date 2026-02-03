import { useState, useEffect, useMemo } from "react";
import { useDebounce } from '@/hooks/useDebounce';
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Package,
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  ArrowUpDown,
  Eye,
  Edit,
  Trash2,
  Download,
  Loader2,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { useAssets, useDeleteAsset } from '@/hooks/useAssets';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSettings } from '@/contexts/SettingsContext';
import { supabase } from '@/lib/supabase';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const statusStyles = {
  active: "bg-success/10 text-success border-success/20",
  maintenance: "bg-warning/10 text-warning border-warning/20",
  inactive: "bg-muted text-muted-foreground border-border",
  disposed: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function Assets() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useSettings();
  const [searchQuery, setSearchQuery] = useState("");
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const { data: allAssets, isLoading, isError, error } = useAssets();
  
  const filteredAssets = useMemo(() => {
    if (!allAssets) return [];
    
    return allAssets.filter((asset) => {
      const matchesSearch =
        debouncedSearchQuery === '' ||
        asset.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        asset.id.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      const matchesCategory =
        !selectedCategory ||
        selectedCategory === t("assets.allCategories") ||
        selectedCategory === "All Categories" ||
        asset.category === selectedCategory;
      const matchesStatus =
        !selectedStatus ||
        selectedStatus === t("assets.allStatus") ||
        selectedStatus === "All Status" ||
        asset.status === selectedStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [allAssets, debouncedSearchQuery, selectedCategory, selectedStatus, t]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAssets.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedStatus]);
  
  const deleteAsset = useDeleteAsset();

  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setSelectedStatus(statusParam);
    }
  }, [searchParams]);

  const [dynamicCategories, setDynamicCategories] = useState<string[]>([]);
  
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
          .from('categories')
          .select('name')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (error) throw error;
        
        const categoryNames = data?.map((cat: any) => cat.name) || [];
        setDynamicCategories([t("assets.allCategories"), ...categoryNames]);
      } catch (err) {
        console.error('Error loading categories:', err);
        setDynamicCategories([t("assets.allCategories")]);
      }
    };
    
    loadCategories();
  }, [t]);

  const statuses = [
    t("assets.allStatus"),
    "active",
    "maintenance",
    "inactive",
    "disposed"
  ];

  const handleDelete = async (id: string) => {
    if (confirm(t("common.confirmDelete"))) {
      await deleteAsset.mutateAsync(id);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Please allow popups for printing');
      return;
    }
    
    if (!allAssets || allAssets.length === 0) {
      alert('No data to print');
      printWindow.close();
      return;
    }
    
    const filteredAssetsForPrint = allAssets.filter((asset) => {
      const matchesSearch =
        debouncedSearchQuery === '' ||
        asset.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        asset.id.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      const matchesCategory =
        !selectedCategory ||
        selectedCategory === t("assets.allCategories") ||
        selectedCategory === "All Categories" ||
        asset.category === selectedCategory;
      const matchesStatus =
        !selectedStatus ||
        selectedStatus === t("assets.allStatus") ||
        selectedStatus === "All Status" ||
        asset.status === selectedStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
    
    const tableRows = filteredAssetsForPrint.map((asset) => `
      <tr>
        <td>${asset.id}</td>
        <td>${asset.name}</td>
        <td>${asset.category || ''}</td>
        <td>${asset.location || ''}</td>
        <td>${t(`status.${asset.status}`)}</td>
        <td>${(asset.purchase_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>${(asset.current_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>${asset.assigned_to || 'Unassigned'}</td>
        <td>${(asset.status === 'active') ? '-' : (asset.status_notes || '-')}</td>
        <td>${(asset.status === 'active') ? '-' : (asset.status_date ? new Date(asset.status_date).toLocaleDateString() : '-')}</td>
      </tr>`).join('');
    
    const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${t("assets.title")}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: white; color: black; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #000; padding: 6px; text-align: left; vertical-align: top; }
        th { background-color: #f0f0f0; font-weight: bold; }
        .filter-info { margin-bottom: 15px; font-size: 14px; }
        @media print {
          @page { size: A4 landscape; margin: 15mm; }
          body { margin: 0; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
        }
      </style>
    </head>
    <body>
      <h2>${t("assets.title")}</h2>
      <div class="filter-info">
        <strong>${t('print.filterApplied')}:</strong><br/>
        ${t('assets.category')}: ${selectedCategory || t('assets.allCategories')}<br/>
        ${t('assets.status')}: ${selectedStatus || t('assets.allStatus')}
      </div>
      <p>${t("assets.manageTrack")}</p>
      <table>
        <thead>
          <tr>
            <th>${t('assets.id')}</th>
            <th>${t('assets.name')}</th>
            <th>${t('assets.category')}</th>
            <th>${t('assets.location')}</th>
            <th>${t('assets.status')}</th>
            <th>${t('assets.purchasePrice')} (RM)</th>
            <th>${t('assets.currentValue')} (RM)</th>
            <th>${t('assets.assignedTo')}</th>
            <th>Status Notes</th>
            <th>Status Date</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </body>
    </html>`;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const handleExportPDF = () => {
    if (!allAssets || allAssets.length === 0) {
      alert(t("assets.noDataToExport") || "No data to export");
      return;
    }

    const filteredAssetsForExport = allAssets.filter((asset) => {
      const matchesSearch =
        debouncedSearchQuery === '' ||
        asset.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        asset.id.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      const matchesCategory =
        !selectedCategory ||
        selectedCategory === t("assets.allCategories") ||
        selectedCategory === "All Categories" ||
        asset.category === selectedCategory;
      const matchesStatus =
        !selectedStatus ||
        selectedStatus === t("assets.allStatus") ||
        selectedStatus === "All Status" ||
        asset.status === selectedStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });

    if (filteredAssetsForExport.length === 0) {
      alert(t("assets.noMatchingAssets") || "No assets match the current filters");
      return;
    }

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Title
    doc.setFontSize(16);
    doc.text(t("assets.title"), 14, 15);

    // Filter info
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(
      `${t('assets.category')}: ${selectedCategory || t('assets.allCategories')}  |  ${t('assets.status')}: ${selectedStatus || t('assets.allStatus')}`,
      14,
      22
    );

    const tableColumn = [
      t('assets.id'),
      t('assets.name'),
      t('assets.category'),
      t('assets.location'),
      t('assets.status'),
      `${t('assets.purchasePrice')} (RM)`,
      `${t('assets.currentValue')} (RM)`,
      t('assets.assignedTo'),
      "Status Notes",
      "Status Date",
    ];

    const tableRows = filteredAssetsForExport.map((asset) => [
      asset.id || '',
      asset.name || '',
      asset.category || '',
      asset.location || '',
      t(`status.${asset.status}`) || asset.status || '',
      (asset.purchase_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      (asset.current_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      asset.assigned_to || 'Unassigned',
      (asset.status === 'active' ? '-' : (asset.status_notes || '-')),
      (asset.status === 'active' ? '-' : (asset.status_date ? new Date(asset.status_date).toLocaleDateString() : '-')),
    ]);

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 18 },  // ID
        1: { cellWidth: 40 },  // Name
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 20 },
        5: { cellWidth: 22 },
        6: { cellWidth: 22 },
        7: { cellWidth: 28 },
        8: { cellWidth: 30 },
        9: { cellWidth: 22 },
      },
      margin: { top: 28, left: 14, right: 14 },
      didParseCell: (data) => {
        if (data.row.raw && (data.row.raw as any)[4]?.toLowerCase().includes('disposed')) {
          data.cell.styles.textColor = [100, 100, 100];
          data.cell.styles.fontStyle = 'italic';
        }
      },
    });

    const fileName = `assets-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("assets.title")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("assets.manageTrack")}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button 
              className="gap-2 rounded-full"
              onClick={() => navigate("/assets/add")}
            >
              <Plus className="w-4 h-4" />
              {t("assets.addNew")}
            </Button>
            
            <Button 
              className="gap-2 rounded-full"
              onClick={handlePrint}
            >
              <Download className="w-4 h-4" />
              {t("Print") || "Print"}
            </Button>

            <Button 
              className="gap-2 rounded-full"
              onClick={handleExportPDF}
            >
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {isError && (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load assets: {error?.message || 'Unknown error'}
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !isError && (
          <div className="glass rounded-xl p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={`${t("common.search")} by name or ID...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-secondary/50 border-border"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48 bg-secondary/50 border-border text-foreground">
                  <SelectValue placeholder={t("assets.category")} />
                </SelectTrigger>
                <SelectContent>
                  {dynamicCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-40 bg-secondary/50 border-border text-foreground">
                  <SelectValue placeholder={t("assets.status")} />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status} className="capitalize">
                      {status === t("assets.allStatus") ? status : t(`status.${status}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="glass rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Asset ID</TableHead>
                  <TableHead className="text-muted-foreground">{t("assets.name")}</TableHead>
                  <TableHead className="text-muted-foreground">{t("assets.category")}</TableHead>
                  <TableHead className="text-muted-foreground">{t("assets.location")}</TableHead>
                  <TableHead className="text-muted-foreground">{t("assets.status")}</TableHead>
                  <TableHead className="text-muted-foreground text-center">Cost (RM)</TableHead>
                  <TableHead className="text-muted-foreground text-center">{t("assets.currentValue")} (RM)</TableHead>
                  <TableHead className="text-muted-foreground">{t("assets.assignedTo")}</TableHead>
                  <TableHead className="text-muted-foreground w-32">Status Notes</TableHead>
                  <TableHead className="text-muted-foreground w-32">Status Date</TableHead>
                  <TableHead className="text-muted-foreground w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.map((asset, index) => (
                  <TableRow
                    key={asset.id}
                    className={`border-border hover:bg-secondary/30 cursor-pointer animate-fade-in ${asset.status === 'disposed' ? 'line-through text-muted-foreground' : ''}`}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <TableCell className="font-mono text-sm text-primary">{asset.id}</TableCell>
                    <TableCell><span className="font-medium text-foreground">{asset.name}</span></TableCell>
                    <TableCell className="text-muted-foreground">{asset.category}</TableCell>
                    <TableCell className="text-muted-foreground">{asset.location}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("capitalize", statusStyles[asset.status as keyof typeof statusStyles])}
                      >
                        {t(`status.${asset.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium text-foreground">
                      {(asset.purchase_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center font-medium text-foreground">
                      {(asset.current_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {asset.assigned_to || 'Unassigned'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {(asset.status === 'active') ? '-' : (asset.status_notes || '-')}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {(asset.status === 'active') ? '-' : (asset.status_date ? new Date(asset.status_date).toLocaleDateString() : '-')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/assets/view/${asset.id}`)}>
                            <Eye className="w-4 h-4 mr-2" /> {t("assets.viewDetails")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/assets/edit/${asset.id}`)}>
                            <Edit className="w-4 h-4 mr-2" /> {t("assets.editAsset")}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDelete(asset.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> {t("common.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {t("assets.showing")} {Math.min(indexOfLastItem, filteredAssets.length)} {t("assets.of")} {filteredAssets.length} {t("assets.assetsLabel")}
            </span>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                {t("assets.previous")}
              </Button>
              <span className="px-2">{currentPage} / {totalPages}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                {t("assets.next")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}