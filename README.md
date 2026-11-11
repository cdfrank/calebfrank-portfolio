# calebfrank.com

Astro site. Each project is one Markdown file. The homepage, archive, timeline, and lab all update from those files.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:4321.

## Keep it up to date

| To change | Edit |
| --- | --- |
| Add a project | `npm run new -- "Client" "Project title"`, then fill in `src/content/work/` |
| Your headline, email, or availability | `src/data/site.yaml` |
| Resume and About details | `src/data/career.yaml` |
| Feature a project on the homepage | Add `featured: 3` to its file |
| Turn a project into a case study | Add `caseStudy: true` and write below the `---` |
| Keep a project to a summary | Add `confidential: true` |
| Hold a project for review | Add `approved: false`; it shows in `npm run dev` only, and every build leaves out its text, images, and private notes |
| Refresh the resume PDF | `npm run resume:pdf`, after any change to `career.yaml` |
| Add a client logo or reorder clients | Put the logo in `public/logos/`, then edit `src/data/clients.yaml` |
| Add or replace a project's hover loop | Drop `public/loops/<project id>.svg` (the id is the Markdown file name). Rows on /work/ pick it up at build time |

Images go in `src/assets/work/<project>/`. New projects start with `draft: true` and stay hidden until you remove that line.

## DOOANE portfolio guide

The bottom-right DOOANE widget offers guided, local answers about published work, experience, and contact details. It runs without an API key or chat service and sends no messages to a server. Each new page starts a fresh conversation.

- `src/components/Dooane.astro` selects public project fields, excluding held, draft, and confidential projects even in development.
- `src/lib/dooane.mjs` contains the prepared answers and project matching.
- `src/components/DooaneChat.jsx` and `src/styles/dooane.css` control the panel and mascot animation. Both site layouts include it.
- `public/dooane/sprites.webp` contains the idle, wave, waiting, and thinking poses derived from the custom DOOANE pet.

Run `node --test scripts/dooane.test.mjs` and `npm run build` to check changes. The widget respects reduced motion and is hidden when printing the resume.

## Before launch

- [ ] Confirm you may show BASF, New York Lottery, and all other client screens and numbers.
- [ ] Confirm the BASF artifacts dated before you joined in July 2019 are yours to show, or remove them. The grower journey is stamped 2.13.18, and the account screens show March 2019.
- [ ] Delete the unredacted originals once you no longer need them: `account-overview.jpg`, `activity-search.jpg`, and `relationship-structure.jpg`. They're in `.gitignore`, so they only exist on this machine.
- [ ] Confirm you may show each client's logo.
- [ ] Confirm the availability text, since it says you're open to roles while you're at STELLA.
- [ ] Review both GM case studies. Their private notes list every image and claim to check.
- [ ] Review the 10 case studies added in November 2026. They're held, so 8 existing project rows stay off the live site until you approve them. Get STELLA's written OK before approving the alerts story.
- [ ] Confirm your Michigan Farm Bureau role.
- [ ] Set `launched: true` in `src/data/site.yaml`. Until then, search engines are told to stay away.
- [ ] Push to a private GitHub repo, import it into Vercel, and connect calebfrank.com. Held drafts and their images live in the source, so the repo must stay private.
