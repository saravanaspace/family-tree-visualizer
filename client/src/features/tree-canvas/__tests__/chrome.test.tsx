// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import type { FamilyMember, Relationship } from '@shared/schema';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LeftToolbar } from '../chrome/LeftToolbar';
import { TopBar } from '../chrome/TopBar';
import { ConnectPopover } from '../chrome/ConnectPopover';
import { ContextMenu } from '../chrome/ContextMenu';
import { DEFAULT_SETTINGS } from '../hooks/useCanvasSettings';
import { EMPTY_FILTERS } from '../lib/filter';

const m = (id: number, firstName: string) =>
  ({ id, firstName, middleName: null, lastName: null, gender: 'male', isLiving: true }) as FamilyMember;

const toolbarProps = () => ({
  canUndo: true, canRedo: false, selectedCount: 0, arranging: false,
  onAdd: vi.fn(), onConnect: vi.fn(), onArrange: vi.fn(), onUndo: vi.fn(), onRedo: vi.fn(), onAlign: vi.fn(), onDistribute: vi.fn(),
});

const topBarProps = () => ({
  view: 'tree' as const, onViewChange: vi.fn(), filters: EMPTY_FILTERS, onFiltersChange: vi.fn(),
  stats: { members: 8, generations: 4, couples: 2 }, settings: DEFAULT_SETTINGS, onSettingsChange: vi.fn(),
  onOpenPalette: vi.fn(), onExport: vi.fn(), exporting: false,
});

