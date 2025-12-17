import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Calendar, DollarSign, MapPin, User, FileText, Hash, Loader2, Image as ImageIcon } from "lucide-react";
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

        {/* Asset Title with Image */}
        <div className="glass rounded-xl p-6">
          <div className="flex flex-col lg:flex-row items-start gap-6">
            {/* Asset Image */}
            {asset.image_url ? (
              <div className="w-full lg:w-64 h-64 rounded-lg overflow-hidden border-2 border-border">
                <img
                  src={asset.image_url}
                  alt={asset.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full lg:w-64 h-64 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-secondary/30">
                <div className="text-center">
                  <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No image available</p>
                </div>
              </div>
            )}

            {/* Asset Title and Status */}
            <div className="flex-1 flex items-start justify-between w-full">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-xl bg-primary/10">
                  <Package className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{asset.name}</h1>
                  <p className="text-muted-foreground mt-1">Asset ID: {asset.id}</p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn("capitalize text-sm px-3 py-1", statusStyles[asset.status as keyof typeof statusStyles])}
              >
                {asset.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Hash className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="text-foreground font-medium">{asset.category}</p>
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
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Financial Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  <p className="text-foreground font-medium text-lg">
                    RM {(asset.purchase_price || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Current Value</p>
                  <p className="text-foreground font-medium text-lg">
                    RM {(asset.current_value || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Depreciation</p>
                  <p className="text-destructive font-medium">
                    - RM {((asset.purchase_price || 0) - (asset.current_value || 0)).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
    </MainLayout>
  );
}
