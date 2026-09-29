import assert from 'node:assert/strict';
import test from 'node:test';
import { nextReadingStop, TOUR_DELAY } from '../app/chapter-model.ts';
import { papersForPhase } from '../app/simulation-model.ts';
import { roomObjectsForPhase } from '../app/room-objects.ts';

test('the three-second tour aligns short chapters and preserves long chapter content', () => {
  assert.equal(TOUR_DELAY, 3000);
  assert.equal(nextReadingStop(0, 900, 900, 88, 9000), 812);
  let y = 0;
  const stops = [y];
  while (y < 2400 - 88) {
    const next = nextReadingStop(y, 2400, 900, 88, 9000);
    assert.ok(next > y);
    assert.ok(next - y <= 900 - 88 + 12, 'no unseen screen between stops');
    y = next; stops.push(y);
  }
  assert.equal(y, 2312);
  assert.ok(stops.length >= 4);
});

test('the tour clamps to the end of the page, never moves backward, and makes no loop', () => {
  assert.equal(nextReadingStop(2800, 3600, 900, 88, 3100), 3100);
  assert.equal(nextReadingStop(3100, 3600, 900, 88, 3100), 3100);
  assert.equal(nextReadingStop(1000, 900, 900, 88, 9000), 1000);
});

test('all visible worksheet papers have matching targets, including papers below the board', () => {
  for (const phase of ['groups', 'casework', 'assembly', 'exchange', 'closing'] as const) {
    const objects = roomObjectsForPhase(phase);
    for (const paper of papersForPhase(phase)) {
      const target = objects.find(item => item.id === `worksheet-${paper.id}`)!;
      assert.ok(target);
      assert.equal(target.x, paper.x);
      assert.equal(target.y, paper.y);
    }
  }
  // At a narrow 280px map, the three gathered sheets still have separate 24px targets.
  const gathered = papersForPhase('closing');
  assert.ok((gathered[1].x - gathered[0].x) / 800 * 280 >= 24);
});
