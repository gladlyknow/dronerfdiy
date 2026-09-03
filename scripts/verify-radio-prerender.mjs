import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { SITE_ORIGIN, SUPPORTED_LOCALES, radioRoutes } from './radio-routes.mjs';

const distDir = path.resolve(process.cwd(), process.env.RADIO_DIST_DIR || 'dist/radio');
const siteDistDir = path.dirname(distDir);
const origin = (process.env.SITE_ORIGIN || SITE_ORIGIN).replace(/\/$/, '');
const fileFor = (route) => route.path === '/radio/' ? path.join(distDir, 'index.html') : path.join(distDir, route.path.replace(/^\/radio\//, ''), 'index.html');
const need = (condition, message, failures) => { if (!condition) failures.push(message); };

async function main() {
  const failures = [];
  for (const route of radioRoutes) {
    let html = '';
    try { html = await readFile(fileFor(route), 'utf8'); } catch { failures.push(`Missing HTML: ${route.path}`); continue; }
    const canonical = `${origin}${route.canonical}`;
    const canonicalTag = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
    need(canonicalTag === canonical, `Canonical mismatch: ${route.path}`, failures);
    need(!canonicalTag?.includes('/redio/'), `Forbidden /redio canonical: ${route.path}`, failures);
    for (const [locale, alternate] of Object.entries(route.alternates)) {
      need(html.includes(`hreflang="${locale}" href="${origin}${alternate}"`), `Missing or incorrect ${locale} hreflang: ${route.path}`, failures);
    }
    need(html.includes('hreflang="x-default"'), `Missing x-default hreflang: ${route.path}`, failures);
    need(html.includes('BreadcrumbList') && html.includes('WebSite') && html.includes(route.structuredDataType), `Missing required schema: ${route.path}`, failures);
    need(html.includes('<h1>') && html.includes(route.h1) && html.includes(route.quickAnswer), `Missing readable SEO body: ${route.path}`, failures);
    need(!html.includes('fonts.googleapis.com') && !html.includes('fonts.gstatic.com'), `External Google font dependency: ${route.path}`, failures);
    need(html.includes('href="/radio/"'), `Missing Radio Earth homepage link: ${route.path}`, failures);
  }
  for (const file of ['sitemap.xml', 'sitemap-cn.xml', 'sitemap-us.xml', 'robots.txt']) {
    let content = '';
    try { content = await readFile(path.join(siteDistDir, file), 'utf8'); } catch { failures.push(`Missing ${file}`); continue; }
    if (file.endsWith('.xml')) need(content.includes('<urlset'), `Invalid sitemap root: ${file}`, failures);
    need(!content.includes('/redio/'), `Forbidden /redio URL: ${file}`, failures);
  }
  const sitemap = await readFile(path.join(siteDistDir, 'sitemap.xml'), 'utf8').catch(() => '');
  for (const route of radioRoutes) need(sitemap.includes(`${origin}${route.canonical}`), `Route missing from root sitemap: ${route.path}`, failures);
  for (const forbidden of ['/radio/cn/', '/radio/us/', '/radio/satellite/', '/radio/propagation/', '/radio/listen/']) need(!sitemap.includes(`${origin}${forbidden}`), `Old or unapproved route in root sitemap: ${forbidden}`, failures);
  if (failures.length) throw new Error(`Radio prerender verification failed:\n- ${failures.join('\n- ')}`);
  console.log(`Verified ${radioRoutes.length} radio routes, canonical links, hreflang, schemas, and sitemaps.`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
