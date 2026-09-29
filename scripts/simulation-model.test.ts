import assert from 'node:assert/strict';
import test from 'node:test';
import { phases, interests, peopleForPhase, papersForPhase, cameraForVisitor, yourActivity, tables, roomBodyHeight, hasIdleMotion } from '../app/simulation-model.ts';

test('room budget reserves actual heading and controls, with natural overflow on short screens', () => {
  assert.equal(roomBodyHeight(1000, 88, 180, 130), 602);
  // A wrapping heading consumes room space rather than overlapping the toolbar.
  assert.equal(roomBodyHeight(1000, 88, 220, 130), 562);
  assert.equal(roomBodyHeight(1000, 108, 220, 130), 542);
  assert.equal(roomBodyHeight(780, 108, 220, 130), 480);
  assert.equal(roomBodyHeight(600, 108, 220, 130), 480);
});

test('upper-body gestures are limited to five people, including the featured participant', () => {
  const people = peopleForPhase('opening', 20);
  assert.equal(people.filter(p => hasIdleMotion(p.id)).length, 5);
  assert.ok(hasIdleMotion(people.find(p => p.visitor)!.id));
});

test('program preserves two 90-minute sessions with a separate provisional break', () => {
  assert.equal(phases.length, 9);
  assert.equal(new Set(phases.map(p => p.id)).size, 9);
  for (const session of ['Session 1', 'Session 2']) {
    assert.equal(phases.filter(p => p.session === session).reduce((sum,p) => sum+p.minutes,0), 90);
  }
  assert.equal(phases.reduce((sum,p) => sum+p.minutes,0), 210);
  assert.equal(phases.find(p => p.id === 'break')?.minutes, 30);
});

test('all 297 layouts retain the people, balanced groups, and chosen participant without collisions', () => {
  for (let count=15; count<=25; count++) for (let interest=0; interest<3; interest++) for (const phase of phases) {
    const people=peopleForPhase(phase.id,count,interest);
    const context=`${phase.id}, ${count} people, interest ${interest}`;
    assert.equal(people.length,count,context);
    assert.equal(people.filter(p=>p.organizer).length,6,context);
    assert.equal(people.filter(p=>p.visitor).length,1,context);
    assert.equal(new Set(people.map(p=>p.id)).size,count,context);
    assert.equal(new Set(people.map(p=>`${p.x.toFixed(3)},${p.y.toFixed(3)}`)).size,count,context);
    const visitor=people.find(p=>p.visitor)!;
    assert.equal(visitor.id,6,context);
    assert.equal(visitor.group,interest,context);
    const sizes=[0,1,2].map(g=>people.filter(p=>p.group===g).length);
    assert.ok(Math.max(...sizes)-Math.min(...sizes)<=1,context);
    for (const p of people) {
      assert.ok(p.x>=60&&p.x<=740&&p.y>=145&&p.y<=425,context);
      const camera=cameraForVisitor(p,true);
      assert.ok(camera.x<=0 && camera.x>=800-800*camera.scale,context);
      assert.ok(camera.y<=0 && camera.y>=520-520*camera.scale,context);
      const screen={x:p.x*camera.scale+camera.x,y:p.y*camera.scale+camera.y};
      assert.ok(screen.x>=32&&screen.x<=768&&screen.y>=70&&screen.y<=480,context);
    }
    if (['groups','casework','exchange'].includes(phase.id)) {
      const table=tables[interest];
      assert.ok(Math.abs(visitor.x-table.x)<=78 && Math.abs(visitor.y-table.y)<=68,context);
    }
    if (phase.id==='assembly') {
      const reporters=people.filter(p=>p.y===180);
      assert.equal(reporters.length,3,context);
      assert.equal(new Set(reporters.map(p=>p.group)).size,3,context);
      assert.ok(reporters.some(p=>p.visitor),context);
    }
    assert.ok(yourActivity(phase.id,interest).length>30,context);
  }
});

test('worksheets move to all other tables while participants stay in their groups', () => {
  const before=papersForPhase('casework'), after=papersForPhase('exchange');
  assert.deepEqual(new Set(after.map(p=>p.x)),new Set(tables.map(t=>t.x)));
  before.forEach((paper,i)=>{assert.equal(paper.id,after[i].id); assert.notEqual(paper.x,after[i].x);});
  for (let interest=0;interest<3;interest++) {
    assert.deepEqual(peopleForPhase('casework',20,interest),peopleForPhase('exchange',20,interest));
  }
});

test('whole-room camera preserves coordinates and chosen interests change the activity', () => {
  for (const p of [{x:0,y:0},{x:400,y:260},{x:800,y:520}]) assert.deepEqual(cameraForVisitor(p,false),{scale:1,x:0,y:0});
  assert.equal(new Set(interests.map((_,i)=>yourActivity('casework',i))).size,3);
  for (const count of [0,14,26,20.5,NaN]) assert.throws(()=>peopleForPhase('opening',count),RangeError);
  for (const interest of [-1,3,.5,NaN]) assert.throws(()=>peopleForPhase('groups',20,interest),RangeError);
});
