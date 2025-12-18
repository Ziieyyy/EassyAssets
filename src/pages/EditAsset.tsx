import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Package, DollarSign, Calendar, MapPin, User, FileText, Hash, Upload, X, Trash2, AlertTriangle, TrendingDown, Receipt } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useAsset, useUpdateAsset, useDeleteAsset } from "@/hooks/useAssets";
import type { AssetInsert } from "@/types/database";
import { useSettings } from "@/contexts/SettingsContext";

const categories = ["IT Equipment", "Furniture", "Vehicles", "Office Equipment", "Machinery", "Other"];

// Auto-calculate useful life based on category
const getCategoryUsefulLife = (category: string): number => {
  switch (category) {
    case "IT Equipment":
      return 3; // Computers, laptops, servers
    case "Furniture":
      return 7; // Desks, chairs, cabinets
    case "Vehicles":
      return 5; // Cars, trucks, vans
    case "Office Equipment":
      return 5; // Printers, scanners, phones
    case "Machinery":
      return 10; // Heavy equipment, tools
    default:
      return 5; // Default for "Other"
  }
};

const statuses = [
  { value: "active", label: "Active", color: "bg-green-500 hover:bg-green-600" },
  { value: "maintenance", label: "Maintenance", color: "bg-amber-500 hover:bg-amber-600" },
  { value: "inactive", label: "Inactive", color: "bg-gray-500 hover:bg-gray-600" },
  { value: "disposed", label: "Disposed", color: "bg-red-500 hover:bg-red-600" },
];

const depreciationMethods = [
  { value: "straight-line", label: "Straight-Line", description: "Equal depreciation each period" },
];

