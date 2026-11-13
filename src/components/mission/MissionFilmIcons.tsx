/**
 * Mission-film glyphs — real SVG icons, never emoji.
 */
export function PlayIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={className} aria-hidden="true" focusable="false" fill="currentColor">
      <path d="M2.5 1.2 10.4 6 2.5 10.8Z" />
    </svg>
  );
}

export function PauseIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={className} aria-hidden="true" focusable="false" fill="currentColor">
      <rect x="2.2" y="1.4" width="2.8" height="9.2" />
      <rect x="7" y="1.4" width="2.8" height="9.2" />
    </svg>
  );
}
