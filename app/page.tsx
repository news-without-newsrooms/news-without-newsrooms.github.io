'use client';

import { Tabs } from '@base-ui/react/tabs';
import { ArrowUpRight, ArrowRight, Check, ChevronDown, FileText, Link2, MessageSquare, MoveUpRight, Network, RotateCcw } from 'lucide-react';
import organizers from './organizers.json';
import site from '../site.config.json';

const base = import.meta.env.BASE_URL;
const stages = [
  {
    id: 'post', n: '01', title: 'The post', verb: 'Believing', Icon: FileText,
    question: 'Before I believe it, what can I check?',
    record: 'A news-like video, its description, and the source cues visible to a viewer.',
    task: 'Compare the claim with the sources a viewer can actually inspect. Separate a signal of authority from evidence of verification.',
    example: 'A post says “according to a source” but provides no link. What could a viewer check before sharing?',
    output: 'A question about how a particular cue or action affects a user decision.',
    illustration: ['A claim appears', '“According to a source…”', 'Source mentioned', 'Link not provided'],
  },
  {
    id: 'spread', n: '02', title: 'The spread', verb: 'Sharing', Icon: Network,
    question: 'When I share it, what travels with it?',
    record: 'An excerpt, a repost, comments, and the context that each preserves or omits.',
    task: 'Follow what changes when the claim moves. Identify what another viewer can inspect, and how the person named can respond.',
    example: 'A clipped version circulates without the original description. What context could the sharing interface preserve?',
    output: 'A question about context, interpretation, or response during circulation.',
    illustration: ['A claim is reposted', 'An excerpt, without its context', 'Clip preserved', 'Description omitted'],
  },
  {
    id: 'aftermath', n: '03', title: 'The aftermath', verb: 'Reconsidering', Icon: RotateCcw,
    question: 'Would I ever see the correction?',
    record: 'Later reporting, responses, corrections, or a court outcome.',
    task: 'Distinguish the existence of later information from evidence that earlier viewers encountered or understood it.',
    example: 'A ruling is reported months later. What route could bring that update to someone who saw the original claim?',
    output: 'A question about the delivery, understanding, or use of later information.',
    illustration: ['New information appears', 'An update, months later', 'Update available', 'Audience reach unknown'],
  },
];

const sessions = [
  { n: '01', title: 'Build a shared picture', description: 'Common ground, then participants’ contexts.', rows: [
    ['10', 'Opening scene', 'Look at a labeled composite post. Write what you would check before believing or sharing.'],
    ['25', 'Panel conversation', 'A journalist, a platform practitioner, and a policy voice each connect a case to one consequential decision. Speakers to be confirmed.'],
    ['45', 'Lightning contributions', 'Up to fifteen three-minute talks, each bringing one situation and one question.'],
    ['10', 'Find your group', 'Choose the post, spread, or aftermath. We balance groups across experiences and contexts.'],
  ] },
  { n: '02', title: 'Turn observations into questions', description: 'Casework, exchange, and a shared research agenda.', rows: [
    ['35', 'Work with a case', 'In pairs or trios, connect a record to interface cues, user actions, unknowns, and a research question.'],
    ['15', 'Assemble the sequence', 'Each group shares its findings. Keep documented, unknown, and disputed items visible.'],
    ['20', 'Try the idea elsewhere', 'Exchange worksheets. Test what a design or practice would need to work at another stage or in another context.'],
    ['20', 'Choose what comes next', 'Propose and rank research questions, retain dissent, and find volunteer owners and next steps.'],
  ] },
];

const roles = [
  'Workshop lead & synthesis', 'Outreach & the spread', 'Japanese cases & the aftermath',
  'Verification & correction', 'Design & the transfer exercise', 'AI & the case worksheet',
];

function Arrow({ external = false }: { external?: boolean }) {
  return external ? <ArrowUpRight size={17} aria-hidden="true" /> : <ArrowRight size={17} aria-hidden="true" />;
}

