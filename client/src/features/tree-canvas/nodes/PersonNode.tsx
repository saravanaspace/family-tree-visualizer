import { memo } from 'react';
import { Handle, NodeToolbar, Position, useStore, type NodeProps } from '@xyflow/react';
import { ChevronDown, ChevronRight, Edit2, Focus, Plus, Trash2, UserRound } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FamilyMember } from '@shared/schema';
import { detailLevelForZoom, type DetailLevel } from '../lib/constants';
import type { PersonNode as PersonNodeType } from '../lib/toFlow';
import { useCanvasActions } from '../hooks/canvasActions';

const accent: Record<string, string> = {
  male: 'border-l-blue-500',
  female: 'border-l-pink-500',
  other: 'border-l-purple-500',
  nonbinary: 'border-l-purple-500',
};

const year = (d: unknown) => (d ? new Date(d as string).getUTCFullYear() : null);

export function fullName(m: FamilyMember) {
  return [m.firstName, m.middleName, m.lastName].filter(Boolean).join(' ');
}

export function lifespan(m: FamilyMember) {
  const born = year(m.birthDate);
  const died = year(m.deathDate);
  if (!born && !died) return m.isLiving === false ? 'Deceased' : '';
  return `${born ?? '?'}${m.isLiving === false || died ? ` – ${died ?? '?'}` : ' –'}`;
}

function PersonNodeBase({ id, data, selected }: NodeProps<PersonNodeType>) {
  const { member, dimmed, collapsed, hiddenCount, hasChildren } = data;
  const level: DetailLevel = useStore((s) => detailLevelForZoom(s.transform[2]));
  const actions = useCanvasActions();
  const name = fullName(member);

  const quick = (label: string, kind: 'parent' | 'child' | 'partner') => (
    <Button
      key={kind}
      size="sm"
      variant="secondary"
      className="h-8 px-2 text-xs"
      aria-label={`Add ${label} of ${name}`}
      onClick={() => actions.onQuickAdd(kind, member.id)}
    >
      <Plus className="h-3 w-3 mr-1" aria-hidden />{label}
    </Button>
  );

  return (
    <div
      data-testid={`person-${member.id}`}
      className={cn(
        'group relative h-full w-full overflow-hidden rounded-lg border border-l-4 bg-card text-card-foreground shadow-sm',
        'transition-[box-shadow,opacity] duration-150 motion-reduce:transition-none',
        accent[member.gender ?? ''] ?? 'border-l-slate-400',
        selected && 'ring-2 ring-primary ring-offset-2',
        dimmed && 'opacity-30',
      )}
    >
      <NodeToolbar isVisible={selected} position={Position.Top} className="flex gap-1 rounded-md border bg-popover p-1 shadow-md">
        {quick('Parent', 'parent')}
        {quick('Child', 'child')}
        {quick('Partner', 'partner')}
        <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Edit ${name}`} onClick={() => actions.onEditMember(member.id)}>
          <Edit2 className="h-4 w-4" aria-hidden />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Focus on ${name}`} onClick={() => actions.onFocusMember(member.id)}>
          <Focus className="h-4 w-4" aria-hidden />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" aria-label={`Delete ${name}`} onClick={() => actions.onDeleteMember(member.id)}>
          <Trash2 className="h-4 w-4" aria-hidden />
        </Button>
      </NodeToolbar>

      {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
        <Handle
          key={side}
          id={side}
          type="source"
          position={{ top: Position.Top, bottom: Position.Bottom, left: Position.Left, right: Position.Right }[side]}
          className="ftv-handle !h-3 !w-3 !border-2 !border-background !bg-primary opacity-0 transition-opacity group-hover:opacity-100 data-[connecting=true]:opacity-100"
          style={{ ...HANDLE_STYLE[side], ...(selected ? { opacity: 1 } : {}) }}
          aria-label={{ top: 'Connect as parent', bottom: 'Connect as child', left: 'Connect as partner (left)', right: 'Connect as partner (right)' }[side]}
        />
      ))}

      {level === 'minimal' ? (
        <div className="flex h-full items-center justify-center px-3">
          <span className="line-clamp-2 break-words text-center text-xl font-semibold leading-tight">{name}</span>
        </div>
      ) : (
        <div className="flex h-full items-start gap-3 p-3">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={member.photoUrl || ''} alt="" />
            <AvatarFallback>
              {member.firstName?.[0] ?? <UserRound className="h-5 w-5" aria-hidden />}{member.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 break-words text-sm font-semibold leading-tight" title={name}>{name}</h3>
            <p className="mt-1 truncate text-xs text-muted-foreground">{lifespan(member)}</p>
            {level === 'full' && (
              <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                {member.birthPlace && <p className="truncate" title={member.birthPlace}>{member.birthPlace}</p>}
                {member.occupation && <p className="truncate" title={member.occupation}>{member.occupation}</p>}
                <p>{member.isLiving === false ? 'Deceased' : 'Living'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {hasChildren && (
        <button
          type="button"
          className="absolute bottom-1 right-1 flex h-6 items-center rounded-full border bg-background px-1.5 text-xs text-muted-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring nodrag"
          aria-label={collapsed ? `Expand descendants of ${name}` : `Collapse descendants of ${name}`}
          aria-expanded={!collapsed}
          onClick={(e) => { e.stopPropagation(); actions.onToggleCollapse(member.id); }}
        >
          {collapsed ? <ChevronRight className="h-3 w-3" aria-hidden /> : <ChevronDown className="h-3 w-3" aria-hidden />}
          {collapsed && hiddenCount > 0 && <span className="ml-0.5">+{hiddenCount}</span>}
        </button>
      )}
    </div>
  );
}

// Handles sit just inside the card edge so connector lines meet the card instead of floating beside it.
const HANDLE_STYLE: Record<'top' | 'bottom' | 'left' | 'right', React.CSSProperties> = {
  top: { top: 0, transform: 'translate(-50%, 0)' },
  bottom: { top: 'auto', bottom: 0, transform: 'translate(-50%, 0)' },
  left: { left: 0, transform: 'translate(0, -50%)' },
  right: { left: 'auto', right: 0, transform: 'translate(0, -50%)' },
};

export const PersonNode = memo(PersonNodeBase);
