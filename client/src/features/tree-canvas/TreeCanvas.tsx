import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  ReactFlow,
  ViewportPortal,
  applyNodeChanges,
  type Connection,
  type Node,
  type NodeChange,
  type OnConnectEnd,
  type Viewport,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { FamilyTreeData } from '@shared/schema';
import { PersonNode } from './nodes/PersonNode';
import { UnionNode } from './nodes/UnionNode';
import { RelationshipEdge } from './edges/RelationshipEdge';
import { toFlow, withUnionPositions, memberIdFromNode, type FlowNode } from './lib/toFlow';
import { validateLink, type LinkType } from './lib/validateLink';
import { findGuides, type Guides } from './lib/guides';
import { ConnectionLine } from './edges/ConnectionLine';
import { useLongPress } from './hooks/useLongPress';
import { SNAP_GRID, ZOOM } from './lib/constants';
import type { CanvasSettings } from './hooks/useCanvasSettings';
import type { Position } from './lib/api';

const nodeTypes = { person: PersonNode, union: UnionNode };
const edgeTypes = { relationship: RelationshipEdge };
const INVALID_LINK = 'These people are already linked, or the link would create a loop';

export interface TreeCanvasProps {
  tree: FamilyTreeData;
  settings: CanvasSettings;
  collapsed: ReadonlySet<number>;
  highlightIds: ReadonlySet<number> | null;
  initialViewport: Viewport | null;
  onMovePositions: (positions: Position[], label: string) => void;
  onConnectMembers: (fromId: number, toId: number, defaultType?: LinkType) => void;
  onConnectToEmpty: (fromId: number, at: { x: number; y: number }) => void;
  onInvalidLink: (reason: string) => void;
  onSelectMembers: (ids: number[]) => void;
  onViewportChange: (viewport: Viewport) => void;
  onNodeContextMenu?: (event: React.MouseEvent, memberId: number) => void;
  onPaneContextMenu?: (event: React.MouseEvent | MouseEvent) => void;
  screenToFlow: (point: { x: number; y: number }) => { x: number; y: number };
  shiftHeld?: boolean;
}

export const isPerson = (n: Node): n is FlowNode => n.type === 'person';

export function toPositions(nodes: ReadonlyArray<Pick<Node, 'id' | 'type' | 'position'>>): Position[] {
  const out: Position[] = [];
  for (const n of nodes) {
    const id = memberIdFromNode(n.id);
    if (id === null || n.type === 'union') continue;
    out.push({ id, x: Math.round(n.position.x), y: Math.round(n.position.y) });
  }
  return out;
}

