import { getCollection, type CollectionEntry } from 'astro:content';
import { parse } from 'yaml';
import siteRaw from '../data/site.yaml?raw';
import careerRaw from '../data/career.yaml?raw';
import clientsRaw from '../data/clients.yaml?raw';

export const site = parse(siteRaw);
export const career = parse(careerRaw);

export type Work = CollectionEntry<'work'>;

export async function allWork(): Promise<Work[]> {
  const entries = await getCollection('work', ({ data }) => !data.draft);
  return entries.sort(
    (a, b) =>
      (b.data.end ?? b.data.start) - (a.data.end ?? a.data.start) ||
      b.data.start - a.data.start ||
      a.data.title.localeCompare(b.data.title),
  );
}

export const years = (w: Work) =>
  w.data.end ? `${w.data.start}–${String(w.data.end).slice(2)}` : `${w.data.start}`;

export const workUrl = (w: Work) => (w.data.caseStudy ? `/work/${w.id}/` : undefined);

const clientData = parse(clientsRaw);
export const capabilityMap: Record<string, string[]> = clientData.capabilities;
export const logoClass = (file?: string) => (clientData.whiteLogos.includes(file) ? 'logo logo-white' : 'logo');

export const capabilitiesOf = (w: Work) =>
  Object.entries(capabilityMap)
    .filter(([, tags]) => w.data.disciplines.some((d) => tags.includes(d)))
    .map(([name]) => name);

export const whereOf = (w: Work) =>
  w.data.employer ?? (w.data.kind === 'lab' ? 'My own work' : w.data.kind === 'student' ? 'Student work' : 'Independent');

export interface ClientGroup {
  id: string;
  name: string;
  logo?: string;
  brands: string[];
  work: Work[];
  span: string;
  role?: string;
  where?: string;
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const mostCommon = (values: (string | undefined)[]) => {
  const counts = new Map<string, number>();
  for (const v of values) if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
};

// Listed clients come first, in file order. Anything unlisted follows, biggest and newest first.
export function groupByClient(work: Work[]): ClientGroup[] {
  const listed: any[] = clientData.clients;
  const home = (w: Work) => listed.find((c) => c.match.includes(w.data.client));
  const build = (meta: any, items: Work[]): ClientGroup => {
    const first = Math.min(...items.map((w) => w.data.start));
    const last = Math.max(...items.map((w) => w.data.end ?? w.data.start));
    // One role can't describe a client worked with across employers, so the header leaves it out.
    const employers = new Set(items.map((w) => w.data.employer).filter(Boolean));
    const single = employers.size <= 1;
    return {
      id: meta.id,
      name: meta.name,
      logo: meta.logo,
      brands: meta.brands ?? [],
      // Case studies lead each client so collapsing never hides them.
      work: [...items].sort((x, y) => Number(y.data.caseStudy) - Number(x.data.caseStudy)),
      span: first === last ? `${first}` : `${first}–${String(last).slice(2)}`,
      role: single ? mostCommon(items.map((w) => w.data.role)) : undefined,
      where: single ? mostCommon(items.map((w) => w.data.employer)) : undefined,
    };
  };
  const known = listed
    .filter((c) => !c.last)
    .map((c) => ({ meta: c, items: work.filter((w) => home(w) === c) }))
    .filter((g) => g.items.length)
    .map((g) => build(g.meta, g.items));
  const others = [...new Set(work.filter((w) => !home(w)).map((w) => w.data.client))]
    .map((client) => build({ id: slugify(client), name: client }, work.filter((w) => w.data.client === client)))
    .sort((a, b) => b.work.length - a.work.length || b.span.localeCompare(a.span));
  const tail = listed
    .filter((c) => c.last)
    .map((c) => ({ meta: c, items: work.filter((w) => home(w) === c) }))
    .filter((g) => g.items.length)
    .map((g) => build(g.meta, g.items));
  return [...known, ...others, ...tail];
}
