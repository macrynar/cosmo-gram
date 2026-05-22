// Signet mark from the Cosmogram logo — crescent + dot in currentColor.
export function CosmoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="22 26 38 48"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        transform="translate(46, 50)"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <path d="M 12.67,-17.99 A 22,22 0 1,0 12.67,17.99 A 18,18 0 1,1 12.67,-17.99 Z" />
        <circle cx="4" cy="0" r="4" stroke="none" />
      </g>
    </svg>
  );
}
