import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Calendar, DollarSign, MapPin, User, FileText, Hash, Loader2, Image as ImageIcon, Receipt, X, ZoomIn } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAsset } from "@/hooks/useAssets";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

const statusStyles = {
  active: "bg-success/10 text-success border-success/20",
  maintenance: "bg-warning/10 text-warning border-warning/20",
  inactive: "bg-muted text-muted-foreground border-border",
  disposed: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function ViewAsset() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: asset, isLoading, isError, error } = useAsset(id || "");
  const [isInvoiceZoomed, setIsInvoiceZoomed] = useState(false);
  const [categoryName, setCategoryName] = useState(asset?.category || "");
  
  // Update category name when asset is loaded
  useEffect(() => {
    if (asset) {
      setCategoryName(asset.category);
    }
  }, [asset]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (isError || !asset) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/assets")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Assets
          </Button>
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load asset: {error?.message || 'Asset not found'}
            </AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/assets")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Assets
          </Button>
        </div>

        {/* 2x2 Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Left: Asset Image */}
          <div>
            <Card className="glass border-border h-full">
              <CardContent className="p-0">
                {asset.image_url ? (
                  <div className="w-full h-80 rounded-lg overflow-hidden border-2 border-border">
                    <img
                      src={asset.image_url}
                      alt={asset.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-80 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-secondary/30">
                    <div className="text-center">
                      <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No image available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Right: Asset Name, ID, Status and Basic Information */}
          <div>
            <Card className="glass border-border h-full">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-4 rounded-xl bg-primary/10 flex-shrink-0">
                      <Package className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold text-foreground">{asset.name}</h1>
                      <p className="text-muted-foreground mt-1">Asset ID: {asset.id}</p>
                      <div className="mt-3">
                        <Badge
                          variant="outline"
                          className={cn("capitalize text-sm px-3 py-1", statusStyles[asset.status as keyof typeof statusStyles])}
                        >
                          {asset.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-border">
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Basic Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Hash className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Category</p>
                        <p className="text-foreground font-medium">{categoryName || "Uncategorized"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="text-foreground font-medium">{asset.location}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Assigned To</p>
                        <p className="text-foreground font-medium">{asset.assigned_to || 'Unassigned'}</p>
                      </div>
                    </div>
                    {asset.serial_number && (
                      <div className="flex items-start gap-3">
                        <Hash className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Serial Number</p>
                          <p className="text-foreground font-medium font-mono">{asset.serial_number}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Row: Invoice and Financial Info */}
        {asset.assigned_invoice ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bottom Left: Invoice Image */}
            <div>
              <Card className="glass border-border h-full">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-primary" />
                    Assigned Invoice
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="w-full h-80 rounded-lg overflow-hidden border-2 border-border cursor-pointer hover:border-primary transition-all group relative"
                    onClick={() => setIsInvoiceZoomed(true)}
                  >
                    <img
                      src={asset.assigned_invoice}
                      alt="Invoice"
                      className="w-full h-full object-contain bg-secondary/30 group-hover:opacity-90 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                      <div className="bg-primary text-primary-foreground rounded-full p-3">
                        <ZoomIn className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-2">Click to view full size</p>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Right: Financial Information and Record Information */}
            <div className="space-y-6">
              <Card className="glass border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                  Financial Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Purchase Date</p>
                    <p className="text-foreground font-medium">
                      {new Date(asset.purchase_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Purchase Price</p>
                    <p className="text-foreground font-medium text-lg text-center">
                      {(asset.purchase_price || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Current Value</p>
                    <p className="text-foreground font-medium text-lg text-center">
                      {(asset.current_value || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <div className="md:col-span-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Depreciation</p>
                    <p className="text-destructive font-medium text-center">
                      - {((asset.purchase_price || 0) - (asset.current_value || 0)).toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card className="glass border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Record Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-foreground font-medium">
                    {new Date(asset.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                
                {/* Status-specific information - only show when status is maintenance, inactive, or disposed */}
                {(asset.status === 'maintenance' || asset.status === 'inactive' || asset.status === 'disposed') && (
                  <>
                    {asset.status_notes && (
                      <div className="flex items-start justify-between pt-3 border-t border-border">
                        <p className="text-sm text-muted-foreground">Status Notes</p>
                        <p className="text-foreground font-medium text-right flex-1 ml-4">{asset.status_notes}</p>
                      </div>
                    )}
                    {asset.status_date && (
                      <div className="flex items-center justify-between pt-2">
                        <p className="text-sm text-muted-foreground">Status Date</p>
                        <p className="text-foreground font-medium">
                          {new Date(asset.status_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Empty placeholder for invoice when no invoice exists */}
            <div className="h-0"></div>
            
            {/* Right column: Financial Information and Record Information */}
            <div className="space-y-6">
              <Card className="glass border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Financial Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Purchase Date</p>
                      <p className="text-foreground font-medium">
                        {new Date(asset.purchase_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Purchase Price</p>
                      <p className="text-foreground font-medium text-lg text-center">
                        {(asset.purchase_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Current Value</p>
                      <p className="text-foreground font-medium text-lg text-center">
                        {(asset.current_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  <div className="md:col-span-3 pt-3 border-t border-border">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Depreciation</p>
                      <p className="text-destructive font-medium text-center">
                        - {((asset.purchase_price || 0) - (asset.current_value || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Metadata */}
              <Card className="glass border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Record Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="text-foreground font-medium">
                      {new Date(asset.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Invoice Zoom Modal */}
        {isInvoiceZoomed && asset.assigned_invoice && (
          <div 
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setIsInvoiceZoomed(false)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full"
              onClick={() => setIsInvoiceZoomed(false)}
            >
              <X className="w-6 h-6" />
            </Button>
            <img
              src={asset.assigned_invoice}
              alt="Invoice - Full Size"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Description */}
        {asset.description && (
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">{asset.description}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
