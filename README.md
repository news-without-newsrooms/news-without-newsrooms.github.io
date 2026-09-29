# News Without Newsrooms

Participant guide prototype for a proposed CHI 2027 workshop on belief, spread, and aftermath as questions for journalism and HCI.

**Acceptance is pending. Submissions are not open.** Program and participation details are provisional.

[Open the participant guide](https://news-without-newsrooms.github.io/)

## Develop

Use Node.js 24 or newer.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite.

```sh
npm test
npm run build
npm run preview
```

The dependency-free model tests check schedule lengths, participant placement, interest matching, worksheet exchange, camera bounds, inspectable objects, and the consistency of the seven worksheet prompts. The build checks TypeScript, bundles the interactive components, and prerenders the complete page into `dist/index.html`. GitHub Pages serves only `dist/`.

## Interface

The guide uses nine chapters with native anchor links, a chapter selector, and gentle scroll snapping. It does not intercept the mouse wheel. Stage tabs use Base UI keyboard navigation. Biographies, the source figure, and FAQs use native disclosure controls. The editorial design pairs locally served Barlow Condensed and Manrope with a light background, dark type, and a yellow accent. Font licenses are in `public/fonts/`. The interface has visible focus states and reduced-motion support. The worksheet remains printable.

The workshop walkthrough follows nine proposed activities. Choose an interest, then switch between the whole room and a participant view. The same participant moves through each activity; a small room overview keeps their location visible while following them. Play, pause, and previous/next controls explore the sequence. Playback is opt-in, pauses outside the viewport, and stops when the page is hidden. Reduced-motion preferences disable playback and animation while retaining step controls.

Double-outlined objects with a plus sign open readable document previews: the materials desk, the shared board, and the worksheets visible on tables. The same documents are available as labeled buttons beneath the room. Previews pause playback and use a native dialog with an explicit close button and Escape support. The practice excerpts can be opened further to distinguish visible evidence from unknowns. Worksheet previews retain their original group identity when they move to another table. The seven prompts match the printable worksheet. Scenery and people are not clickable.

The room, pixel characters, dialogue, and featured participant role are illustrative, not a confirmed floor plan or speaking assignment. The example shows 20 people including six organizers; the planned attendance remains 15–25. The three interest choices suggest a starting group, subject to balancing. The simulation uses the proposed two 90-minute sessions and a provisional 30-minute break. Worksheets, rather than people, move during the transfer exercise.


## Update

- Website URL and shared contact address: `site.config.json`
- Workshop content: `app/page.tsx`
- Organizer biographies: `app/organizers.json`
- Chapter controls: `app/chapter-navigation.tsx`
- Walkthrough UI and spatial model: `app/workshop-simulation.tsx`, `app/simulation-model.ts`
- Styling: `app/globals.css`
- Inspectable room objects and document previews: `app/room-objects.ts`, `app/room-inspector.tsx`
- Local typefaces and OFL licenses: `public/fonts/`
- Printable worksheet: `public/worksheet.html`
- Workshop figure: `public/workshop-overview.png`

Pushing to `main` runs `.github/workflows/pages.yml` and publishes to GitHub Pages. No hosting token or application server is needed. The Vite base path, page metadata, asset links, and contact link derive from `site.config.json`. For an organization site, set its URL to the organization’s root GitHub Pages address and publish in the matching `<organization>.github.io` repository.

Workshop contact: [news-without-newsrooms@outlook.com](mailto:news-without-newsrooms@outlook.com).