function Journey() {
  return <div className="journey" aria-label="Follow a claim from the post, through its spread, to the aftermath">
    <div className="journey-heading"><span className="label">A CLAIM’S JOURNEY</span><span className="figure-index">01 → 03</span></div>
    <ol className="journey-track">
      {stages.map(({ id, n, title, Icon }, i) => <li className={`journey-stop journey-${id}`} key={id}>
        <span className="journey-marker">{n}</span>
        <div className="journey-paper">
          <div className="journey-paper-top"><Icon size={18} strokeWidth={1.6} aria-hidden="true" /><span>{title}</span></div>
          <p>{['A claim takes shape.', 'The context changes.', 'New information arrives.'][i]}</p>
          <div className="paper-foot"><span>{['What can I check?', 'What travels with it?', 'Who sees the update?'][i]}</span><MoveUpRight size={14} aria-hidden="true" /></div>
        </div>
      </li>)}
    </ol>
    <p className="journey-caption">Three moments. Different decisions.<br/><strong>One conversation across disciplines.</strong></p>
  </div>;
}

function StagePreview({ stage }: { stage: typeof stages[number] }) {
  const { Icon } = stage;
  return <aside className={`case-preview preview-${stage.id}`}>
    <div className="preview-label"><span className="label">ILLUSTRATIVE EXERCISE</span><Icon size={20} aria-hidden="true" /></div>
    <div className="sample-record">
      <span className="record-type">{stage.illustration[0]}</span>
      <p>{stage.illustration[1]}</p>
      <div className="record-flags"><span><Check size={13} aria-hidden="true" />{stage.illustration[2]}</span><span className="unknown"><span aria-hidden="true">?</span>{stage.illustration[3]}</span></div>
    </div>
    <p className="prompt-label">DISCUSS AT YOUR TABLE</p>
    <p className="exercise-question">{stage.example}</p>
    <p className="example-note">Fictional prompt to illustrate the activity, not a case finding.</p>
  </aside>;
}

