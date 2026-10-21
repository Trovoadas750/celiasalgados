// Ícones desenhados à mão para o projeto (sem bibliotecas de ícones).
// Todos usam currentColor, então herdam a cor do texto.

function Svg({ children, className = "size-6", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
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

// Cloche de servir: MENU
export function IconeCloche(props) {
  return (
    <Svg {...props}>
      <path d="M12 5.2v-1.4" />
      <circle cx="12" cy="3.4" r="0.6" fill="currentColor" />
      <path d="M4 16.5a8 8 0 0 1 16 0" />
      <path d="M2.8 16.5h18.4" />
      <path d="M4.5 19.5h15" />
      <path d="M8 11.2a5 5 0 0 1 2.4-1.6" />
    </Svg>
  );
}

// Comanda com picote: PEDIDOS
export function IconeComanda(props) {
  return (
    <Svg {...props}>
      <path d="M6 2.8h12v18.4l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4z" />
      <path d="M9 7.5h6" />
      <path d="M9 11h6" />
      <path d="M9 14.5h3.5" />
    </Svg>
  );
}

// Crachá: PERFIL
export function IconeCracha(props) {
  return (
    <Svg {...props}>
      <rect x="4" y="5" width="16" height="16" rx="3" />
      <path d="M10 5V3.2h4V5" />
      <circle cx="12" cy="11" r="2.3" />
      <path d="M8 17.5a4.3 4.3 0 0 1 8 0" />
    </Svg>
  );
}

// Coxinha: categoria salgado
export function IconeCoxinha(props) {
  return (
    <Svg {...props}>
      <path d="M12 3c-1.2 2.8-6 7.4-6 11.6A6 6 0 0 0 12 20.5a6 6 0 0 0 6-5.9C18 10.4 13.2 5.8 12 3z" />
      <path d="M9.3 13.3l.01 0M12.4 11.2l.01 0M14.2 15l.01 0M10.8 16.6l.01 0" strokeWidth="2.2" />
    </Svg>
  );
}

// Caixa de festa com laço: categoria kit
export function IconeCaixaFesta(props) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="9" width="17" height="11.5" rx="1.5" />
      <path d="M3.5 13h17" />
      <path d="M12 9v11.5" />
      <path d="M12 9c-1.2-2.8-4.6-4-5.4-2.2C6 8.2 8.6 9 12 9z" />
      <path d="M12 9c1.2-2.8 4.6-4 5.4-2.2.6 1.4-2 2.2-5.4 2.2z" />
    </Svg>
  );
}

// Garrafa PET: categoria refrigerante
export function IconeGarrafa(props) {
  return (
    <Svg {...props}>
      <path d="M10.2 2.8h3.6" />
      <path d="M10.6 2.8v2.6c0 .8-2.6 2-2.6 4.6v9.4A1.6 1.6 0 0 0 9.6 21h4.8a1.6 1.6 0 0 0 1.6-1.6V10c0-2.6-2.6-3.8-2.6-4.6V2.8" />
      <path d="M8 12.5h8" />
      <path d="M8 16.5h8" />
    </Svg>
  );
}

export function IconeLupa(props) {
  return (
    <Svg {...props}>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5 5" />
    </Svg>
  );
}

// Ampulheta: tempo de preparo
export function IconeAmpulheta(props) {
  return (
    <Svg {...props}>
      <path d="M6.5 3h11M6.5 21h11" />
      <path d="M7.5 3c0 5 4.5 6 4.5 9s-4.5 4-4.5 9" />
      <path d="M16.5 3c0 5-4.5 6-4.5 9s4.5 4 4.5 9" />
    </Svg>
  );
}

// Alfinete de mapa: área de entrega
export function IconeAlfinete(props) {
  return (
    <Svg {...props}>
      <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.2" />
    </Svg>
  );
}

export function IconeMais(props) {
  return (
    <Svg {...props} strokeWidth="2.2">
      <path d="M12 5.5v13M5.5 12h13" />
    </Svg>
  );
}

export function IconeMenos(props) {
  return (
    <Svg {...props} strokeWidth="2.2">
      <path d="M5.5 12h13" />
    </Svg>
  );
}

export function IconeFechar(props) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  );
}

export function IconeSeta(props) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M9 5l7 7-7 7" />
    </Svg>
  );
}

export const ICONE_CATEGORIA = {
  kit: IconeCaixaFesta,
  salgado: IconeCoxinha,
  refrigerante: IconeGarrafa,
};

// Redes sociais (mesmo traço dos outros ícones)
export function IconeInstagram(props) {
  return (
    <Svg {...props}>
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
    </Svg>
  );
}

export function IconeWhatsapp(props) {
  return (
    <Svg {...props}>
      <path d="M3.3 20.7l1.2-4.1a8.7 8.7 0 1 1 3.1 3z" />
      <path d="M9 8.3c-.4 2.9 3.6 7.1 6.6 6.8l.9-1.5-2.1-1.1-1 .8a5.2 5.2 0 0 1-2.7-2.7l.8-1-1.1-2.1z" />
    </Svg>
  );
}

export function IconeFacebook(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.8" />
      <path d="M15 7.8h-1.5a2.3 2.3 0 0 0-2.3 2.3v10.7" />
      <path d="M8.8 13h5.4" />
    </Svg>
  );
}
