import { useCallback, useRef, useState } from 'react';
import { UndoStack, type UndoCommand } from '../lib/undoStack';
import { UNDO_DEPTH } from '../lib/constants';

export interface UndoRedo {
  push: (command: UndoCommand) => void;
  undo: () => Promise<UndoCommand | undefined>;
  redo: () => Promise<UndoCommand | undefined>;
  clear: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undoLabel?: string;
  redoLabel?: string;
}

export function useUndoRedo(onError?: (error: unknown, action: 'undo' | 'redo') => void): UndoRedo {
  const stack = useRef(new UndoStack(UNDO_DEPTH));
  const [, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);
  const errorRef = useRef(onError);
  errorRef.current = onError;

  const push = useCallback((command: UndoCommand) => { stack.current.push(command); bump(); }, [bump]);
  const clear = useCallback(() => { stack.current.clear(); bump(); }, [bump]);

  const run = useCallback(async (action: 'undo' | 'redo') => {
    try {
      return await stack.current[action]();
    } catch (error) {
      errorRef.current?.(error, action);
      return undefined;
    } finally {
      bump();
    }
  }, [bump]);

  const undo = useCallback(() => run('undo'), [run]);
  const redo = useCallback(() => run('redo'), [run]);

  return {
    push, undo, redo, clear,
    canUndo: stack.current.canUndo,
    canRedo: stack.current.canRedo,
    undoLabel: stack.current.nextUndoLabel,
    redoLabel: stack.current.nextRedoLabel,
  };
}

export type { UndoCommand };
