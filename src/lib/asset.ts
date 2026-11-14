/**
 * Deployment-aware asset URLs.
 *
 * ECHOES ships as a static site that can be served from the root of a domain
 * ("/tex-hi/earth.ktx2") or from a sub-path (a GitHub Pages project site:
 * "/echoes/tex-hi/earth.ktx2"). The build sets `base: "./"`, so every asset
 * reference is resolved relative to the page that loads it.
 *
 * Remote URLs are passed through untouched.
 */
const BASE = (import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");

export const assetUrl = (path: string): string => {
  if (/^(https?:)?\/\//i.test(path) || path.startsWith("data:")) return path;
  return BASE + path.replace(/^\/+/, "");
};
