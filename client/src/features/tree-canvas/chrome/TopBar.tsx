import { Clock, Download, Filter, LogOut, Search, Settings2, TreePine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { EMPTY_FILTERS, filtersActive, type TreeFilters } from '../lib/filter';
import type { CanvasSettings } from '../hooks/useCanvasSettings';
import type { ExportFormat } from '../hooks/useExport';

interface Props {
  view: 'tree' | 'timeline';
  onViewChange: (view: 'tree' | 'timeline') => void;
  filters: TreeFilters;
  onFiltersChange: (f: TreeFilters) => void;
  stats: { members: number; generations: number; couples: number };
  settings: CanvasSettings;
  onSettingsChange: (patch: Partial<CanvasSettings>) => void;
  onOpenPalette: () => void;
  onExport: (format: ExportFormat) => void;
  onSignOut: () => void;
  exporting: boolean;
}

export function TopBar(p: Props) {
  const active = filtersActive(p.filters);
  return (
    <header className="absolute left-3 right-3 top-3 z-10 flex items-center gap-2 rounded-lg border bg-background/95 px-3 py-1.5 shadow-md backdrop-blur">
      <h1 className="mr-2 hidden items-center gap-2 text-sm font-semibold sm:flex"><TreePine className="h-4 w-4 text-primary" />Family Tree</h1>

      <ToggleGroup type="single" value={p.view} onValueChange={(v) => v && p.onViewChange(v as 'tree' | 'timeline')} aria-label="View">
        <ToggleGroupItem value="tree" aria-label="Tree view" className="h-9 min-w-9"><TreePine className="h-4 w-4" /></ToggleGroupItem>
        <ToggleGroupItem value="timeline" aria-label="Timeline view" className="h-9 min-w-9"><Clock className="h-4 w-4" /></ToggleGroupItem>
      </ToggleGroup>

      <Button variant="outline" size="sm" className="ml-auto min-w-0 flex-1 justify-start text-muted-foreground sm:max-w-xs" onClick={p.onOpenPalette} aria-label="Search people or commands (Ctrl+K)">
        <Search className="mr-2 h-4 w-4 shrink-0" /><span className="truncate">Search…</span>
        <kbd className="ml-auto hidden rounded border px-1 text-[10px] sm:inline">⌘K</kbd>
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant={active ? 'default' : 'outline'} size="icon" aria-label="Filters"><Filter className="h-4 w-4" /></Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 space-y-3">
          <div className="space-y-1">
            <Label htmlFor="flt-q">Name contains</Label>
            <Input id="flt-q" value={p.filters.query} onChange={(e) => p.onFiltersChange({ ...p.filters, query: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <ToggleGroup type="single" variant="outline" value={p.filters.living} onValueChange={(v) => v && p.onFiltersChange({ ...p.filters, living: v as TreeFilters['living'] })}>
              <ToggleGroupItem value="all">All</ToggleGroupItem>
              <ToggleGroupItem value="living">Living</ToggleGroupItem>
              <ToggleGroupItem value="deceased">Deceased</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="space-y-1">
            <Label>Gender</Label>
            <ToggleGroup type="single" variant="outline" value={p.filters.gender} onValueChange={(v) => v && p.onFiltersChange({ ...p.filters, gender: v as TreeFilters['gender'] })} className="flex-wrap">
              {['all', 'male', 'female', 'other', 'unknown'].map((g) => <ToggleGroupItem key={g} value={g} className="capitalize">{g}</ToggleGroupItem>)}
            </ToggleGroup>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{p.stats.members} people · {p.stats.generations} generations · {p.stats.couples} couples</span>
            <Button variant="ghost" size="sm" disabled={!active} onClick={() => p.onFiltersChange(EMPTY_FILTERS)}>Clear</Button>
          </div>
        </PopoverContent>
      </Popover>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Export" disabled={p.exporting}><Download className="h-4 w-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => p.onExport('png')}>Export as PNG</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => p.onExport('svg')}>Export as SVG</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Canvas settings"><Settings2 className="h-4 w-4" /></Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 space-y-3">
          <div className="space-y-1">
            <Label>Mouse wheel</Label>
            <ToggleGroup type="single" variant="outline" value={p.settings.wheelScheme} onValueChange={(v) => v && p.onSettingsChange({ wheelScheme: v as CanvasSettings['wheelScheme'] })}>
              <ToggleGroupItem value="whiteboard">Scroll pans</ToggleGroupItem>
              <ToggleGroupItem value="alternate">Scroll zooms</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="flex items-center justify-between"><Label htmlFor="set-snap">Snap to grid (hold Shift to invert)</Label><Switch id="set-snap" checked={p.settings.snap} onCheckedChange={(snap) => p.onSettingsChange({ snap })} /></div>
          <div className="flex items-center justify-between"><Label htmlFor="set-map">Minimap</Label><Switch id="set-map" checked={p.settings.minimap} onCheckedChange={(minimap) => p.onSettingsChange({ minimap })} /></div>
        </PopoverContent>
      </Popover>

      <Button variant="outline" size="icon" className="sm:w-auto sm:px-3" onClick={p.onSignOut} aria-label="Sign out">
        <LogOut className="h-4 w-4" /><span className="hidden sm:inline">Sign out</span>
      </Button>
    </header>
  );
}
