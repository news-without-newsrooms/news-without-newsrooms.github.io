/** Illustrative spatial layouts, not a confirmed venue or attendance plan. */
export const phases = [
  { id: 'opening', title: 'Opening scene', session: 'Session 1', minutes: 10, action: 'Everyone looks at a composite post and notes what they would check before believing or sharing it.', output: 'A first question from each person.', screen: 'What would you check?', mode: 'plenary' },
  { id: 'panel', title: 'Panel conversation', session: 'Session 1', minutes: 25, action: 'Three proposed panel voices connect a case to a decision in journalism, platforms, or policy. Participants contribute question cards.', output: 'Different perspectives on the same situation. Speakers are not yet confirmed.', screen: 'Journalism · Platforms · Policy', mode: 'plenary' },
  { id: 'lightning', title: 'Lightning contributions', session: 'Session 1', minutes: 45, action: 'Up to fifteen contributors each share one situation and one question in three minutes. Everyone listens for connections to their own work.', output: 'A collection of cases and questions to bring into the group work.', screen: 'One situation · One question', mode: 'plenary' },
  { id: 'groups', title: 'Choose a stage group', session: 'Session 1', minutes: 10, action: 'People join the post, spread, or aftermath group. Organizers balance the groups across experiences and contexts.', output: 'Three stage groups, with pairs or trios working within each.', screen: 'Find your starting point', mode: 'groups' },
  { id: 'break', title: 'Conference break', session: 'Between sessions', minutes: 30, action: 'An informal pause between the two sessions. This plan allows thirty minutes; the conference will determine the actual break.', output: 'Time to pause and continue conversations. Break duration is provisional.', screen: 'A pause between sessions', mode: 'break' },
  { id: 'casework', title: 'Work with a case', session: 'Session 2', minutes: 35, action: 'Pairs or trios use the shared worksheet to connect a record, an interface cue, a user action, and an unanswered question.', output: 'A worksheet that separates observations, unknowns, and disagreements.', screen: 'See · Verify · Do', mode: 'groups' },
  { id: 'assembly', title: 'Assemble the sequence', session: 'Session 2', minutes: 15, action: 'Each group contributes its findings to a shared sequence. Participants compare what is documented, unknown, or disputed.', output: 'One sequence connecting the post, its spread, and its aftermath.', screen: 'Connect the three stages', mode: 'assembly' },
  { id: 'exchange', title: 'Exchange & transfer', session: 'Session 2', minutes: 20, action: 'Worksheets move to another stage group. People test what an idea would need to work at another stage or in another context.', output: 'An intervention hypothesis, its conditions, and possible failure modes.', screen: 'What changes in another context?', mode: 'exchange' },
  { id: 'closing', title: 'Questions & next steps', session: 'Session 2', minutes: 20, action: 'The whole room compares and ranks research questions, keeps dissent visible, and identifies volunteer owners and next steps.', output: 'Research questions with people and practical next steps attached.', screen: 'What should we pursue together?', mode: 'plenary' },
] as const;

export type PhaseId = typeof phases[number]['id'];
export type Point = { x: number; y: number };
export const tables = [
  { x: 183, y: 321, label: 'The post' },
  { x: 400, y: 321, label: 'The spread' },
  { x: 617, y: 321, label: 'The aftermath' },
] as const;

export function audiencePosition(index: number): Point {
  const col = index % 6;
  const row = Math.floor(index / 6);
  return { x: 246 + col * 61, y: 226 + row * 57 };
}

export function groupPosition(index: number, count: number): Point {
  const group = index % 3;
  const seat = Math.floor(index / 3);
  const size = Math.ceil((count - group) / 3);
  const angle = -Math.PI / 2 + seat * Math.PI * 2 / size;
  return { x: tables[group].x + Math.cos(angle) * 78, y: tables[group].y + Math.sin(angle) * 68 };
}

export const interests = [
  { id: 'post', title: 'Credibility & verification', table: 'The post', question: 'What makes a claim worth believing?', focus: 'Examine the cues that suggest credibility and the sources a viewer can actually check.', exchange: 'Try your verification idea during sharing. What could remain visible when a post is clipped or reposted?' },
  { id: 'spread', title: 'Sharing & context', table: 'The spread', question: 'What changes as a claim travels?', focus: 'Follow the context that sharing preserves or removes, and the actions available to viewers and people named.', exchange: 'Try your sharing idea after a correction. What would help an earlier audience encounter new information?' },
  { id: 'aftermath', title: 'Corrections & accountability', table: 'The aftermath', question: 'Who encounters the later information?', focus: 'Separate the existence of a response, correction, or ruling from evidence that the original audience saw it.', exchange: 'Try your correction idea at the first post. What could make a later update easier for the original viewer to find?' },
] as const;

