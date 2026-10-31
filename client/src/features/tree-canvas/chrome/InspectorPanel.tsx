import { Edit2, Focus, Trash2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import type { FamilyMember } from '@shared/schema';
import { fullName, lifespan } from '../nodes/PersonNode';

export interface InspectorProps {
  member: FamilyMember | null;
  onClose: () => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onFocus: (id: number) => void;
  onAdd: (kind: 'parent' | 'child' | 'partner', id: number) => void;
}

const FIELDS: [keyof FamilyMember, string][] = [
  ['birthDate', 'Born'], ['birthPlace', 'Birthplace'], ['deathDate', 'Died'], ['deathPlace', 'Death place'],
  ['occupation', 'Occupation'], ['email', 'Email'],
];

const show = (v: unknown) => (v instanceof Date || (typeof v === 'string' && /^\d{4}-\d\d-\d\d/.test(v))
  ? new Date(v as string).toLocaleDateString(undefined, { timeZone: 'UTC' })
  : String(v));

function Body({ member, ...a }: InspectorProps & { member: FamilyMember }) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-sm text-muted-foreground">{lifespan(member)}</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        {FIELDS.map(([k, label]) => member[k] ? (
          <div key={k} className="contents"><dt className="text-muted-foreground">{label}</dt><dd className="break-words">{show(member[k])}</dd></div>
        ) : null)}
      </dl>
      {member.biography && <p className="whitespace-pre-wrap break-words text-sm">{member.biography}</p>}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => a.onEdit(member.id)}><Edit2 className="mr-1 h-4 w-4" />Edit</Button>
        <Button size="sm" variant="outline" onClick={() => a.onFocus(member.id)}><Focus className="mr-1 h-4 w-4" />Focus</Button>
        <Button size="sm" variant="outline" onClick={() => a.onAdd('child', member.id)}><UserPlus className="mr-1 h-4 w-4" />Child</Button>
        <Button size="sm" variant="outline" onClick={() => a.onAdd('partner', member.id)}><UserPlus className="mr-1 h-4 w-4" />Partner</Button>
        <Button size="sm" variant="outline" onClick={() => a.onAdd('parent', member.id)}><UserPlus className="mr-1 h-4 w-4" />Parent</Button>
        <Button size="sm" variant="destructive" onClick={() => a.onDelete(member.id)}><Trash2 className="mr-1 h-4 w-4" />Delete</Button>
      </div>
    </div>
  );
}

/** Side sheet on desktop, bottom drawer below 768px. */
export function InspectorPanel(props: InspectorProps) {
  const isMobile = useIsMobile();
  const { member, onClose } = props;
  const open = Boolean(member);

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
        <DrawerContent className="max-h-[85dvh] overflow-y-auto">
          <DrawerHeader><DrawerTitle>{member ? fullName(member) : ''}</DrawerTitle><DrawerDescription>Person details</DrawerDescription></DrawerHeader>
          {member && <Body {...props} member={member} />}
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()} modal={false}>
      <SheetContent side="right" className="w-[22rem] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <SheetHeader><SheetTitle className="break-words">{member ? fullName(member) : ''}</SheetTitle><SheetDescription>Person details</SheetDescription></SheetHeader>
        {member && <Body {...props} member={member} />}
      </SheetContent>
    </Sheet>
  );
}
