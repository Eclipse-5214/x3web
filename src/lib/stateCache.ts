// Best-effort memory of the last settings this driver wrote to the mouse.
// Not a real hardware read — see x3protocol.ts's note on GET_REPORT support.
// If the official app (or another copy of this driver) changes the mouse
// in between, this cache goes stale until the next write.

export interface CachedState {
  stageDpi: number[];
  activeStage: number | null;
  activeRate: number | null;
}

const KEY = 'x3-last-state';

export function loadCachedState(): CachedState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.stageDpi) || parsed.stageDpi.length !== 6) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveCachedState({ stageDpi, activeStage, activeRate }: CachedState): void {
  localStorage.setItem(KEY, JSON.stringify({ stageDpi, activeStage, activeRate }));
}
