import { Minus, Plus, Maximize, ScanSearch } from 'lucide-react';
import { useReactFlow, useStore } from '@xyflow/react';
import { Button } from '@/components/ui/button';

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export const animDuration = (ms = 250) => (reducedMotion() ? 0 : ms);

export function ZoomPanel() {
  const { zoomIn, zoomOut, fitView, zoomTo, getNodes } = useReactFlow();
  const zoom = useStore((s) => s.transform[2]);
  const hasSelection = useStore((s) => s.nodes.some((n) => n.selected && n.type === 'person'));

  return (
    <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1 rounded-lg border bg-background/95 p-1 shadow-md backdrop-blur max-md:bottom-20" role="group" aria-label="Zoom controls">
      <Button variant="ghost" size="icon" aria-label="Zoom out" onClick={() => zoomOut({ duration: animDuration(150) })}><Minus className="h-4 w-4" /></Button>
      <button
        className="min-w-12 rounded px-1 text-xs tabular-nums hover:bg-accent"
        aria-label="Reset zoom to 100%"
        onClick={() => zoomTo(1, { duration: animDuration(150) })}
      >
        {Math.round(zoom * 100)}%
      </button>
      <Button variant="ghost" size="icon" aria-label="Zoom in" onClick={() => zoomIn({ duration: animDuration(150) })}><Plus className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" aria-label="Fit tree to screen" onClick={() => fitView({ padding: 0.2, maxZoom: 1, duration: animDuration() })}>
        <Maximize className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost" size="icon" aria-label="Fit selection" disabled={!hasSelection}
        onClick={() => fitView({ nodes: getNodes().filter((n) => n.selected), padding: 0.4, maxZoom: 1.5, duration: animDuration() })}
      >
        <ScanSearch className="h-4 w-4" />
      </Button>
    </div>
  );
}
