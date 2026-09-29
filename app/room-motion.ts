import { tables, cameraForVisitor } from './simulation-model.ts';
import type { Point } from './simulation-model.ts';

export const TRAVEL_MS = 2000;
export const DWELL_MS = 2000;
export const CYCLE_MS = TRAVEL_MS + DWELL_MS;
const ZOOM_MS = 650;
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (n: number) => Math.max(0, Math.min(1, n));

/** Native Window methods must keep their receiver when a controller calls them. */
export function roomBrowserClock(browser: Pick<Window, 'performance' | 'requestAnimationFrame' | 'cancelAnimationFrame' | 'setTimeout' | 'clearTimeout'>) {
  return {
    motion: {
      now: () => browser.performance.now(),
      request: (callback: () => void) => browser.requestAnimationFrame(callback),
      cancel: (id: number) => browser.cancelAnimationFrame(id),
    },
    playback: {
      delay: (callback: () => void, ms: number) => browser.setTimeout(callback, ms),
      cancel: (id: number) => browser.clearTimeout(id),
    },
  };
}

// Keep a walking person's center clear of the permanent tables and side furniture.
export function clearWalkSegment(a: Point, b: Point) {
  if ([a, b].some(p => p.x < 100 || p.x > 700 || p.y < 145 || p.y > 419)) return false;
  return tables.every(table => {
    const x = (a.x - table.x) / 72, y = (a.y - table.y) / 56;
    const dx = (b.x - a.x) / 72, dy = (b.y - a.y) / 56;
    const t = clamp(-(x * dx + y * dy) / (dx * dx + dy * dy || 1));
    return (x + dx * t) ** 2 + (y + dy * t) ** 2 >= 1 - 1e-8;
  });
}

const aislePoints: Point[] = tables.flatMap(table => Array.from({ length: 16 }, (_, i) => {
  const angle = i * Math.PI / 8;
  return { x: table.x + Math.cos(angle) * 78, y: table.y + Math.sin(angle) * 64 };
})).filter(p => clearWalkSegment(p, p));
const aisleLinks = aislePoints.map(a => aislePoints.map(b => clearWalkSegment(a, b)));

/** Visibility graph around fixed furniture, solved only when a destination changes. */
export function walkRoute(from: Point, to: Point): Point[] {
  if (clearWalkSegment(from, to)) return [from, to];
  const points = [from, to, ...aislePoints];
  const costs = points.map(() => Infinity), previous = points.map(() => -1), visited = new Set<number>();
  costs[0] = 0;
  for (let pass = 0; pass < points.length; pass++) {
    let node = -1;
    points.forEach((_, i) => { if (!visited.has(i) && (node < 0 || costs[i] < costs[node])) node = i; });
    if (node < 0 || !Number.isFinite(costs[node])) break;
    if (node === 1) {
      const route = [to];
      while (previous[node] >= 0) { node = previous[node]; route.unshift(points[node]); }
      return route;
    }
    visited.add(node);
    points.forEach((point, i) => {
      if (visited.has(i) || !(node >= 2 && i >= 2 ? aisleLinks[node - 2][i - 2] : clearWalkSegment(points[node], point))) return;
      const candidate = costs[node] + distance(points[node], point);
      if (candidate < costs[i]) { costs[i] = candidate; previous[i] = node; }
    });
  }
  throw new Error('No furniture-safe route between room positions');
}

export function sampleRoute(route: Point[], progress: number): Point {
  if (progress <= 0) return { x: route[0].x, y: route[0].y };
  if (progress >= 1) return { x: route.at(-1)!.x, y: route.at(-1)!.y };
  const segments = route.slice(1).map((p, i) => distance(route[i], p));
  let remaining = clamp(progress) * segments.reduce((sum, n) => sum + n, 0);
  for (let i = 0; i < segments.length; i++) {
    if (remaining <= segments[i] || i === segments.length - 1) {
      const t = segments[i] ? remaining / segments[i] : 1;
      return { x: lerp(route[i].x, route[i + 1].x, t), y: lerp(route[i].y, route[i + 1].y, t) };
    }
    remaining -= segments[i];
  }
  return { ...route.at(-1)! };
}

export type RoomPose = { people: Point[]; papers: Point[] };
export type RoomFrame = RoomPose & { camera: { x: number; y: number; scale: number }; travelling: boolean };
type MotionHost = {
  now: () => number;
  request: (callback: () => void) => number;
  cancel: (id: number) => void;
  paint: (frame: RoomFrame) => void;
};