export default function Home() {
  return <>
    <a className="skip" href="#main">Skip to content</a>
    <div className="status-bar"><div className="wrap"><span className="status-dot" aria-hidden="true" /><strong>Proposed CHI 2027 workshop</strong><span className="status-detail">Acceptance pending · Submissions not open</span></div></div>
    <header className="site-header">
      <div className="wrap header-inner">
        <a className="brand" href="#main" aria-label="News Without Newsrooms, back to top"><span className="brand-symbol" aria-hidden="true">N<span>/</span>N</span><span>News Without<br/>Newsrooms</span></a>
        <nav aria-label="Main navigation"><a href="#workshop">The workshop</a><a href="#program">Program</a><a href="#participate">Participate</a><a href="#organizers">Organizers</a></nav>
        <a className="header-contact" href="#contact">Get in touch <Arrow external /></a>
      </div>
    </header>
    <main id="main">
      <section className="hero wrap" aria-labelledby="page-title">
        <div className="hero-copy">
          <p className="eyebrow"><span className="short-rule" />JOURNALISM · HUMAN–COMPUTER INTERACTION · AI</p>
          <h1 id="page-title">News Without<br/><span>Newsrooms</span></h1>
          <p className="hero-subtitle">Belief, Spread, and Aftermath as<br className="desktop-break"/> Questions for Journalism and HCI</p>
          <p className="hero-description">When a post looks like news, what can people see, verify, and do? A hands-on workshop about the decisions we make as claims travel.</p>
          <div className="hero-actions"><a className="button button-primary" href="#workshop">Inside the workshop <Arrow /></a><a className="quiet-link" href="#participate">How to take part <Arrow external /></a></div>
        </div>
        <Journey />
      </section>
      <div className="facts wrap" aria-label="Workshop at a glance">
        <div><span className="label">PROPOSED VENUE</span><strong>CHI 2027 · Pittsburgh</strong><span>May 2027 · Date to be confirmed</span></div>
        <div><span className="label">THE FORMAT</span><strong>Two 90-minute sessions</strong><span>In person · Discussion + collaborative casework</span></div>
        <div><span className="label">THE ROOM</span><strong>15–25 participants</strong><span>Including organizers · Across disciplines</span></div>
      </div>

      <section className="section wrap" id="workshop" aria-labelledby="workshop-title">
        <div className="section-heading"><div><p className="eyebrow">01 / INSIDE THE WORKSHOP</p><h2 id="workshop-title">Follow a claim.<br/>Find a question worth asking.</h2></div><p className="section-intro">Work with people from journalism, HCI, AI, and policy. Start with a shared case, examine a decision, then test your ideas against someone else’s perspective.</p></div>
        <div className="question-banner"><span className="label">OUR SHARED QUESTION</span><p>What can people <em>see, verify, and do</em><br className="desktop-break"/> in the interface at this point?</p></div>
        <div className="activity-heading"><h3>Three stages. Choose a place to begin.</h3><p>Select a stage to explore your group’s activity.</p></div>
        <Tabs.Root defaultValue="post" className="stage-tabs">
          <Tabs.List className="stage-list" aria-label="Explore the workshop stages">
            {stages.map(s => <Tabs.Tab className="stage-tab" value={s.id} key={s.id}><span className="stage-number">{s.n}</span><span><strong>{s.title}</strong><small>{s.verb}</small></span><ArrowRight size={18} aria-hidden="true" /></Tabs.Tab>)}
          </Tabs.List>
          {stages.map(s => <Tabs.Panel className="stage-panel" value={s.id} key={s.id} keepMounted>
            <div className="stage-content"><p className="eyebrow">THE QUESTION</p><h3>{s.question}</h3><p>{s.task}</p><dl><div><dt>On the table</dt><dd>{s.record}</dd></div><div><dt>You leave with</dt><dd>{s.output}</dd></div></dl></div>
            <StagePreview stage={s} />
          </Tabs.Panel>)}
        </Tabs.Root>
        <div className="case-material"><div><FileText size={22} aria-hidden="true" /><div><h3>A shared case, with room for your context.</h3><p>A documented Korean accusation-video sequence anchors the work. Korean and Japanese comparison cases offer different later outcomes. Participants bring other settings into the conversation.</p></div></div>
          <details className="figure-details"><summary>View the case framework <ChevronDown size={16} aria-hidden="true" /></summary><figure><img src={`${base}workshop-overview.png`} width="2200" height="1100" loading="lazy" alt="A labeled composite post alongside a schematic case sequence. Different records extend to different points; audience exposure remains a separate evidence question."/><figcaption>The composite illustrates the exercise and does not depict a real person or post. A later correction or ruling does not establish that earlier viewers saw it. <a href={`${base}workshop-overview.png`} target="_blank" rel="noreferrer">Open full-size figure <Arrow external /></a></figcaption></figure></details>
        </div>
      </section>

      <section className="collaboration-section" aria-labelledby="together-title"><div className="wrap collaboration-layout">
        <div><p className="eyebrow">HOW WE WORK TOGETHER</p><h2 id="together-title">Small groups.<br/>Connected perspectives.</h2><p>Begin in pairs or trios within one stage group. Then exchange worksheets across stages and ask what changes when an idea moves to another context.</p><a className="text-link" href={`${base}worksheet.html`} target="_blank" rel="noreferrer">Preview the shared worksheet <Arrow external /></a></div>
        <div className="room-flow"><div className="tables" role="img" aria-label="Post, spread, and aftermath groups exchange worksheets. Diagram shows groupings, not fixed seating.">
          {stages.map(s => <div className={`table-group table-${s.id}`} key={s.id}><div className="chairs" aria-hidden="true"><i/><i/><i/></div><div className="table-surface"><span>{s.n}</span><strong>{s.title}</strong><FileText size={21} strokeWidth={1.4} aria-hidden="true" /></div><div className="chairs" aria-hidden="true"><i/><i/><i/></div></div>)}
        </div><div className="exchange-line"><span>Post</span><ArrowRight size={15} aria-hidden="true"/><span>Spread</span><ArrowRight size={15} aria-hidden="true"/><span>Aftermath</span><RotateCcw size={15} aria-hidden="true"/></div><p className="diagram-note">Groupings are illustrative. Seating adapts to the room and attendance.</p></div>
      </div></section>

      <section className="section wrap" id="program" aria-labelledby="program-title">
        <div className="section-heading"><div><p className="eyebrow">02 / THE PROGRAM</p><h2 id="program-title">From conversation<br/>to collaborative work.</h2></div><p className="section-intro">Two sessions move from common ground to research questions with a next step. All timings are provisional.</p></div>
        <div className="sessions">{sessions.map(s => <article className="session" key={s.n}><header className="session-heading"><span className="session-label">SESSION {s.n}<span>90 MIN</span></span><h3>{s.title}</h3><p>{s.description}</p></header><ol>{s.rows.map(([mins, title, description]) => <li key={title}><div className="duration"><strong>{mins}</strong><span>min</span></div><div><h4>{title}</h4><p>{description}</p></div></li>)}</ol></article>)}</div>
        <div className="schedule-note"><span className="label">BETWEEN SESSIONS</span><p>The plan allows a 30-minute conference break. Final timing and room details follow acceptance. If sessions are 75 minutes, we will retain every activity with shorter segments.</p></div>
        <div className="outcomes"><div className="outcome-heading"><p className="eyebrow">WHAT WE TAKE FORWARD</p><h3>More than a discussion.</h3></div><div><span>01</span><h4>A shared sequence</h4><p>Records, user actions, unknowns, and disagreements connected across stages.</p></div><div><span>02</span><h4>Questions with next steps</h4><p>Situated research questions, volunteer owners, and ideas to pursue together.</p></div><div><span>03</span><h4>A reusable foundation</h4><p>A participant-reviewed report within six weeks, the case pack, and an autumn 2027 online follow-up.</p></div></div>
      </section>

      <section className="participation-section" id="participate" aria-labelledby="participate-title"><div className="wrap participation-layout">
        <div className="participation-intro"><p className="eyebrow">03 / TAKE PART</p><h2 id="participate-title">Bring one situation.<br/>And one question.</h2><p>We welcome HCI and AI researchers, system designers, journalists, creators, and platform and policy practitioners.</p><p>You do not need expertise in every field or prior knowledge of the Korean cases. Bring a case, interface, study, design, or argument that others can work with.</p><div className="participation-status"><span className="status-dot" aria-hidden="true"/><strong>Submissions are not open yet.</strong><p>The call and final instructions will follow workshop acceptance.</p></div></div>
        <div className="participation-options"><p className="label">TWO WAYS TO CONTRIBUTE</p><article><span className="option-index">A</span><div><h3>Position paper</h3><p className="format">2–4 pages · ACM single-column · Not anonymized</p><p>A case, design, study, or argument, with a concrete situation and a question for the room.</p></div></article><article><span className="option-index">B</span><div><h3>Practitioner statement</h3><p className="format">1 page</p><p>A situation from practice, the decision it raised, and a question you want to explore with others.</p></div></article><div className="planned-dates"><div><span>Planned call opening</span><strong>17 Dec 2026</strong></div><div><span>Planned submission deadline</span><strong>11 Feb 2027 <small>AoE</small></strong></div></div><p className="selection-note">Dates are subject to acceptance. Two organizers will review each contribution for relevance, a concrete situation, and a workable question. Email submission instructions will be published with the call.</p></div>
      </div></section>

      <section className="section wrap prepare" aria-labelledby="prepare-title"><div className="section-heading"><div><p className="eyebrow">04 / BEFORE YOU ARRIVE</p><h2 id="prepare-title">We’ll help you get ready.</h2></div><p className="section-intro">Shared materials make it easier to spend the workshop working together.</p></div><ol className="prepare-steps"><li><span className="step-icon"><FileText size={23} strokeWidth={1.5} aria-hidden="true" /></span><p className="label">TWO WEEKS BEFORE</p><h3>Read the case pack</h3><p>We plan to share the reference sequence, comparison records, checked English translations of Korean material, and the common worksheet.</p></li><li><span className="step-icon"><Link2 size={23} strokeWidth={1.5} aria-hidden="true" /></span><p className="label">FIND YOUR STARTING POINT</p><h3>Locate your question</h3><p>Choose a stage. Note what your record shows, what it cannot tell us, and what another perspective could help you understand.</p></li><li><span className="step-icon"><MessageSquare size={23} strokeWidth={1.5} aria-hidden="true" /></span><p className="label">COME READY TO SHARE</p><h3>Prepare your contribution</h3><p>Selected contributors give a three-minute talk using a shared slide file. Others introduce their work in groups. Question cards keep discussion open.</p></li></ol>
        <div className="worksheet-callout"><div><span className="worksheet-icon"><FileText size={25} aria-hidden="true"/></span><div><h3>From a record to a research question</h3><p>Preview the seven prompts we’ll work through together.</p></div></div><a className="button button-outline" href={`${base}worksheet.html`} target="_blank" rel="noreferrer">Open the worksheet <Arrow external /></a></div>
      </section>

      <section className="section wrap organizers" id="organizers" aria-labelledby="organizers-title"><div className="section-heading"><div><p className="eyebrow">05 / THE ORGANIZERS</p><h2 id="organizers-title">Different expertise.<br/>A shared inquiry.</h2></div><p className="section-intro">Our organizing team brings together news systems, public communication, policy, AI, and product development.</p></div><div className="people-grid">{organizers.map((o, i) => <article className="person" key={o.name}><span className="person-number">0{i + 1}</span><div><p className="person-role">{roles[i]}</p><h3>{o.name}</h3><p className="affiliation">{o.affiliation}</p><details><summary>About & contribution <ChevronDown size={15} aria-hidden="true" /></summary><p>{o.bio[0].toUpperCase() + o.bio.slice(1)}</p></details></div></article>)}</div></section>

      <section className="section wrap practical" aria-labelledby="practical-title"><div><p className="eyebrow">06 / PRACTICAL DETAILS</p><h2 id="practical-title">Before you<br/>make plans.</h2><p>Have another question?<br/><a href="#contact" className="text-link">Talk to the organizers <Arrow /></a></p></div><div className="faq-list">
        <details><summary>Is the workshop confirmed?<ChevronDown size={18} aria-hidden="true" /></summary><p>No. This is a participant guide prototype for a proposed CHI 2027 workshop. Acceptance is pending. The program, participation process, and dates will be finalized if the workshop is accepted.</p></details>
        <details><summary>Can I join without an accepted contribution?<ChevronDown size={18} aria-hidden="true" /></summary><p>The proposed workshop prioritizes accepted contributors and remains open to conference attendees, subject to capacity and CHI’s attendance arrangements. Everyone who joins can use the same materials and group activities.</p></details>
        <details><summary>What about language and accessibility?<ChevronDown size={18} aria-hidden="true" /></summary><p>The workshop will be in English, with checked English translations of Korean records. We plan accessible materials and will request live captioning. Please contact us about access needs so we can plan with you; specific services are not yet confirmed.</p></details>
        <details><summary>Will contributions be published or recorded?<ChevronDown size={18} aria-hidden="true" /></summary><p>Contributions will be posted only with author consent; authors retain copyright. Panel recording requires consent. Participants can contribute without attribution, and the report will be reviewed by participants. The event is a design workshop, not a participant study.</p></details>
      </div></section>
    </main>
    <footer id="contact"><div className="wrap"><div className="footer-top"><div><p className="eyebrow">LET’S START A CONVERSATION</p><h2>Questions, ideas,<br/>or access needs?</h2></div><div className="contact-block"><p>Write to the organizing team.</p><a className="contact-email" href={`mailto:${site.contactEmail}`}><span>{site.contactEmail}</span><Arrow external /></a><p className="contact-note">This address is for questions. Submissions will open only after acceptance and publication of the call.</p></div></div><div className="footer-bottom"><a className="footer-brand" href="#main">News Without Newsrooms</a><p>Participant guide prototype · Proposed for CHI 2027</p><a href="https://chi2027.acm.org/authors/workshops/" target="_blank" rel="noreferrer">CHI workshop information <Arrow external /></a></div></div></footer>
  </>;
}
