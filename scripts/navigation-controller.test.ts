import assert from 'node:assert/strict';
import test from 'node:test';
import { createNavigationController } from '../app/navigation-controller.ts';
import type { NavigationState } from '../app/navigation-controller.ts';

function fixture() {
  let time = 0, nextId = 0, y = 0, limit = 5000, reduced = false, allowed = true;
  const tasks = new Map<number, { at: number; run: () => void }>();
  const writes: { at: number; y: number }[] = [];
  const states: NavigationState[] = [];
  let nativeSnap = true;
  const owners: boolean[] = [];
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
    writeY: top => { assert.equal(nativeSnap, false, 'native snap must be off before any requested movement'); y = top; writes.push({ at: time, y }); },
    maxY: () => limit,
    reducedMotion: () => reduced,
    canTour: () => allowed,
    nextTourTarget: () => y >= limit - 2 ? null : Math.min(y + 600, limit),
    setNativeSnap: enabled => { nativeSnap = enabled; owners.push(enabled); },
    onState: state => states.push(state),
    tourDelay: 3000,
  });
  return {
    controller, writes, states, owners,
    get nativeSnap() { return nativeSnap; },
    get y() { return y; },
    get now() { return time; },
    get pending() { return tasks.size; },
    setReduced(value: boolean) { reduced = value; },
    setAllowed(value: boolean) { allowed = value; },
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


test('links and internal selections keep snapping suspended until the next native gesture', () => {
  const f = fixture();
  assert.equal(f.nativeSnap, true);
  f.controller.navigate(() => 730);
  assert.equal(f.nativeSnap, false);
  f.advance(1500); assert.equal(f.y, 730); assert.equal(f.nativeSnap, false);
  // Pointer/focus events while reading must not snap the selected panel away.
  f.controller.pause(); f.advance(10000); assert.equal(f.nativeSnap, false);
  f.controller.nativeInput(); assert.equal(f.nativeSnap, true);
  const count = f.writes.length;
  f.nativeScrollTo(1234); f.advance(10000);
  assert.equal(f.writes.length, count); assert.equal(f.y, 1234);
});

test('native input cancels requested animation before returning scrolling to the browser', () => {
  const f = fixture(); f.controller.play(); f.advance(3100);
  assert.ok(f.y > 0 && f.y < 600); assert.equal(f.nativeSnap, false);
  f.controller.nativeInput(); assert.equal(f.nativeSnap, true);
  const count = f.writes.length; f.nativeScrollTo(900); f.advance(10000);
  assert.equal(f.writes.length, count); assert.equal(f.pending, 0);
  f.controller.navigate(() => 500); f.advance(16);
  assert.equal(f.nativeSnap, false);
  f.controller.dispose(); assert.equal(f.nativeSnap, true);
});

test('rapid internal selections never briefly re-enable browser snapping', () => {
  const f = fixture(); f.controller.navigate(() => 500); f.advance(100);
  f.controller.pause(); f.controller.navigate(() => 1500); f.advance(100);
  f.controller.pause(); f.controller.navigate(() => 850); f.advance(1500);
  assert.equal(f.y, 850);
  assert.ok(f.owners.length >= 3); assert.ok(f.owners.every(enabled => !enabled));
});
