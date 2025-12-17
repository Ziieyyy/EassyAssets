import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Package, DollarSign, Calendar, MapPin, User, FileText, Hash, Upload, X, Receipt } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
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

const statuses = [
  { value: "active", label: "Active", color: "bg-green-500 hover:bg-green-600" },
  { value: "maintenance", label: "Maintenance", color: "bg-amber-500 hover:bg-amber-600" },
  { value: "inactive", label: "Inactive", color: "bg-gray-500 hover:bg-gray-600" },
  { value: "disposed", label: "Disposed", color: "bg-red-500 hover:bg-red-600" },
];

export default function AddAsset() {
  const navigate = useNavigate();
  const createAsset = useCreateAsset();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  const [showOtherCategory, setShowOtherCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");

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
      // Set current_value to purchase_price for new assets (no depreciation yet)
      const assetData = {
        ...formData,
        current_value: formData.purchase_price,
      };
      
      await createAsset.mutateAsync(assetData as AssetInsert);
      navigate("/assets");
    } catch (error) {
      console.error("Failed to create asset:", error);
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
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
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
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
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
                  <Label htmlFor="assigned_invoice" className="flex items-center gap-2">
                    <Receipt className="w-4 h-4" />
                    Assigned Invoice
                  </Label>
                  <Input
                    id="assigned_invoice"
                    placeholder="e.g., INV-2024-001"
                    value={formData.assigned_invoice || ""}
                    onChange={(e) => handleChange("assigned_invoice", e.target.value)}
                    className="h-[140px]"
                  />
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
