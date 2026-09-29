import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { phases, interests, papersForPhase, peopleForPhase, cameraForVisitor } from '../app/simulation-model.ts';
import { roomObjectsForPhase, projectRoomObject, roomObjectContent, worksheetPrompts } from '../app/room-objects.ts';

test('only materials, board and visible table documents become interactive', () => {
  for (const phase of phases) {
    const objects=roomObjectsForPhase(phase.id);
    assert.equal(objects.length,5);
    assert.equal(new Set(objects.map(o=>o.id)).size,objects.length);
    assert.ok(objects.every(o=>o.label.startsWith('Open ')));
    assert.ok(objects.every(o=>o.width>0&&o.height>0));
    assert.ok(objects.every(o=>projectRoomObject(o,{scale:1,x:0,y:0}).visible));
    for(let interest=0;interest<3;interest++) {
      const visitor=peopleForPhase(phase.id,20,interest).find(p=>p.visitor)!;
      const camera=cameraForVisitor(visitor,true);
      for(const object of objects) {
        const screen=projectRoomObject(object,camera);
        if(screen.visible) {
          assert.ok(screen.left-screen.width/2>=0 && screen.left+screen.width/2<=100);
          assert.ok(screen.top-screen.height/2>=0 && screen.top+screen.height/2<=100);
        }
      }
    }
  }
});

test('exchanged documents retain their source group content while their location changes', () => {
  const before=roomObjectsForPhase('casework'), after=roomObjectsForPhase('exchange');
  for(let stage=0;stage<3;stage++) {
    const first=before.find(o=>o.stage===stage)!, moved=after.find(o=>o.id===first.id)!;
    assert.notEqual(first.x,moved.x);
    assert.equal(moved.x,papersForPhase('exchange')[stage].x);
    const content=roomObjectContent(moved.id,'exchange',(stage+1)%3);
    assert.equal(content.stage,stage);
    assert.equal(content.interest,interests[stage]);
    assert.equal(content.destination,interests[(stage+1)%3].table);
    assert.ok(moved.label.includes(content.destination.toLowerCase()));
  }
});

test('material and board previews use the visitor interest and current workshop activity', () => {
  for(const phase of phases) for(let interest=0;interest<3;interest++) for(const id of ['materials','board'] as const) {
    const content=roomObjectContent(id,phase.id,interest);
    assert.equal(content.phase,phase);
    assert.equal(content.stage,interest);
    assert.ok(content.record.visible && content.record.unknown);
  }
});

test('all seven disclosed prompts match the printable worksheet', () => {
  const worksheet=readFileSync(new URL('../public/worksheet.html',import.meta.url),'utf8');
  assert.equal(worksheetPrompts.length,7);
  worksheetPrompts.forEach(([title,description],i)=>{
    assert.ok(worksheet.includes(`${i+1}. ${title}`),title);
    assert.ok(worksheet.includes(description),description);
  });
});
