import assert from 'node:assert/strict';
import test from 'node:test';
import { phases, peopleForPhase, papersForPhase, cameraForVisitor } from '../app/simulation-model.ts';
import { clearWalkSegment, walkRoute, sampleRoute, createRoomMotion, createRoomPlayback, roomBrowserClock, TRAVEL_MS, CYCLE_MS } from '../app/room-motion.ts';
import type { RoomFrame } from '../app/room-motion.ts';
import { projectRoomObject, roomObjectsForPhase } from '../app/room-objects.ts';

const pose = (step: number, interest = 0) => ({ people: peopleForPhase(phases[step].id, 20, interest), papers: papersForPhase(phases[step].id) });

test('browser clock preserves native method receivers during initial suspension and playback', () => {
  let next = 0;
  const frames = new Set<number>(), timers = new Set<number>();
  const requireWindow = (value: unknown) => { if (value !== browser) throw new TypeError('Illegal invocation'); };
  const browser = {
    performance: { now() { assert.equal(this, browser.performance); return 0; } },
    requestAnimationFrame() { requireWindow(this); const id = ++next; frames.add(id); return id; },
    cancelAnimationFrame(id: number) { requireWindow(this); frames.delete(id); },
    setTimeout() { requireWindow(this); const id = ++next; timers.add(id); return id; },
    clearTimeout(id: number) { requireWindow(this); timers.delete(id); },
  };
  const clock = roomBrowserClock(browser as unknown as Parameters<typeof roomBrowserClock>[0]);
  // Positive control: the previous host assignment fails as soon as the initial scene suspends.
  const broken = createRoomMotion(pose(0), {...clock.motion, cancel: browser.cancelAnimationFrame, paint() {}});
  assert.throws(() => broken.suspend(true), /Illegal invocation/);
  const motion = createRoomMotion(pose(0), {...clock.motion, paint() {}});
  assert.doesNotThrow(() => motion.suspend(true));
  motion.suspend(false); motion.move(pose(1)); assert.equal(frames.size, 1);
  motion.suspend(true); assert.equal(frames.size, 0);
  const playback = createRoomPlayback(9, {...clock.playback, advance() {}, state() {}});
  playback.play(0); assert.equal(timers.size, 1);
  playback.pause(); assert.equal(timers.size, 0);
  motion.dispose(); playback.dispose();
});
function motionHarness() {
  let now = 0, id = 0, output: RoomFrame;
  const frames = new Map<number, () => void>();
  const engine = createRoomMotion(pose(3), {
    now: () => now, request: callback => { frames.set(++id, callback); return id; }, cancel: key => { frames.delete(key); }, paint: value => { output = value; },
  });
  engine.repaint();
  return { engine, frames, read: () => output!, at(value: number) { now = value; const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn => fn()); } };
}

test('all adjacent layouts walk around permanent tables, including group-break-return', () => {
  for (let count = 15; count <= 25; count++) for (let interest = 0; interest < 3; interest++) {
    for (let step = 0; step < phases.length - 1; step++) {
      const from = peopleForPhase(phases[step].id, count, interest), to = peopleForPhase(phases[step + 1].id, count, interest);
      from.forEach((person, id) => {
        const route = walkRoute(person, to[id]);
        assert.deepEqual(route[0], person);
        assert.deepEqual(route.at(-1), to[id]);
        route.slice(1).forEach((point, i) => assert.ok(clearWalkSegment(route[i], point), `${count}/${interest}/${step}/${id}`));
      });
    }
  }
});

test('group seats persist through the break and people return to the same places', () => {
  for (let interest = 0; interest < 3; interest++) {
    assert.deepEqual(pose(3, interest).people, pose(5, interest).people);
    assert.notDeepEqual(pose(3, interest).people, pose(4, interest).people);
    assert.deepEqual(pose(3, interest).papers, pose(4, interest).papers);
    assert.deepEqual(pose(4, interest).papers, pose(5, interest).papers);
  }
});

test('direct jumps between any two activities have safe routes for every interest', () => {
  for (let interest = 0; interest < 3; interest++) for (let from = 0; from < 9; from++) for (let to = 0; to < 9; to++) {
    const a = pose(from, interest), b = pose(to, interest);
    a.people.forEach((p, i) => {
      const route = walkRoute(p, b.people[i]);
      route.slice(1).forEach((point, j) => assert.ok(clearWalkSegment(route[j], point)));
    });
  }
});

test('people, camera and paper targets share the same intermediate frame', () => {
  const h = motionHarness();
  h.engine.follow(true, false); h.engine.move(pose(6));
  h.at(1000);
  const frame = h.read();
  assert.notDeepEqual(frame.people, pose(3).people);
  assert.notDeepEqual(frame.people, pose(6).people);
  assert.deepEqual(frame.camera, cameraForVisitor(frame.people[6], true));
  const paper = frame.papers[0], original = pose(3).papers[0], target = pose(6).papers[0];
  assert.equal(paper.x, (original.x + target.x) / 2);
  assert.equal(paper.y, (original.y + target.y) / 2);
  const object = roomObjectsForPhase('assembly').find(o => o.stage === 0)!;
  const projected = projectRoomObject({...object, x: paper.x, y: paper.y}, frame.camera);
  assert.equal(projected.left, (paper.x * frame.camera.scale + frame.camera.x) / 8);
  h.at(TRAVEL_MS); assert.equal(h.read().travelling, false); assert.equal(h.frames.size, 0);
});

