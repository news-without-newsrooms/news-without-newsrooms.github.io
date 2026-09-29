export const chapters = [
  ['overview', 'Overview'], ['workshop', 'The workshop'], ['walkthrough', 'In the room'],
  ['program', 'Program'], ['participate', 'Participate'], ['prepare', 'Before you arrive'],
  ['organizers', 'Organizers'],
] as const;

export const TOUR_DELAY = 3000;

/** Settle only at a chapter approached by this gesture, never the one just left. */
export function nearbyChapterStop(from: number, to: number, stops: number[], viewport: number): number | null {
  const direction = Math.sign(to - from);
  if (Math.abs(to - from) < 12) return null;
  const reach = Math.min(140, viewport * .18);
  const candidates = stops.filter(stop => Number.isFinite(stop) &&
    (direction > 0 ? stop > from + 4 : stop < from - 4) &&
    Math.abs(stop - to) > 2 && Math.abs(stop - to) <= reach);
  return candidates.sort((a, b) => Math.abs(a - to) - Math.abs(b - to))[0] ?? null;
}

/** A timed tour moves at most one screen, so it cannot skip a long section. */
export function nextReadingStop(y: number, nextChapterTop: number, viewport: number, header: number, maxScroll: number) {
  const stride = Math.max(120, (viewport - header) * .82);
  if (nextChapterTop - header - y <= viewport - header + 12) return Math.min(Math.max(y, nextChapterTop - header), maxScroll);
  return Math.min(y + stride, Math.max(y, nextChapterTop - header), maxScroll);
}