export default function EditAsset() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();
  const { data: asset, isLoading } = useAsset(id || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const { t } = useSettings();
  
  const [formData, setFormData] = useState<Partial<AssetInsert>>({
    id: "",
    name: "",
    category: "IT Equipment",
    location: "",
    status: "active",
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_price: 0,
    current_value: 0,
    assigned_to: "",
    assigned_invoice: "",
    description: "",
    serial_number: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [invoicePreview, setInvoicePreview] = useState<string | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [showOtherCategory, setShowOtherCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [depreciationMethod, setDepreciationMethod] = useState<string>("straight-line");
  const [usefulLife, setUsefulLife] = useState<number>(5);

  // Calculate depreciation based on selected method
  const depreciationData = useMemo(() => {
    const purchasePrice = formData.purchase_price || 0;
    const purchaseDate = formData.purchase_date ? new Date(formData.purchase_date) : new Date();
    const today = new Date();
    
    // Calculate months between purchase date and today
    const monthsDiff = (today.getFullYear() - purchaseDate.getFullYear()) * 12 + 
                      (today.getMonth() - purchaseDate.getMonth());
    const yearsDiff = monthsDiff / 12;
    
    // Check if purchase date is in the future
    const isFutureDate = purchaseDate > today;
    
    if (purchasePrice <= 0 || yearsDiff <= 0 || isFutureDate) {
      return {
        monthlyDepreciation: 0,
        yearlyDepreciation: 0,
        accumulatedDepreciation: 0,
        remainingValue: purchasePrice,
        depreciationRate: 0,
        monthsDiff: Math.max(0, monthsDiff),
        yearsDiff: Math.max(0, yearsDiff).toFixed(2),
        isFutureDate,
      };
    }

    let accumulatedDepreciation = 0;
    let yearlyDepreciation = 0;
    let monthlyDepreciation = 0;
    let depreciationRate = 0;

    if (depreciationMethod === "straight-line") {
      // Straight-line: (Cost - Salvage Value) / Useful Life
      // Assuming salvage value is 0 for simplicity
      yearlyDepreciation = purchasePrice / usefulLife;
      monthlyDepreciation = yearlyDepreciation / 12;
      accumulatedDepreciation = Math.min(purchasePrice, monthlyDepreciation * monthsDiff);
      depreciationRate = (1 / usefulLife) * 100;
    }

    const remainingValue = Math.max(0, purchasePrice - accumulatedDepreciation);

    return {
      monthlyDepreciation: Math.max(0, monthlyDepreciation),
      yearlyDepreciation: Math.max(0, yearlyDepreciation),
      accumulatedDepreciation: Math.max(0, accumulatedDepreciation),
      remainingValue,
      depreciationRate,
      monthsDiff,
      yearsDiff: yearsDiff.toFixed(2),
      isFutureDate: false,
    };
  }, [formData.purchase_price, formData.purchase_date, depreciationMethod, usefulLife]);

  // Auto-update current_value with calculated remaining value
  useEffect(() => {
    if (depreciationData.remainingValue !== formData.current_value) {
      setFormData(prev => ({ ...prev, current_value: depreciationData.remainingValue }));
    }
  }, [depreciationData.remainingValue]);

  // Populate form with asset data
  useEffect(() => {
    if (asset) {
      setFormData({
        id: asset.id,
        name: asset.name,
        category: asset.category,
        location: asset.location,
        status: asset.status,
        purchase_date: asset.purchase_date,
        purchase_price: asset.purchase_price,
        current_value: asset.current_value,
        assigned_to: asset.assigned_to,
        assigned_invoice: asset.assigned_invoice,
        description: asset.description,
        serial_number: asset.serial_number,
        image_url: asset.image_url,
      });

      // Set image preview if image exists
      if (asset.image_url) {
        setImagePreview(asset.image_url);
      }

      // Set invoice preview if invoice exists
      if (asset.assigned_invoice) {
        setInvoicePreview(asset.assigned_invoice);
      }

      // Check if category is "Other"
      if (!categories.slice(0, -1).includes(asset.category)) {
        setShowOtherCategory(true);
        setCustomCategory(asset.category);
      }
    }
  }, [asset]);

  const handleChange = (field: keyof AssetInsert, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleCategoryChange = (category: string) => {
    if (category === "Other") {
      setShowOtherCategory(true);
      setFormData(prev => ({ ...prev, category: "" }));
      setUsefulLife(5); // Default for custom categories
    } else {
      setShowOtherCategory(false);
      setCustomCategory("");
      handleChange("category", category);
      // Auto-set useful life based on category
      setUsefulLife(getCategoryUsefulLife(category));
    }
  };

  const handleCustomCategoryChange = (value: string) => {
    setCustomCategory(value);
    handleChange("category", value);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.id?.trim()) {
      newErrors.id = t("editAsset.idRequired");
    }
    if (!formData.name?.trim()) {
      newErrors.name = t("editAsset.nameRequired");
    }
    if (!formData.category) {
      newErrors.category = t("editAsset.categoryRequired");
    }
    if (!formData.location?.trim()) {
      newErrors.location = t("editAsset.locationRequired");
    }
    if (!formData.purchase_date) {
      newErrors.purchase_date = t("editAsset.purchaseDateRequired");
    }
    if (!formData.purchase_price || formData.purchase_price <= 0) {
      newErrors.purchase_price = t("editAsset.purchasePriceRequired");
    }
    if (!formData.assigned_to?.trim()) {
      newErrors.assigned_to = t("editAsset.assignedToRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !id) {
      return;
    }

    try {
      const { created_at, ...updateData } = formData as any;
      // Include the id in updates to allow changing the Asset ID
      await updateAsset.mutateAsync({ id, updates: updateData });
      navigate("/assets");
    } catch (error) {
      console.error("Failed to update asset:", error);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      await deleteAsset.mutateAsync(id);
      navigate("/assets");
    } catch (error) {
      console.error("Failed to delete asset:", error);
    }
  };

  const handleCancel = () => {
    navigate("/assets");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        // Save the base64 image to formData
        setFormData(prev => ({ ...prev, image_url: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image_url: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        // Save the base64 image to formData
        setFormData(prev => ({ ...prev, image_url: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleInvoiceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInvoiceFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setInvoicePreview(base64String);
        // Save the base64 invoice image to formData
        setFormData(prev => ({ ...prev, assigned_invoice: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveInvoice = () => {
    setInvoiceFile(null);
    setInvoicePreview(null);
    setFormData(prev => ({ ...prev, assigned_invoice: null }));
    if (invoiceInputRef.current) {
      invoiceInputRef.current.value = "";
    }
  };

  const handleInvoiceDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setInvoiceFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setInvoicePreview(base64String);
        // Save the base64 invoice image to formData
        setFormData(prev => ({ ...prev, assigned_invoice: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInvoiceDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const getCategoryLabel = (category: string) => {
    const categoryMap: Record<string, string> = {
      "IT Equipment": t("category.itEquipment"),
      "Furniture": t("category.furniture"),
      "Vehicles": t("category.vehicles"),
      "Office Equipment": t("category.officeEquipment"),
      "Machinery": t("category.machinery"),
      "Other": t("category.other"),
    };
    return categoryMap[category] || category;
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      "active": t("status.active"),
      "maintenance": t("status.maintenance"),
      "inactive": t("status.inactive"),
      "disposed": t("status.disposed"),
    };
    return statusMap[status] || status;
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!asset) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <AlertTriangle className="w-12 h-12 text-destructive" />
          <h2 className="text-2xl font-bold">{t("editAsset.assetNotFound")}</h2>
          <Button onClick={() => navigate("/assets")}>{t("editAsset.backToAssets")}</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 -mx-6 px-6 border-b">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handleCancel}
              className="rounded-full"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">
                {t("editAsset.title")}: {asset.name}
              </h1>
              <p className="text-muted-foreground mt-1">
                {t("editAsset.lastUpdated")} {getTimeAgo(asset.created_at)} • ID: {asset.id}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                {t("editAsset.basicInfo")}
              </CardTitle>
              <CardDescription>
                {t("editAsset.basicInfoDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Row 1: Asset ID and Asset Name - 2 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Asset ID - Editable */}
                <div className="space-y-2">
                  <Label htmlFor="id" className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    {t("editAsset.assetId")} <span className="text-destructive">{t("editAsset.required")}</span>
                  </Label>
                  <Input
                    id="id"
                    placeholder="e.g., AST-009"
                    value={formData.id}
                    onChange={(e) => handleChange("id", e.target.value)}
                    className={errors.id ? "border-destructive" : ""}
                  />
                  {errors.id && (
                    <p className="text-sm text-destructive">{errors.id}</p>
                  )}
                </div>

                {/* Asset Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    {t("editAsset.assetName")} <span className="text-destructive">{t("editAsset.required")}</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Dell Laptop XPS 15"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>
              </div>

              {/* Row 2: Image Upload and Assigned Invoice - Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>{t("editAsset.assetImage")}</Label>
                  {!imagePreview ? (
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors h-[140px]"
                    >
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground text-center">
                        {t("editAsset.dropImage")}
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="relative h-[140px] rounded-lg overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Asset preview"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 rounded-full"
                        onClick={handleRemoveImage}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Assigned Invoice */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Receipt className="w-4 h-4" />
                    {t("editAsset.assignedInvoice")}
                  </Label>
                  {!invoicePreview ? (
                    <div
                      onDrop={handleInvoiceDrop}
                      onDragOver={handleInvoiceDragOver}
                      onClick={() => invoiceInputRef.current?.click()}
                      className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors h-[140px]"
                    >
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground text-center">
                        {t("editAsset.dropImage")}
                      </p>
                      <input
                        ref={invoiceInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleInvoiceUpload}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="relative h-[140px] rounded-lg overflow-hidden">
                      <img
                        src={invoicePreview}
                        alt="Invoice preview"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 rounded-full"
                        onClick={handleRemoveInvoice}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t("editAsset.invoiceOptional")}
                  </p>
                </div>
              </div>

              {/* Category Buttons */}
              <div className="space-y-2">
                <Label htmlFor="category">
                  {t("editAsset.category")} <span className="text-destructive">{t("editAsset.required")}</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <Button
                      key={cat}
                      type="button"
                      variant={(formData.category === cat || (cat === "Other" && showOtherCategory)) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleCategoryChange(cat)}
                      className="rounded-full"
                    >
                      {getCategoryLabel(cat)}
                    </Button>
                  ))}
                </div>
                {showOtherCategory && (
                  <Input
                    id="custom_category"
                    placeholder={t("category.customCategory")}
                    value={customCategory}
                    onChange={(e) => handleCustomCategoryChange(e.target.value)}
                    className={cn("mt-2", errors.category ? "border-destructive" : "")}
                    autoFocus
                  />
                )}
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category}</p>
                )}
              </div>

              {/* Status Buttons - Semantic Colors */}
              <div className="space-y-2">
                <Label htmlFor="status">
                  {t("editAsset.status")} <span className="text-destructive">{t("editAsset.required")}</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {statuses.map((stat) => (
                    <Button
                      key={stat.value}
                      type="button"
                      variant={formData.status === stat.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleChange("status", stat.value)}
                      className={cn(
                        "rounded-full",
                        formData.status === stat.value && stat.color
                      )}
                    >
                      {getStatusLabel(stat.value)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Location and Assigned To - 2 Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {t("editAsset.location")} <span className="text-destructive">{t("editAsset.required")}</span>
                  </Label>
                  <Input
                    id="location"
                    placeholder="e.g., Office Floor 2, Room 201"
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    className={errors.location ? "border-destructive" : ""}
                  />
                  {errors.location && (
                    <p className="text-sm text-destructive">{errors.location}</p>
                  )}
                </div>

                {/* Assigned To */}
                <div className="space-y-2">
                  <Label htmlFor="assigned_to" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {t("editAsset.assignedTo")} <span className="text-destructive">{t("editAsset.required")}</span>
                  </Label>
                  <Input
                    id="assigned_to"
                    placeholder="e.g., John Doe"
                    value={formData.assigned_to}
                    onChange={(e) => handleChange("assigned_to", e.target.value)}
                    className={errors.assigned_to ? "border-destructive" : ""}
                  />
                  {errors.assigned_to && (
                    <p className="text-sm text-destructive">{errors.assigned_to}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                {t("editAsset.financialInfo")}
              </CardTitle>
              <CardDescription>
                {t("editAsset.financialInfoDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* 2-Column Grid - Purchase Date and Purchase Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Purchase Date */}
                <div className="space-y-2">
                  <Label htmlFor="purchase_date" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {t("editAsset.purchaseDate")} <span className="text-destructive">{t("editAsset.required")}</span>
                  </Label>
                  <Input
                    id="purchase_date"
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => handleChange("purchase_date", e.target.value)}
                    className={errors.purchase_date ? "border-destructive" : ""}
                  />
                  {errors.purchase_date && (
                    <p className="text-sm text-destructive">{errors.purchase_date}</p>
                  )}
                </div>

                {/* Purchase Price */}
                <div className="space-y-2">
                  <Label htmlFor="purchase_price" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    {t("editAsset.purchasePrice")} <span className="text-destructive">{t("editAsset.required")}</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                      RM
                    </span>
                    <Input
                      id="purchase_price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.purchase_price || ""}
                      onChange={(e) => handleChange("purchase_price", parseFloat(e.target.value) || 0)}
                      className={cn(
                        "pl-10",
                        errors.purchase_price ? "border-destructive" : ""
                      )}
                    />
                  </div>
                  {errors.purchase_price && (
                    <p className="text-sm text-destructive">{errors.purchase_price}</p>
                  )}
                </div>
              </div>

              {/* Remaining Value Display (Auto-calculated, Read-only) */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  {t("editAsset.remainingValue")}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    RM
                  </span>
                  <Input
                    type="text"
                    value={depreciationData.remainingValue.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    disabled
                    className="pl-10 bg-success/10 border-success/20 text-success font-semibold cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("editAsset.basedOn")} {depreciationMethods.find(m => m.value === depreciationMethod)?.label} {t("editAsset.depreciationMethod")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Depreciation Calculator */}
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-primary" />
                {t("editAsset.depreciationCalc")}
              </CardTitle>
              <CardDescription>
                {t("editAsset.depreciationCalcDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Depreciation Method Selection */}
              <div className="space-y-2">
                <Label>{t("editAsset.depreciationMethodLabel")}</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {depreciationMethods.map((method) => (
                    <div
                      key={method.value}
                      onClick={() => setDepreciationMethod(method.value)}
                      className={cn(
                        "p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-primary/50",
                        depreciationMethod === method.value
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      )}
                    >
                      <h4 className="font-semibold text-foreground mb-1">
                        {method.value === "straight-line" ? t("editAsset.straightLine") :
                         method.value === "declining-balance" ? t("editAsset.decliningBalance") :
                         t("editAsset.sumOfYears")}
                      </h4>
                      <p className="text-xs text-muted-foreground whitespace-pre-line">
                        {method.value === "straight-line" ? t("editAsset.straightLineDesc") :
                         method.value === "declining-balance" ? t("editAsset.decliningBalanceDesc") :
                         t("editAsset.sumOfYearsDesc")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Useful Life Input */}
              <div className="space-y-2">
                <Label htmlFor="useful_life" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {t("editAsset.usefulLife")} <span className="text-xs text-muted-foreground ml-2">{t("editAsset.usefulLifeAuto")}</span>
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Input
                    id="useful_life"
                    type="number"
                    min="1"
                    max="50"
                    value={usefulLife}
                    onChange={(e) => setUsefulLife(parseInt(e.target.value) || 5)}
                    className="text-lg font-semibold"
                  />
                  <div className="md:col-span-3 flex items-center">
                    <p className="text-sm text-muted-foreground">
                      {t("editAsset.usefulLifeDesc")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Depreciation Summary */}
              {depreciationData.isFutureDate ? (
                <div className="p-6 rounded-lg bg-warning/10 border border-warning/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">{t("editAsset.futurePurchaseDate")}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t("editAsset.futurePurchaseDateDesc")}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">{t("editAsset.monthlyDepreciation")}</p>
                  <p className="text-2xl font-bold text-foreground">
                    RM {depreciationData.monthlyDepreciation.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">{t("editAsset.yearlyDepreciation")}</p>
                  <p className="text-2xl font-bold text-foreground">
                    RM {depreciationData.yearlyDepreciation.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-muted-foreground mb-1">{t("editAsset.accumulatedDepreciation")}</p>
                  <p className="text-2xl font-bold text-destructive">
                    RM {depreciationData.accumulatedDepreciation.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("editAsset.over")} {depreciationData.yearsDiff} {t("editAsset.years")} ({depreciationData.monthsDiff} {t("editAsset.months")})
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                  <p className="text-sm text-muted-foreground mb-1">{t("assets.remainingValue")}</p>
                  <p className="text-2xl font-bold text-success">
                    RM {depreciationData.remainingValue.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {depreciationData.depreciationRate.toFixed(1)}% {t("editAsset.annualRate")}
                  </p>
                </div>
              </div>
              )}

              {/* Depreciation Info */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-3">
                  <TrendingDown className="w-5 h-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-2">{t("editAsset.howCalculated")}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t("editAsset.calculationFullDesc")}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {t("editAsset.additionalDetails")}
              </CardTitle>
              <CardDescription>
                {t("editAsset.additionalDetailsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Serial Number */}
                <div className="space-y-2">
                  <Label htmlFor="serial_number" className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    {t("editAsset.serialNumber")}
                  </Label>
                  <Input
                    id="serial_number"
                    placeholder="e.g., SN123456789"
                    value={formData.serial_number || ""}
                    onChange={(e) => handleChange("serial_number", e.target.value)}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {t("editAsset.description")}
                  </Label>
                  <Textarea
                    id="description"
                    placeholder={t("editAsset.enterAdditionalDetails")}
                    rows={3}
                    value={formData.description || ""}
                    onChange={(e) => handleChange("description", e.target.value)}
                    className="resize-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="glass border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                {t("editAsset.dangerZone")}
              </CardTitle>
              <CardDescription>
                {t("editAsset.dangerZoneDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <div>
                  <h3 className="font-semibold text-foreground">{t("editAsset.deleteAsset")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("editAsset.deleteAssetDesc")}
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="w-4 h-4" />
                      {t("editAsset.deleteAssetBtn")}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("editAsset.confirmDelete")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("editAsset.confirmDeleteDesc")}
                        <span className="font-semibold"> "{asset.name}" </span>
                        {t("editAsset.confirmDeleteDesc2")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("editAsset.cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        {t("editAsset.deletePermanently")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {/* Error Alert */}
          {Object.keys(errors).length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                {t("editAsset.fixErrors")}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-4 pt-4">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">{t("editAsset.requiredFields")}</span> {t("editAsset.markedWith")} <span className="text-destructive">{t("editAsset.required")}</span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={updateAsset.isPending}
                className="rounded-full px-6"
              >
                {t("editAsset.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={updateAsset.isPending}
                className="rounded-full px-6 gap-2 bg-primary hover:bg-primary/90"
              >
                {updateAsset.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t("editAsset.saving")}
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4" />
                    {t("editAsset.saveChanges")}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
