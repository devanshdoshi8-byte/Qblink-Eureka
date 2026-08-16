export const Monogram = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
    <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="20" cy="20" r="11" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.55" />
    <line x1="20" y1="20" x2="31" y2="20" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="31" cy="20" r="2" fill="currentColor" />
  </svg>
);