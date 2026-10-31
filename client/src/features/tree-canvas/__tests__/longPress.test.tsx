// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useLongPress, LONG_PRESS_MS } from '../hooks/useLongPress';

const ev = (over: object = {}) => ({ pointerType: 'touch', isPrimary: true, clientX: 10, clientY: 10, target: document.body, ...over }) as any;

describe('useLongPress', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('fires after the delay with the pointer position', () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useLongPress(cb));
    act(() => result.current.onPointerDown(ev()));
    act(() => { vi.advanceTimersByTime(LONG_PRESS_MS); });
    expect(cb).toHaveBeenCalledWith({ x: 10, y: 10, target: document.body });
  });

  it('is cancelled by release or movement', () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useLongPress(cb));
    act(() => result.current.onPointerDown(ev()));
    act(() => result.current.onPointerUp());
    act(() => { vi.advanceTimersByTime(LONG_PRESS_MS); });
    act(() => result.current.onPointerDown(ev()));
    act(() => result.current.onPointerMove(ev({ clientX: 40 })));
    act(() => { vi.advanceTimersByTime(LONG_PRESS_MS); });
    expect(cb).not.toHaveBeenCalled();
  });

  it('ignores mouse and secondary touches', () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useLongPress(cb));
    act(() => result.current.onPointerDown(ev({ pointerType: 'mouse' })));
    act(() => result.current.onPointerDown(ev({ isPrimary: false })));
    act(() => { vi.advanceTimersByTime(LONG_PRESS_MS); });
    expect(cb).not.toHaveBeenCalled();
  });
});