function TreeCanvasInner(props: TreeCanvasProps) {
  const { tree, settings, collapsed, highlightIds } = props;
  const flow = useMemo(() => toFlow(tree, { collapsed, highlightIds }), [tree, collapsed, highlightIds]);
  const [nodes, setNodes] = useState<FlowNode[]>(flow.nodes);
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  // Re-derive from server data while preserving local selection.
  useEffect(() => {
    setNodes((prev) => {
      const selected = new Set(prev.filter((n) => n.selected).map((n) => n.id));
      return flow.nodes.map((n) => (selected.has(n.id) ? { ...n, selected: true } : n));
    });
  }, [flow.nodes]);

  const onNodesChange = useCallback((changes: NodeChange<FlowNode>[]) => {
    setNodes((prev) => {
      const next = applyNodeChanges(changes, prev);
      return changes.some((c) => c.type === 'position') ? withUnionPositions(next) : next;
    });
  }, []);

  const [guides, setGuides] = useState<Guides>({});

  const handleDrag = useCallback((_: unknown, node: Node) => {
    const id = memberIdFromNode(node.id);
    if (id === null) return;
    const others = toPositions(nodesRef.current.filter((n) => n.id !== node.id));
    const next = findGuides({ id, x: node.position.x, y: node.position.y }, others);
    setGuides((prev) => (prev.x === next.x && prev.y === next.y ? prev : next));
  }, []);

  const handleDragStop = useCallback((_: unknown, __: Node, dragged: Node[]) => {
    setGuides({});
    const positions = toPositions(dragged);
    if (positions.length) props.onMovePositions(positions, positions.length > 1 ? 'Move people' : 'Move person');
  }, [props.onMovePositions]);

  const handleSelectionDragStop = useCallback((_: unknown, dragged: Node[]) => {
    const positions = toPositions(dragged);
    if (positions.length) props.onMovePositions(positions, 'Move people');
  }, [props.onMovePositions]);

  const isValidConnection = useCallback((c: { source: string | null; target: string | null }) => {
    const from = c.source ? memberIdFromNode(c.source) : null;
    const to = c.target ? memberIdFromNode(c.target) : null;
    if (from === null || to === null) return false;
    return validateLink(tree.relationships, from, to, 'parent-child').ok
      || validateLink(tree.relationships, from, to, 'spouse').ok;
  }, [tree.relationships]);

  const onConnect = useCallback((c: Connection) => {
    const from = c.source ? memberIdFromNode(c.source) : null;
    const to = c.target ? memberIdFromNode(c.target) : null;
    if (from === null || to === null) return;
    if (from === to) return props.onInvalidLink('A person cannot be linked to themselves');
    if (!isValidConnection(c)) return props.onInvalidLink(INVALID_LINK);
    // The handle the drag started from hints at intent: bottom = parent, top = child, sides = partner.
    if (c.sourceHandle === 'top') return props.onConnectMembers(to, from, 'parent-child');
    if (c.sourceHandle === 'bottom') return props.onConnectMembers(from, to, 'parent-child');
    if (c.sourceHandle === 'left' || c.sourceHandle === 'right') return props.onConnectMembers(from, to, 'spouse');
    props.onConnectMembers(from, to);
  }, [isValidConnection, props.onConnectMembers, props.onInvalidLink]);

  const onConnectEnd: OnConnectEnd = useCallback((event, state) => {
    if (state.isValid || !state.fromNode) return;
    const from = memberIdFromNode(state.fromNode.id);
    if (from === null) return;
    if (state.toNode) {
      props.onInvalidLink(state.toNode.id === state.fromNode.id ? 'A person cannot be linked to themselves' : INVALID_LINK);
      return;
    }
    const e = 'changedTouches' in event ? event.changedTouches[0] : event;
    const target = (event.target as HTMLElement | null)?.closest?.('.react-flow__node');
    if (target) return;
    props.onConnectToEmpty(from, props.screenToFlow({ x: e.clientX, y: e.clientY }));
  }, [props.onConnectToEmpty, props.screenToFlow]);

  const alternate = settings.wheelScheme === 'alternate';
  const snap = settings.snap !== Boolean(props.shiftHeld);

  const longPress = useLongPress(({ x, y, target }) => {
    const el = (target as HTMLElement | null)?.closest?.('.react-flow__node');
    const synthetic = { clientX: x, clientY: y, preventDefault() {} } as unknown as React.MouseEvent;
    const memberId = el ? memberIdFromNode(el.getAttribute('data-id') ?? '') : null;
    if (memberId !== null) props.onNodeContextMenu?.(synthetic, memberId);
    else if (!(target as HTMLElement | null)?.closest?.('.react-flow__controls, .react-flow__minimap')) props.onPaneContextMenu?.(synthetic);
  });

  return (
    <div className="h-full w-full" {...longPress}>
    <ReactFlow
      nodes={nodes}
      edges={flow.edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onNodeDrag={handleDrag}
      onNodeDragStop={handleDragStop}
      onSelectionDragStop={handleSelectionDragStop}
      onConnect={onConnect}
      onConnectEnd={onConnectEnd}
      isValidConnection={isValidConnection}
      connectionLineComponent={ConnectionLine}
      onSelectionChange={({ nodes: sel }) =>
        props.onSelectMembers(sel.map((n) => memberIdFromNode(n.id)).filter((id): id is number => id !== null))}
      onNodeContextMenu={(e, n) => {
        const id = memberIdFromNode(n.id);
        if (id !== null) props.onNodeContextMenu?.(e, id);
      }}
      onPaneContextMenu={props.onPaneContextMenu}
      onMoveEnd={(_, viewport) => props.onViewportChange(viewport)}
      connectionMode={ConnectionMode.Loose}
      minZoom={ZOOM.min}
      maxZoom={ZOOM.max}
      defaultViewport={props.initialViewport ?? undefined}
      fitView={!props.initialViewport}
      fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
      panOnScroll={!alternate}
      zoomOnScroll={alternate}
      zoomOnPinch
      panOnDrag
      panActivationKeyCode="Space"
      selectionKeyCode="Shift"
      multiSelectionKeyCode={['Meta', 'Control', 'Shift']}
      deleteKeyCode={null}
      snapToGrid={snap}
      snapGrid={[SNAP_GRID, SNAP_GRID]}
      onlyRenderVisibleElements={nodes.length > 150}
      proOptions={{ hideAttribution: true }}
      aria-label="Family tree canvas"
    >
      <ViewportPortal>
        {guides.x !== undefined && <div aria-hidden className="pointer-events-none absolute w-px bg-primary/60" style={{ left: guides.x, top: -100000, height: 200000 }} />}
        {guides.y !== undefined && <div aria-hidden className="pointer-events-none absolute h-px bg-primary/60" style={{ top: guides.y, left: -100000, width: 200000 }} />}
      </ViewportPortal>
      <Background variant={BackgroundVariant.Dots} gap={SNAP_GRID} size={1.2} />
      {settings.minimap && <MiniMap pannable zoomable className="!hidden md:!block" ariaLabel="Tree overview" />}
    </ReactFlow>
    </div>
  );
}

export const TreeCanvas = memo(TreeCanvasInner);
