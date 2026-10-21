/* Íconos decorativos: siempre acompañan a un texto, nunca lo reemplazan. */

const propsComunes = {
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

export const IconoInformacion = () => (
  <svg {...propsComunes}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

export const IconoAlerta = () => (
  <svg {...propsComunes}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);

export const IconoSalud = () => (
  <svg {...propsComunes}>
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
    <path d="M12 9v6M9 12h6" />
  </svg>
);

export const IconoFlecha = () => (
  <svg {...propsComunes}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const IconoVisto = () => (
  <svg {...propsComunes} width={16} height={16} strokeWidth={3}>
    <path d="M5 12l5 5L20 7" />
  </svg>
);

export const IconoLibro = () => (
  <svg {...propsComunes} width={20} height={20}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" />
    <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
  </svg>
);

export const IconoBusqueda = () => (
  <svg {...propsComunes}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </svg>
);
