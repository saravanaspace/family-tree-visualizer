import { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, useStore, type EdgeProps } from '@xyflow/react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { edgeLabel, edgeStyle } from '../lib/edgeStyle';
import type { RelationshipEdge as RelationshipEdgeType } from '../lib/toFlow';
import { useCanvasActions } from '../hooks/canvasActions';

const STATUSES = ['active', 'divorced', 'separated', 'widowed', 'deceased'];
const SUB_TYPES = ['biological', 'adopted', 'step', 'foster', 'legal'];

function RelationshipEdgeBase(props: EdgeProps<RelationshipEdgeType>) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected } = props;
  const zoom = useStore((s) => s.transform[2]);
  const actions = useCanvasActions();
  if (!data) return null;

  const [path, labelX, labelY] = getSmoothStepPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, borderRadius: 12 });
  const style = edgeStyle(data.relationship);
  // A couple is drawn as two edges to one junction; label/edit only on the first.
  const primary = !id.endsWith(':b');
  const label = primary ? edgeLabel(data.relationship, zoom) : undefined;
  const isSpouse = data.relationship.type === 'spouse';
  const isParentChild = data.relationship.type === 'parent-child';

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        interactionWidth={24}
        style={{
          stroke: style.stroke,
          strokeWidth: selected ? style.strokeWidth + 2 : style.strokeWidth,
          strokeDasharray: style.strokeDasharray,
          opacity: data.dimmed ? 0.2 : 1,
        }}
      />
      {(label || (selected && primary)) && (
        <EdgeLabelRenderer>
          <div
            className={cn('nodrag nopan absolute flex items-center gap-1 rounded bg-background/90 px-1.5 py-0.5 text-xs shadow-sm', selected && 'border p-1')}
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`, pointerEvents: selected ? 'all' : 'none' }}
          >
            {label && <span style={{ color: style.stroke }}>{label}</span>}
            {selected && (isSpouse || isParentChild) && (
              <select
                aria-label={isSpouse ? 'Relationship status' : 'Relationship kind'}
                className="h-8 rounded border bg-background px-1 text-xs"
                value={(isSpouse ? data.relationship.status : data.relationship.subType) ?? ''}
                onChange={(e) =>
                  actions.onUpdateEdge(data.relationshipIds, isSpouse ? { status: e.target.value } : { subType: e.target.value as any })}
              >
                {isParentChild && !data.relationship.subType && <option value="">unspecified</option>}
                {(isSpouse ? STATUSES : SUB_TYPES).map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            )}
            {selected && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive"
                aria-label="Delete relationship"
                onClick={() => actions.onDeleteEdge(data.relationshipIds)}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const RelationshipEdge = memo(RelationshipEdgeBase);
