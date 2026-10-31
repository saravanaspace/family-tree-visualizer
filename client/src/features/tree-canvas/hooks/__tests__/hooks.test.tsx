// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useUndoRedo } from '../useUndoRedo';
import { useCanvasSettings, DEFAULT_SETTINGS } from '../useCanvasSettings';
import { useViewportPersist } from '../useViewportPersist';
import { useCollapsed } from '../useCollapsed';
import { STORAGE_KEYS } from '../../lib/constants';

describe('useUndoRedo', () => {
  it('runs undo then redo and updates availability', async () => {
    const calls: string[] = [];
    const { result } = renderHook(() => useUndoRedo());
    act(() => result.current.push({ label: 'Move', undo: () => { calls.push('undo'); }, redo: () => { calls.push('redo'); } }));
    expect(result.current.canUndo).toBe(true);
    expect(result.current.undoLabel).toBe('Move');

    await act(async () => { await result.current.undo(); });
    expect(calls).toEqual(['undo']);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);

    await act(async () => { await result.current.redo(); });
    expect(calls).toEqual(['undo', 'redo']);
  });

  it('reports failures through onError instead of throwing', async () => {
    const onError = vi.fn();
    const { result } = renderHook(() => useUndoRedo(onError));
    act(() => result.current.push({ label: 'x', undo: () => { throw new Error('boom'); }, redo: () => {} }));
    await act(async () => { await result.current.undo(); });
    expect(onError).toHaveBeenCalledWith(expect.any(Error), 'undo');
  });

  it('clears the redo branch when a new command is pushed', async () => {
    const { result } = renderHook(() => useUndoRedo());
    const cmd = (label: string) => ({ label, undo: () => {}, redo: () => {} });
    act(() => result.current.push(cmd('a')));
    await act(async () => { await result.current.undo(); });
    act(() => result.current.push(cmd('b')));
    expect(result.current.canRedo).toBe(false);
  });
});

describe('useCanvasSettings', () => {
  it('defaults, persists updates and restores them', () => {
    const first = renderHook(() => useCanvasSettings());
    expect(first.result.current.settings).toEqual(DEFAULT_SETTINGS);
    act(() => first.result.current.update({ snap: true, wheelScheme: 'alternate' }));
    first.unmount();

    const second = renderHook(() => useCanvasSettings());
    expect(second.result.current.settings).toMatchObject({ snap: true, wheelScheme: 'alternate', minimap: true });
  });

  it('falls back to defaults for corrupt or invalid stored data', () => {
    localStorage.setItem(STORAGE_KEYS.settings, '{not json');
    expect(renderHook(() => useCanvasSettings()).result.current.settings).toEqual(DEFAULT_SETTINGS);
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify({ wheelScheme: 'nope', snap: 1, minimap: true }));
    expect(renderHook(() => useCanvasSettings()).result.current.settings).toEqual(DEFAULT_SETTINGS);
  });
});

describe('useViewportPersist', () => {
  it('returns null on first visit and the saved viewport afterwards', () => {
    const first = renderHook(() => useViewportPersist());
    expect(first.result.current.saved).toBeNull();
    act(() => first.result.current.save({ x: 10, y: -20, zoom: 1.5 }));
    expect(renderHook(() => useViewportPersist()).result.current.saved).toEqual({ x: 10, y: -20, zoom: 1.5 });
  });

  it.each([
    ['corrupt json', '{{{'],
    ['zoom out of range', JSON.stringify({ x: 0, y: 0, zoom: 99 })],
    ['non-finite coordinates', '{"x":1e999,"y":0,"zoom":1}'],
    ['wrong shape', JSON.stringify([1, 2, 3])],
  ])('ignores %s', (_, raw) => {
    localStorage.setItem(STORAGE_KEYS.viewport, raw);
    expect(renderHook(() => useViewportPersist()).result.current.saved).toBeNull();
  });
});

describe('useCollapsed', () => {
  it('toggles and persists collapsed ids', () => {
    const { result, unmount } = renderHook(() => useCollapsed());
    act(() => result.current.toggle(4));
    act(() => result.current.toggle(5));
    act(() => result.current.toggle(4));
    expect(Array.from(result.current.collapsed)).toEqual([5]);
    unmount();
    expect(Array.from(renderHook(() => useCollapsed()).result.current.collapsed)).toEqual([5]);
  });

  it('ignores invalid stored data', () => {
    localStorage.setItem(STORAGE_KEYS.collapsed, JSON.stringify(['a', -1]));
    expect(renderHook(() => useCollapsed()).result.current.collapsed.size).toBe(0);
  });
});
