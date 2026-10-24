/* Decorative icons: they always go with a text, never replace it. */

const commonProps = {
  "aria-hidden": true,
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "shrink-0",
} as const;

export const InfoIcon = () => (
  <svg {...commonProps}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

export const AlertIcon = () => (
  <svg {...commonProps}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);

export const HealthIcon = () => (
  <svg {...commonProps}>
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
    <path d="M12 9v6M9 12h6" />
  </svg>
);

export const ArrowIcon = () => (
  <svg {...commonProps}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const CheckIcon = () => (
  <svg {...commonProps} width={16} height={16} strokeWidth={3}>
    <path d="M5 12l5 5L20 7" />
  </svg>
);

export const BookIcon = () => (
  <svg {...commonProps} width={20} height={20}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" />
    <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
  </svg>
);

export const SearchIcon = () => (
  <svg {...commonProps}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </svg>
);

export const UploadIcon = () => (
  <svg {...commonProps} width={28} height={28}>
    <path d="M12 16V4M7 9l5-5 5 5" />
    <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
  </svg>
);

export const TrashIcon = () => (
  <svg {...commonProps} width={18} height={18}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3" />
  </svg>
);

/* Shapes of «Tierra viva»: decorative, they take the color of their text (currentColor). */

/** Two rolling hills, to close the bottom of a block. */
export const Hills = ({ className = "" }: { className?: string }) => (
  <svg aria-hidden viewBox="0 0 400 60" preserveAspectRatio="none" className={className}>
    <path d="M0 38 Q70 6 150 30 T300 26 T400 20 V60 H0Z" fill="currentColor" opacity="0.55" />
    <path d="M0 48 Q90 22 190 44 T400 36 V60 H0Z" fill="currentColor" />
  </svg>
);

/** The site's mark: a sun rising behind a hill. */
export const SunMark = () => (
  <svg aria-hidden viewBox="0 0 32 32" width={28} height={28} className="shrink-0">
    <circle cx="19" cy="14" r="8" fill="var(--sol)" />
    <path d="M1 28 Q10 14 20 22 T31 20 V31 H1Z" fill="var(--monte)" />
  </svg>
);
