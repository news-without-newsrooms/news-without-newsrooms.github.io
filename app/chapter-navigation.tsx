'use client';
import { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { chapters, TOUR_DELAY, nextReadingStop, nativeScrollIntent } from './chapter-model';
import { createNavigationController } from './navigation-controller';
import { connectPageScroll, headerOffset } from './page-scroll';
export { chapters } from './chapter-model';

export default function ChapterNavigation() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [available, setAvailable] = useState(false);
  const [cycle, setCycle] = useState(0);
  const actions = useRef({ go: (_index: number) => {}, toggle: () => {} });

  useEffect(() => {
    const desktop = matchMedia('(min-width: 1000px) and (min-height: 650px) and (pointer: fine)');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const sections = [...chapters.map(([id]) => document.getElementById(id)!), document.getElementById('contact')!];
    const html = document.documentElement;
    let frame = 0, auto = false;
    const maxScroll = () => Math.max(0, html.scrollHeight - innerHeight);
    const currentIndex = () => {
      if (scrollY >= maxScroll() - 4) return sections.length - 1;
      let index = 0;
      sections.forEach((section, i) => { if (section.getBoundingClientRect().top <= headerOffset() + 12) index = i; });
      return index;
    };
    const update = () => {
      frame = 0;
      const index = currentIndex(); setActive(index);
      sections.forEach((section, i) => section.classList.toggle('is-current-chapter', i === index));
    };
    const queueUpdate = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observeScroll = queueUpdate;
    const eligible = () => desktop.matches && !reduce.matches && !document.hidden;
    const controller = createNavigationController({
      now: () => performance.now(),
      frame: callback => requestAnimationFrame(callback),
      cancelFrame: id => cancelAnimationFrame(id),
      delay: (callback, ms) => window.setTimeout(callback, ms),
      cancelDelay: id => clearTimeout(id),
      readY: () => scrollY,
      // Never start a second native smooth-scroll animation beneath the controller.
      writeY: top => window.scrollTo({ top, behavior: 'instant' }),
      maxY: maxScroll,
      reducedMotion: () => reduce.matches,
      canTour: eligible,
      setNativeSnap: enabled => html.classList.toggle('requested-scroll', !enabled),
      nextTourTarget: () => {
        if (scrollY >= maxScroll() - 4) return null;
        const next = sections[currentIndex() + 1];
        const nextTop = next ? next.getBoundingClientRect().top + scrollY : maxScroll() + headerOffset();
        return nextReadingStop(scrollY, nextTop, innerHeight, headerOffset(), maxScroll());
      },
      onState: state => {
        auto = state.playing;
        setPlaying(state.playing); setWaiting(state.waiting);
        if (state.waiting) setCycle(value => value + 1);
      },
      tourDelay: TOUR_DELAY,
    });
    const disconnect = connectPageScroll(destination => controller.navigate(destination));
    const goTo = (element: HTMLElement) => {
      controller.navigate(() => element.id === 'main' || element.id === 'overview'
        ? 0 : element.getBoundingClientRect().top + scrollY - headerOffset());
      history.replaceState(null, '', location.pathname + location.search + (element.id === 'main' || element.id === 'overview' ? '' : '#' + element.id));
    };
    actions.current = {
      go: index => { if (sections[index]) goTo(sections[index]); },
      toggle: () => { if (auto) controller.pause(); else controller.play(); },
    };
    const manualInput = (event: Event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('.chapter-auto') && event.type !== 'wheel' && event.type !== 'touchmove') return;
      const resume = nativeScrollIntent({
        type: event.type, key: event instanceof KeyboardEvent ? event.key : undefined,
        typing: !!target?.closest('input, textarea, select, [contenteditable]'),
        control: !!target?.closest('button, a, summary, [role="tab"]'),
        tab: !!target?.closest('[role="tab"]'), scrollbar: target === html,
        zoom: event instanceof WheelEvent && event.ctrlKey,
      });
      if (resume) controller.nativeInput();
      else controller.pause();
    };
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
      if (!link || link.classList.contains('skip')) return;
      const id = link.getAttribute('href')?.slice(1);
      const target = id ? document.getElementById(id) : null;
      if (!target) return;
      event.preventDefault(); goTo(target);
    };
    const resize = () => {
      const offset = headerOffset() + 'px';
      if (html.style.getPropertyValue('--chapter-offset') !== offset) html.style.setProperty('--chapter-offset', offset);
      const masthead = (document.querySelector('.site-header')?.getBoundingClientRect().height ?? 76) + (document.querySelector('.status-bar')?.getBoundingClientRect().height ?? 30);
      const mastheadValue = masthead + 'px';
      if (html.style.getPropertyValue('--masthead-height') !== mastheadValue) html.style.setProperty('--masthead-height', mastheadValue);
      setAvailable(desktop.matches && !reduce.matches);
      // Mobile address-bar resizing must not cancel a user's selected destination.
      if (auto && !eligible()) controller.pause();
      queueUpdate();
    };
    const visibility = () => { if (document.hidden) controller.pause(); };
    const preference = () => { controller.pause(); resize(); };
    const hash = () => {
      const target = document.getElementById(location.hash.slice(1));
      if (target) controller.navigate(() => target.getBoundingClientRect().top + scrollY - headerOffset());
    };
    // Passive input listeners cancel our work without consuming native wheel/touch input.
    const inputs = ['wheel', 'pointerdown', 'touchstart', 'touchmove', 'keydown', 'focusin'];
    // Cancel before React handles the same input and requests a new destination.
    inputs.forEach(type => document.addEventListener(type, manualInput, { passive: true, capture: true }));
    document.addEventListener('click', click);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('scroll', observeScroll, { passive: true });
    window.addEventListener('resize', resize);
    window.addEventListener('hashchange', hash);
    desktop.addEventListener('change', preference); reduce.addEventListener('change', preference);
    const header = document.querySelector('.site-header');
    const observer = new ResizeObserver(resize);
    if (header) observer.observe(header);
    resize(); update();
    // Tour playback is explicit. Page loading, scrolling, and resizing never start it.
    return () => {
      controller.dispose(); disconnect(); observer.disconnect(); cancelAnimationFrame(frame);
      sections.forEach(section => section.classList.remove('is-current-chapter'));
      inputs.forEach(type => document.removeEventListener(type, manualInput, true));
      document.removeEventListener('click', click); document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('scroll', observeScroll); window.removeEventListener('resize', resize);
      window.removeEventListener('hashchange', hash);
      desktop.removeEventListener('change', preference); reduce.removeEventListener('change', preference);
    };
  }, []);

  return <nav className="chapter-nav" aria-label="Chapter navigation" hidden={active >= chapters.length}>
    <span className="chapter-position" aria-hidden="true">{String(active + 1).padStart(2, '0')}</span>
    <div className="chapter-dots">{chapters.map(([id, name], index) => <a key={id} href={'#' + id} aria-label={name} aria-current={index === active ? 'location' : undefined} onClick={event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); actions.current.go(index);
    }}><span className="chapter-dot" aria-hidden="true"/><span className="chapter-tooltip" aria-hidden="true">{name}</span></a>)}</div>
    <button className="chapter-auto" type="button" hidden={!available} aria-label={playing ? 'Pause automatic tour' : 'Play automatic tour, advancing every 3 seconds'} aria-pressed={playing} onClick={() => actions.current.toggle()}>
      {playing ? <Pause size={13} aria-hidden="true"/> : <Play size={13} aria-hidden="true"/>}
      {playing && waiting && <svg key={cycle} className="tour-progress" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15"/></svg>}
      <span className="chapter-tooltip" aria-hidden="true">{playing ? 'Pause tour · 3s' : 'Play tour · 3s'}</span>
    </button>
  </nav>;
}
