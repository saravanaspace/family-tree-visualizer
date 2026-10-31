import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ReactFlowProvider, useReactFlow } from '@xyflow/react';
import { Loader2, TreePine, UserPlus } from 'lucide-react';
import type { FamilyMember, FamilyTreeData } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import AddMemberModal from '@/components/add-member-modal';
import EditMemberModal from '@/components/edit-member-modal';
import ConnectMembersModal from '@/components/connect-members-modal';
import TimelineView from '@/components/timeline-view';
import { TreeCanvas } from './TreeCanvas';
import { ZoomPanel, animDuration } from './chrome/ZoomPanel';
import { TopBar } from './chrome/TopBar';
import { LeftToolbar } from './chrome/LeftToolbar';
import { CommandPalette } from './chrome/CommandPalette';
import { InspectorPanel } from './chrome/InspectorPanel';
import { ConnectPopover, type PendingLink, type SubType } from './chrome/ConnectPopover';
import { ContextMenu, type ContextMenuState } from './chrome/ContextMenu';
import { CanvasActionsContext, type CanvasActions, type QuickAddKind } from './hooks/canvasActions';
import { useTreeActions } from './hooks/useTreeActions';
import { useCanvasSettings } from './hooks/useCanvasSettings';
import { useViewportPersist } from './hooks/useViewportPersist';
import { useCollapsed } from './hooks/useCollapsed';
import { useExport } from './hooks/useExport';
import { useTreeShortcuts } from './hooks/useTreeShortcuts';
import { alignBoxes, distributeBoxes, type AlignMode } from './lib/align';
import { EMPTY_FILTERS, highlightFromFilters, treeStats, type TreeFilters } from './lib/filter';
import { focusSet } from './lib/focus';
import { CARD_SIZE, NUDGE } from './lib/constants';
import { memberNodeId } from './lib/toFlow';
import { fullName } from './nodes/PersonNode';
import type { LinkType } from './lib/validateLink';

const NUDGE_DEBOUNCE_MS = 300;
const ADD_TYPE: Record<QuickAddKind, string> = {
  parent: 'parent-biological',
  child: 'child-biological',
  partner: 'spouse',
};

