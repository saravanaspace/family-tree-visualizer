// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import type { FamilyMember } from '@shared/schema';

let zoom = 1;
vi.mock('@xyflow/react', async (orig) => ({
  ...(await orig<typeof import('@xyflow/react')>()),
  useStore: (selector: (s: unknown) => unknown) => selector({ transform: [0, 0, zoom] }),
  Handle: ({ id }: { id: string }) => <span data-handle={id} />,
  NodeToolbar: ({ children, isVisible }: any) => (isVisible ? <div role="toolbar" aria-label="Quick actions">{children}</div> : null),
}));

import { PersonNode, fullName, lifespan } from '../nodes/PersonNode';
import { CanvasActionsContext, type CanvasActions } from '../hooks/canvasActions';

const member = (over: Partial<FamilyMember> = {}) =>
  ({
    id: 1, firstName: 'Ada', middleName: null, lastName: 'Lovelace', gender: 'female', isLiving: false,
    birthDate: '1815-12-10', deathDate: '1852-11-27', birthPlace: 'London', occupation: 'Mathematician', photoUrl: null, ...over,
  }) as FamilyMember;

const actions = (): CanvasActions => ({
  onQuickAdd: vi.fn(), onEditMember: vi.fn(), onDeleteMember: vi.fn(), onToggleCollapse: vi.fn(),
  onFocusMember: vi.fn(), onDeleteEdge: vi.fn(), onUpdateEdge: vi.fn(),
});

function renderNode(over: { member?: Partial<FamilyMember>; selected?: boolean; collapsed?: boolean; hasChildren?: boolean; hiddenCount?: number; dimmed?: boolean } = {}, a = actions()) {
  const props = {
    id: 'm:1', selected: over.selected ?? false,
    data: { member: member(over.member), dimmed: over.dimmed ?? false, collapsed: over.collapsed ?? false, hiddenCount: over.hiddenCount ?? 0, hasChildren: over.hasChildren ?? false },
  } as any;
  const view = render(<CanvasActionsContext.Provider value={a}><PersonNode {...props} /></CanvasActionsContext.Provider>);
  return { a, ...view };
}

beforeEach(() => { zoom = 1; });

describe('formatting helpers', () => {
  it('builds names and lifespans', () => {
    expect(fullName(member({ middleName: 'Byron' }))).toBe('Ada Byron Lovelace');
    expect(lifespan(member())).toBe('1815 – 1852');
    expect(lifespan(member({ isLiving: true, deathDate: null }))).toBe('1815 –');
    expect(lifespan(member({ birthDate: null, deathDate: null }))).toBe('Deceased');
  });
});

describe('PersonNode detail levels', () => {
  it('shows only the name when zoomed far out', () => {
    zoom = 0.2;
    renderNode();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.queryByText('1815 – 1852')).toBeNull();
  });

  it('shows name and lifespan at normal zoom, without extra details', () => {
    zoom = 0.7;
    renderNode();
    expect(screen.getByText('1815 – 1852')).toBeInTheDocument();
    expect(screen.queryByText('London')).toBeNull();
  });

  it('shows place and occupation when zoomed in', () => {
    zoom = 2;
    renderNode();
    expect(screen.getByText('London')).toBeInTheDocument();
    expect(screen.getByText('Mathematician')).toBeInTheDocument();
  });

  it('clamps very long names to the card instead of overflowing', () => {
    renderNode({ member: { firstName: 'A'.repeat(300) } });
    expect(screen.getByRole('heading')).toHaveClass('line-clamp-2');
  });

  it('dims non-matching people', () => {
    renderNode({ dimmed: true });
    expect(screen.getByTestId('person-1')).toHaveClass('opacity-30');
  });

  it('exposes four connection handles', () => {
    const { container } = renderNode();
    expect(Array.from(container.querySelectorAll('[data-handle]')).map((h) => h.getAttribute('data-handle')).sort())
      .toEqual(['bottom', 'left', 'right', 'top']);
  });
});

describe('PersonNode interactions', () => {
  it('shows quick actions only when selected and wires them up', async () => {
    const { a, rerender } = renderNode();
    expect(screen.queryByRole('toolbar')).toBeNull();
    rerender(<CanvasActionsContext.Provider value={a}><PersonNode {...({ id: 'm:1', selected: true, data: { member: member(), dimmed: false, collapsed: false, hiddenCount: 0, hasChildren: false } } as any)} /></CanvasActionsContext.Provider>);
    await userEvent.click(screen.getByRole('button', { name: 'Add Child of Ada Lovelace' }));
    await userEvent.click(screen.getByRole('button', { name: 'Edit Ada Lovelace' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete Ada Lovelace' }));
    expect(a.onQuickAdd).toHaveBeenCalledWith('child', 1);
    expect(a.onEditMember).toHaveBeenCalledWith(1);
    expect(a.onDeleteMember).toHaveBeenCalledWith(1);
  });

  it('offers collapse only for people with children, and reports hidden count', async () => {
    const none = renderNode();
    expect(screen.queryByRole('button', { name: /descendants/ })).toBeNull();
    none.unmount();

    const { a } = renderNode({ hasChildren: true, collapsed: true, hiddenCount: 3 });
    const btn = screen.getByRole('button', { name: 'Expand descendants of Ada Lovelace' });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    expect(btn).toHaveTextContent('+3');
    await userEvent.click(btn);
    expect(a.onToggleCollapse).toHaveBeenCalledWith(1);
  });

  it('has no axe violations in the selected state', async () => {
    const { container } = renderNode({ selected: true, hasChildren: true });
    expect(await axe(container, { rules: { region: { enabled: false } } })).toHaveNoViolations();
  });
});
