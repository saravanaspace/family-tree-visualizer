import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

/** Small, non-draggable junction where a couple's children attach. */
function UnionNodeBase() {
  return (
    <div className="h-full w-full rounded-full border-2 border-background bg-muted-foreground/60" aria-hidden>
      <Handle id="top" type="source" position={Position.Top} className="!opacity-0 !h-1 !w-1" isConnectable={false} />
      <Handle id="left" type="source" position={Position.Left} className="!opacity-0 !h-1 !w-1" isConnectable={false} />
      <Handle id="right" type="source" position={Position.Right} className="!opacity-0 !h-1 !w-1" isConnectable={false} />
      <Handle id="bottom" type="source" position={Position.Bottom} className="!opacity-0 !h-1 !w-1" isConnectable={false} />
    </div>
  );
}

export const UnionNode = memo(UnionNodeBase);
