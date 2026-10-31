// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import type { FamilyMember, FamilyTreeData, Relationship } from '@shared/schema';

let rfProps: any;
vi.mock('@xyflow/react', async (orig) => ({
  ...(await orig<typeof import('@xyflow/react')>()),
  ReactFlow: (props: any) => { rfProps = props; return <div data-testid="rf" />; },
  Background: () => null,
  MiniMap: () => null,
}));

import { TreeCanvas, toPositions, type TreeCanvasProps } from '../TreeCanvas';
import { DEFAULT_SETTINGS } from '../hooks/useCanvasSettings';

const m = (id: number, x = 0, y = 0) =>
  ({ id, firstName: `P${id}`, middleName: null, lastName: null, gender: 'male', isLiving: true, x, y }) as FamilyMember;
const rel = (id: number, from: number, to: number, type: string) =>
  ({ id, fromMemberId: from, toMemberId: to, type, status: 'active', subType: null, startDate: null }) as Relationship;

const tree: FamilyTreeData = {
  members: [m(1), m(2, 300), m(3, 0, 200)],
  relationships: [rel(1, 1, 3, 'parent-child')],
  events: [],
} as FamilyTreeData;

function setup(over: Partial<TreeCanvasProps> = {}) {
  const props: TreeCanvasProps = {
    tree, settings: DEFAULT_SETTINGS, collapsed: new Set(), highlightIds: null, initialViewport: null,
    onMovePositions: vi.fn(), onConnectMembers: vi.fn(), onConnectToEmpty: vi.fn(), onInvalidLink: vi.fn(),
    onSelectMembers: vi.fn(), onViewportChange: vi.fn(), screenToFlow: (p) => p,
    ...over,
  };
  render(<TreeCanvas {...props} />);
  return props;
}

describe('toPositions', () => {
  it('rounds person nodes and skips junctions', () => {
    expect(toPositions([
      { id: 'm:4', type: 'person', position: { x: 10.6, y: -3.2 } },
      { id: 'u:9', type: 'union', position: { x: 1, y: 1 } },
    ])).toEqual([{ id: 4, x: 11, y: -3 }]);
  });
});

