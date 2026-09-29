import assert from 'node:assert/strict';
import test from 'node:test';
import { createNavigationController } from '../app/navigation-controller.ts';
import type { NavigationState } from '../app/navigation-controller.ts';
import { nearbyChapterStop } from '../app/chapter-model.ts';

function fixture(withSettle = false) {
  let time = 0, nextId = 0, y = 0, limit = 5000, reduced = false, allowed = true, settleAllowed = true;
  const tasks = new Map<number, { at: number; run: () => void }>();
  const writes: { at: number; y: number }[] = [];
  const states: NavigationState[] = [];
  const enqueue = (run: () => void, after: number) => {
    const id = ++nextId; tasks.set(id, { at: time + after, run }); return id;
  };
  const controller = createNavigationController({
    now: () => time,
    frame: callback => enqueue(() => callback(time), 16),
    cancelFrame: id => { tasks.delete(id); },
    delay: enqueue,
    cancelDelay: id => { tasks.delete(id); },
    readY: () => y,
    writeY: top => { y = top; writes.push({ at: time, y }); },
    maxY: () => limit,
    reducedMotion: () => reduced,
    canTour: () => allowed,
    nextTourTarget: () => y >= limit - 2 ? null : Math.min(y + 600, limit),
    canSettle: () => settleAllowed,
    settleTarget: withSettle ? (from, to) => nearbyChapterStop(from, to, [0, 1000, 2000, 3000], 800) : undefined,
    onState: state => states.push(state),
    tourDelay: 3000,
  });
  return {
    controller, writes, states,
    get y() { return y; },
    get now() { return time; },
    get pending() { return tasks.size; },
    setReduced(value: boolean) { reduced = value; },
    setAllowed(value: boolean) { allowed = value; },
    setSettleAllowed(value: boolean) { settleAllowed = value; },
    setLimit(value: number) { limit = value; },
    nativeScrollTo(top: number) { y = top; },
    advance(milliseconds: number) {
      const end = time + milliseconds;
      for (let guard = 0; guard < 10000; guard++) {
        const task = [...tasks].sort((a, b) => a[1].at - b[1].at)[0];
        if (!task || task[1].at > end) { time = end; return; }
        tasks.delete(task[0]); time = task[1].at; task[1].run();
      }
      throw new Error('Unbounded timer or animation loop');
    },
  };
}

test('loading and native scrolling create no automatic movement', () => {
  const f = fixture(); f.advance(10000); f.nativeScrollTo(700); f.advance(10000);
  assert.equal(f.y, 700); assert.equal(f.writes.length, 0); assert.equal(f.pending, 0);
});

test('settling waits for the last inertial scroll, and programmatic scroll cannot start another settle', () => {
  const f = fixture(true); f.nativeScrollTo(600); f.controller.beginNativeScroll(1);
  f.nativeScrollTo(910); f.controller.nativeScrolled(); f.advance(200);
  f.nativeScrollTo(950); f.controller.nativeScrolled(); f.advance(219);
  assert.equal(f.writes.length, 0);
  f.advance(500); assert.equal(f.y, 1000); assert.equal(f.pending, 0);
  const count = f.writes.length;
  f.controller.nativeScrolled(); f.advance(10000);
  assert.equal(f.writes.length, count); assert.equal(f.pending, 0);
});

test('held touch blocks settling until release, and leaving an aligned chapter remains free', () => {
  const f = fixture(true); f.nativeScrollTo(600); f.setSettleAllowed(false);
  f.controller.beginNativeScroll(); f.nativeScrollTo(950); f.controller.nativeScrolled(); f.advance(1000);
  assert.equal(f.writes.length, 0);
  f.setSettleAllowed(true); f.controller.nativeScrolled(); f.advance(1000);
  assert.equal(f.y, 1000);
  const count = f.writes.length;
  f.controller.beginNativeScroll(1); f.nativeScrollTo(1060); f.controller.nativeScrolled(); f.advance(1000);
  assert.equal(f.y, 1060); assert.equal(f.writes.length, count);
});

test('tab selection replaces both a queued settle and an alignment already in progress', () => {
  for (const delay of [100, 300]) {
    const f = fixture(true); f.nativeScrollTo(600); f.controller.beginNativeScroll(1);
    f.nativeScrollTo(910); f.controller.nativeScrolled(); f.advance(delay);
    if (delay === 300) assert.ok(f.y > 910 && f.y < 1000);
    f.controller.navigate(() => 650); f.advance(2000);
    assert.equal(f.y, 650); assert.equal(f.pending, 0);
  }
});

test('another native gesture cancels alignment immediately and reversals use the new direction', () => {
  const f = fixture(true); f.nativeScrollTo(600); f.controller.beginNativeScroll(1);
  f.nativeScrollTo(910); f.controller.nativeScrolled(); f.advance(300);
  assert.ok(f.y > 910 && f.y < 1000);
  f.controller.beginNativeScroll(1); const count = f.writes.length;
  f.nativeScrollTo(1600); f.controller.nativeScrolled(); f.advance(1000);
  assert.equal(f.y, 1600); assert.equal(f.writes.length, count);
  f.controller.beginNativeScroll(1); f.nativeScrollTo(2100); f.controller.nativeScrolled(); f.advance(100);
  f.controller.beginNativeScroll(-1); f.nativeScrollTo(1980); f.controller.nativeScrolled(); f.advance(1000);
  assert.equal(f.y, 2000);
});

