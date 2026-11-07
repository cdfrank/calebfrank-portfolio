import { capabilitiesOf, capabilityMap, groupByClient, logoClass, whereOf, years, type Work } from './data';

// The client record on /work/: approved work only, grouped like the archive. NDA rows keep only the client name.
export function clientRecord(all: Work[]) {
  const work = all.filter((w) => w.data.approved !== false);
  const groups = groupByClient(work);
  const groupIndex = new Map(groups.flatMap((g, i) => g.work.map((w) => [w.id, i] as const)));
  const order = new Map(work.map((w, i) => [w.id, i]));
  const logo = (file?: string) => (file ? { src: `/logos/${file}`, w: logoClass(file).includes('logo-white') } : null);

  const G = groups.map((g) => {
    const multiClient = g.work.some((x) => x.data.client !== g.work[0].data.client);
    return {
      id: g.id,
      name: g.name,
      logo: logo(g.logo),
      brands: g.brands.map((b) => logo(b)!),
      span: g.span,
      n: g.work.length,
      sub: [g.role, g.where].filter(Boolean).join(', '),
      items: g.work.map((w) => {
        const note = [multiClient && w.data.client !== g.name ? w.data.client : '', w.data.role && w.data.role !== g.role ? w.data.role : '']
          .filter(Boolean)
          .join(' · ');
        return `${order.get(w.id)}|${note}`;
      }),
    };
  });

  const W = work.map((w) => {
    const d = w.data;
    const nda = Boolean(d.confidential);
    const g = groups[groupIndex.get(w.id)!];
    return {
      t: nda ? 'Under NDA' : d.title,
      s: nda ? '' : d.summary ?? '',
      y: years(w),
      st: String(d.start),
      g: groupIndex.get(w.id)!,
      cs: Boolean(d.caseStudy),
      aw: !nda && Boolean(d.award),
      nda,
      ind: d.industry ?? '',
      wh: whereOf(w),
      caps: capabilitiesOf(w),
      href: d.caseStudy && !nda ? `/work/${w.id}/` : '',
      q: (nda
        ? `${g.name} under nda ${d.industry ?? ''}`
        : [g.name, d.client, d.title, d.summary, d.disciplines.join(' '), d.industry].join(' ')
      ).toLowerCase(),
    };
  });

  const counted = (values: string[]) => {
    const counts = new Map<string, number>();
    for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
    return [...counts].sort((a, b) => a[0].localeCompare(b[0]));
  };
  return {
    G,
    W,
    IND: counted(W.map((w) => w.ind)),
    WH: counted(W.map((w) => w.wh)),
    CAPS: Object.keys(capabilityMap).map((name) => [name, W.filter((w) => w.caps.includes(name)).length] as const),
    first: Math.min(...work.map((w) => w.data.start)),
    clients: groups.filter((g) => g.id !== 'own-work').length,
  };
}
