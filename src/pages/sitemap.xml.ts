import type { APIRoute } from 'astro';
import { allWork, workUrl } from '../lib/data';

export const GET: APIRoute = async ({ site: origin }) => {
  const cases = (await allWork()).map(workUrl).filter(Boolean) as string[];
  const urls = ['/', '/work/', '/lab/', '/about/', '/resume/', ...cases]
    .map((path) => `  <url><loc>${new URL(path, origin).href}</loc></url>`)
    .join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
