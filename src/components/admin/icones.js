// Ícones do painel admin, no mesmo traço dos ícones do site (components/icones.js). currentColor.

function Svg({ children, className = "size-6", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconeCasa = (p) => (
  <Svg {...p}>
    <path d="M3.5 11 12 4l8.5 7" />
    <path d="M5.5 9.5V20h13V9.5M10 20v-5.5h4V20" />
  </Svg>
);

export const IconeLista = (p) => (
  <Svg {...p}>
    <path d="M9 6.5h11M9 12h11M9 17.5h11" />
    <circle cx="4.5" cy="6.5" r="1" />
    <circle cx="4.5" cy="12" r="1" />
    <circle cx="4.5" cy="17.5" r="1" />
  </Svg>
);

export const IconeCalendario = (p) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
    <path d="M3.5 9.5h17M8 3v4M16 3v4" />
  </Svg>
);

export const IconePanela = (p) => (
  <Svg {...p}>
    <path d="M4 10h16v5.5a4.5 4.5 0 0 1-4.5 4.5h-7A4.5 4.5 0 0 1 4 15.5z" />
    <path d="M2 10h2M20 10h2M9 6.5c0-1 1-1.5 1-2.5M13 6.5c0-1 1-1.5 1-2.5" />
  </Svg>
);

export const IconeDinheiro = (p) => (
  <Svg {...p}>
    <rect x="2.5" y="6" width="19" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.6" />
    <path d="M6 9.5v5M18 9.5v5" />
  </Svg>
);

export const IconePessoas = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M3 19.5c.6-3.3 3-5 6-5s5.4 1.7 6 5" />
    <path d="M16 5.6a3 3 0 0 1 0 5.8M18 14.6c1.6.7 2.6 2.2 3 4.9" />
  </Svg>
);

export const IconeLivro = (p) => (
  <Svg {...p}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
    <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5M8.5 7.5h7" />
  </Svg>
);

export const IconeMoto = (p) => (
  <Svg {...p}>
    <circle cx="5.5" cy="16.5" r="3" />
    <circle cx="18.5" cy="16.5" r="3" />
    <path d="M8.5 16.5h5l3-6h-4M14 6.5h2.5l2 10" />
  </Svg>
);

export const IconeGrafico = (p) => (
  <Svg {...p}>
    <path d="M4 20V4M4 20h16" />
    <path d="M8 16v-4M12 16V8M16 16v-6" />
  </Svg>
);

export const IconeEngrenagem = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" />
  </Svg>
);

export const IconeMaisOpcoes = (p) => (
  <Svg {...p} strokeWidth="2.6">
    <path d="M5.5 12h.01M12 12h.01M18.5 12h.01" />
  </Svg>
);

export const IconeSair = (p) => (
  <Svg {...p}>
    <path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14" />
    <path d="M10 8l-4 4 4 4M6 12h10" />
  </Svg>
);

export const IconeImpressora = (p) => (
  <Svg {...p}>
    <path d="M7 8V3.5h10V8" />
    <rect x="3.5" y="8" width="17" height="8.5" rx="2" />
    <path d="M7 14h10v6.5H7z" />
  </Svg>
);

export const IconeTelefone = (p) => (
  <Svg {...p}>
    <path d="M5 3.5h3.5l1.5 4.5-2.2 1.4a11 11 0 0 0 4.8 4.8l1.4-2.2 4.5 1.5V17a3 3 0 0 1-3 3A15.5 15.5 0 0 1 2 6.5a3 3 0 0 1 3-3z" />
  </Svg>
);

export const IconeCopiar = (p) => (
  <Svg {...p}>
    <rect x="8.5" y="8.5" width="12" height="12" rx="2" />
    <path d="M15.5 8.5V5a1.5 1.5 0 0 0-1.5-1.5H5A1.5 1.5 0 0 0 3.5 5v9A1.5 1.5 0 0 0 5 15.5h3.5" />
  </Svg>
);

export const IconeDesfazer = (p) => (
  <Svg {...p}>
    <path d="M9 7 4.5 11.5 9 16" />
    <path d="M4.5 11.5H15a4.5 4.5 0 0 1 0 9h-2" />
  </Svg>
);

export const IconePausa = (p) => (
  <Svg {...p} strokeWidth="2.2">
    <path d="M9 5.5v13M15 5.5v13" />
  </Svg>
);

export const IconePlay = (p) => (
  <Svg {...p}>
    <path d="M7.5 5v14l11-7z" />
  </Svg>
);

export const IconeSino = (p) => (
  <Svg {...p}>
    <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z" />
    <path d="M10 21h4" />
  </Svg>
);

export const IconeSom = (p) => (
  <Svg {...p}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
    <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
  </Svg>
);

export const IconeSomMudo = (p) => (
  <Svg {...p}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
    <path d="M16 9.5l5 5M21 9.5l-5 5" />
  </Svg>
);

export const IconeFiltro = (p) => (
  <Svg {...p}>
    <path d="M3.5 5h17l-6.5 7.5V19l-4 1.5v-8z" />
  </Svg>
);

export const IconeBaixar = (p) => (
  <Svg {...p}>
    <path d="M12 3.5v11M7.5 10l4.5 4.5 4.5-4.5M4.5 19.5h15" />
  </Svg>
);

export const IconeOlho = (p) => (
  <Svg {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const IconeOlhoFechado = (p) => (
  <Svg {...p}>
    <path d="M4 4l16 16M10.6 6.6A9.6 9.6 0 0 1 12 6.5c6 0 9.5 5.5 9.5 5.5a17 17 0 0 1-2.6 3.2M6.6 8.1A16.6 16.6 0 0 0 2.5 12S6 18.5 12 18.5a9 9 0 0 0 4.1-1" />
  </Svg>
);

export const IconeLixeira = (p) => (
  <Svg {...p}>
    <path d="M4 6.5h16M9.5 6.5V4h5v2.5M6 6.5l1 13.5h10l1-13.5M10 10.5v6M14 10.5v6" />
  </Svg>
);

export const IconeBloqueio = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M6 6l12 12" />
  </Svg>
);

export const IconeVoltar = (p) => (
  <Svg {...p} strokeWidth="2">
    <path d="M15 5l-7 7 7 7" />
  </Svg>
);

export const IconeNota = (p) => (
  <Svg {...p}>
    <path d="M5 3.5h10l4 4V20.5H5z" />
    <path d="M14.5 3.5v4.5H19M8.5 12h7M8.5 16h5" />
  </Svg>
);

export const IconeMapa = (p) => (
  <Svg {...p}>
    <path d="M3.5 6.5 9 4l6 2.5L20.5 4v13.5L15 20l-6-2.5L3.5 20z" />
    <path d="M9 4v13.5M15 6.5V20" />
  </Svg>
);

export const IconeAtualizar = (p) => (
  <Svg {...p}>
    <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3L19.5 9" />
    <path d="M19.5 4v5h-5" />
  </Svg>
);

export const IconeLink = (p) => (
  <Svg {...p}>
    <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
    <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
  </Svg>
);
