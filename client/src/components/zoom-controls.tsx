import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Minus, Home } from "lucide-react";

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

export default function ZoomControls({
  onZoomIn,
  onZoomOut,
  onResetZoom
}: ZoomControlsProps) {
  return (
    <Card className="fixed top-5 right-5 z-10 p-2">
      <div className="flex flex-col space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onZoomIn}
          className="h-8 w-8 p-0 hover:bg-gray-100 transition-colors"
        >
          <Plus className="h-4 w-4 text-gray-600" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onZoomOut}
          className="h-8 w-8 p-0 hover:bg-gray-100 transition-colors"
        >
          <Minus className="h-4 w-4 text-gray-600" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onResetZoom}
          className="h-8 w-8 p-0 hover:bg-gray-100 transition-colors"
        >
          <Home className="h-4 w-4 text-gray-600" />
        </Button>
      </div>
    </Card>
  );
}