export function yourActivity(id: PhaseId, interest: number) {
  const chosen = interests[interest];
  if (!chosen) throw new RangeError('Choose one of the three interests.');
  if (id === 'groups') return `Your starting group is ${chosen.table}. Organizers will help balance the groups across experiences and contexts.`;
  if (id === 'casework') return chosen.focus;
  if (id === 'exchange') return chosen.exchange;
  if (id === 'assembly') return `Bring your ${chosen.table.toLowerCase()} observations into the shared sequence. What does another group reveal that your record cannot?`;
  if (id === 'break') return 'Take a break and meet someone approaching the topic from another field. This is also a chance to compare questions informally.';
  if (id === 'opening') return `Start with your question: ${chosen.question} Note one thing you would want to inspect in the post.`;
  if (id === 'panel') return `Listen through the lens of ${chosen.title.toLowerCase()}. Add a question for the discussion.`;
  if (id === 'lightning') return `In this example, you give a three-minute contribution about ${chosen.title.toLowerCase()}. Contributors without a lightning slot introduce their work in the group.`;
  return 'Choose a research question you would like to pursue. Suggest a next step, or volunteer to help take it forward.';
}

export function peopleForPhase(id: PhaseId, count: number, interest = 0) {
  if (!Number.isInteger(count) || count < 15 || count > 25) throw new RangeError('Illustrative attendance must be 15–25.');
  if (!Number.isInteger(interest) || interest < 0 || interest > 2) throw new RangeError('Choose one of the three interests.');
  return Array.from({ length: count }, (_, index) => {
    // Swap the visitor with another participant so group sizes and organizer distribution stay constant.
    const layoutIndex = index === 6 ? 6 + interest : index === 6 + interest ? 6 : index;
    let position: Point;
    if (['groups', 'casework', 'exchange'].includes(id)) position = groupPosition(layoutIndex, count);
    else if (id === 'break') {
      const group = index % 3;
      const seat = Math.floor(index / 3);
      position = index === 6 ? { x: 635, y: 166 } : index === 7 ? { x: 680, y: 183 } : { x: [144, 388, 632][group] + (seat % 3 - 1) * 33, y: 295 + Math.floor(seat / 3) * 44 };
    } else if (id === 'panel') {
      position = index < 3 ? { x: 333 + index * 66, y: 165 } : audiencePosition(index - 3);
    } else if (id === 'assembly') {
      const reporters = [0, 1, 2].map(group => group === interest ? 6 : group);
      const reporter = reporters.indexOf(index);
      position = reporter >= 0 ? { x: 326 + reporter * 72, y: 180 } : groupPosition(layoutIndex, count);
    } else if (id === 'lightning') {
      position = index === 6 ? { x: 584, y: 164 } : audiencePosition(index < 6 ? index : index - 1);
    } else position = index === 0 ? { x: 584, y: 164 } : audiencePosition(index - 1);
    return { ...position, id: index, organizer: index < 6, group: layoutIndex % 3, visitor: index === 6 };
  });
}

export function papersForPhase(id: PhaseId) {
  return tables.map((_, index) => {
    if (id === 'assembly' || id === 'closing') return { id: index, x: 320 + index * 80, y: 138 };
    const recipient = id === 'exchange' ? (index + 1) % 3 : index;
    return { id: index, x: tables[recipient].x, y: tables[recipient].y - 11 };
  });
}

export function cameraForVisitor(point: Point, following: boolean) {
  const scale = following ? 1.72 : 1;
  return {
    scale,
    x: Math.max(800 - 800 * scale, Math.min(0, 400 - point.x * scale)),
    y: Math.max(520 - 520 * scale, Math.min(0, 280 - point.y * scale)),
  };
}

export const thoughtBubbles: Record<PhaseId, string> = {
  opening: 'What can I check?', panel: 'Who could answer that?', lightning: 'Here is my case.',
  groups: 'I’ll start here.', break: 'What are you working on?', casework: 'What does the record show?',
  assembly: 'How does this connect?', exchange: 'Would that work here?', closing: 'What should we try next?',
};
