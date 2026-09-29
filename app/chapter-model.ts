export const chapters = [
  ['overview', 'Overview'], ['workshop', 'The workshop'], ['walkthrough', 'In the room'],
  ['program', 'Program'], ['participate', 'Participate'], ['prepare', 'Before you arrive'],
  ['organizers', 'Organizers'],
] as const;

export const TOUR_DELAY = 3000;

/** A tap or control activation is not a request to resume page snapping. */
export function nativeScrollIntent(input: {
  type: string; key?: string; typing?: boolean; control?: boolean; tab?: boolean; scrollbar?: boolean; zoom?: boolean;
}) {
  if (input.type === 'wheel') return !input.zoom;
  if (input.type === 'touchmove') return true;
  if (input.type === 'pointerdown') return !!input.scrollbar;
  if (input.type !== 'keydown' || input.typing) return false;
  if (input.key === ' ' && input.control) return false;
  if (input.tab && input.key?.startsWith('Arrow')) return false;
  return ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(input.key ?? '');
}

/** A timed tour moves at most one screen, so it cannot skip a long section. */
export function nextReadingStop(y: number, nextChapterTop: number, viewport: number, header: number, maxScroll: number) {
  const stride = Math.max(120, (viewport - header) * .82);
  if (nextChapterTop - header - y <= viewport - header + 12) return Math.min(Math.max(y, nextChapterTop - header), maxScroll);
  return Math.min(y + stride, Math.max(y, nextChapterTop - header), maxScroll);
}
