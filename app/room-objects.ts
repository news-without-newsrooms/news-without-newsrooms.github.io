import { interests, papersForPhase, phases } from './simulation-model.ts';
import type { PhaseId, Point } from './simulation-model.ts';

export type RoomObjectId = 'materials' | 'board' | 'worksheet-0' | 'worksheet-1' | 'worksheet-2';
export type RoomObject = Point & { id: RoomObjectId; title: string; label: string; width: number; height: number; stage?: number };
export type RoomCamera = { x: number; y: number; scale: number };

/** Only these objects are interactive; scenery and participants remain decorative. */
export function roomObjectsForPhase(phase: PhaseId): RoomObject[] {
  const objects: RoomObject[] = [
    { id: 'materials', title: 'Case pack', label: 'Open the case pack on the desk', x: 140, y: 90, width: 64, height: 42 },
    { id: 'board', title: 'Shared board', label: 'Open the shared workshop board', x: 401, y: 84, width: 256, height: 60 },
  ];
  { // Worksheets stay on the tables throughout the visit.
    const papers = papersForPhase(phase);
    papers.forEach((paper, stage) => {
      const destination = phase === 'exchange' ? (stage + 1) % 3 : stage;
      objects.push({ id: `worksheet-${stage}` as RoomObjectId, title: `${interests[stage].table} worksheet`, label: `Open ${interests[stage].table.toLowerCase()} worksheet${phase === 'exchange' ? `, now at ${interests[destination].table.toLowerCase()} table` : ''}`, x: paper.x, y: paper.y, width: 34, height: 38, stage });
    });
  }
  return objects;
}

export function projectRoomObject(object: RoomObject, camera: RoomCamera) {
  const x = object.x * camera.scale + camera.x;
  const y = object.y * camera.scale + camera.y;
  const width = object.width * camera.scale;
  const height = object.height * camera.scale;
  return { left: x / 8, top: y / 5.2, width: width / 8, height: height / 5.2,
    visible: x - width / 2 >= 2 && x + width / 2 <= 798 && y - height / 2 >= 2 && y + height / 2 <= 518 };
}

export const worksheetPrompts = [
  ['Stage and decision', 'Post / spread / aftermath. Who is deciding what?'],
  ['Record and observation', 'Identify the source. What does it actually show?'],
  ['What users could see, verify, and do', 'Identify visible cues, information, and available actions. Separate availability from actual use.'],
  ['Applicable practice or rule', 'What editorial practice, platform condition, or policy applies in this context?'],
  ['Unknowns and disagreement', 'What cannot be established from this record? Where does the group disagree?'],
  ['One research question', 'Connect a user decision to an interface or system condition.'],
  ['Evidence and context', 'What would answer this question, and in which setting?'],
] as const;

/** Fictional examples already used in the participant guide, not findings from real cases. */
export const practiceRecords = [
  { excerpt: '“According to a source…”', context: 'A news-like post names a source without providing a link.', visible: 'The post uses a source cue. The viewer has no source link to inspect in this example.', unknown: 'Whether the claim was verified, or whether viewers treat the cue as evidence.', question: 'What could a viewer check before believing or sharing this post?' },
  { excerpt: 'A clip travels without its original description.', context: 'A repost preserves the video excerpt but omits its surrounding context.', visible: 'The excerpt and the repost’s immediate context can be compared.', unknown: 'What the new audience understood, and which context they encountered elsewhere.', question: 'What could the sharing interface preserve for the next viewer?' },
  { excerpt: 'An update appears months after the original post.', context: 'Later reporting adds information to a claim that circulated earlier.', visible: 'Later information is available in this example.', unknown: 'Whether the earlier audience encountered, understood, or used the update.', question: 'What route could bring new information to an earlier viewer?' },
] as const;

export function roomObjectContent(id: RoomObjectId, phaseId: PhaseId, interest: number) {
  if (!Number.isInteger(interest) || !interests[interest]) throw new RangeError('Choose one of the three interests.');
  const phase = phases.find(p => p.id === phaseId);
  if (!phase) throw new RangeError('Unknown workshop activity.');
  const stage = id.startsWith('worksheet-') ? Number(id.slice(-1)) : interest;
  if (!interests[stage] || !['materials','board','worksheet-0','worksheet-1','worksheet-2'].includes(id)) throw new RangeError('Unknown room object.');
  return { phase, stage, interest: interests[stage], record: practiceRecords[stage],
    destination: phaseId === 'exchange' ? interests[(stage + 1) % 3].table : interests[stage].table };
}
