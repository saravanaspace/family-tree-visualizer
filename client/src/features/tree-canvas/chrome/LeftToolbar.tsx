import { AlignCenterHorizontal, AlignCenterVertical, AlignEndHorizontal, AlignEndVertical, AlignStartHorizontal, AlignStartVertical, Link2, Redo2, Undo2, UserPlus, Wand2, StretchHorizontal, StretchVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { AlignMode } from '../lib/align';

interface Props {
  canUndo: boolean;
  canRedo: boolean;
  undoLabel?: string;
  redoLabel?: string;
  selectedCount: number;
  arranging: boolean;
  onAdd: () => void;
  onConnect: () => void;
  onArrange: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onAlign: (mode: AlignMode) => void;
  onDistribute: (axis: 'x' | 'y') => void;
}

function Tool({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="h-11 w-11 md:h-9 md:w-9" aria-label={label} disabled={disabled} onClick={onClick}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

/** Floating vertical toolbar on desktop; becomes a bottom bar on mobile. */
export function LeftToolbar(p: Props) {
  const multi = p.selectedCount >= 2;
  return (
    <div
      role="toolbar"
      aria-label="Canvas tools"
      className="absolute z-10 flex gap-1 rounded-lg border bg-background/95 p-1 shadow-md backdrop-blur max-md:bottom-3 max-md:left-1/2 max-md:-translate-x-1/2 max-md:flex-row max-md:overflow-x-auto md:left-4 md:top-1/2 md:-translate-y-1/2 md:flex-col"
    >
      <Tool label="Add person" onClick={p.onAdd}><UserPlus className="h-4 w-4" /></Tool>
      <Tool label="Connect people" onClick={p.onConnect}><Link2 className="h-4 w-4" /></Tool>
      <Tool label="Auto-arrange" onClick={p.onArrange} disabled={p.arranging}><Wand2 className="h-4 w-4" /></Tool>
      <Tool label={p.undoLabel ? `Undo ${p.undoLabel}` : 'Undo'} onClick={p.onUndo} disabled={!p.canUndo}><Undo2 className="h-4 w-4" /></Tool>
      <Tool label={p.redoLabel ? `Redo ${p.redoLabel}` : 'Redo'} onClick={p.onRedo} disabled={!p.canRedo}><Redo2 className="h-4 w-4" /></Tool>
      {multi && (
        <>
          <Tool label="Align left" onClick={() => p.onAlign('left')}><AlignStartVertical className="h-4 w-4" /></Tool>
          <Tool label="Align horizontal centers" onClick={() => p.onAlign('center-x')}><AlignCenterVertical className="h-4 w-4" /></Tool>
          <Tool label="Align right" onClick={() => p.onAlign('right')}><AlignEndVertical className="h-4 w-4" /></Tool>
          <Tool label="Align top" onClick={() => p.onAlign('top')}><AlignStartHorizontal className="h-4 w-4" /></Tool>
          <Tool label="Align vertical centers" onClick={() => p.onAlign('center-y')}><AlignCenterHorizontal className="h-4 w-4" /></Tool>
          <Tool label="Align bottom" onClick={() => p.onAlign('bottom')}><AlignEndHorizontal className="h-4 w-4" /></Tool>
          <Tool label="Distribute horizontally" onClick={() => p.onDistribute('x')} disabled={p.selectedCount < 3}><StretchHorizontal className="h-4 w-4" /></Tool>
          <Tool label="Distribute vertically" onClick={() => p.onDistribute('y')} disabled={p.selectedCount < 3}><StretchVertical className="h-4 w-4" /></Tool>
        </>
      )}
    </div>
  );
}
