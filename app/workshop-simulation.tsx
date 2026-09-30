'use client';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Play, Pause, ArrowLeft, ArrowRight, RotateCcw, LayoutGrid, UserRound } from 'lucide-react';
import { phases, tables, peopleForPhase, papersForPhase, groupPosition, interests, yourActivity, cameraForVisitor, thoughtBubbles, roomBodyHeight, hasIdleMotion } from './simulation-model';

import { headerOffset, revealSelection } from './page-scroll';
import RoomInspector from './room-inspector';
import { roomObjectsForPhase, projectRoomObject } from './room-objects';
import type { RoomObjectId } from './room-objects';
import PittsburghScene from './pittsburgh-scene';
import { createRoomMotion, createRoomPlayback, roomBrowserClock, TRAVEL_MS } from './room-motion';

const groupColors = ['#637971', '#a27f65', '#687a92'];
const writeAttribute = (node: Element | null | undefined, name: string, value: string) => {
  if (node && node.getAttribute(name) !== value) node.setAttribute(name, value);
};
const writeStyle = (node: HTMLElement, name: string, value: string) => {
  if (node.style.getPropertyValue(name) !== value) node.style.setProperty(name, value);
};

export default function WorkshopSimulation() {
  const [inspecting, setInspecting] = useState<RoomObjectId | null>(null);
  const [step, setStep] = useState(0);
  const count = 20;
  const [interest, setInterest] = useState(0);
  const [following, setFollowing] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [inView, setInView] = useState(false);
  const [ambientMotion, setAmbientMotion] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [motionPaused, setMotionPaused] = useState(false);
  const motion = useRef<ReturnType<typeof createRoomMotion> | null>(null);
  const playback = useRef<ReturnType<typeof createRoomPlayback> | null>(null);
  const personNodes = useRef<(SVGGElement | null)[]>([]);
  const paperNodes = useRef<(SVGGElement | null)[]>([]);
  const miniNodes = useRef<(SVGCircleElement | null)[]>([]);
  const cameraNode = useRef<SVGGElement>(null);
  const objectNodes = useRef<Partial<Record<RoomObjectId, HTMLButtonElement | null>>>({});
  const initial = useRef({people: peopleForPhase('opening', 20), papers: papersForPhase('opening')});
  const root = useRef<HTMLDivElement>(null);
  const roomViewport = useRef<HTMLDivElement>(null);
  const phase = phases[step];
  const grouped = ['groups', 'assembly', 'casework', 'exchange'].includes(phase.id);
  const people = peopleForPhase(phase.id, count, interest);
  const papers = papersForPhase(phase.id);
  const chosen = interests[interest];
  const camera = cameraForVisitor(initial.current.people[6], false);
  const roomObjects = roomObjectsForPhase(phase.id);
  const objectData = useRef(roomObjects);
  objectData.current = roomObjects;
  const pausePlayback = () => playback.current?.pause();
  const closePreview = useCallback(() => setInspecting(null), []);
  const inspect = (id: RoomObjectId) => { pausePlayback(); setInspecting(id); };
  useLayoutEffect(() => {
    motion.current = createRoomMotion(initial.current, {
      ...roomBrowserClock(window).motion,
      paint: frame => {
        if (!root.current) return;
        root.current.dataset.travelling = String(frame.travelling);
        frame.people.forEach((p, i) => {
          writeAttribute(personNodes.current[i], 'transform', `translate(${p.x} ${p.y})`);
          writeAttribute(miniNodes.current[i], 'cx', String(p.x));
          writeAttribute(miniNodes.current[i], 'cy', String(p.y));
        });
        frame.papers.forEach((p, i) => writeAttribute(paperNodes.current[i], 'transform', `translate(${p.x} ${p.y})`));
        writeAttribute(cameraNode.current, 'transform', `translate(${frame.camera.x} ${frame.camera.y}) scale(${frame.camera.scale})`);
        if (roomViewport.current) writeStyle(roomViewport.current, '--room-camera-scale', String(frame.camera.scale));
        objectData.current.forEach(object => {
          const node = objectNodes.current[object.id];
          if (!node) return;
          const movingObject = object.stage === undefined ? object : {...object, x: frame.papers[object.stage].x, y: frame.papers[object.stage].y};
          const position = projectRoomObject(movingObject, frame.camera);
          // Preserve the floating artwork/target clock while a camera view hides an object.
          writeStyle(node, 'visibility', position.visible ? 'visible' : 'hidden');
          writeAttribute(node, 'aria-hidden', String(!position.visible));
          if (node.tabIndex !== (position.visible ? 0 : -1)) node.tabIndex = position.visible ? 0 : -1;
          writeStyle(node, 'left', `${position.left}%`); writeStyle(node, 'top', `${position.top}%`);
          writeStyle(node, 'width', `max(${object.stage === undefined ? 44 : 24}px, ${position.width}%)`);
          writeStyle(node, 'height', `max(${object.stage === undefined ? 44 : 24}px, ${position.height}%)`);
        });
      },
    });
    motion.current.repaint();
    return () => { motion.current?.dispose(); motion.current = null; };
  }, []);
  useLayoutEffect(() => {
    motion.current?.move({people: peopleForPhase(phases[step].id, count, interest), papers: papersForPhase(phases[step].id)}, !reducedMotion);
  }, [step, interest, reducedMotion]);
  useLayoutEffect(() => { motion.current?.follow(following, !reducedMotion); }, [following, reducedMotion]);
  useLayoutEffect(() => { motion.current?.suspend(!inView || !pageVisible || !!inspecting || motionPaused); }, [inView, pageVisible, inspecting, motionPaused]);
  useEffect(() => {
    playback.current = createRoomPlayback(phases.length, {
      ...roomBrowserClock(window).playback,
      advance: setStep, state: setPlaying,
    });
    return () => { playback.current?.dispose(); playback.current = null; };
  }, []);
  useEffect(() => {
    if (!inView || !pageVisible || reducedMotion) playback.current?.pause();
  }, [inView, pageVisible, reducedMotion]);
  useEffect(() => {
    const element = root.current;
    const section = element?.closest<HTMLElement>('.simulation-chapter');
    if (!element || !section) return;
    const heading = section.querySelector<HTMLElement>('.section-heading')!;
    const toolbar = element.querySelector<HTMLElement>('.simulation-toolbar')!;
    const controls = element.querySelector<HTMLElement>('.simulation-controls')!;
    const notes = element.querySelector<HTMLElement>('.visit-notes>summary')!;
    const desktop = matchMedia('(min-width:1000px) and (min-height:600px)');
    let frame = 0, disposed = false;
    const measure = () => {
      frame = 0;
      if (!desktop.matches) { element.style.removeProperty('--visit-body-height'); return; }
      // Read only on resize/layout changes, never on scroll or animation frames.
      const beforeBody = element.getBoundingClientRect().top - section.getBoundingClientRect().top + toolbar.getBoundingClientRect().height + 1;
      const afterBody = controls.getBoundingClientRect().height + notes.getBoundingClientRect().height + parseFloat(getComputedStyle(section).paddingBottom) + 3;
      const value = roomBodyHeight(innerHeight, headerOffset(), beforeBody, afterBody) + 'px';
      if (element.style.getPropertyValue('--visit-body-height') !== value) element.style.setProperty('--visit-body-height', value);
    };
    const queue = () => { if (!disposed && !frame) frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(queue);
    [heading, toolbar, controls, notes, document.querySelector('.site-header')].forEach(node => { if (node) observer.observe(node); });
    window.addEventListener('resize', queue);
    void document.fonts.ready.then(queue);
    queue();
    return () => { disposed = true; observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener('resize', queue); };
  }, []);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => { setReducedMotion(preference.matches); if (preference.matches) pausePlayback(); };
    sync(); preference.addEventListener('change', sync);
    return () => preference.removeEventListener('change', sync);
  }, []);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio >= .05), { threshold: [0, .05] });
    if (roomViewport.current) observer.observe(roomViewport.current);
    const pauseWhenHidden = () => { setPageVisible(!document.hidden); if (document.hidden) pausePlayback(); };
    pauseWhenHidden();
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', pauseWhenHidden); };
  }, []);
  const revealScene = () => revealSelection(() => root.current?.querySelector<HTMLElement>('.phase-list') ?? null);
  const chooseStep = (index: number) => { pausePlayback(); setMotionPaused(false); setInspecting(null); setStep(Math.max(0, Math.min(phases.length - 1, index))); revealScene(); };
  const play = () => {
    if (playing) { pausePlayback(); setMotionPaused(true); return; }
    setInspecting(null); setMotionPaused(false); revealScene();
    const restart = step === phases.length - 1;
    if (restart) setStep(0);
    playback.current?.play(restart ? 0 : step, restart ? TRAVEL_MS : motion.current?.remaining() ?? 0);
  };
  const playFullVisit = () => {
    if (playing) { play(); return; }
    setInspecting(null); setMotionPaused(false); setStep(0); revealScene();
    playback.current?.play(0, step === 0 ? motion.current?.remaining() ?? 0 : TRAVEL_MS);
  };

  return <div className={`workshop-simulation ${playing && inView ? 'is-playing' : ''} ${ambientMotion && inView && pageVisible && !reducedMotion && !inspecting && !motionPaused ? 'is-animated' : ''}`} ref={root}>
    <div className="simulation-toolbar"><div><span className="simulation-caption">PITTSBURGH · WORKSHOP PREVIEW</span></div><span className="visitor-key"><svg viewBox="0 0 28 36" width="24" height="31" aria-hidden="true" shapeRendering="crispEdges"><path d="M7 21h5v12H7m9-12h5v12h-5" fill="#586566"/><path d="M6 13h16v13H6" fill="#47757c"/><path d="M8 2h12v12H8" fill="#d5ae8b"/><path d="M7 0h14v5H7m0 5h3v4H7" fill="#554b3d"/><path d="M11 8h2v2h-2m5-2h2v2h-2" fill="#303d39"/><path d="M12 14h4v11h-4" fill="#eee8d7"/></svg><span>Your participant</span></span></div>
    <div className="simulation-body">
      <PittsburghScene />
      <aside className="simulation-console" aria-label="Your visit controls">
    <fieldset className="interest-options"><legend>Your perspective</legend><div className="interest-grid">{interests.map((item, index) => <label key={item.id} className={interest === index ? 'is-selected' : ''}><input type="radio" name="workshop-interest" value={item.id} checked={interest === index} onChange={() => { pausePlayback(); setMotionPaused(false); setInspecting(null); setInterest(index); setFollowing(true); revealScene(); }}/><span><strong>{item.title}</strong></span></label>)}</div><p className="interest-question">{chosen.question}</p></fieldset>
      <p className="phase-label">Explore the day</p>
      <nav className="phase-list" aria-label="Workshop moments">
        {phases.map((p, index) => <button type="button" key={p.id} aria-controls="workshop-scene" aria-label={`${String(index + 1).padStart(2, '0')}. ${p.title}, ${p.minutes} minutes`} className={index === step ? 'is-current' : ''} onClick={() => chooseStep(index)} aria-current={index === step ? 'step' : undefined}><span className="phase-order">{String(index + 1).padStart(2, '0')}</span><span className="phase-name">{['Opening','Panel','Talks','Groups','Break','Casework','Share','Exchange','Next steps'][index]}</span><small>{p.minutes}m</small></button>)}
      </nav>
      </aside>
      <div className="simulation-scene" id="workshop-scene" role="region" aria-labelledby="simulation-scene-title">
        <div className="scene-caption" aria-live={playing ? 'off' : 'polite'}><span>{String(step + 1).padStart(2, '0')} / 09</span><strong id="simulation-scene-title">{phase.title}</strong><small>Workshop time · {phase.minutes} min</small></div>
        <div className="view-controls" role="group" aria-label="Room view and playback">
          <div className="view-switch" role="group" aria-label="Viewpoint">
            <button type="button" aria-pressed={!following} onClick={() => setFollowing(false)}><LayoutGrid size={14} aria-hidden="true"/><span>Whole room</span></button>
            <button type="button" aria-pressed={following} aria-label="Follow a participant" onClick={() => setFollowing(true)}><UserRound size={14} aria-hidden="true"/><span>Follow<span className="view-label-detail"> participant</span></span></button>
          </div>
          <button type="button" className="scene-play" onClick={playFullVisit} disabled={reducedMotion} aria-label={playing ? 'Pause the visit' : 'Play all nine activities from the beginning'} title={reducedMotion ? 'Reduced motion is on. Use the numbered activities.' : playing ? 'Pause the visit' : 'Play the full visit, from Opening to Next steps'}>
            {playing ? <Pause size={15} aria-hidden="true"/> : <Play size={15} aria-hidden="true"/>}<span>{playing ? 'Pause' : 'Play'}</span><span className="scene-play-range" aria-hidden="true">01–09</span>
          </button>
        </div>
        <div className="room-stage"><div className="room-viewport" ref={roomViewport}><svg className="room-map" viewBox="0 0 800 520" role="img" aria-labelledby="room-title room-description">
          <title id="room-title">{`${phase.title}: an illustrative workshop room`}</title>
          <desc id="room-description">{count} people including six organizers. {phase.action} Pixel characters represent participants. Your chosen interest is {chosen.title}. People and furniture show a possible arrangement, not a confirmed room plan.</desc>
          <defs>
            <pattern id="floor-grain" width="96" height="36" patternUnits="userSpaceOnUse"><rect width="96" height="36" fill="#e1d3b9"/><path d="M0 0H96M0 18H96M0 36H96M24 0V18M72 18V36" stroke="#cbbc9f" strokeWidth="1"/><path d="M3 3H19M29 21H55M61 8H83M7 29H28" stroke="#d5c5a6" strokeWidth=".8"/></pattern>
            <pattern id="board-rule" width="22" height="18" patternUnits="userSpaceOnUse"><path d="M0 17H22" stroke="#6b7567" strokeWidth=".6"/></pattern>
          </defs>
          <g className="room-camera" ref={cameraNode} transform="translate(0 0) scale(1)">
          <rect x="29" y="16" width="742" height="462" rx="9" fill="#f4f3e8" fillOpacity=".8"/>
          <path d="M363 520V452h72v68" fill="#d6cbb6"/>
          <path d="M371 464h57m-57 15h57m-57 15h57m-57 15h57" stroke="#bfb39b" strokeWidth="1"/>
          {[{x:19,y:110},{x:777,y:180},{x:20,y:325},{x:778,y:390}].map(({x,y}) => <g key={x+':'+y} transform={`translate(${x} ${y})`} shapeRendering="crispEdges"><rect x="-3" y="6" width="6" height="23" fill="#9b9074"/><path d="M-14-17H14V-8H20V14H-20V-8H-14Z" fill="#97ad84"/><path d="M-10-20H10V-11H16V5H-15V-11H-10Z" fill="#b0c29c"/><rect x="-7" y="-16" width="10" height="5" fill="#c5d4b0"/></g>)}
          <path d="M38 467H762V49H38Z" fill="#c2cbbe"/>
          <rect x="45" y="33" width="710" height="425" rx="2" fill="url(#floor-grain)" stroke="#818e7e" strokeWidth="3"/>
          <path d="M45 40H755" stroke="#fffdf8" strokeWidth="7"/>
          <path d="M45 43V458H756" fill="none" stroke="#b4b7a9" strokeWidth="8"/>
          <path d="M367 461H435" stroke="#e0e6dc" strokeWidth="12"/>
          <path d="M368 459V410Q435 409 435 459" fill="none" stroke="#9ca994" strokeWidth="1.5"/>
          <text x="400" y="492" textAnchor="middle" className="room-note">OUR WORKSHOP / AN IMAGINED ROOM</text>
          <g aria-hidden="true"><path d="M95 41H202L175 175H90Z" fill="#fff9dc" opacity=".2"/><path d="M590 41H710L703 170H618Z" fill="#fff9dc" opacity=".2"/><rect x="64" y="201" width="38" height="122" fill="#ad9671" stroke="#8d7d60"/>{[214,241,268,295].map(y => <g key={y}><path d={`M65 ${y+17}H101`} stroke="#7d735a" strokeWidth="2"/>{[69,77,84,91].map((x,i)=><rect key={x} x={x} y={y} width={i===1?5:4} height={i%2?15:12} fill={['#6d807c','#ad7158','#e2d3a9','#555c4e'][i]}/>)}</g>)}<rect x="695" y="214" width="29" height="98" fill="#c5bea8" stroke="#928b76"/>{[700,707,714].map(x=><path key={x} d={`M${x} 219V307`} stroke="#e6dfc9" strokeWidth="3"/>)}</g>
          {/* Windows and plants establish a quiet, tangible room. */}
          {[140, 275, 525, 660].map(x => <g key={x}><rect x={x - 37} y="25" width="74" height="15" fill="#dfe9e5" stroke="#85958c"/><path d={`M${x} 25V40`} stroke="#85958c"/></g>)}
          {[{x:80,y:75},{x:713,y:75},{x:81,y:418},{x:712,y:418}].map(({x,y}) => <g key={x+':'+y} transform={`translate(${x} ${y})`}><rect x="-10" y="1" width="20" height="18" rx="3" fill="#9c8e77"/><circle cx="-7" cy="-6" r="11" fill="#71856e"/><circle cx="7" cy="-7" r="10" fill="#82957a"/><circle cy="-13" r="9" fill="#95a88b"/></g>)}
          <rect x="272" y="56" width="258" height="70" rx="2" fill="#999d88"/>
          <rect x="278" y="60" width="246" height="60" fill="#394336" stroke="#252e24"/>
          <rect x="283" y="66" width="236" height="47" fill="url(#board-rule)"/>
          <text x="400" y="83" textAnchor="middle" className="room-board-kicker">{phase.session.toUpperCase()}</text>
          <text x="400" y="104" textAnchor="middle" className="room-board-title">{phase.screen}</text>
          <rect x="108" y="85" width="97" height="32" rx="2" fill="#cfbda0" stroke="#9c8c73"/>
          <text x="157" y="106" textAnchor="middle" className="room-furniture-label">MATERIALS</text>
          <rect x="591" y="85" width="97" height="32" rx="2" fill="#cfbda0" stroke="#9c8c73"/>
          <text x="640" y="106" textAnchor="middle" className="room-furniture-label">COFFEE</text>
          {[119,135,151].map(x => <g key={x}><rect x={x} y="83" width="10" height="17" fill="#fcfaf4" stroke="#aeaa99"/><path d={`M${x+3} 88h4m-4 4h4`} stroke="#8a9988" strokeWidth=".7"/></g>)}
          {[610,627,644].map(x => <g key={x}><rect x={x} y="81" width="9" height="12" rx="2" fill="#f8f5ed" stroke="#9c8c73"/><path d={`M${x+9} 84q8 3 0 6`} fill="none" stroke="#9c8c73"/></g>)}
          <g className="room-furniture">
            {Array.from({length: count}, (_, i) => { const p = groupPosition(i, count); return <g key={i} transform={`translate(${p.x} ${p.y})`}><rect x="-13" y="3" width="26" height="18" rx="4" fill="#b2bdad" stroke="#84947e"/><rect x="-13" y="16" width="26" height="6" rx="2" fill="#7d8e79"/></g>; })}
            {[333,399,465].map(x => <rect key={x} x={x-17} y="172" width="34" height="8" rx="3" fill="#8c9a83"/>)}
            {tables.map((t, i) => <g key={t.label}>
              <ellipse cx={t.x+3} cy={t.y+6} rx="62" ry="43" fill="#c1bcab" opacity=".45"/>
              <ellipse cx={t.x} cy={t.y} rx="61" ry="43" fill="#ddcba9" stroke="#a79778" strokeWidth="2"/>
              <path d={`M${t.x-49} ${t.y+11}Q${t.x} ${t.y+20} ${t.x+49} ${t.y+11}`} fill="none" stroke="#c4b18f"/>
              <rect x={t.x-9} y={t.y+12} width="18" height="6" rx="1" fill={groupColors[i]}/>
              <text x={t.x} y="431" textAnchor="middle" className="room-table-label">{t.label}</text>
            </g>)}
          </g>
          {people.map(person => {
            const skin = ['#d9b495','#b48c6d','#d2aa84','#a47d60'][person.id % 4];
            const hair = ['#514b40','#81735c','#40463f','#746052'][person.id % 4];
            const shirt = person.visitor ? '#47757c' : person.organizer ? '#56644b' : groupColors[person.group];
            return <g key={person.id} className={`room-person${hasIdleMotion(person.id) ? ' has-idle-motion' : ''}`} ref={node => { personNodes.current[person.id] = node; }} transform={`translate(${initial.current.people[person.id].x} ${initial.current.people[person.id].y})`} aria-hidden="true">
              <ellipse cy="16" rx="13" ry="5" fill="#716d5a" opacity=".18"/>
              {person.visitor && <ellipse cy="16" rx="18" ry="8" fill="none" stroke="#47757c" strokeWidth="1.4" strokeDasharray="3 3"/>}
              <g className="pixel-person" shapeRendering="crispEdges" style={{'--idle-delay': `${person.id * -137}ms`, '--step-duration': `${420 + person.id % 4 * 40}ms`} as CSSProperties}>
                <g className="pixel-leg-left"><rect x="-6" y="9" width="5" height="9" fill="#566163"/><rect x="-7" y="16" width="6" height="3" fill="#454c46"/></g>
                <g className="pixel-leg-right"><rect x="2" y="9" width="5" height="9" fill="#566163"/><rect x="2" y="16" width="6" height="3" fill="#454c46"/></g>
                <g className="pixel-upper">
                <rect x="-8" y="-3" width="16" height="15" fill={shirt}/>
                <rect x="-11" y="-2" width="4" height="9" fill={shirt}/><rect x="8" y="-2" width="4" height="9" fill={shirt}/>
                <rect x="-11" y="7" width="4" height="3" fill={skin}/><rect x="8" y="7" width="4" height="3" fill={skin}/>
                <rect x="-6" y="-16" width="12" height="13" fill={skin}/><rect x="-7" y="-18" width="14" height="6" fill={hair}/>
                <path d="M-7-12h3v6h-3m11-6h3v3H4" fill={hair}/>
                {person.id % 3 === 1 && <path d="M-8-14h3v13h-3m13-13h3v13H5" fill={hair}/>}
                <rect x="-3" y="-9" width="1.8" height="2" fill="#354038"/><rect x="3" y="-9" width="1.8" height="2" fill="#354038"/>
                <rect x="0" y="-5" width="2" height="1" fill="#98745b"/>
                {person.visitor ? <><path d="M-2-3h5v13H-2" fill="#eae5d8"/><rect x="-7" y="0" width="3" height="2" fill="#e0c886"/></> : person.organizer ? <><path d="M-2-3l2 7 3-7" fill="none" stroke="#ddd7c2" strokeWidth="1"/><rect x="-1" y="4" width="4" height="5" fill="#f0e7cc"/></> : null}
                </g>
              </g>
              {person.visitor && <g className="you-label"><rect x="-21" y="-46" width="42" height="18" rx="3" fill="#3f666b"/><path d="M-4-29L0-24 4-29" fill="#3f666b"/><text y="-33" textAnchor="middle">YOU</text></g>}
              {person.visitor && following && <g className="thought-bubble"><path d="M-98-88H98V-57H16L9-50V-57H-98Z" fill="#fffff7" stroke="#667b63" strokeWidth="1"/><text y="-69" textAnchor="middle">{thoughtBubbles[phase.id]}</text></g>}
            </g>;
          })}
          <g className="room-documents" aria-hidden="true">
            {papers.map(p => <g key={p.id} className={`room-paper paper-${interests[p.id].id}`} ref={node => { paperNodes.current[p.id] = node; }} transform={`translate(${initial.current.papers[p.id].x} ${initial.current.papers[p.id].y})`}><g className="room-paper-art"><rect x="-11" y="-12" width="22" height="27" rx="1" fill="#fdfbf4" stroke={groupColors[p.id]} strokeWidth="1.5"/><rect x="-8" y="-8" width="16" height="4" fill={groupColors[p.id]}/><path d="M-7 1H7M-7 5H7M-7 9H3" stroke="#859081" strokeWidth="1"/></g></g>)}
          </g>
          </g>
        </svg>
        <div className="room-hotspots" aria-label="Objects you can explore">{roomObjects.map(object => {
          const position = projectRoomObject(object.stage === undefined ? object : {...object, x: initial.current.papers[object.stage].x, y: initial.current.papers[object.stage].y}, camera);
          return <button key={object.id} ref={node => { objectNodes.current[object.id] = node; }} type="button" className={`room-hotspot object-${object.id}`} aria-expanded={inspecting === object.id} aria-controls="room-preview" aria-label={object.label} aria-haspopup="dialog" aria-describedby="room-object-hint" onClick={() => inspect(object.id)} style={{left:`${position.left}%`,top:`${position.top}%`,width:`max(${object.stage === undefined ? 44 : 24}px, ${position.width}%)`,height:`max(${object.stage === undefined ? 44 : 24}px, ${position.height}%)`}}><span className="object-plus" aria-hidden="true">+</span><span className="object-tooltip" aria-hidden="true">{object.title}</span></button>;
        })}</div>
        {following && <button className="room-minimap" type="button" onClick={() => setFollowing(false)} aria-label="Return to the whole-room view"><span>YOU IN THE ROOM</span><svg viewBox="0 0 800 520" aria-hidden="true"><rect x="45" y="33" width="710" height="425" fill="#f4f3e7" stroke="#91a18b" strokeWidth="9"/><rect x="272" y="56" width="258" height="70" fill="#b7c9ab"/>{tables.map(t => <ellipse key={t.label} cx={t.x} cy={t.y} rx="55" ry="45" fill="#d5c5a7"/>)}{people.map(person => <circle key={person.id} ref={node => { miniNodes.current[person.id] = node; }} cx={initial.current.people[person.id].x} cy={initial.current.people[person.id].y} r={person.visitor ? 22 : 10} fill={person.visitor ? '#315e66' : '#8f9e80'} stroke={person.visitor ? '#fffef5' : 'none'} strokeWidth="8"/>)}</svg><span>Whole room ↗</span></button>}
        </div>
        <RoomInspector object={inspecting} phase={phase.id} interest={interest} onClose={closePreview}/></div>
        <div className="room-legend"><span className="your-table"><i/>Your interest: {chosen.title}</span><span>{grouped ? `Your starting table: ${chosen.table}` : 'Follow the character marked “you”'}</span></div>
      </div>
    </div>
    <div className="simulation-controls"><div><button type="button" className="simulation-play" onClick={play} disabled={reducedMotion} aria-label={playing ? 'Pause walkthrough' : step === phases.length - 1 ? 'Replay walkthrough' : 'Play from this activity'}>{playing ? <Pause size={15} aria-hidden="true"/> : <Play size={15} aria-hidden="true"/>}{playing ? 'Pause' : step === phases.length - 1 ? 'Replay' : 'Play from here'}</button><button type="button" className="simulation-reset" onClick={() => chooseStep(0)} aria-label="Restart walkthrough"><RotateCcw size={17} aria-hidden="true"/></button><span className="playback-note">{reducedMotion ? 'Reduced motion: use the step controls.' : '2.5s per scene'}</span></div><div className="simulation-next"><button type="button" onClick={() => chooseStep(step - 1)} disabled={step === 0} aria-label="Previous activity"><ArrowLeft size={17} aria-hidden="true"/></button><span>{step + 1} / {phases.length}</span><button type="button" onClick={() => chooseStep(step + 1)} disabled={step === phases.length - 1} aria-label="Next activity"><ArrowRight size={17} aria-hidden="true"/></button></div></div>
    <details className="visit-notes" onToggle={pausePlayback}><summary>Activity details & materials<span aria-hidden="true">+</span></summary>
    <label className="ambient-setting"><input type="checkbox" checked={ambientMotion && !reducedMotion} disabled={reducedMotion} onChange={event => setAmbientMotion(event.target.checked)}/><span>Character & paper movement{reducedMotion ? ' · reduced motion is on' : ''}</span></label>
    <div className="room-object-shelf"><p id="room-object-hint"><span className="double-line-key" aria-hidden="true">+</span>Click a paper or a double outline + to preview the material.</p><div aria-label="Room documents">{roomObjects.map(object => <button key={object.id} type="button" onClick={() => inspect(object.id)} aria-haspopup="dialog" aria-expanded={inspecting === object.id} aria-controls="room-preview">{object.title}<span aria-hidden="true">+</span></button>)}</div></div>
    <div className="simulation-detail" aria-live={playing ? 'off' : 'polite'} aria-atomic="true"><div><p className="simulation-session">{phase.session} · {phase.minutes} minutes</p><h3>{phase.title}</h3><p>{phase.action}</p></div><div className="simulation-output"><span>YOUR PART IN THIS MOMENT</span><p>{yourActivity(phase.id, interest)}</p><details className="phase-output"><summary>What the group produces</summary><p>{phase.output}</p></details></div></div>
    <p id="simulation-assumptions" className="simulation-assumptions">An illustrative visit with 20 pixel characters, including six organizers. Dialogue and the featured participant’s role are examples. The planned attendance is 15–25. Your interest suggests a starting group; organizers will balance the actual groups. The city scene is inspired by Pittsburgh and the David L. Lawrence Convention Center, the announced CHI 2027 venue. This room, seating, and panel are illustrative. During the exchange, worksheets move between groups.</p>
    </details>
  </div>;
}
