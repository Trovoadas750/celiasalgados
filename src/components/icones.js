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

// Loja aberta: fachada com toldo e porta
export function IconeLojaAberta(props) {
  return (
    <Svg {...props}>
      <path d="M4 10v10h16V10" />
      <path d="M3 5.5 4.5 3h15L21 5.5V7a2.5 2.5 0 0 1-4.5 1.5 2.5 2.5 0 0 1-4.5 0 2.5 2.5 0 0 1-4.5 0A2.5 2.5 0 0 1 3 7z" />
      <path d="M10 20v-5h4v5" />
    </Svg>
  );
}

// Loja fechada: cadeado
export function IconeLojaFechada(props) {
  return (
    <Svg {...props}>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
      <path d="M12 14.5v2" />
    </Svg>
  );
}

// Relógio: horários de atendimento
export function IconeRelogio(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Svg>
  );
}

// Lápis: editar (ex.: trocar avatar)
export function IconeLapis(props) {
  return (
    <Svg {...props}>
      <path d="M4 20l1.2-4.4L15.8 5a2.1 2.1 0 0 1 3 3L8.4 18.8z" />
      <path d="M13.8 7l3.2 3.2" />
    </Svg>
  );
}

// Logo oficial do WhatsApp (preenchido), do Simple Icons (CC0): https://simpleicons.org/?q=whatsapp
// Usado no botão flutuante, onde o símbolo da marca é reconhecido de longe.
export function IconeWhatsappOficial({ className = "size-6", ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className} {...props}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

// Recebimento do pedido. Desenhos do conjunto Pinhead Map Icons (CC0, domínio público):
// https://github.com/waysidemapping/pinhead
function SvgPinhead({ children, className = "size-6", ...props }) {
  return (
    <svg viewBox="0 0 15 15" fill="currentColor" aria-hidden="true" className={className} {...props}>
      {children}
    </svg>
  );
}

// Pessoa carregando sacolas: retirar no local
export function IconeRetirada(props) {
  return (
    <SvgPinhead {...props}>
      <path d="M7.67 2.68c.69.05 1.3-.44 1.35-1.09C9.07.93 8.56.35 7.87.3S6.58.74 6.53 1.4c-.06.66.46 1.23 1.14 1.28m5.17 9.62l-.42-3.6h-.67c0-.3 0-.33-.02-.52c-.02-.18-.08-.32-.17-.36c.07-.09.13-.19.14-.31a.53.53 0 0 0-.22-.47L9.76 5.9L8.49 3.52c-.21-.31-.56-.56-.99-.6c-.33-.02-.64.09-.88.25L4.11 5.11c-.08.07-.14.16-.17.26l-.59 2.36l-.04.07H3.3c-.1 0-.19.09-.22.22c-.03.12-.07.28-.07.41v.27h-.65l-.42 3.6h1.68l-.74 1.18c-.04.09-.1.22-.11.34c-.04.45.31.84.78.87c.33.03.62-.13.79-.39l1.25-2h.16l-.03-.22l.35-.56c.04-.07.16-.25.17-.34l.42-1.83l1.8 1.88l.57 2.83c.09.33.37.61.76.63c.47.04.88-.29.91-.74v-.16l-.3-1.49zM3.29 8.4c.02-.14.07-.22.16-.22h.04c.1.11.23.19.4.2c.18.02.35-.06.46-.19c.02.02.04.06.06.1c.02.09.04.19.04.27c0 .05 0 .15-.01.15H3.28s0-.2.01-.31m1.72.3h-.36c.01-.3.01-.33-.01-.52c-.02-.15-.06-.27-.13-.33l.44-1.94l.88-.67zm6.53 0h-1.17s0-.19.01-.3c.02-.14.07-.22.17-.22c.13 0 .25-.01.36-.01s.26-.01.45-.01c.07 0 .12.04.14.13c.03.09.04.19.04.27zm-3.77-.68l.56-2.39l.48.9a.7.7 0 0 0 .14.16l1.69 1.11h-.25c-.1 0-.14.09-.17.22c-.03.12-.02.28-.02.41v.27h-.76l-.12 1.06l-1.55-1.75z" />
    </SvgPinhead>
  );
}

// Pessoa de capacete pilotando moto: entrega (motoboy)
export function IconeMotoboy(props) {
  return (
    <SvgPinhead {...props}>
      <path d="M8.25 11.52c-.2.21-.48.34-.75.34V8.18l2.73-.68v1.36zM6.14 3.41h-.69V2.8s-.61.13-.81.34L2.59 6.27c-.07.07-.07.28-.07.41c0 .34.14.62.41.75l2.73 1.5v2.66c0 .34.27.68.68.68c.34 0 .55-.27.55-.68v-3.2s.2-.55-.34-.82l-1.78-.89L6 4.77l.68 1.03c.14.2.27.34.48.34h1.7c.69 0 .69-.96 0-.96H7.5L6.14 3.14zm7.43 3.89l.07.13c0 .07-.07.14-.14.14h-.07c-.27-.14-.48-.21-.82-.21c-.2 0-.47.07-.81.34l-.28-.61c.34-.14.68-.27 1.03-.27c.4 0 .68.2 1.02.48m-11.39.47l2.59 1.57v.61l-3-1.77c-.2-.13-.54-.2-.75-.2c-.34 0-.2.07-.47.2H.48c-.07 0-.14-.07-.14-.13l.07-.14c.34-.27.27-.41.82-.41c.27 0 .54.07.95.27m.21 5.8c.88 0 1.63-.75 1.63-1.71c0-.95-.75-1.7-1.63-1.7c-.89 0-1.64.75-1.64 1.7c0 .96.75 1.71 1.64 1.71M0 11.86c0-1.36 1.09-2.45 2.39-2.45c1.29 0 2.38 1.09 2.38 2.45c0 1.37-1.09 2.46-2.38 2.46c-1.3 0-2.39-1.09-2.39-2.46m12.55 1.71c.95 0 1.7-.75 1.7-1.71c0-.95-.75-1.7-1.7-1.7c-.96 0-1.71.75-1.71 1.7c0 .96.82 1.71 1.71 1.71m-2.46-1.71c0-1.36 1.09-2.45 2.46-2.45c1.36 0 2.45 1.09 2.45 2.45c0 1.37-1.09 2.46-2.45 2.46c-1.37 0-2.46-1.09-2.46-2.46m1.91-3l-1.09-2.18c-.14-.27-.55-.54-.89-.54h-.75c-.13 0-.27.2-.27.41c0 .2.14.27.27.27h.75c.14 0 .28.07.34.2l1.09 1.84zM8.18 2.05h.62c.06-.14.06-.21.06-.35c0-.95-.75-1.7-1.7-1.7c-.96 0-1.71.75-1.71 1.7c0 .41.14.75.35 1.03h2.38zm-2.04.34a1.02 1.02 0 1 0 2.05 0a1.02 1.02 0 1 0-2.05 0" />
    </SvgPinhead>
  );
}

// Alerta (círculo com "!"): acompanha mensagens de erro e aviso, para não depender só da cor
export function IconeAlerta(props) {
  return (
    <Svg {...props} strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5" />
      <path d="M12 16.5v.01" strokeWidth="2.6" />
    </Svg>
  );
}

// Visto (✓): sucesso e item selecionado
export function IconeCheck(props) {
  return (
    <Svg {...props} strokeWidth="2.4">
      <path d="M5 12.5l4.2 4.2L19 7" />
    </Svg>
  );
}

// Floco de neve: pacote congelado
export function IconeFloco(props) {
  return (
    <Svg {...props}>
      <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" />
      <path d="M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5" />
      <path d="M4.3 10.3l3.4-.9-.9-3.4M19.7 13.7l-3.4.9.9 3.4" />
      <path d="M6.8 17.6l.9-3.4-3.4-.9M17.2 6.4l-.9 3.4 3.4.9" />
    </Svg>
  );
}

// Prato com vapor: pronto para comer
export function IconePronto(props) {
  return (
    <Svg {...props}>
      <path d="M3 13.5h18a9 9 0 0 1-18 0z" />
      <path d="M9 3.5c-.8 1 .8 2 0 3M12 2.5c-.8 1 .8 2 0 3M15 3.5c-.8 1 .8 2 0 3" />
    </Svg>
  );
}
