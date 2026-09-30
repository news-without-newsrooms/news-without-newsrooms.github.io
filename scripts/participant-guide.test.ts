import assert from 'node:assert/strict';
import test from 'node:test';
import { participantBrief } from '../app/participant-guide.ts';
import { phases, interests, papersForPhase, tables } from '../app/simulation-model.ts';
import { roomObjectContent, roomObjectsForPhase } from '../app/room-objects.ts';

test('every phase and interest has a concise participant action, takeaway and available preview', () => {
  for (const phase of phases) for (let interest = 0; interest < interests.length; interest++) {
    const brief = participantBrief(phase.id, interest);
    assert.ok(brief.action.split(/\s+/).length <= 23, `${phase.id}: action must stay readable`);
    assert.ok(brief.takeaway.split(/\s+/).length <= 12);
    assert.ok(roomObjectsForPhase(phase.id).some(object => object.id === brief.material));
    assert.doesNotThrow(() => roomObjectContent(brief.material, phase.id, interest));
  }
  assert.equal(new Set(interests.map((_,i) => participantBrief('casework',i).action)).size,3);
  for (const interest of [-1,3,.5,NaN]) assert.throws(() => participantBrief('casework',interest),RangeError);
});

test('exchange guidance opens the incoming worksheet at this participant’s table', () => {
  const papers = papersForPhase('exchange');
  for (let interest = 0; interest < interests.length; interest++) {
    const guide = participantBrief('exchange', interest);
    const content = roomObjectContent(guide.material, 'exchange', interest);
    assert.notEqual(content.stage, interest, 'the outgoing worksheet is no longer at this table');
    assert.equal(content.destination, interests[interest].table);
    assert.equal(papers[content.stage].x, tables[interest].x);
    assert.ok(guide.action.includes(content.interest.table.toLowerCase()));
  }
});
