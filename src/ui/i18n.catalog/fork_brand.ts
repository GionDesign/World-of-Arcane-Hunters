// Fork-exclusive brand constants for World of Arcane Hunters.
// Single source of truth for all brand strings across the catalog, HTML pages, and server.
// See docs/MAINTAINING-FORK.md for every upstream file that references these values.
export const FORK_BRAND = {
  gameName: 'World of Arcane Hunters',
  gameNameUpperCase: 'WORLD OF ARCANE HUNTERS',
  gameNameShort: 'WoAH',
  realmName: 'Eastbrook',
  githubUrl: 'https://github.com/giondesign/world-of-arcane-hunters',
  // TODO: Set your custom domain once deployed (also update play.html, guide.html, public/sitemap.xml, server/realm.ts TRUSTED_PUBLIC_HOST_ORIGINS)
  siteUrl: 'https://TODO-your-domain.com',
  // TODO: Set your Discord invite URL, or remove Discord footer links in play.html
  discordUrl: 'https://discord.gg/TODO',
  // TODO: Set your donation/sponsor URL, or remove donate footer link in play.html
  donateUrl: 'https://github.com/sponsors/TODO',
};
