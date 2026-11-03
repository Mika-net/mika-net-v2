// DISC-05 — prod allows and names the sitemap; dev disallows (the edge adds X-Robots-Tag too).
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const origin = site?.origin ?? 'https://mika-net.io';
  const isProd = origin === 'https://mika-net.io';
  const body = isProd
    ? `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap-index.xml\n`
    : `User-agent: *\nDisallow: /\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
