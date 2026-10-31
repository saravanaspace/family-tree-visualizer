import { useEffect, useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { FamilyMember } from '@shared/schema';
import { fullName } from '../nodes/PersonNode';
import { validateLink, type LinkType } from '../lib/validateLink';
import type { Relationship } from '@shared/schema';

export interface PendingLink { from: number; to: number; defaultType?: LinkType }

export const SUB_TYPES = ['biological', 'adopted', 'foster', 'step', 'legal'] as const;
export type SubType = (typeof SUB_TYPES)[number];

const OPTIONS: { type: LinkType; label: (a: string, b: string) => string }[] = [
  { type: 'parent-child', label: (a, b) => `${a} is a parent of ${b}` },
  { type: 'spouse', label: (a, b) => `${a} and ${b} are partners` },
  { type: 'guardian', label: (a, b) => `${a} is a guardian of ${b}` },
];

/** Asks what kind of link a drag-to-connect gesture should create; invalid types are disabled with the reason. */
export function ConnectPopover({
  pending,
  members,
  relationships,
  onChoose,
  onCancel,
}: {
  pending: PendingLink | null;
  members: ReadonlyArray<FamilyMember>;
  relationships: ReadonlyArray<Relationship>;
  onChoose: (link: PendingLink, type: LinkType, subType?: SubType) => void;
  onCancel: () => void;
}) {
  const a = members.find((m) => m.id === pending?.from);
  const b = members.find((m) => m.id === pending?.to);
  const [subType, setSubType] = useState<SubType>('biological');
  useEffect(() => setSubType('biological'), [pending]);

  return (
    <Dialog open={Boolean(pending && a && b)} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-h-[100dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How are they related?</DialogTitle>
          <DialogDescription>Choose the relationship to create between these two people.</DialogDescription>
        </DialogHeader>
        {pending && a && b && (
          <div className="flex flex-col gap-2">
            <div className="space-y-1">
              <p id="subtype-label" className="text-sm font-medium">Parent relationship kind</p>
              <ToggleGroup type="single" variant="outline" value={subType} aria-labelledby="subtype-label" className="flex-wrap justify-start"
                onValueChange={(v) => v && setSubType(v as SubType)}>
                {SUB_TYPES.map((t) => <ToggleGroupItem key={t} value={t} className="h-11 capitalize md:h-9">{t}</ToggleGroupItem>)}
              </ToggleGroup>
            </div>
            {OPTIONS.map((o) => {
              const check = validateLink(relationships, pending.from, pending.to, o.type);
              return (
                <div key={o.type}>
                  <Button
                    variant={pending.defaultType === o.type ? 'default' : 'outline'}
                    className="h-auto min-h-11 w-full justify-start whitespace-normal text-left"
                    disabled={!check.ok}
                    onClick={() => onChoose(pending, o.type, o.type === 'parent-child' ? subType : undefined)}
                  >
                    {o.label(fullName(a), fullName(b))}
                  </Button>
                  {!check.ok && <p className="mt-1 text-xs text-muted-foreground">{check.reason}</p>}
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
