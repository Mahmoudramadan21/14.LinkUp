import { NextResponse } from 'next/server';

// Replace this with real DB query later
const sampleProfiles = ['mahmoud', 'ahmed', 'sarah', 'mohamed', 'fatma'];

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = 'https://linkup-app-frontend.vercel.app';

  const urls = sampleProfiles.map((username) => ({
    url: `${baseUrl}/${username}`,
    lastmod: new Date().toISOString().split("T")[0],
    changefreq: "weekly",
    priority: "0.8",
    images: [`${baseUrl}/api/ogog/og-profile.png`],
  }));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${urls
    .map(
      u => `
  <url>
    <loc>${u.url}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
    ${u.images?.map(img => `<image:image><image:loc>${img}</image:loc></image:image>`).join('') || ''}
  </url>`
    )
    .join('')}
</urlset>`;

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
}