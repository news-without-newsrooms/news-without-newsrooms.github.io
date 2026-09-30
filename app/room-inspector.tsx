'use client';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { PhaseId } from './simulation-model';
import { roomObjectContent } from './room-objects';
import type { RoomObjectId } from './room-objects';

export default function RoomInspector({ object, phase, interest, onClose }: {
  object: RoomObjectId | null; phase: PhaseId; interest: number; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const open = object !== null;
  useEffect(() => {
    const node = dialog.current;
    if (!node || !open) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // Non-modal: keep the room visible and other objects available.
    node.show();
    const dismiss = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || node.contains(event.target)) return;
      if (event.target.closest('.room-hotspot, .room-object-shelf button, .participant-material')) return;
      onClose();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
    };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => {
      const returnFocus = node.contains(document.activeElement);
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape);
      node.close();
      if (returnFocus && opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [open, onClose]);
  const content = object ? roomObjectContent(object, phase, interest) : null;
  return <dialog id="room-preview" className="room-preview" ref={dialog} aria-labelledby={open ? 'preview-title' : undefined} aria-describedby={open ? 'preview-note' : undefined}>
    {content && <>
      <header><span>TENTATIVE MATERIAL</span><button type="button" onClick={onClose} autoFocus aria-label="Close material preview"><X size={18} aria-hidden="true" /></button></header>
      <div className="preview-body" key={object}>
        <h3 id="preview-title">{object === 'materials' ? 'Inside the case pack' : object === 'board' ? 'On the shared board' : `${content.interest.table} worksheet`}</h3>
        {object === 'materials' ? <>
          <p>A documented Korean accusation-video sequence, followed through its posts, circulation, and later information.</p>
          <ul><li>Source records with checked English translations</li><li>Korean and Japanese comparison records</li><li>A shared worksheet for your group</li></ul>
          <p id="preview-note" className="preview-note">Planned for two weeks before the workshop. The pack is still being prepared.</p>
        </> : object === 'board' ? <>
          <p className="preview-question">What can people see, verify, and do?</p>
          <div className="preview-stages"><span>01 Post</span><span>02 Spread</span><span>03 Aftermath</span></div>
          <p>Each group adds one observation, one unknown, and one research question.</p>
          <p id="preview-note" className="preview-note">A sample board structure, not workshop findings.</p>
        </> : <>
          <p className="preview-caption">ILLUSTRATIVE EXAMPLE</p>
          <blockquote>{content.record.excerpt}</blockquote>
          <p className="preview-prompt"><strong>Your group’s prompt</strong>{content.record.question}</p>
          <p id="preview-note" className="preview-note">Fictional excerpt. The final worksheet will use documented records.{phase === 'exchange' ? ` Now at ${content.destination.toLowerCase()} table.` : ''}</p>
        </>}
      </div>
    </>}
  </dialog>;
}
