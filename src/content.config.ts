import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { readdirSync, readFileSync } from 'node:fs';

// Unapproved files only load under `astro dev`. Every build leaves them out, launched or not, so their text and images never ship.
const base = './src/content/work';
const reviewing = process.argv.includes('dev');
const held = reviewing
  ? []
  : readdirSync(base).filter((f) => f.endsWith('.md') && /^approved:\s*false/m.test(readFileSync(`${base}/${f}`, 'utf8')));

const work = defineCollection({
  loader: glob({ pattern: ['*.md', ...held.map((f) => `!${f}`)], base }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      client: z.string(),
      // client = paid work, independent = freelance or side clients,
      // lab = my own ventures and experiments, student = school work
      kind: z.enum(['client', 'independent', 'lab', 'student']).default('client'),
      employer: z.string().optional(),
      role: z.string().optional(),
      start: z.number().int(),
      end: z.number().int().optional(),
      industry: z.string(),
      disciplines: z.array(z.string()).default([]),
      summary: z.string(),
      status: z.string().optional(),
      award: z.string().optional(),
      // Homepage order. Lower numbers appear first. Leave out to keep it off the homepage.
      featured: z.number().optional(),
      // true publishes the Markdown below the frontmatter as a full case study page.
      caseStudy: z.boolean().default(false),
      // true keeps the archive row to a summary and marks it as limited by NDA.
      confidential: z.boolean().default(false),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      outcome: z.string().optional(),
      draft: z.boolean().default(false),
      // false holds the whole project out of the live site until you approve it. It still shows in local review.
      approved: z.boolean().default(true),
      // Private notes shown only on unapproved drafts.
      reviewNotes: z.array(z.string()).default([]),
    }),
});

export const collections = { work };
