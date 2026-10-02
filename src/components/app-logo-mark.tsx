// CMPND mark — three connected nodes, read two ways at once: a chemical
// compound (bonded atoms) and a cluster of data points drawn together by
// the app's agents. Bonds are strokes (matching the weight of the lucide
// icons used everywhere else in the app); nodes are filled solid so the
// mark stays bold and legible at small sizes (favicon, app icon) rather
// than thinning out - see scripts/gen-icons.mjs for the rasterized PNG
// variants built from this same shape.
export function AppLogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 5.4 L6 18 L18 18 Z" />
      <circle cx="12" cy="5.4" r="2.6" fill="currentColor" stroke="none" />
      <circle cx="6" cy="18" r="2.6" fill="currentColor" stroke="none" />
      <circle cx="18" cy="18" r="2.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
