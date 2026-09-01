import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { SITE_ORIGIN, SUPPORTED_LOCALES, radioRoutes } from './radio-routes.mjs';

const root = process.cwd();
const distDir = path.resolve(root, process.env.RADIO_DIST_DIR || 'dist/radio');
const siteDistDir = path.dirname(distDir);
const siteOrigin = (process.env.SITE_ORIGIN || SITE_ORIGIN).replace(/\/$/, '');
const templatePath = path.join(distDir, 'index.html');

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
const absoluteUrl = (pathname) => `${siteOrigin}${pathname}`;
const pageFile = (pathname) => pathname === '/radio/' ? templatePath : path.join(distDir, pathname.replace(/^\/radio\//, ''), 'index.html');

function retainedAssetTags(template) {
  const tags = template.match(/<(?:script|link)\b[^>]*(?:src=|href=)[^>]*>\s*(?:<\/script>)?/gi) || [];
  return tags.filter((tag) => /(?:stylesheet|modulepreload|type=["']module["'])/i.test(tag)).join('\n    ');
}

function list(items) { return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`; }

function pageMarkup(route, assets) {
  const canonical = absoluteUrl(route.canonical);
  const alternateLinks = SUPPORTED_LOCALES.map((locale) => `<link rel="alternate" hreflang="${locale}" href="${absoluteUrl(route.alternates[locale])}" />`).join('\n    ');
  const breadcrumbs = route.path.split('/').filter(Boolean).map((part, index, all) => ({ '@type': 'ListItem', position: index + 1, name: index === all.length - 1 ? route.h1 : part.replace(/-/g, ' '), item: absoluteUrl(`/${all.slice(0, index + 1).join('/')}/`) }));
  const primary = route.structuredDataType === 'WebApplication'
    ? { '@type': 'WebApplication', name: route.h1, url: canonical, applicationCategory: 'EducationalApplication', description: route.description, inLanguage: route.locale }
    : { '@type': 'Article', headline: route.h1, description: route.description, mainEntityOfPage: canonical, inLanguage: route.locale, dateModified: route.lastReviewed, author: { '@type': 'Organization', name: 'DroneRF DIY' } };
  const jsonLd = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Organization', name: 'DroneRF DIY', url: absoluteUrl('/') },
    { '@type': 'WebSite', name: 'Radio Earth', url: absoluteUrl('/radio/'), inLanguage: SUPPORTED_LOCALES },
    { '@type': 'BreadcrumbList', itemListElement: breadcrumbs }, primary,
    { '@type': 'FAQPage', mainEntity: route.faq.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) },
  ] };
  const isChinese = route.locale.startsWith('zh');
  const labels = isChinese
    ? { quick: '快速答案', requirements: '开始前确认', steps: '下一步怎么做', next: '继续探索', faq: '常见问题', sources: '官方来源', reviewed: '最后复核' }
    : { quick: 'Quick Answer', requirements: 'Before you start', steps: 'Step by step', next: 'Continue exploring', faq: 'FAQ', sources: 'Official Sources', reviewed: 'Last reviewed' };
  return `<!doctype html>
<html lang="${route.locale}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(route.title)}</title>
    <meta name="description" content="${escapeHtml(route.description)}" />
    <meta name="robots" content="index,follow,max-image-preview:large" />
    <meta name="theme-color" content="#06101c" />
    <link rel="canonical" href="${canonical}" />
    ${alternateLinks}
    <link rel="alternate" hreflang="x-default" href="${absoluteUrl('/radio/')}" />
    <link rel="icon" href="/assets/logo/drone-rf-mark.svg" type="image/svg+xml" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Radio Earth · DroneRF DIY" />
    <meta property="og:locale" content="${route.locale.replace('-', '_')}" />
    <meta property="og:title" content="${escapeHtml(route.title)}" />
    <meta property="og:description" content="${escapeHtml(route.description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${absoluteUrl('/assets/home/hero-drone-rf.webp')}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(route.title)}" />
    <meta name="twitter:description" content="${escapeHtml(route.description)}" />
    <meta name="twitter:image" content="${absoluteUrl('/assets/home/hero-drone-rf.webp')}" />
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
    ${assets}
  </head>
  <body>
    <main id="root">
      <article data-seo-route="${route.path}">
        <nav aria-label="Breadcrumb"><a href="/radio/">Radio Earth</a> / ${escapeHtml(route.h1)}</nav>
        <h1>${escapeHtml(route.h1)}</h1>
        <section><h2>${labels.quick}</h2><p>${escapeHtml(route.quickAnswer)}</p></section>
        <section><h2>${labels.requirements}</h2>${list(route.requirements)}</section>
        <section><h2>${labels.steps}</h2><ol>${route.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol></section>
        ${route.sections.map((section) => `<section><h2>${escapeHtml(section.heading)}</h2>${(section.paragraphs ?? []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}${section.items?.length ? list(section.items) : ''}</section>`).join('')}
        <section><h2>${labels.next}</h2><p>${escapeHtml(route.cta)}</p><p><a href="${escapeHtml(route.ctaHref)}">${escapeHtml(route.cta)}</a></p></section>
        ${route.faq.length ? `<section><h2>${labels.faq}</h2>${route.faq.map((item) => `<details><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`).join('')}</section>` : ''}
        ${route.officialSources.length ? `<section><h2>${labels.sources}</h2><ul>${route.officialSources.map((source) => `<li><a href="${escapeHtml(source.url)}" rel="nofollow external">${escapeHtml(source.label)}</a></li>`).join('')}</ul></section>` : ''}
        <footer><p>${labels.reviewed}: <time datetime="${route.lastReviewed}">${route.lastReviewed}</time></p></footer>
      </article>
    </main>
  </body>
</html>`;
}

function sitemap(items) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items.map((route) => `  <url><loc>${absoluteUrl(route.canonical)}</loc><lastmod>${route.lastReviewed}</lastmod></url>`).join('\n')}\n</urlset>\n`;
}

async function main() {
  let template;
  try { template = await readFile(templatePath, 'utf8'); }
  catch { throw new Error(`Missing ${templatePath}. Build the radio app to dist/radio first, or set RADIO_DIST_DIR.`); }
  const assets = retainedAssetTags(template);
  if (!assets) throw new Error('No Vite JS/CSS asset tags found in the radio build template.');
  for (const route of radioRoutes) {
    const target = pageFile(route.path);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, pageMarkup(route, assets));
  }
  await writeFile(path.join(siteDistDir, 'sitemap.xml'), sitemap(radioRoutes));
  await writeFile(path.join(siteDistDir, 'sitemap-cn.xml'), sitemap(radioRoutes.filter((route) => route.market === 'CN')));
  await writeFile(path.join(siteDistDir, 'sitemap-us.xml'), sitemap(radioRoutes.filter((route) => route.market === 'US')));
  await writeFile(path.join(siteDistDir, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin/\nDisallow: /account/\nSitemap: ${absoluteUrl('/sitemap.xml')}\nSitemap: ${absoluteUrl('/sitemap-cn.xml')}\nSitemap: ${absoluteUrl('/sitemap-us.xml')}\n`);
  console.log(`Prerendered ${radioRoutes.length} radio pages in ${distDir}`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
