// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import type { FamilyMember } from '@shared/schema';
import { CommandPalette } from '../chrome/CommandPalette';
import { InspectorPanel } from '../chrome/InspectorPanel';

const m = (id: number, firstName: string, over: Partial<FamilyMember> = {}) =>
  ({ id, firstName, middleName: null, lastName: 'Doe', gender: 'male', isLiving: true, birthDate: '1980-01-02', ...over }) as FamilyMember;
const members = [m(1, 'Ann'), m(2, 'Bob'), m(3, 'Cara')];

describe('CommandPalette', () => {
  const setup = () => {
    const p = { onOpenChange: vi.fn(), onSelectMember: vi.fn(), run: vi.fn() };
    render(
      <CommandPalette open onOpenChange={p.onOpenChange} members={members} onSelectMember={p.onSelectMember}
        commands={[{ id: 'arrange', label: 'Auto-arrange', run: p.run }]} />,
    );
    return p;
  };

  it('filters people as you type and selects one', async () => {
    const p = setup();
    await userEvent.type(screen.getByPlaceholderText(/Search people/), 'bob');
    expect(screen.queryByText('Ann Doe')).toBeNull();
    await userEvent.click(screen.getByText('Bob Doe'));
    expect(p.onSelectMember).toHaveBeenCalledWith(2);
    expect(p.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('runs commands (sidebar actions stay reachable)', async () => {
    const p = setup();
    await userEvent.click(screen.getByText('Auto-arrange'));
    expect(p.run).toHaveBeenCalled();
  });

  it('shows an empty state for no matches', async () => {
    setup();
    await userEvent.type(screen.getByPlaceholderText(/Search people/), 'zzzz');
    expect(screen.getByText('No results.')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    setup();
    expect(await axe(document.body, { rules: { region: { enabled: false } } })).toHaveNoViolations();
  });
});

describe('InspectorPanel', () => {
  const handlers = () => ({ onClose: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn(), onFocus: vi.fn(), onAdd: vi.fn() });

  it('renders nothing when no member is selected', () => {
    render(<InspectorPanel member={null} {...handlers()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows details and wires actions', async () => {
    const h = handlers();
    render(<InspectorPanel member={m(2, 'Bob', { occupation: 'Baker' })} {...h} />);
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Bob Doe');
    expect(screen.getByText('Baker')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Edit/ }));
    await userEvent.click(screen.getByRole('button', { name: /Child/ }));
    await userEvent.click(screen.getByRole('button', { name: /Delete/ }));
    expect(h.onEdit).toHaveBeenCalledWith(2);
    expect(h.onAdd).toHaveBeenCalledWith('child', 2);
    expect(h.onDelete).toHaveBeenCalledWith(2);
  });

  it('wraps very long text instead of overflowing', () => {
    render(<InspectorPanel member={m(2, 'Bob', { biography: 'x'.repeat(500) })} {...handlers()} />);
    expect(screen.getByText('x'.repeat(500))).toHaveClass('break-words');
  });

  it('has no axe violations', async () => {
    render(<InspectorPanel member={m(2, 'Bob')} {...handlers()} />);
    expect(await axe(document.body, { rules: { region: { enabled: false } } })).toHaveNoViolations();
  });
});
