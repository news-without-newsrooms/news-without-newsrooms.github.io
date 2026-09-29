'use client';
import { useEffect, useRef } from 'react';
import { ArrowRight, ArrowUpRight, X } from 'lucide-react';
import { interests } from './simulation-model';
import type { PhaseId } from './simulation-model';
import { roomObjectContent, worksheetPrompts } from './room-objects';
import type { RoomObjectId } from './room-objects';

export default function RoomInspector({ object, phase, interest, onClose, onCasework }: {
  object: RoomObjectId | null; phase: PhaseId; interest: number; onClose: () => void; onCasework: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (object && !node.open) node.showModal();
    if (!object && node.open) node.close();
  }, [object]);
  const content = object ? roomObjectContent(object, phase, interest) : null;
  const isSheet = object?.startsWith('worksheet-');
  const title = object === 'materials' ? 'Inside the case pack' : object === 'board' ? 'The shared board' : `${content?.interest.table} worksheet`;
  return <dialog className="room-inspector" ref={dialog} aria-labelledby={content ? "inspector-title" : undefined} aria-describedby={content ? "inspector-context" : undefined} onCancel={onClose} onClose={onClose} onClick={event => {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
  }}>
    {content && <>
      <header className="inspector-header"><span className="inspector-index">{isSheet ? 'WORKING DOCUMENT' : object === 'board' ? 'ON THE WALL' : 'AT THE MATERIALS DESK'}</span><button type="button" onClick={onClose} autoFocus aria-label="Close document"><X size={19} aria-hidden="true"/></button></header>
      <div className="inspector-document">
        <p className="inspector-phase">{content.phase.title} / {content.phase.session}</p>
        <h2 id="inspector-title">{title}</h2>
        <p id="inspector-context" className="inspector-context">{isSheet ? `A preview for ${content.interest.title.toLowerCase()}. ${phase === 'exchange' ? `This worksheet has moved to ${content.destination.toLowerCase()} table.` : 'Use the same seven prompts across all three stage groups.'}` : object === 'board' ? 'A preview of what we will assemble together. These are working prompts, not findings from the workshop.' : 'The planned case pack gives everyone a shared starting point. It will be distributed two weeks before the workshop.'}</p>
        {object === 'materials' && <div className="pack-inventory"><h3>What you will receive</h3><ol><li><span>01</span><div><h4>An anchor sequence</h4><p>Documented records from a Korean accusation-video case, with checked English translations of Korean material.</p></div></li><li><span>02</span><div><h4>Comparison records</h4><p>Korean and Japanese cases with different later outcomes. An outcome does not establish that earlier viewers saw it.</p></div></li><li><span>03</span><div><h4>A common worksheet</h4><p>Seven prompts to connect a record, interface cues, a user decision, and a research question.</p></div></li></ol></div>}
        {object !== 'board' && <section className="practice-record" aria-labelledby="record-preview-title"><div className="record-caption"><span>ILLUSTRATIVE PRACTICE EXCERPT</span><span>{content.interest.table}</span></div><h3 id="record-preview-title">{content.record.excerpt}</h3><p>{content.record.context}</p><details className="record-reveal" key={`${object}-${content.stage}`}><summary>Look closer: what can this record establish?<span aria-hidden="true">+</span></summary><dl><div><dt>Visible in this example</dt><dd>{content.record.visible}</dd></div><div><dt>Still unknown</dt><dd>{content.record.unknown}</dd></div></dl></details><p className="record-question">{content.record.question}</p><p className="record-disclaimer">Fictional example for this preview. The workshop will use documented case records.</p></section>}
        {isSheet && <section className="inspector-prompts"><h3>The seven worksheet prompts</h3><p>Open a prompt to see what your group will work through.</p>{worksheetPrompts.map(([heading, description], index) => <details key={heading}><summary><span>{String(index + 1).padStart(2,'0')}</span>{heading}<span aria-hidden="true">+</span></summary><p>{description}</p></details>)}<div className="transfer-preview"><span className="inspector-index">WHEN WORKSHEETS MOVE</span><p>{content.interest.exchange}</p><p>What conditions must hold, what could fail, and how would you evaluate the idea?</p></div></section>}
        {object === 'board' && <><div className="board-question"><span>THE QUESTION IN THE ROOM</span><p>What can people see, verify, and do at this point?</p></div><ol className="board-sequence">{interests.map((item,index) => <li key={item.id} className={index === interest ? 'is-your-stage' : ''}><span className="board-step">0{index + 1}</span><div><h3>{item.table}{index === interest && <small>Your starting group</small>}</h3><p>{item.question}</p><details><summary>What we put on the board <span aria-hidden="true">+</span></summary><p>{item.focus} Keep observations, unknowns, and disagreements distinct.</p></details></div></li>)}</ol><div className="board-output"><span className="inspector-index">AFTER THIS ACTIVITY</span><p>{content.phase.output}</p></div></>}
      </div>
      <div className="inspector-actions">{object === 'board' ? <button type="button" onClick={onClose}>Back to the room <ArrowRight size={17} aria-hidden="true"/></button> : <><a href={`${import.meta.env.BASE_URL}worksheet.html`} target="_blank" rel="noreferrer">Printable worksheet <ArrowUpRight size={16} aria-hidden="true"/></a><button type="button" onClick={onCasework}>Try the group-work step <ArrowRight size={16} aria-hidden="true"/></button></>}</div>
    </>}
  </dialog>;
}
