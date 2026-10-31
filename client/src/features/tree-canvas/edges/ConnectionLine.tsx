import { BaseEdge, getSmoothStepPath, type ConnectionLineComponentProps } from '@xyflow/react';

/** Connection preview that turns red (with a hint) when the hovered target would be invalid. */
export function ConnectionLine({ fromX, fromY, toX, toY, fromPosition, toPosition, connectionStatus }: ConnectionLineComponentProps) {
  const [path] = getSmoothStepPath({ sourceX: fromX, sourceY: fromY, targetX: toX, targetY: toY, sourcePosition: fromPosition, targetPosition: toPosition });
  const invalid = connectionStatus === 'invalid';
  return (
    <g>
      <BaseEdge path={path} style={{ stroke: invalid ? 'hsl(var(--destructive))' : 'hsl(var(--primary))', strokeWidth: 2, strokeDasharray: '6 4' }} />
      {invalid && (
        <text x={toX + 12} y={toY - 12} fill="hsl(var(--destructive))" fontSize={12} role="alert">Can't link these people</text>
      )}
    </g>
  );
}
