/**
 * Simulator integration point.
 *
 * The ECHOES simulator is NOT part of this repository, so the landing page cannot
 * know its real URL. Set VITE_ECHOES_SIMULATOR_URL at build time (e.g. "/simulator/"
 * or "https://echoes.example/app") and every "Enter" CTA will open it.
 *
 * Without it the CTAs resolve to the in-app "#/simulator" notice page, which says
 * plainly that no simulator is connected — instead of pretending it exists.
 */
const raw = (import.meta.env.VITE_ECHOES_SIMULATOR_URL as string | undefined)?.trim();

export const SIMULATOR_CONNECTED = Boolean(raw);
export const SIMULATOR_URL = raw || "#/simulator";

/** Public repository URL — left empty because none is known. The footer hides the link when empty. */
export const GITHUB_URL = (import.meta.env.VITE_ECHOES_GITHUB_URL as string | undefined)?.trim() || "";
