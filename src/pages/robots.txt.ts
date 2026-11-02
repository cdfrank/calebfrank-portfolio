import type { APIRoute } from 'astro';
import { site } from '../lib/data';

// Search engines stay out until launch.
export const GET: APIRoute = ({ site: origin }) => {
  const body = site.launched
    ? `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', origin).href}\n`
    : 'User-agent: *\nDisallow: /\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
