import { useEffect, useState } from 'react';
import { DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import type { FamilyMember } from '@shared/schema';
import { fullName, lifespan } from '../nodes/PersonNode';

export interface PaletteCommand { id: string; label: string; run: () => void }

export function CommandPalette({
  open,
  onOpenChange,
  members,
  commands,
  onSelectMember,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: ReadonlyArray<FamilyMember>;
  commands: ReadonlyArray<PaletteCommand>;
  onSelectMember: (id: number) => void;
}) {
  const [query, setQuery] = useState('');
  useEffect(() => { if (!open) setQuery(''); }, [open]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <DialogTitle className="sr-only">Command palette</DialogTitle>
      <DialogDescription className="sr-only">Search people or run a canvas command</DialogDescription>
      <CommandInput placeholder="Search people or run a command…" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="People">
          {members.map((m) => (
            <CommandItem
              key={m.id}
              value={`${fullName(m)} ${m.id}`}
              onSelect={() => { onOpenChange(false); onSelectMember(m.id); }}
            >
              <span className="truncate">{fullName(m)}</span>
              <span className="ml-auto pl-2 text-xs text-muted-foreground">{lifespan(m)}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Commands">
          {commands.map((c) => (
            <CommandItem key={c.id} value={`command ${c.label}`} onSelect={() => { onOpenChange(false); c.run(); }}>
              {c.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
