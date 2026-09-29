export const chapters = [
  ['overview', 'Overview'], ['workshop', 'The workshop'], ['walkthrough', 'In the room'],
  ['program', 'Program'], ['participate', 'Participate'], ['prepare', 'Before you arrive'],
  ['organizers', 'Organizers'],
] as const;

export const TOUR_DELAY = 3000;
export type ChapterBox = { top: number; bottom: number };

/** Long chapters remain freely readable until the reader reaches their edge. */
export function canTurnChapter(box: ChapterBox, direction: number, viewport: number, header: number) {
  return box.bottom - box.top <= viewport - header + 12 ||
    (direction > 0 ? box.bottom <= viewport + 12 : box.top >= header - 12);
}

/** A timed tour moves at most one screen, so it cannot skip a long section. */
export function nextReadingStop(y: number, nextChapterTop: number, viewport: number, header: number, maxScroll: number) {
  const stride = Math.max(120, (viewport - header) * .82);
  if (nextChapterTop - header - y <= viewport - header + 12) return Math.min(Math.max(y, nextChapterTop - header), maxScroll);
  return Math.min(y + stride, Math.max(y, nextChapterTop - header), maxScroll);
}