/** One clock owns people, papers, camera, and their clickable overlays. No React frame updates. */
export function createRoomMotion(initial: RoomPose, host: MotionHost) {
  let pose = initial, follow = 0, frame = 0, disposed = false, suspendedAt: number | null = null;
  let travel: { start: number; people: Point[][]; papers: Point[][] } | null = null;
  let zoom: { start: number; from: number; to: number } | null = null;
  const sample = (now: number) => {
    if (travel) {
      const t = clamp((now - travel.start) / TRAVEL_MS);
      // Gentle easing with an extended, legible walking portion.
      const progress = t * t * (3 - 2 * t);
      pose = { people: travel.people.map(r => sampleRoute(r, progress)), papers: travel.papers.map(r => sampleRoute(r, progress)) };
      if (t === 1) travel = null;
    }
    if (zoom) {
      const t = clamp((now - zoom.start) / ZOOM_MS);
      follow = lerp(zoom.from, zoom.to, t * t * (3 - 2 * t));
      if (t === 1) zoom = null;
    }
  };
  const paint = () => {
    const close = cameraForVisitor(pose.people[6], true);
    host.paint({ ...pose, travelling: !!travel && suspendedAt === null,
      camera: { x: close.x * follow, y: close.y * follow, scale: 1 + (close.scale - 1) * follow } });
  };
  const schedule = () => { if (!disposed && suspendedAt === null && !frame && (travel || zoom)) frame = host.request(tick); };
  const tick = () => { frame = 0; if (disposed || suspendedAt !== null) return; sample(host.now()); paint(); schedule(); };
  return {
    move(target: RoomPose, animate = true) {
      if (disposed) return;
      const now = suspendedAt ?? host.now(); sample(now);
      const changed = pose.people.some((p, i) => distance(p, target.people[i]) > .001) || pose.papers.some((p, i) => distance(p, target.papers[i]) > .001);
      if (animate && changed) travel = { start: now, people: pose.people.map((p, i) => walkRoute(p, target.people[i])), papers: pose.papers.map((p, i) => [p, target.papers[i]]) };
      else { pose = target; travel = null; }
      paint(); schedule();
    },
    follow(value: boolean, animate = true) {
      if (disposed) return;
      const now = suspendedAt ?? host.now(); sample(now);
      // View controls still work when a visitor has paused the walkthrough.
      if (animate && suspendedAt === null && Math.abs(follow - Number(value)) > .0001) zoom = { start: now, from: follow, to: Number(value) };
      else { follow = Number(value); zoom = null; }
      paint(); schedule();
    },
    suspend(value: boolean) {
      if (disposed || value === (suspendedAt !== null)) return;
      if (value) { const now = host.now(); sample(now); suspendedAt = now; host.cancel(frame); frame = 0; }
      else {
        const pause = host.now() - suspendedAt!;
        if (travel) travel.start += pause;
        if (zoom) zoom.start += pause;
        suspendedAt = null;
      }
      paint(); schedule();
    },
    remaining() { return travel ? Math.max(0, TRAVEL_MS - ((suspendedAt ?? host.now()) - travel.start)) : 0; },
    repaint: paint,
    dispose() { disposed = true; host.cancel(frame); frame = 0; travel = null; zoom = null; },
  };
}

type PlaybackHost = { delay: (callback: () => void, ms: number) => number; cancel: (id: number) => void; advance: (index: number) => void; state: (playing: boolean) => void };
export function createRoomPlayback(count: number, host: PlaybackHost) {
  let timer = 0, generation = 0, playing = false, index = 0;
  const pause = () => { generation++; host.cancel(timer); timer = 0; playing = false; host.state(false); };
  const queue = (delay: number) => {
    const expected = generation;
    timer = host.delay(() => {
      if (expected !== generation || !playing) return;
      if (index === count - 1) { pause(); return; }
      index++; host.advance(index); queue(CYCLE_MS);
    }, delay);
  };
  return {
    play(start: number, remainingTravel = 0) { pause(); index = start; playing = true; host.state(true); queue(DWELL_MS + remainingTravel); },
    pause,
    dispose() { generation++; host.cancel(timer); timer = 0; playing = false; },
  };
}
