'use client';
import { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { chapters, TOUR_DELAY, canTurnChapter, nextReadingStop } from './chapter-model';
export { chapters } from './chapter-model';

export default function ChapterNavigation() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [available, setAvailable] = useState(false);
  const [cycle, setCycle] = useState(0);
  const controller = useRef({ go: (_index: number) => {}, toggle: () => {} });

  useEffect(() => {
    const desktop = matchMedia('(min-width: 1000px) and (min-height: 650px) and (pointer: fine)');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const sections = chapters.map(([id]) => document.getElementById(id)!);
    const html = document.documentElement;
    let current = 0, auto = false, animating = false, disposed = false;
    let timer = 0, settleTimer = 0, frame = 0, fallback = 0, wheelSum = 0, lastWheel = 0, gestureUntil = 0;
    const header = () => (document.querySelector('.site-header')?.getBoundingClientRect().height ?? 76) + 12;
    const maxScroll = () => Math.max(0, html.scrollHeight - innerHeight);
    const target = (index: number) => index === 0 ? 0 : Math.min(maxScroll(), Math.max(0, sections[index].getBoundingClientRect().top + scrollY - header()));
    const enabled = () => desktop.matches && !reduce.matches;
    const update = () => {
      frame = 0;
      const line = header() + 12;
      current = 0;
      sections.forEach((section, index) => { if (section.getBoundingClientRect().top <= line) current = index; });
      if (scrollY >= maxScroll() - 4) current = sections.length - 1;
      setActive(current);
    };
    const pause = () => { auto = false; clearTimeout(timer); setPlaying(false); };
    const schedule = () => {
      clearTimeout(timer);
      if (!auto || animating || !enabled() || document.hidden) return;
      if (scrollY >= maxScroll() - 4) { pause(); return; }
      setCycle(value => value + 1);
      timer = window.setTimeout(() => {
        const next = current + 1;
        const top = next < sections.length
          ? nextReadingStop(scrollY, sections[next].getBoundingClientRect().top + scrollY, innerHeight, header(), maxScroll())
          : maxScroll();
        move(top);
      }, TOUR_DELAY);
    };
    const finish = () => {
      clearTimeout(fallback); clearTimeout(settleTimer);
      if (!animating || disposed) return;
      animating = false;
      html.classList.remove('chapter-is-moving');
      update(); schedule();
    };
    const move = (top: number) => {
      clearTimeout(timer); clearTimeout(fallback); clearTimeout(settleTimer);
      animating = true;
      html.classList.add('chapter-is-moving');
      window.scrollTo({ top, behavior: reduce.matches ? 'instant' : 'smooth' });
      // Scroll events debounce completion; the fallback also covers no-op moves.
      fallback = window.setTimeout(finish, 1600);
    };
    const go = (index: number) => {
      if (!sections[index]) return;
      pause(); move(target(index));
      history.replaceState(null, '', location.pathname + location.search + (index ? '#' + chapters[index][0] : ''));
    };
    const nestedScroll = (node: Element | null, delta: number) => {
      for (let item = node; item && item !== document.body; item = item.parentElement) {
        if (/(auto|scroll)/.test(getComputedStyle(item).overflowY) && item.scrollHeight > item.clientHeight + 2 &&
          (delta > 0 ? item.scrollTop + item.clientHeight < item.scrollHeight - 2 : item.scrollTop > 2)) return true;
      }
      return false;
    };
    const wheel = (event: WheelEvent) => {
      pause();
      if (!enabled() || event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) ||
        nestedScroll(event.target instanceof Element ? event.target : null, event.deltaY)) return;
      const now = performance.now();
      if (animating || now < gestureUntil) { event.preventDefault(); gestureUntil = now + 160; return; }
      const direction = Math.sign(event.deltaY), next = current + direction;
      if (!direction || !sections[next] || !canTurnChapter(sections[current].getBoundingClientRect(), direction, innerHeight, header())) return;
      event.preventDefault();
      if (now - lastWheel > 180 || Math.sign(wheelSum) !== direction) wheelSum = 0;
      lastWheel = now;
      wheelSum += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
      if (Math.abs(wheelSum) >= 34) { wheelSum = 0; gestureUntil = now + 800; go(next); }
    };
    const interact = (event: Event) => {
      if (event.target instanceof Element && event.target.closest('.chapter-auto')) return;
      pause();
    };
    const scroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
      if (animating) { clearTimeout(settleTimer); settleTimer = window.setTimeout(finish, 140); }
    };
    const resize = () => {
      html.style.setProperty('--chapter-offset', header() + 'px');
      html.classList.toggle('chapter-snapping', enabled());
      setAvailable(enabled());
      if (!enabled()) pause();
      update(); schedule();
    };
    const visibility = () => { if (document.hidden) pause(); };
    const hash = () => {
      const index = chapters.findIndex(([id]) => '#' + id === location.hash);
      if (index >= 0) go(index);
    };
    controller.current = {
      go,
      toggle: () => {
        if (auto) { pause(); return; }
        if (!enabled()) return;
        auto = true; setPlaying(true);
        if (scrollY >= maxScroll() - 4) move(0); else schedule();
      },
    };
    window.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('resize', resize);
    window.addEventListener('hashchange', hash);
    for (const type of ['pointerdown', 'touchstart', 'keydown', 'focusin']) document.addEventListener(type, interact, { passive: true });
    document.addEventListener('visibilitychange', visibility);
    desktop.addEventListener('change', resize);
    reduce.addEventListener('change', resize);
    resize();
    // First visit starts the brief tour. Any reading interaction leaves it paused.
    auto = enabled() && !location.hash && scrollY < 8;
    setPlaying(auto);
    document.fonts.ready.then(() => { if (!disposed) { update(); schedule(); } });
    return () => {
      disposed = true;
      clearTimeout(timer); clearTimeout(fallback); clearTimeout(settleTimer); cancelAnimationFrame(frame);
      window.removeEventListener('wheel', wheel); window.removeEventListener('scroll', scroll);
      window.removeEventListener('resize', resize); window.removeEventListener('hashchange', hash);
      for (const type of ['pointerdown', 'touchstart', 'keydown', 'focusin']) document.removeEventListener(type, interact);
      document.removeEventListener('visibilitychange', visibility);
      desktop.removeEventListener('change', resize); reduce.removeEventListener('change', resize);
      html.classList.remove('chapter-snapping', 'chapter-is-moving');
    };
  }, []);

  return <nav className="chapter-nav" aria-label="Chapter navigation">
    <span className="chapter-position" aria-hidden="true">{String(active + 1).padStart(2, '0')}</span>
    <div className="chapter-dots">{chapters.map(([id, name], index) => <a key={id} href={'#' + id} aria-label={name} aria-current={index === active ? 'location' : undefined} onClick={event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); controller.current.go(index);
    }}><span className="chapter-dot" aria-hidden="true"/><span className="chapter-tooltip" aria-hidden="true">{name}</span></a>)}</div>
    <button className="chapter-auto" type="button" hidden={!available} aria-label={playing ? 'Pause automatic tour' : 'Play automatic tour, advancing every 3 seconds'} aria-pressed={playing} onClick={() => controller.current.toggle()}>
      {playing ? <Pause size={13} aria-hidden="true"/> : <Play size={13} aria-hidden="true"/>}
      {playing && <svg key={cycle} className="tour-progress" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15"/></svg>}
      <span className="chapter-tooltip" aria-hidden="true">{playing ? 'Pause tour · 3s' : 'Play tour · 3s'}</span>
    </button>
  </nav>;
}
