// Post-build brand URL injection for dist/ static files.
//
// Vite's define block handles substitution inside JS/CSS bundles. The
// transformIndexHtml hook handles Vite HTML entry points (index.html, play.html,
// guide.html, admin.html). This script covers everything else Vite copies verbatim
// from public/: robots.txt, sitemap.xml, and the standalone HTML pages
// (privacy.html, terms.html, data-deletion.html, support.html, links.html,
// merch.html, server-unavailable.html).
//
// Environment variables read:
//   VITE_SITE_URL    -- full https:// origin, no trailing slash
//                       (e.g. https://mysite.com); default: https://TODO-your-domain.com
//   VITE_DISCORD_URL -- full Discord invite URL (e.g. https://discord.gg/abcdef);
//                       default: https://discord.gg/TODO
//   VITE_DONATE_URL  -- full donate/sponsor URL (e.g. https://github.com/sponsors/me);
//                       default: https://github.com/sponsors/TODO
//
// Run after `npm run build` via `npm run brand:inject`.
// The Dockerfile wires both steps together.

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const distDir = join(root, 'dist');

const siteUrl = (process.env.VITE_SITE_URL ?? 'https://TODO-your-domain.com').replace(/\/$/, '');
const discordUrl = process.env.VITE_DISCORD_URL ?? 'https://discord.gg/TODO';
const donateUrl = process.env.VITE_DONATE_URL ?? 'https://github.com/sponsors/TODO';
const siteDomain = siteUrl.replace(/^https?:\/\//, '');

function replaceTokens(content) {
  return content
    .replaceAll('https://TODO-your-domain.com', siteUrl)
    .replaceAll('TODO-your-domain.com', siteDomain)
    .replaceAll('https://discord.gg/TODO', discordUrl)
    .replaceAll('https://github.com/sponsors/TODO', donateUrl);
}

const TEXT_EXTS = new Set(['.html', '.txt', '.xml', '.json']);
let count = 0;

function processDir(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip assets/ -- JS/CSS bundles are already handled by Vite's define block.
      if (entry.name !== 'assets') processDir(full);
    } else if (TEXT_EXTS.has(extname(entry.name).toLowerCase())) {
      const original = readFileSync(full, 'utf8');
      const replaced = replaceTokens(original);
      if (replaced !== original) {
        writeFileSync(full, replaced, 'utf8');
        count++;
      }
    }
  }
}

processDir(distDir);

console.log(`[brand:inject] patched ${count} file(s) in dist/`);
console.log(`  SITE_URL:    ${siteUrl}`);
console.log(`  DISCORD_URL: ${discordUrl}`);
console.log(`  DONATE_URL:  ${donateUrl}`);
