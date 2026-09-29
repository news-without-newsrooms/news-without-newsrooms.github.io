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
npm run build
npm run preview
```

The build checks TypeScript, bundles the interactive components, and prerenders the complete page into `dist/index.html`. GitHub Pages serves only `dist/`.

## Update

- Website URL and shared contact address: `site.config.json`
- Workshop content: `app/page.tsx`
- Organizer biographies: `app/organizers.json`
- Styling: `app/globals.css`
- Printable worksheet: `public/worksheet.html`
- Workshop figure: `public/workshop-overview.png`

Pushing to `main` runs `.github/workflows/pages.yml` and publishes to GitHub Pages. No hosting token or application server is needed. The Vite base path, page metadata, asset links, and contact link derive from `site.config.json`. For an organization site, set its URL to the organization’s root GitHub Pages address and publish in the matching `<organization>.github.io` repository.

Contact: [Dongjae Kang](mailto:dk3500@columbia.edu).
