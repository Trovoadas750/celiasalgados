// Alertas de pedido novo no painel: som, notificação do navegador e "já vi este pedido".
// Tudo em try/catch: navegador sem armazenamento/áudio continua funcionando, só sem o extra.

const CHAVE_SOM = "celiasalgados:admin:som";
const CHAVE_VISTOS = "celiasalgados:admin:pedidos-vistos";
const MAX_VISTOS = 500;

// ---- Som ----
let audio = null;

function obterAudio() {
  audio ??= new Audio("/sons/novo-pedido.wav");
  return audio;
}

export function somLigado() {
  try {
    return window.localStorage.getItem(CHAVE_SOM) === "1";
  } catch {
    return false;
  }
}

/**
 * Liga/desliga o som. Ligar precisa vir de um clique: navegadores bloqueiam áudio sem
 * interação, então já toca uma vez para "destravar".
 */
export async function definirSom(ligado) {
  try {
    window.localStorage.setItem(CHAVE_SOM, ligado ? "1" : "0");
  } catch {
    // sem armazenamento: vale só nesta aba
  }
  if (ligado) return tocarSom();
  return true;
}

export async function tocarSom() {
  try {
    const a = obterAudio();
    a.currentTime = 0;
    await a.play();
    return true;
  } catch {
    return false; // bloqueado pelo navegador (falta clique) ou sem áudio
  }
}

// ---- Notificação do navegador ----
export function permissaoNotificacao() {
  return typeof Notification === "undefined" ? "indisponivel" : Notification.permission;
}

export async function pedirNotificacao() {
  if (typeof Notification === "undefined") return "indisponivel";
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function notificar(titulo, corpo, tag) {
  if (permissaoNotificacao() !== "granted") return;
  try {
    new Notification(titulo, { body: corpo, tag, icon: "/logo.webp" });
  } catch {
    // alguns celulares só notificam via service worker
  }
}

// ---- Pedidos já abertos (badge "NOVO" some depois de abrir) ----
export function lerVistos() {
  try {
    const lista = JSON.parse(window.localStorage.getItem(CHAVE_VISTOS));
    return new Set(Array.isArray(lista) ? lista : []);
  } catch {
    return new Set();
  }
}

export function marcarVisto(id) {
  const vistos = lerVistos();
  if (vistos.has(id)) return vistos;
  vistos.add(id);
  try {
    window.localStorage.setItem(CHAVE_VISTOS, JSON.stringify([...vistos].slice(-MAX_VISTOS)));
  } catch {
    // sem armazenamento: o badge volta ao recarregar
  }
  return vistos;
}