describe('TreeCanvas', () => {
  beforeEach(() => { rfProps = undefined; });

  it('reports a multi-card drag as one batch', () => {
    const p = setup();
    const dragged = [
      { id: 'm:1', type: 'person', position: { x: 5, y: 6 } },
      { id: 'm:2', type: 'person', position: { x: 305, y: 6 } },
    ];
    rfProps.onNodeDragStop({}, dragged[0], dragged);
    expect(p.onMovePositions).toHaveBeenCalledTimes(1);
    expect(p.onMovePositions).toHaveBeenCalledWith(
      [{ id: 1, x: 5, y: 6 }, { id: 2, x: 305, y: 6 }], 'Move people');
  });

  it('reports a marquee-selection drag as one batch too', () => {
    const p = setup();
    rfProps.onSelectionDragStop({}, [{ id: 'm:3', type: 'person', position: { x: 1, y: 2 } }]);
    expect(p.onMovePositions).toHaveBeenCalledWith([{ id: 3, x: 1, y: 2 }], 'Move people');
  });

  it('renders member nodes, junction nodes only for couples, and loose connection mode', () => {
    setup({ tree: { ...tree, relationships: [...tree.relationships, rel(2, 1, 2, 'spouse')] } as FamilyTreeData });
    expect(rfProps.nodes.filter((n: any) => n.type === 'person')).toHaveLength(3);
    expect(rfProps.nodes.filter((n: any) => n.type === 'union')).toHaveLength(1);
    expect(rfProps.connectionMode).toBe('loose');
  });

  it('applies the wheel scheme', () => {
    setup();
    expect(rfProps.zoomOnScroll).toBe(true);
    expect(rfProps.panOnScroll).toBe(false);
    setup({ settings: { ...DEFAULT_SETTINGS, wheelScheme: 'whiteboard' } });
    expect(rfProps.panOnScroll).toBe(true);
  });

  it('pans on drag by default, with Shift for box selection', () => {
    setup();
    expect(rfProps.panOnDrag).toBe(true);
    expect(rfProps.selectionKeyCode).toBe('Shift');
  });

  it('inverts snapping while Shift is held', () => {
    setup({ settings: { ...DEFAULT_SETTINGS, snap: true }, shiftHeld: true });
    expect(rfProps.snapToGrid).toBe(false);
    setup({ settings: { ...DEFAULT_SETTINGS, snap: false }, shiftHeld: true });
    expect(rfProps.snapToGrid).toBe(true);
  });

  it('opens a connection for a valid link', () => {
    const p = setup();
    rfProps.onConnect({ source: 'm:1', target: 'm:2', sourceHandle: null, targetHandle: null });
    expect(p.onConnectMembers).toHaveBeenCalledWith(1, 2);
  });

  it('uses the starting handle to suggest the link type and direction', () => {
    const p = setup();
    rfProps.onConnect({ source: 'm:2', target: 'm:1', sourceHandle: 'bottom', targetHandle: 'top' });
    expect(p.onConnectMembers).toHaveBeenLastCalledWith(2, 1, 'parent-child');
    rfProps.onConnect({ source: 'm:2', target: 'm:1', sourceHandle: 'top', targetHandle: 'bottom' });
    expect(p.onConnectMembers).toHaveBeenLastCalledWith(1, 2, 'parent-child');
    rfProps.onConnect({ source: 'm:2', target: 'm:1', sourceHandle: 'right', targetHandle: 'left' });
    expect(p.onConnectMembers).toHaveBeenLastCalledWith(2, 1, 'spouse');
  });

  it('explains an invalid drop on another card', () => {
    const p = setup();
    rfProps.onConnectEnd({ target: document.body, clientX: 0, clientY: 0 }, { isValid: false, fromNode: { id: 'm:1' }, toNode: { id: 'm:1' } });
    expect(p.onInvalidLink).toHaveBeenCalledWith(expect.stringMatching(/themselves/));
    rfProps.onConnectEnd({ target: document.body, clientX: 0, clientY: 0 }, { isValid: false, fromNode: { id: 'm:1' }, toNode: { id: 'm:3' } });
    expect(p.onInvalidLink).toHaveBeenCalledTimes(2);
    expect(p.onConnectToEmpty).not.toHaveBeenCalled();
  });

  it('rejects self links and cycles with a reason', () => {
    const p = setup();
    expect(rfProps.isValidConnection({ source: 'm:1', target: 'm:1' })).toBe(false);
    rfProps.onConnect({ source: 'm:1', target: 'm:1' });
    expect(p.onInvalidLink).toHaveBeenCalledWith(expect.stringMatching(/themselves/));
    expect(p.onConnectMembers).not.toHaveBeenCalled();
    // 3 is already 1's child; 3 -> 1 as parent-child would loop, and spouse is still allowed
    expect(rfProps.isValidConnection({ source: 'm:3', target: 'm:1' })).toBe(true);
  });

  it('offers add-person when a connection is released on empty canvas', () => {
    const p = setup();
    const event = { target: document.body, clientX: 40, clientY: 50 } as unknown as MouseEvent;
    rfProps.onConnectEnd(event, { isValid: false, fromNode: { id: 'm:2' } });
    expect(p.onConnectToEmpty).toHaveBeenCalledWith(2, { x: 40, y: 50 });
  });

  it('does not offer add-person when the connection ended on a valid target', () => {
    const p = setup();
    rfProps.onConnectEnd({ target: document.body, clientX: 0, clientY: 0 }, { isValid: true, fromNode: { id: 'm:2' } });
    expect(p.onConnectToEmpty).not.toHaveBeenCalled();
  });

  it('persists the viewport when a move ends', () => {
    const p = setup();
    rfProps.onMoveEnd({}, { x: 1, y: 2, zoom: 1 });
    expect(p.onViewportChange).toHaveBeenCalledWith({ x: 1, y: 2, zoom: 1 });
  });
});