test('rapid selection replaces a journey from the current position without teleporting', () => {
  const h = motionHarness(); h.engine.move(pose(4)); h.at(800);
  const before = structuredClone(h.read().people);
  h.engine.move(pose(5, 2));
  assert.deepEqual(h.read().people, before);
  assert.equal(h.frames.size, 1);
  h.at(2800);
  assert.deepEqual(h.read().people, pose(5, 2).people.map(({x,y}) => ({x,y})));
  assert.equal(h.frames.size, 0);
});

test('inspection or leaving the scene freezes motion and resumes without a catch-up jump', () => {
  const h = motionHarness(); h.engine.move(pose(4)); h.at(600); h.engine.suspend(true);
  const paused = structuredClone(h.read());
  h.at(9000); assert.deepEqual(h.read(), paused); assert.equal(h.frames.size, 0);
  h.engine.suspend(false); assert.deepEqual(h.read().people, paused.people);
  h.at(10400); assert.equal(h.read().travelling, false); assert.equal(h.frames.size, 0);
});

test('changing the viewpoint mid-walk does not restart or interrupt the journey', () => {
  const h = motionHarness(); h.engine.move(pose(4)); h.at(500);
  const before = structuredClone(h.read().people);
  h.engine.follow(true);
  assert.deepEqual(h.read().people, before);
  h.at(1200); assert.equal(h.read().camera.scale, 1.72);
  h.at(2000);
  assert.deepEqual(h.read().people, pose(4).people.map(({x,y}) => ({x,y})));
  assert.equal(h.frames.size, 0);
});

test('view controls work while paused without moving the participant', () => {
  const h = motionHarness(); h.engine.move(pose(4)); h.at(600); h.engine.suspend(true);
  const people = structuredClone(h.read().people);
  h.engine.follow(true);
  assert.deepEqual(h.read().camera, cameraForVisitor(people[6], true));
  assert.deepEqual(h.read().people, people);
  assert.equal(h.frames.size, 0);
  h.engine.follow(false);
  assert.ok(h.read().camera.x === 0 && h.read().camera.y === 0 && h.read().camera.scale === 1);
  assert.deepEqual(h.read().people, people);
  h.engine.suspend(false); h.at(2000);
  assert.deepEqual(h.read().people, pose(4).people.map(({x,y}) => ({x,y})));
});

test('reduced motion snaps to the selected state and disposal cancels future frames', () => {
  const h = motionHarness(); h.engine.move(pose(4)); h.at(500);
  h.engine.move(pose(8), false); h.engine.follow(true, false);
  assert.equal(h.read().travelling, false);
  assert.deepEqual(h.read().people, pose(8).people);
  h.engine.dispose(); h.at(20000); assert.equal(h.frames.size, 0);
});

test('every sampled route point remains furniture-safe and endpoints are exact', () => {
  const route = walkRoute({x: 183, y: 253}, {x: 183, y: 389});
  assert.ok(route.length > 2);
  for (let i = 0; i <= 100; i++) { const p = sampleRoute(route, i / 100); assert.ok(clearWalkSegment(p, p)); }
  assert.deepEqual(sampleRoute(route, 0), route[0]);
  assert.deepEqual(sampleRoute(route, 1), route.at(-1));
});

test('playback advances after the initial dwell, then every four seconds, and stops at the end', () => {
  let now = 0, id = 0, playing = false; const steps: number[] = [];
  const timers = new Map<number, {at: number; callback: () => void}>();
  const controller = createRoomPlayback(3, {
    delay: (callback, ms) => { timers.set(++id, {at: now + ms, callback}); return id; },
    cancel: id => { timers.delete(id); }, advance: index => steps.push(index), state: value => { playing = value; },
  });
  const at = (time: number) => { now = time; for (const [id,t] of timers) if (t.at <= now) { timers.delete(id); t.callback(); } };
  assert.equal(CYCLE_MS, 4000);
  controller.play(0); at(1999); assert.deepEqual(steps, []);
  at(2000); assert.deepEqual(steps, [1]); at(5999); assert.deepEqual(steps, [1]);
  at(6000); assert.deepEqual(steps, [1,2]); at(10000); assert.equal(playing, false); assert.equal(timers.size, 0);
  controller.play(0); const stale = [...timers.values()][0].callback; controller.pause(); stale();
  assert.deepEqual(steps, [1,2]); assert.equal(timers.size, 0);
  controller.play(0, 1000); at(12999); assert.deepEqual(steps, [1,2]); at(13000); assert.deepEqual(steps, [1,2,1]);
  controller.dispose(); assert.equal(timers.size, 0);
});
