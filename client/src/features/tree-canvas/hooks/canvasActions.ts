import { createContext, useContext } from 'react';
import type { Relationship } from '@shared/schema';

export type QuickAddKind = 'parent' | 'child' | 'partner';

export interface CanvasActions {
  onQuickAdd: (kind: QuickAddKind, memberId: number) => void;
  onEditMember: (memberId: number) => void;
  onDeleteMember: (memberId: number) => void;
  onToggleCollapse: (memberId: number) => void;
  onFocusMember: (memberId: number) => void;
  onDeleteEdge: (relationshipIds: number[]) => void;
  onUpdateEdge: (relationshipIds: number[], data: Partial<Pick<Relationship, 'status' | 'subType'>>) => void;
}

const noop = () => {};

export const CanvasActionsContext = createContext<CanvasActions>({
  onQuickAdd: noop,
  onEditMember: noop,
  onDeleteMember: noop,
  onToggleCollapse: noop,
  onFocusMember: noop,
  onDeleteEdge: noop,
  onUpdateEdge: noop,
});

export const useCanvasActions = () => useContext(CanvasActionsContext);
