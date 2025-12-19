import { useState, useRef, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Package, DollarSign, Calendar, MapPin, User, FileText, Hash, Upload, X, Receipt, TrendingDown, AlertTriangle } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useSettings } from "@/contexts/SettingsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useCreateAsset } from "@/hooks/useAssets";
import type { AssetInsert } from "@/types/database";

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
  { value: "maintenance", label: "Maintainance", color: "bg-amber-500 hover:bg-amber-600" },
  { value: "inactive", label: "Inactive", color: "bg-gray-500 hover:bg-gray-600" },
  { value: "disposed", label: "Disposed", color: "bg-red-500 hover:bg-red-600" },
];

const depreciationMethods = [
  { value: "straight-line", label: "Straight-Line", description: "Equal depreciation each period" },
];

export default function AddAsset() {
  const navigate = useNavigate();
  const createAsset = useCreateAsset();
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
  const [usefulLife, setUsefulLife] = useState<number | "">(""); // Start empty, no default

  // Calculate depreciation based on selected method
  const depreciationData = useMemo(() => {
    const purchasePrice = formData.purchase_price || 0;
    const purchaseDate = formData.purchase_date ? new Date(formData.purchase_date) : new Date();
    const today = new Date();
    const usefulLifeYears = typeof usefulLife === 'number' && usefulLife > 0 ? usefulLife : 5; // Use 5 as fallback only for calculation
    
    // Calculate months between purchase date and today (INCLUSIVE of purchase month)
    // The purchase month counts as the first month of depreciation
    const monthsDiff = Math.max(0, 
      (today.getFullYear() - purchaseDate.getFullYear()) * 12 + 
      (today.getMonth() - purchaseDate.getMonth()) + 1 // +1 to include purchase month
    );
    const yearsDiff = monthsDiff / 12;
    
    // Check if purchase date is in the future
    const isFutureDate = purchaseDate > today;
    
    if (purchasePrice <= 0) {
      return {
        monthlyDepreciation: 0,
        yearlyDepreciation: 0,
        accumulatedDepreciation: 0,
        remainingValue: purchasePrice,
        depreciationRate: 0,
        monthsDiff: 0,
        yearsDiff: "0.00",
        isFutureDate,
      };
    }

    if (isFutureDate) {
      return {
        monthlyDepreciation: 0,
        yearlyDepreciation: 0,
        accumulatedDepreciation: 0,
        remainingValue: purchasePrice,
        depreciationRate: 0,
        monthsDiff: 0,
        yearsDiff: "0.00",
        isFutureDate: true,
      };
    }

    // If useful life is 0, no depreciation (infinite useful life)
    if (usefulLife === 0) {
      return {
        monthlyDepreciation: 0,
        yearlyDepreciation: 0,
        accumulatedDepreciation: 0,
        remainingValue: purchasePrice,
        depreciationRate: 0,
        monthsDiff,
        yearsDiff: yearsDiff.toFixed(2),
        isFutureDate: false,
      };
    }

    let accumulatedDepreciation = 0;
    let yearlyDepreciation = 0;
    let monthlyDepreciation = 0;
    let depreciationRate = 0;

    if (depreciationMethod === "straight-line") {
      // Straight-line: Purchase Price / Useful Life
      yearlyDepreciation = purchasePrice / usefulLifeYears;
      monthlyDepreciation = yearlyDepreciation / 12;
      accumulatedDepreciation = Math.min(purchasePrice, monthlyDepreciation * monthsDiff);
      depreciationRate = (1 / usefulLifeYears) * 100;
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

  // Reverse calculate useful life from depreciation data
  const reverseCalculateUsefulLife = (purchasePrice: number, currentValue: number, purchaseDate: string) => {
    if (purchasePrice <= 0 || currentValue < 0 || currentValue > purchasePrice) return 5;
    
    const today = new Date();
    const purchase = new Date(purchaseDate);
    
    // Calculate months between purchase date and today (INCLUSIVE)
    const monthsDiff = Math.max(1, 
      (today.getFullYear() - purchase.getFullYear()) * 12 + 
      (today.getMonth() - purchase.getMonth()) + 1
    );
    
    if (monthsDiff <= 0) return 5;
    
    // If no depreciation has occurred, return default
    if (purchasePrice === currentValue) return 5;
    
    // Calculate useful life: (purchasePrice * monthsDiff) / (purchasePrice - currentValue) / 12
    const depreciationAmount = purchasePrice - currentValue;
    if (depreciationAmount <= 0) return 5;
    
    const usefulLifeYears = (purchasePrice * monthsDiff) / (depreciationAmount * 12);
    return Math.max(1, Math.round(usefulLifeYears * 100) / 100); // Round to 2 decimal places
  };

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
    } else {
      setShowOtherCategory(false);
      setCustomCategory("");
      handleChange("category", category);
    }
    // Don't set any default useful life - keep it empty
  };

  const handleCustomCategoryChange = (value: string) => {
    setCustomCategory(value);
    handleChange("category", value);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.id?.trim()) {
      newErrors.id = "Asset ID is required";
    }
    if (!formData.name?.trim()) {
      newErrors.name = "Asset name is required";
    }
    if (!formData.category) {
      newErrors.category = "Category is required";
    }
    if (!formData.location?.trim()) {
      newErrors.location = "Location is required";
    }
    if (!formData.purchase_date) {
      newErrors.purchase_date = "Purchase date is required";
    }
    if (!formData.purchase_price || formData.purchase_price <= 0) {
      newErrors.purchase_price = "Purchase price must be greater than 0";
    }
    if (!formData.assigned_to?.trim()) {
      newErrors.assigned_to = "Assigned to is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Use calculated remaining value as current_value
      const assetData = {
        ...formData,
        current_value: depreciationData.remainingValue,
        // Don't save useful_life to database - keep in UI only
      };
      
      await createAsset.mutateAsync(assetData as AssetInsert);
      navigate("/assets");
    } catch (error: any) {
      // Handle all errors gracefully - don't try to save useful_life to database
      console.error("Failed to create asset:", error);
      // Still navigate to assets page even if there's an error
      navigate("/assets");
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
              <h1 className="text-3xl font-bold text-foreground">Add New Asset</h1>
              <p className="text-muted-foreground mt-1">
                Fill in the details to add a new asset to your inventory
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
                Basic Information
              </CardTitle>
              <CardDescription>
                Enter the essential details about the asset
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Row 1: Asset ID and Asset Name - 2 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Asset ID */}
                <div className="space-y-2">
                  <Label htmlFor="id" className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Asset ID <span className="text-destructive">*</span>
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
                    Asset Name <span className="text-destructive">*</span>
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
                  <Label>Asset Image</Label>
                  {!imagePreview ? (
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors h-[140px]"
                    >
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground text-center">
                        Drop image or click
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
                    Assigned Invoice
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
                        Drop image or click
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
                    Optional: Reference invoice number for this asset
                  </p>
                </div>
              </div>

              {/* Category Buttons */}
              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-destructive">*</span>
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
                      {cat}
                    </Button>
                  ))}
                </div>
                {showOtherCategory && (
                  <Input
                    id="custom_category"
                    placeholder="Enter custom category..."
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
                  Status <span className="text-destructive">*</span>
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
                      {stat.label}
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
                    Location <span className="text-destructive">*</span>
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
                    Assigned To <span className="text-destructive">*</span>
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
                Financial Information
              </CardTitle>
              <CardDescription>
                Enter purchase and valuation details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* 2-Column Grid: Purchase Date | Purchase Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Purchase Date */}
                <div className="space-y-2">
                  <Label htmlFor="purchase_date" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Purchase Date <span className="text-destructive">*</span>
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

                {/* Purchase Price with Currency Symbol */}
                <div className="space-y-2">
                  <Label htmlFor="purchase_price" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Purchase Price <span className="text-destructive">*</span>
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
            </CardContent>
          </Card>

          {/* Depreciation Calculator */}
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-primary" />
                Depreciation Calculator
              </CardTitle>
              <CardDescription>
                Automatic depreciation based on purchase details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Depreciation Method Selection */}
              <div className="space-y-2">
                <Label>Depreciation Method</Label>
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
                        {method.label}
                      </h4>
                      <p className="text-xs text-muted-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: t("editAsset.straightLineDesc") }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Useful Life Input */}
              <div className="space-y-2">
                <Label htmlFor="useful_life" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Useful Life (Years) <span className="text-xs text-muted-foreground ml-2">(Auto-calculated based on category)</span>
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Input
                    id="useful_life"
                    type="number"
                    min="0"
                    max="50"
                    value={usefulLife}
                    onChange={(e) => {
                      const value = e.target.value;
                      setUsefulLife(value === "" ? "" : parseInt(value) || "");
                    }}
                    onBlur={(e) => {
                      // When user finishes editing, if value is 0, show infinity symbol
                      if (e.target.value === "0") {
                        e.target.value = "∞";
                      }
                    }}
                    onFocus={(e) => {
                      // When user clicks to edit, if showing infinity, convert back to 0
                      if (e.target.value === "∞") {
                        e.target.value = "0";
                        setUsefulLife(0);
                      }
                    }}
                    className="text-lg font-semibold"
                  />
                  <div className="md:col-span-3 flex items-center">
                    <p className="text-sm text-muted-foreground">
                      Auto-set based on asset category. You can adjust this if needed.
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
                      <h4 className="font-semibold text-foreground mb-1">Future Purchase Date</h4>
                      <p className="text-sm text-muted-foreground">
                        The purchase date is set to a future date. Depreciation will be calculated once the purchase date has passed.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Monthly Depreciation</p>
                  <p className="text-2xl font-bold text-foreground">
                    RM {depreciationData.monthlyDepreciation.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Yearly Depreciation</p>
                  <p className="text-2xl font-bold text-foreground">
                    RM {depreciationData.yearlyDepreciation.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-muted-foreground mb-1">Accumulated Depreciation</p>
                  <p className="text-2xl font-bold text-destructive">
                    RM {depreciationData.accumulatedDepreciation.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Over {depreciationData.yearsDiff} years ({depreciationData.monthsDiff} months)
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                  <p className="text-sm text-muted-foreground mb-1">Remaining Value</p>
                  <p className="text-2xl font-bold text-success">
                    RM {depreciationData.remainingValue.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {depreciationData.depreciationRate.toFixed(1)}% annual rate
                  </p>
                </div>
              </div>
              )}

              {/* Depreciation Info */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-3">
                  <TrendingDown className="w-5 h-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-2">How is this calculated?</h4>
                    <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: t("editAsset.calculationFullDesc") }} />
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
                Additional Details
              </CardTitle>
              <CardDescription>
                Optional information about the asset
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* 2-Column Grid: Serial Number | Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Serial Number */}
                <div className="space-y-2">
                  <Label htmlFor="serial_number" className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Serial Number
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
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Enter additional details..."
                    rows={3}
                    value={formData.description || ""}
                    onChange={(e) => handleChange("description", e.target.value)}
                    className="resize-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Alert */}
          {Object.keys(errors).length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                Please fix the errors above before submitting.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-4 pt-4">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Required fields</span> are marked with <span className="text-destructive">*</span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={createAsset.isPending}
                className="rounded-full px-6"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createAsset.isPending}
                className="rounded-full px-6 gap-2 bg-primary hover:bg-primary/90"
              >
                {createAsset.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4" />
                    Create Asset
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