function Workspace({ tree }: { tree: FamilyTreeData }) {
  const { toast } = useToast();
  const rf = useReactFlow();
  const actions = useTreeActions(tree);
  const { settings, update: updateSettings } = useCanvasSettings();
  const { saved, save: saveViewport } = useViewportPersist();
  const { collapsed, toggle: toggleCollapsed } = useCollapsed();

  const [view, setView] = useState<'tree' | 'timeline'>('tree');
  const [filters, setFilters] = useState<TreeFilters>(EMPTY_FILTERS);
  const [focusId, setFocusId] = useState<number | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [inspectId, setInspectId] = useState<number | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [add, setAdd] = useState<{ type: string; relatedId: number | null; at: { x: number; y: number } | null } | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [connectOpen, setConnectOpen] = useState(false);
  const [pending, setPending] = useState<PendingLink | null>(null);
  const [menu, setMenu] = useState<ContextMenuState | null>(null);
  const [arranging, setArranging] = useState(false);
  const [shiftHeld, setShiftHeld] = useState(false);
  const [nudged, setNudged] = useState<Map<number, { dx: number; dy: number }>>(new Map());
  const nudgeTimer = useRef<ReturnType<typeof setTimeout>>();
  const nudgeRef = useRef(nudged);
  nudgeRef.current = nudged;

  const { exportTree, exporting } = useExport(rf.getNodes);

  const byId = useMemo(() => new Map(tree.members.map((m) => [m.id, m])), [tree.members]);

  // Keyboard nudges show immediately but are saved as one batch after the debounce.
  const displayTree = useMemo<FamilyTreeData>(() => (nudged.size === 0 ? tree : {
    ...tree,
    members: tree.members.map((m) => {
      const n = nudged.get(m.id);
      return n ? { ...m, x: m.x + n.dx, y: m.y + n.dy } : m;
    }),
  }), [tree, nudged]);

  const highlightIds = useMemo(
    () => (focusId !== null ? focusSet(focusId, tree.relationships) : highlightFromFilters(tree.members, filters)),
    [focusId, filters, tree],
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => e.key === 'Shift' && setShiftHeld(true);
    const up = (e: KeyboardEvent) => e.key === 'Shift' && setShiftHeld(false);
    const blur = () => setShiftHeld(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);

  useEffect(() => () => clearTimeout(nudgeTimer.current), []);

  const openAdd = useCallback((type: string, relatedId: number | null = null, at: { x: number; y: number } | null = null) =>
    setAdd({ type, relatedId, at }), []);

  const focusMember = useCallback((id: number) => {
    const m = byId.get(id);
    if (!m) return;
    rf.setCenter(m.x + 128, m.y + 64, { zoom: Math.max(rf.getZoom(), 1), duration: animDuration() });
    setSelected([id]);
    rf.setNodes((ns) => ns.map((n) => ({ ...n, selected: n.id === memberNodeId(id) })));
  }, [byId, rf]);

  const selectedBoxes = () => selected.flatMap((id) => {
    const m = displayTree.members.find((x) => x.id === id);
    return m ? [{ id, x: m.x, y: m.y }] : [];
  });

  const commitBoxes = (boxes: { id: number; x: number; y: number }[], label: string) =>
    void actions.movePositions(boxes.map((b) => ({ id: b.id, x: Math.round(b.x), y: Math.round(b.y) })), label);

  const deleteMembers = (ids: number[]) => {
    for (const id of ids) void actions.deleteMember(id);
    setSelected([]);
    if (ids.includes(inspectId ?? -1)) setInspectId(null);
  };

  const nudgeSelected = (dx: number, dy: number) => {
    if (!selected.length) return;
    setNudged((prev) => {
      const next = new Map(prev);
      for (const id of selected) {
        const cur = next.get(id) ?? { dx: 0, dy: 0 };
        next.set(id, { dx: cur.dx + dx, dy: cur.dy + dy });
      }
      return next;
    });
    clearTimeout(nudgeTimer.current);
    nudgeTimer.current = setTimeout(async () => {
      const offsets = nudgeRef.current;
      const boxes = Array.from(offsets, ([id, o]) => {
        const m = byId.get(id);
        return m ? { id, x: m.x + o.dx, y: m.y + o.dy } : null;
      }).filter((b): b is { id: number; x: number; y: number } => b !== null);
      await actions.movePositions(boxes.map((b) => ({ id: b.id, x: Math.round(b.x), y: Math.round(b.y) })), 'Nudge');
      setNudged(new Map());
    }, NUDGE_DEBOUNCE_MS);
  };

  // Legacy or imported coordinates can stack cards on top of each other; tidy them once on first load.
  const autoTidied = useRef(false);
  useEffect(() => {
    if (autoTidied.current || tree.members.length < 2) return;
    autoTidied.current = true;
    const { width, height } = CARD_SIZE;
    const ms = tree.members;
    const overlaps = ms.some((a, i) => ms.slice(i + 1).some((b) => Math.abs(a.x - b.x) < width && Math.abs(a.y - b.y) < height));
    if (overlaps) void arrange();
  }, [tree.members]);

  const arrange = async () => {
    setArranging(true);
    try {
      if (await actions.autoArrange()) {
        window.setTimeout(() => rf.fitView({ padding: 0.2, maxZoom: 1, duration: animDuration(400) }), 50);
      }
    } finally {
      setArranging(false);
    }
  };

  useTreeShortcuts((action) => {
    if (view !== 'tree') return;
    if (action === 'palette') setPaletteOpen(true);
    else if (action === 'fit') rf.fitView({ padding: 0.2, maxZoom: 1, duration: animDuration() });
    else if (action === 'reset-zoom') rf.zoomTo(1, { duration: animDuration(150) });
    else if (action === 'open-inspector') selected[0] !== undefined && setInspectId(selected[0]);
    else if (action === 'delete') deleteMembers(selected);
    else if (action === 'undo') void actions.undoRedo.undo();
    else if (action === 'redo') void actions.undoRedo.redo();
    else nudgeSelected(action.dx, action.dy);
  }, !add && !editId && !connectOpen && !pending && !paletteOpen);

  const canvasActions = useMemo<CanvasActions>(() => ({
    onQuickAdd: (kind, id) => {
      const m = byId.get(id);
      const offset = kind === 'child' ? { x: 0, y: 220 } : kind === 'parent' ? { x: 0, y: -220 } : { x: 300, y: 0 };
      openAdd(ADD_TYPE[kind], id, m ? { x: m.x + offset.x, y: m.y + offset.y } : null);
    },
    onEditMember: setEditId,
    onDeleteMember: (id) => void actions.deleteMember(id),
    onToggleCollapse: toggleCollapsed,
    onFocusMember: (id) => setFocusId((cur) => (cur === id ? null : id)),
    onDeleteEdge: (ids) => void actions.deleteRelationships(ids),
    onUpdateEdge: (ids, data) => void actions.updateRelationship(ids, data as Parameters<typeof actions.updateRelationship>[1]),
  }), [byId, actions, openAdd, toggleCollapsed]);

  const chooseLink = async (link: PendingLink, type: LinkType, subType?: SubType) => {
    setPending(null);
    await actions.createRelationship({
      fromMemberId: link.from,
      toMemberId: link.to,
      type,
      ...(subType ? { subType } : {}),
      status: 'active',
    } as Parameters<typeof actions.createRelationship>[0]);
  };

  const memberMenu = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    setMenu({
      x: e.clientX, y: e.clientY,
      items: [
        { label: 'Open details', onSelect: () => setInspectId(id) },
        { label: 'Edit', onSelect: () => setEditId(id) },
        { label: 'Add child', onSelect: () => canvasActions.onQuickAdd('child', id) },
        { label: 'Add partner', onSelect: () => canvasActions.onQuickAdd('partner', id) },
        { label: 'Add parent', onSelect: () => canvasActions.onQuickAdd('parent', id) },
        { label: focusId === id ? 'Clear focus' : 'Focus on branch', onSelect: () => canvasActions.onFocusMember(id) },
        { label: 'Delete', destructive: true, separatorBefore: true, onSelect: () => void actions.deleteMember(id) },
      ],
    });
  };

  const paneMenu = (e: React.MouseEvent | MouseEvent) => {
    e.preventDefault();
    const at = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    setMenu({
      x: e.clientX, y: e.clientY,
      items: [
        { label: 'Add person here', onSelect: () => openAdd('', null, at) },
        { label: 'Auto-arrange', onSelect: () => void arrange() },
        { label: 'Fit to screen', onSelect: () => rf.fitView({ padding: 0.2, maxZoom: 1, duration: animDuration() }) },
      ],
    });
  };

  const inspected: FamilyMember | null = inspectId !== null ? byId.get(inspectId) ?? null : null;
  const editing: FamilyMember | null = editId !== null ? byId.get(editId) ?? null : null;

  const commands = [
    { id: 'add', label: 'Add person', run: () => openAdd('') },
    { id: 'connect', label: 'Connect people', run: () => setConnectOpen(true) },
    { id: 'arrange', label: 'Auto-arrange', run: () => void arrange() },
    { id: 'fit', label: 'Fit to screen', run: () => rf.fitView({ padding: 0.2, maxZoom: 1, duration: animDuration() }) },
    { id: 'png', label: 'Export as PNG', run: () => void doExport('png') },
    { id: 'svg', label: 'Export as SVG', run: () => void doExport('svg') },
  ];

  const doExport = async (format: 'png' | 'svg') => {
    try {
      await exportTree(format);
    } catch (error) {
      toast({ title: 'Export failed', description: error instanceof Error ? error.message : 'Unknown error', variant: 'destructive' });
    }
  };

  return (
    <CanvasActionsContext.Provider value={canvasActions}>
      <TooltipProvider delayDuration={300}>
        <div className="relative h-screen w-full overflow-hidden bg-background">
          {view === 'tree' ? (
            tree.members.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <TreePine className="h-12 w-12 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Start your family tree</h2>
                <p className="max-w-sm text-sm text-muted-foreground">Add the first person, then grow the tree from their card.</p>
                <Button onClick={() => openAdd('')}><UserPlus className="mr-2 h-4 w-4" />Add first person</Button>
              </div>
            ) : (
              <TreeCanvas
                tree={displayTree}
                settings={settings}
                collapsed={collapsed}
                highlightIds={highlightIds}
                initialViewport={saved}
                shiftHeld={shiftHeld}
                screenToFlow={rf.screenToFlowPosition}
                onMovePositions={(p, label) => void actions.movePositions(p, label)}
                onConnectMembers={(from, to, defaultType) => setPending({ from, to, defaultType })}
                onConnectToEmpty={(from, at) => openAdd(ADD_TYPE.child, from, at)}
                onInvalidLink={(reason) => toast({ title: "Can't connect", description: reason, variant: 'destructive' })}
                onSelectMembers={setSelected}
                onViewportChange={saveViewport}
                onNodeContextMenu={memberMenu}
                onPaneContextMenu={paneMenu}
              />
            )
          ) : (
            <div className="h-full overflow-auto pt-16"><TimelineView familyTree={tree} /></div>
          )}

          <TopBar
            view={view}
            onViewChange={setView}
            filters={filters}
            onFiltersChange={setFilters}
            stats={treeStats(tree)}
            settings={settings}
            onSettingsChange={updateSettings}
            onOpenPalette={() => setPaletteOpen(true)}
            onExport={(f) => void doExport(f)}
            exporting={exporting}
          />
          {view === 'tree' && (
            <>
              <LeftToolbar
                canUndo={actions.undoRedo.canUndo}
                canRedo={actions.undoRedo.canRedo}
                undoLabel={actions.undoRedo.undoLabel}
                redoLabel={actions.undoRedo.redoLabel}
                selectedCount={selected.length}
                arranging={arranging}
                onAdd={() => openAdd('')}
                onConnect={() => setConnectOpen(true)}
                onArrange={() => void arrange()}
                onUndo={() => void actions.undoRedo.undo()}
                onRedo={() => void actions.undoRedo.redo()}
                onAlign={(mode: AlignMode) => commitBoxes(alignBoxes(selectedBoxes(), mode), 'Align')}
                onDistribute={(axis) => commitBoxes(distributeBoxes(selectedBoxes(), axis), 'Distribute')}
              />
              <ZoomPanel />
              {focusId !== null && (
                <Button className="absolute left-1/2 top-16 z-10 -translate-x-1/2" size="sm" onClick={() => setFocusId(null)}>
                  Focused on {byId.get(focusId) ? fullName(byId.get(focusId)!) : 'branch'} · Clear
                </Button>
              )}
            </>
          )}

          <div className="sr-only" role="status" aria-live="polite">
            {selected.length ? `${selected.length} selected` : ''}
          </div>
        </div>

        <ContextMenu state={menu} onClose={() => setMenu(null)} />
        <CommandPalette
          open={paletteOpen}
          onOpenChange={setPaletteOpen}
          members={tree.members}
          commands={commands}
          onSelectMember={(id) => { setView('tree'); setInspectId(id); window.setTimeout(() => focusMember(id), 0); }}
        />
        <InspectorPanel
          member={inspected}
          onClose={() => setInspectId(null)}
          onEdit={setEditId}
          onDelete={(id) => { setInspectId(null); void actions.deleteMember(id); }}
          onFocus={(id) => setFocusId(id)}
          onAdd={(kind, id) => canvasActions.onQuickAdd(kind, id)}
        />
        <ConnectPopover
          pending={pending}
          members={tree.members}
          relationships={tree.relationships}
          onChoose={(link, type, sub) => void chooseLink(link, type, sub)}
          onCancel={() => setPending(null)}
        />
        <AddMemberModal
          open={add !== null}
          onOpenChange={(o) => !o && setAdd(null)}
          memberType={add?.type ?? ''}
          relatedMemberId={add?.relatedId ?? null}
          initialPosition={add?.at}
          onCreated={actions.registerCreated}
        />
        <EditMemberModal open={editing !== null} onOpenChange={(o) => !o && setEditId(null)} member={editing} />
        <ConnectMembersModal open={connectOpen} onOpenChange={setConnectOpen} familyTree={tree} />
      </TooltipProvider>
    </CanvasActionsContext.Provider>
  );
}

export function TreeWorkspace({ tree, isLoading, error }: { tree: FamilyTreeData | undefined; isLoading: boolean; error?: unknown }) {
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center" role="status"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading family tree…</div>;
  }
  if (!tree) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3" role="alert">
        <p className="font-medium">Could not load the family tree.</p>
        {error instanceof Error && <p className="text-sm text-muted-foreground">{error.message}</p>}
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }
  return (
    <ReactFlowProvider>
      <Workspace tree={tree} />
    </ReactFlowProvider>
  );
}