test('manual settling cancels a tour and cannot restart it; pause drops an armed gesture', () => {
  const f = fixture(true); f.controller.play(); f.advance(2900);
  f.controller.beginNativeScroll(1); f.nativeScrollTo(950); f.controller.nativeScrolled(); f.advance(10000);
  assert.equal(f.y, 1000); assert.equal(f.states.at(-1)?.playing, false); assert.equal(f.pending, 0);
  const count = f.writes.length;
  f.controller.beginNativeScroll(1); f.nativeScrollTo(1920); f.controller.nativeScrolled(); f.controller.pause();
  f.controller.nativeScrolled(); f.advance(10000);
  assert.equal(f.y, 1920); assert.equal(f.writes.length, count); assert.equal(f.pending, 0);
});

test('reduced motion and hidden or reading states never align automatically', () => {
  const f = fixture(true); f.setReduced(true); f.nativeScrollTo(600); f.controller.beginNativeScroll(1);
  f.nativeScrollTo(950); f.controller.nativeScrolled(); f.advance(1000);
  assert.equal(f.writes.length, 0); assert.equal(f.pending, 0);
  f.setReduced(false); f.nativeScrollTo(600); f.controller.beginNativeScroll(1);
  f.nativeScrollTo(950); f.controller.nativeScrolled(); f.setSettleAllowed(false); f.advance(1000);
  assert.equal(f.writes.length, 0); assert.equal(f.pending, 0);
  f.controller.dispose(); f.setSettleAllowed(true); f.controller.nativeScrolled(); f.advance(1000);
  assert.equal(f.writes.length, 0); assert.equal(f.pending, 0);
});

test('manual input cancels both the countdown and an automatic movement in progress', () => {
  const f = fixture(); f.controller.play(); f.advance(2999); f.controller.pause(); f.advance(10000);
  assert.equal(f.writes.length, 0);
  f.controller.play(); f.advance(3160);
  assert.ok(f.y > 0 && f.y < 600, 'automatic movement has actually started');
  f.controller.pause(); const count = f.writes.length;
  f.nativeScrollTo(1300); f.advance(10000);
  assert.equal(f.y, 1300); assert.equal(f.writes.length, count); assert.equal(f.pending, 0);
  assert.equal(f.states.at(-1)?.playing, false);
});

test('input at the timer boundary cancels the queued first animation frame', () => {
  const f = fixture(); f.controller.play(); f.advance(3000); f.controller.pause(); f.advance(10000);
  assert.equal(f.writes.length, 0); assert.equal(f.pending, 0);
});

test('rapid selections replace pending and in-progress destinations, rather than queueing them', () => {
  const f = fixture();
  f.controller.navigate(() => 1000); f.controller.navigate(() => 1400); f.controller.navigate(() => 600);
  f.advance(120); assert.ok(f.y > 0 && f.y < 600);
  const index = f.writes.length;
  f.controller.navigate(() => 200); f.advance(2000);
  assert.equal(f.y, 200); assert.equal(f.pending, 0);
  assert.ok(f.writes.slice(index).every(write => write.y < 600));
  f.advance(10000); assert.equal(f.y, 200);
});

test('selection waits for committed geometry, and a tap pauses the tour permanently', () => {
  const f = fixture(); let top = 1500;
  f.controller.play(); f.advance(2900);
  f.controller.navigate(() => top); top = 730;
  f.advance(5000); assert.equal(f.y, 730); assert.equal(f.pending, 0);
  assert.equal(f.states.at(-1)?.playing, false);
});

test('a repeated selection already at its target does not move the page', () => {
  const f = fixture(); f.nativeScrollTo(400); f.controller.navigate(() => 400); f.advance(1000);
  assert.equal(f.writes.length, 0); assert.equal(f.pending, 0);
});

test('the tour waits three full seconds after completing each movement and stops at the end', () => {
  const f = fixture(); f.setLimit(1200); f.controller.play(); f.advance(2999);
  assert.equal(f.writes.length, 0);
  f.advance(401); assert.equal(f.y, 600);
  const arrival = f.writes.at(-1)!.at, firstCount = f.writes.length;
  f.advance(arrival + 2999 - f.now);
  assert.equal(f.writes.length, firstCount);
  f.advance(1000); assert.equal(f.y, 1200); assert.equal(f.pending, 0);
  assert.equal(f.states.at(-1)?.playing, false);
  const count = f.writes.length; f.advance(15000); assert.equal(f.writes.length, count);
});

test('hidden or disabled tours and reduced motion cannot start a countdown', () => {
  const f = fixture(); f.setAllowed(false); f.controller.play(); f.advance(10000);
  assert.equal(f.pending, 0); assert.equal(f.writes.length, 0);
  f.setAllowed(true); f.setReduced(true); f.controller.play(); f.advance(10000);
  assert.equal(f.pending, 0);
  f.controller.navigate(() => 450); f.advance(16);
  assert.deepEqual(f.writes, [{ at: 20016, y: 450 }]);
});

test('destinations stay within the page and detached selections never move it', () => {
  const f = fixture(); f.setLimit(200);
  f.controller.navigate(() => 900); f.advance(1000); assert.equal(f.y, 200);
  f.controller.navigate(() => -300); f.advance(1000); assert.equal(f.y, 0);
  const count = f.writes.length; f.controller.navigate(() => null); f.advance(1000);
  assert.equal(f.writes.length, count); assert.equal(f.pending, 0);
});

test('unmounting drops all future timer and animation work', () => {
  const f = fixture(); f.controller.play(); f.advance(3090); f.controller.dispose();
  const count = f.writes.length; f.advance(10000); f.controller.play(); f.controller.navigate(() => 300); f.advance(5000);
  assert.equal(f.writes.length, count); assert.equal(f.pending, 0);
});
