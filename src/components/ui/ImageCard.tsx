import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ZoomIn, Image as ImageIcon, X } from "lucide-react";

interface ImageCardProps {
  title?: string;
  icon?: React.ReactNode;
  imageUrl: string | null;
  altText: string;
  defaultTitle?: string;
  showZoomHint?: boolean;
  onImageClick?: () => void;
  isZoomed?: boolean;
  onZoomClose?: () => void;
  zoomImageUrl?: string;
  className?: string;
  hideHeader?: boolean;
  defaultHeightClass?: string;
}

const ImageCard: React.FC<ImageCardProps> = ({
  title = "Image",
  icon,
  imageUrl,
  altText,
  defaultTitle = "No image available",
  showZoomHint = true,
  onImageClick,
  isZoomed,
  onZoomClose,
  zoomImageUrl,
  className = "",
  hideHeader = false,
  defaultHeightClass = "h-64"
}) => {
  return (
    <>
      <Card className={`glass border-border ${className}`}>
        {!hideHeader && (
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {icon}
              {title}
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          {imageUrl ? (
            <div 
              className={`w-full ${defaultHeightClass} rounded-lg overflow-hidden border-2 border-border ${onImageClick ? 'cursor-pointer hover:border-primary transition-all group relative' : ''}`}
              onClick={onImageClick}
            >
              <img
                src={imageUrl}
                alt={altText}
                className={`w-full ${defaultHeightClass} object-contain bg-secondary/30 ${onImageClick ? 'group-hover:opacity-90 transition-opacity' : ''}`}
              />
              {onImageClick && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                  <div className="bg-primary text-primary-foreground rounded-full p-3">
                    <ZoomIn className="w-6 h-6" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={`w-full ${defaultHeightClass} rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-secondary/30`}>
              <div className="text-center">
                <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{defaultTitle}</p>
              </div>
            </div>
          )}
          {imageUrl && showZoomHint && onImageClick && (
            <p className="text-xs text-muted-foreground text-center mt-2">Click to view full size</p>
          )}
        </CardContent>
      </Card>

      {/* Zoom Modal */}
      {isZoomed && zoomImageUrl && onZoomClose && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={onZoomClose}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full"
            onClick={onZoomClose}
          >
            <X className="w-6 h-6" />
          </Button>
          <img
            src={zoomImageUrl}
            alt="Full Size"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default ImageCard;