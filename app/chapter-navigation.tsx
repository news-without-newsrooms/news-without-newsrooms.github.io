'use client';
import { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

export const chapters = [
  ['overview', 'Overview'], ['workshop', 'The workshop'], ['walkthrough', 'In the room'],
  ['program', 'Program'], ['participate', 'Participate'], ['prepare', 'Before you arrive'],
  ['organizers', 'Organizers'], ['practical', 'Practical details'], ['contact', 'Contact'],
] as const;

export default function ChapterNavigation() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = Math.min(window.innerHeight * .32, 240);
      let index = 0;
      chapters.forEach(([id], i) => {
        if ((document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) <= line) index = i;
      });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) index = chapters.length - 1;
      setActive(previous => previous === index ? previous : index);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();
    return () => { window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); cancelAnimationFrame(frame); };
  }, []);
  return <nav className="chapter-nav" aria-label="Chapter navigation">
    <span className="chapter-position" aria-hidden="true">{String(active + 1).padStart(2, '0')}<span> / {String(chapters.length).padStart(2, '0')}</span></span>
    <label className="sr-only" htmlFor="chapter-select">Jump to a chapter</label>
    <select id="chapter-select" value={chapters[active][0]} onChange={e => { window.location.hash = e.target.value; }}>
      {chapters.map(([id, name]) => <option value={id} key={id}>{name}</option>)}
    </select>
    {active > 0 ? <a href={`#${chapters[active - 1][0]}`} aria-label={`Previous chapter: ${chapters[active - 1][1]}`}><ArrowUp size={17} aria-hidden="true" /></a> : <span className="chapter-disabled" aria-hidden="true"><ArrowUp size={17}/></span>}
    {active < chapters.length - 1 ? <a href={`#${chapters[active + 1][0]}`} aria-label={`Next chapter: ${chapters[active + 1][1]}`}><ArrowDown size={17} aria-hidden="true" /></a> : <span className="chapter-disabled" aria-hidden="true"><ArrowDown size={17}/></span>}
  </nav>;
}
