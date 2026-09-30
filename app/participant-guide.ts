import { interests } from './simulation-model.ts';
import type { PhaseId } from './simulation-model.ts';
import type { RoomObjectId } from './room-objects.ts';

type ParticipantBrief = { action: string; takeaway: string; material: RoomObjectId; materialLabel: string };

/** A possible participant's visit, using the proposed program rather than extra tasks. */
export function participantBrief(phase: PhaseId, interest: number): ParticipantBrief {
  if (!Number.isInteger(interest) || !interests[interest]) throw new RangeError('Choose one of the three interests.');
  const chosen = interests[interest];
  const worksheet = `worksheet-${interest}` as RoomObjectId;
  switch (phase) {
    case 'opening': return {
      action: ['Look at the composite post. Note a source or credibility cue you would check.', 'Look at the composite post. Note what you would check before passing it on.', 'Look at the composite post. Ask how you would find a later correction.'][interest],
      takeaway: 'One question to bring into the conversation.', material: 'materials', materialLabel: 'Case pack',
    };
    case 'panel': return {
      action: `Listen for ${['how people verify a claim', 'how context changes during sharing', 'how later information reaches people'][interest]}. Add a question for the panel.`,
      takeaway: 'Journalism, platform, and policy perspectives on your question.', material: 'board', materialLabel: 'Shared board',
    };
    case 'lightning': return {
      action: 'In this example, share one situation and one question in three minutes. Others introduce theirs in groups.',
      takeaway: 'Other cases to connect with your own.', material: 'materials', materialLabel: 'Case pack',
    };
    case 'groups': return {
      action: `Join ${chosen.table.toLowerCase()} group. Meet people with different backgrounds; organizers help balance the groups.`,
      takeaway: 'A starting table and partners for the casework.', material: worksheet, materialLabel: 'Your worksheet',
    };
    case 'break': return {
      action: 'Pause for coffee. Compare questions with someone from another field, or take a quiet break.',
      takeaway: 'Room to recharge before working together.', material: 'materials', materialLabel: 'Case pack',
    };
    case 'casework': return {
      action: ['With a partner or trio, inspect a credibility cue. Separate what viewers can check from what remains unknown.', 'With a partner or trio, compare a post and repost. Mark the context that survives or disappears.', 'With a partner or trio, examine a later update. Separate its availability from evidence that people saw it.'][interest],
      takeaway: 'An observation, an unknown, and a research question.', material: worksheet, materialLabel: 'Your worksheet',
    };
    case 'assembly': return {
      action: `Share an observation from ${chosen.table.toLowerCase()}. Listen for what the other two stages add or challenge.`,
      takeaway: 'One sequence, with gaps and disagreements still visible.', material: 'board', materialLabel: 'Shared board',
    };
    case 'exchange': {
      // Papers travel clockwise; show the incoming paper, not the one that just left.
      const source = (interest + 2) % interests.length;
      return {
        action: `Receive ${interests[source].table.toLowerCase()} worksheet. Try an idea from it at ${chosen.table.toLowerCase()} stage. What must change?`,
        takeaway: 'A possible intervention, its conditions, and failure points.',
        material: `worksheet-${source}` as RoomObjectId, materialLabel: 'Incoming worksheet',
      };
    }
    case 'closing': return {
      action: 'Rank the research questions. Keep disagreements visible; suggest a next step or volunteer to take one forward.',
      takeaway: 'A shared agenda with people and next steps attached.', material: 'board', materialLabel: 'Shared board',
    };
  }
}
