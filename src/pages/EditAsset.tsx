import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Package, DollarSign, Calendar, MapPin, User, FileText, Hash, Upload, X, Trash2, AlertTriangle, TrendingDown } from "lucide-react";
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

const categories = ["IT Equipment", "Furniture", "Vehicles", "Office Equipment", "Machinery", "Other"];

const statuses = [
  { value: "active", label: "Active", color: "bg-green-500 hover:bg-green-600" },
  { value: "maintenance", label: "Maintenance", color: "bg-amber-500 hover:bg-amber-600" },
  { value: "inactive", label: "Inactive", color: "bg-gray-500 hover:bg-gray-600" },
  { value: "disposed", label: "Disposed", color: "bg-red-500 hover:bg-red-600" },
];

const depreciationMethods = [
  { value: "straight-line", label: "Straight-Line", description: "Equal depreciation each period" },
  { value: "declining-balance", label: "Declining Balance", description: "Higher depreciation in early years" },
  { value: "sum-of-years", label: "Sum-of-Years-Digits", description: "Accelerated depreciation" },
];

export default function EditAsset() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();
  const { data: asset, isLoading } = useAsset(id || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    description: "",
    serial_number: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showOtherCategory, setShowOtherCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [depreciationMethod, setDepreciationMethod] = useState<string>("straight-line");

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

    // Assumed useful life (in years) - you can make this configurable
    const usefulLife = 5;

    if (depreciationMethod === "straight-line") {
      // Straight-line: (Cost - Salvage Value) / Useful Life
      // Assuming salvage value is 0 for simplicity
      yearlyDepreciation = purchasePrice / usefulLife;
      monthlyDepreciation = yearlyDepreciation / 12;
      accumulatedDepreciation = Math.min(purchasePrice, monthlyDepreciation * monthsDiff);
      depreciationRate = (1 / usefulLife) * 100;
    } else if (depreciationMethod === "declining-balance") {
      // Declining Balance: 2 * (1 / Useful Life) * Book Value
      // Using double-declining balance (200%)
      const rate = 2 / usefulLife;
      depreciationRate = rate * 100;
      let bookValue = purchasePrice;
      
      for (let year = 0; year < Math.ceil(yearsDiff); year++) {
        const yearDepreciation = bookValue * rate;
        if (year < Math.floor(yearsDiff)) {
          accumulatedDepreciation += yearDepreciation;
          bookValue -= yearDepreciation;
        } else {
          // Partial year
          const partialYear = yearsDiff - Math.floor(yearsDiff);
          accumulatedDepreciation += yearDepreciation * partialYear;
        }
      }
      
      yearlyDepreciation = purchasePrice * rate;
      monthlyDepreciation = yearlyDepreciation / 12;
      accumulatedDepreciation = Math.min(purchasePrice, accumulatedDepreciation);
    } else if (depreciationMethod === "sum-of-years") {
      // Sum-of-Years-Digits: (Remaining Life / Sum of Years) * Depreciable Base
      const sumOfYears = (usefulLife * (usefulLife + 1)) / 2;
      
      for (let year = 1; year <= Math.ceil(yearsDiff); year++) {
        const remainingLife = usefulLife - year + 1;
        const yearDepreciation = (remainingLife / sumOfYears) * purchasePrice;
        
        if (year <= Math.floor(yearsDiff)) {
          accumulatedDepreciation += yearDepreciation;
        } else {
          // Partial year
          const partialYear = yearsDiff - Math.floor(yearsDiff);
          accumulatedDepreciation += yearDepreciation * partialYear;
        }
      }
      
      const currentYear = Math.min(Math.ceil(yearsDiff), usefulLife);
      const remainingLife = usefulLife - currentYear + 1;
      yearlyDepreciation = (remainingLife / sumOfYears) * purchasePrice;
      monthlyDepreciation = yearlyDepreciation / 12;
      accumulatedDepreciation = Math.min(purchasePrice, accumulatedDepreciation);
      depreciationRate = (remainingLife / sumOfYears) * 100;
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
  }, [formData.purchase_price, formData.purchase_date, depreciationMethod]);

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
        description: asset.description,
        serial_number: asset.serial_number,
        image_url: asset.image_url,
      });

      // Set image preview if image exists
      if (asset.image_url) {
        setImagePreview(asset.image_url);
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
    } else {
      setShowOtherCategory(false);
      setCustomCategory("");
      handleChange("category", category);
    }
  };

  const handleCustomCategoryChange = (value: string) => {
    setCustomCategory(value);
    handleChange("category", value);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

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
    
    if (!validateForm() || !id) {
      return;
    }

    try {
      const { id: _, created_at, ...updateData } = formData as any;
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
          <h2 className="text-2xl font-bold">Asset Not Found</h2>
          <Button onClick={() => navigate("/assets")}>Back to Assets</Button>
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
                Edit Asset: {asset.name}
              </h1>
              <p className="text-muted-foreground mt-1">
                Last updated {getTimeAgo(asset.created_at)} • ID: {asset.id}
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
                Update the essential details about the asset
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Grid Layout - Asset ID + Asset Name + Image Upload */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Asset ID - Read Only */}
                <div className="space-y-2">
                  <Label htmlFor="id" className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Asset ID
                  </Label>
                  <Input
                    id="id"
                    value={formData.id}
                    disabled
                    className="bg-muted cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">ID cannot be changed</p>
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

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>Asset Image</Label>
                  {!imagePreview ? (
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors h-[120px]"
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
                    <div className="relative h-[120px] rounded-lg overflow-hidden">
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
                Update purchase and valuation details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* 2-Column Grid - Purchase Date and Purchase Price */}
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

                {/* Purchase Price */}
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

              {/* Remaining Value Display (Auto-calculated, Read-only) */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  Remaining Value (Auto-calculated)
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
                  Based on {depreciationMethods.find(m => m.value === depreciationMethod)?.label} depreciation method
                </p>
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
                Automatic depreciation calculation based on purchase details
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
                      <h4 className="font-semibold text-foreground mb-1">{method.label}</h4>
                      <p className="text-xs text-muted-foreground">{method.description}</p>
                    </div>
                  ))}
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
                        The purchase date is set to a future date ({formData.purchase_date ? new Date(formData.purchase_date).toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}).
                        Depreciation will be calculated once the purchase date has passed.
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
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p><span className="font-medium">Purchase Date:</span> {formData.purchase_date ? new Date(formData.purchase_date).toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set'}</p>
                      <p><span className="font-medium">Purchase Price:</span> RM {(formData.purchase_price || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      <p><span className="font-medium">Useful Life:</span> 5 years (assumed)</p>
                      <p className="mt-2 text-xs italic">
                        The depreciation is calculated from the purchase date to today using the {depreciationMethods.find(m => m.value === depreciationMethod)?.label} method.
                      </p>
                    </div>
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

          {/* Danger Zone */}
          <Card className="glass border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions. Please proceed with caution.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <div>
                  <h3 className="font-semibold text-foreground">Delete this asset</h3>
                  <p className="text-sm text-muted-foreground">
                    Once deleted, this asset cannot be recovered.
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete Asset
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the asset
                        <span className="font-semibold"> "{asset.name}" </span>
                        and remove all associated data from the database.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Delete Permanently
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
                Please fix the errors above before saving.
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
                disabled={updateAsset.isPending}
                className="rounded-full px-6"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateAsset.isPending}
                className="rounded-full px-6 gap-2 bg-primary hover:bg-primary/90"
              >
                {updateAsset.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4" />
                    Save Changes
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