describe('LeftToolbar', () => {
  it('fires tool actions and reflects undo/redo availability', async () => {
    const p = toolbarProps();
    render(<TooltipProvider><LeftToolbar {...p} /></TooltipProvider>);
    await userEvent.click(screen.getByRole('button', { name: 'Add person' }));
    await userEvent.click(screen.getByRole('button', { name: 'Auto-arrange' }));
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(p.onAdd).toHaveBeenCalled();
    expect(p.onArrange).toHaveBeenCalled();
    expect(p.onUndo).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Redo' })).toBeDisabled();
  });

  it('shows align and distribute only for multi-selection, distribute needs three', async () => {
    const p = toolbarProps();
    const { rerender } = render(<TooltipProvider><LeftToolbar {...p} /></TooltipProvider>);
    expect(screen.queryByRole('button', { name: 'Align left' })).toBeNull();

    rerender(<TooltipProvider><LeftToolbar {...p} selectedCount={2} /></TooltipProvider>);
    await userEvent.click(screen.getByRole('button', { name: 'Align left' }));
    expect(p.onAlign).toHaveBeenCalledWith('left');
    expect(screen.getByRole('button', { name: 'Distribute horizontally' })).toBeDisabled();

    rerender(<TooltipProvider><LeftToolbar {...p} selectedCount={3} /></TooltipProvider>);
    await userEvent.click(screen.getByRole('button', { name: 'Distribute vertically' }));
    expect(p.onDistribute).toHaveBeenCalledWith('y');
  });

  it('disables arrange while arranging', () => {
    render(<TooltipProvider><LeftToolbar {...toolbarProps()} arranging /></TooltipProvider>);
    expect(screen.getByRole('button', { name: 'Auto-arrange' })).toBeDisabled();
  });

  it('has no axe violations', async () => {
    const { container } = render(<TooltipProvider><LeftToolbar {...toolbarProps()} selectedCount={3} /></TooltipProvider>);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('TopBar', () => {
  it('opens the palette and switches views', async () => {
    const p = topBarProps();
    render(<TopBar {...p} />);
    await userEvent.click(screen.getByRole('button', { name: /Search people or commands/ }));
    await userEvent.click(screen.getByRole('radio', { name: 'Timeline view' }));
    expect(p.onOpenPalette).toHaveBeenCalled();
    expect(p.onViewChange).toHaveBeenCalledWith('timeline');
  });

  it('edits filters and shows stats', async () => {
    const p = topBarProps();
    render(<TopBar {...p} />);
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
    expect(screen.getByText(/8 people · 4 generations · 2 couples/)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Name contains'), 'a');
    expect(p.onFiltersChange).toHaveBeenCalledWith({ ...EMPTY_FILTERS, query: 'a' });
    await userEvent.click(screen.getByRole('radio', { name: 'Deceased' }));
    expect(p.onFiltersChange).toHaveBeenCalledWith({ ...EMPTY_FILTERS, living: 'deceased' });
  });

  it('changes canvas settings', async () => {
    const p = topBarProps();
    render(<TopBar {...p} />);
    await userEvent.click(screen.getByRole('button', { name: 'Canvas settings' }));
    await userEvent.click(screen.getByRole('radio', { name: 'Scroll pans' }));
    await userEvent.click(screen.getByRole('switch', { name: /Snap to grid/ }));
    expect(p.onSettingsChange).toHaveBeenCalledWith({ wheelScheme: 'whiteboard' });
    expect(p.onSettingsChange).toHaveBeenCalledWith({ snap: true });
  });

  it('exports in the chosen format', async () => {
    const p = topBarProps();
    render(<TopBar {...p} />);
    await userEvent.click(screen.getByRole('button', { name: 'Export' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Export as SVG' }));
    expect(p.onExport).toHaveBeenCalledWith('svg');
  });

  it('has no axe violations', async () => {
    const { container } = render(<TopBar {...topBarProps()} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('ConnectPopover', () => {
  const members = [m(1, 'Ann'), m(2, 'Bob')];
  const parentChild = { fromMemberId: 1, toMemberId: 2, type: 'parent-child' } as Relationship;

  it('offers each relationship type and returns the choice', async () => {
    const onChoose = vi.fn();
    render(<ConnectPopover pending={{ from: 1, to: 2 }} members={members} relationships={[]} onChoose={onChoose} onCancel={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Ann and Bob are partners' }));
    expect(onChoose).toHaveBeenCalledWith({ from: 1, to: 2 }, 'spouse', undefined);
  });

  it('passes the chosen parent sub-type (default biological)', async () => {
    const onChoose = vi.fn();
    render(<ConnectPopover pending={{ from: 1, to: 2 }} members={members} relationships={[]} onChoose={onChoose} onCancel={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Ann is a parent of Bob' }));
    expect(onChoose).toHaveBeenLastCalledWith({ from: 1, to: 2 }, 'parent-child', 'biological');
    await userEvent.click(screen.getByRole('radio', { name: 'foster' }));
    await userEvent.click(screen.getByRole('button', { name: 'Ann is a parent of Bob' }));
    expect(onChoose).toHaveBeenLastCalledWith({ from: 1, to: 2 }, 'parent-child', 'foster');
  });

  it('highlights the suggested type', () => {
    render(<ConnectPopover pending={{ from: 1, to: 2, defaultType: 'spouse' }} members={members} relationships={[]} onChoose={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Ann and Bob are partners' })).toHaveClass('bg-primary');
  });

  it('disables a type that already exists and explains why', () => {
    render(<ConnectPopover pending={{ from: 1, to: 2 }} members={members} relationships={[parentChild]} onChoose={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Ann is a parent of Bob' })).toBeDisabled();
    expect(screen.getByText(/already linked/)).toBeInTheDocument();
  });

  it('renders nothing without a pending link', () => {
    render(<ConnectPopover pending={null} members={members} relationships={[]} onChoose={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('cancels on Escape', async () => {
    const onCancel = vi.fn();
    render(<ConnectPopover pending={{ from: 1, to: 2 }} members={members} relationships={[]} onChoose={vi.fn()} onCancel={onCancel} />);
    await userEvent.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalled();
  });
});

describe('ContextMenu', () => {
  it('runs an item and closes', async () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(<ContextMenu state={{ x: 10, y: 10, items: [{ label: 'Edit', onSelect }, { label: 'Delete', destructive: true, onSelect: vi.fn() }] }} onClose={onClose} />);
    const menu = screen.getByRole('menu');
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Edit' }));
    expect(onClose).toHaveBeenCalled();
    expect(onSelect).toHaveBeenCalled();
  });

  it('closes on Escape and outside click, and renders nothing when null', async () => {
    const onClose = vi.fn();
    const { rerender } = render(<ContextMenu state={{ x: 0, y: 0, items: [{ label: 'A', onSelect: vi.fn() }] }} onClose={onClose} />);
    await userEvent.keyboard('{Escape}');
    await userEvent.click(document.body);
    expect(onClose).toHaveBeenCalledTimes(2);
    rerender(<ContextMenu state={null} onClose={onClose} />);
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
