import { NextResponse } from 'next/server';

const staticUrls = [
  { url: 'https://linkup-app-frontend.vercel.app/',             changefreq: 'daily',    priority: '1.0' },
  { url: 'https://linkup-app-frontend.vercel.app/feed',         changefreq: 'hourly',   priority: '0.9' },
  { url: 'https://linkup-app-frontend.vercel.app/explore',      changefreq: 'hourly',   priority: '0.9' },
  { url: 'https://linkup-app-frontend.vercel.app/flicks',       changefreq: 'hourly',   priority: '0.9' },
  { url: 'https://linkup-app-frontend.vercel.app/search',       changefreq: 'daily',    priority: '0.7' },
  { url: 'https://linkup-app-frontend.vercel.app/help',         changefreq: 'monthly',  priority: '0.5' },
  { url: 'https://linkup-app-frontend.vercel.app/privacy',      changefreq: 'yearly',   priority: '0.4' },
  { url: 'https://linkup-app-frontend.vercel.app/terms',        changefreq: 'yearly',   priority: '0.4' },
];

export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${staticUrls
    .map(
      ({ url, changefreq, priority }) => `
  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
    )
    .join('')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=600',
    },
  });
}