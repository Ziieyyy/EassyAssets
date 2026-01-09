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
  
  // Debounced search query to avoid excessive filtering while typing
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const { data: allAssets, isLoading, isError, error } = useAssets();
  
  // Memoize filtered assets to prevent recalculation on every render
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50; // Show 50 items per page
  
  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAssets.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedStatus]);
  
  const deleteAsset = useDeleteAsset();

  // Apply status filter from URL on mount
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setSelectedStatus(statusParam);
    }
  }, [searchParams]);

  const [dynamicCategories, setDynamicCategories] = useState<string[]>([]);
  
  // Load dynamic categories
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
        // Fallback to empty array with just the 'All Categories' option
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
    if (confirm('Are you sure you want to delete this asset?')) {
      await deleteAsset.mutateAsync(id);
    }
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
          <div className="flex items-center gap-3">
            <Button 
              className="gap-2 rounded-full"
              onClick={() => navigate("/assets/add")}
            >
              <Plus className="w-4 h-4" />
              {t("assets.addNew")}
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {isError && (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load assets: {error?.message || 'Unknown error'}
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
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
                <SelectValue placeholder={t("assets.category")} className="text-foreground" />
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
                <SelectValue placeholder={t("assets.status")} className="text-foreground" />
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

        {/* Table */}
        {!isLoading && !isError && (
        <div className="glass rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">
                  <div className="flex items-center gap-2 cursor-pointer hover:text-foreground">
                    Asset ID <ArrowUpDown className="w-4 h-4" />
                  </div>
                </TableHead>
                <TableHead className="text-muted-foreground">{t("assets.name")}</TableHead>
                <TableHead className="text-muted-foreground">{t("assets.category")}</TableHead>
                <TableHead className="text-muted-foreground">{t("assets.location")}</TableHead>
                <TableHead className="text-muted-foreground">{t("assets.status")}</TableHead>
                <TableHead className="text-muted-foreground text-center">
                  Cost (RM)
                </TableHead>
                <TableHead className="text-muted-foreground text-center">
                  {t("assets.currentValue")} (RM)
                </TableHead>
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
                  <TableCell className="font-mono text-sm text-primary">
                    {asset.id}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-foreground">{asset.name}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {asset.category}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {asset.location}
                  </TableCell>
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
                        <DropdownMenuItem 
                          className="gap-2 cursor-pointer"
                          onClick={() => navigate(`/assets/view/${asset.id}`)}
                        >
                          <Eye className="w-4 h-4" /> {t("assets.viewDetails")}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="gap-2 cursor-pointer"
                          onClick={() => navigate(`/assets/edit/${asset.id}`)}
                        >
                          <Edit className="w-4 h-4" /> {t("assets.editAsset")}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="gap-2 cursor-pointer text-destructive"
                          onClick={() => handleDelete(asset.id)}
                        >
                          <Trash2 className="w-4 h-4" /> {t("common.delete")}
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

        {/* Pagination Info */}
        {!isLoading && !isError && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{t("assets.showing")} {Math.min(indexOfLastItem, filteredAssets.length)} {t("assets.of")} {filteredAssets.length} {t("assets.assetsLabel")}</span>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              {t("assets.previous")}
            </Button>
            <span className="px-2">{currentPage} of {totalPages}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
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