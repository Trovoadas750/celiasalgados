"use client";

import { useEffect, useState } from "react";
import Campo, { AlertaErro } from "@/components/cliente/Campo";
import { IconeAlerta } from "@/components/icones";
import { buscarConfigLoja, listarFaixasFrete, simularFrete } from "@/lib/admin/loja";
import { formatarPreco, formatarValor } from "@/lib/formatar";
import { temErros, validar } from "@/lib/validacao";
import { CLASSE_BOTAO_PRINCIPAL } from "../estilos";
import { IconeMapa } from "../icones";
import { AvisoSoConsulta, Bloco, Carregando, SeloAtivo } from "./Comum";

const MENSAGEM_STATUS = {
  nao_encontrado: "Endereço não encontrado. No site, a entrega fica bloqueada (o cliente combina pelo WhatsApp ou retira).",
  fora_da_area: "Fora da área de entrega (mais longe que o raio máximo).",
  nao_configurado: "A loja está sem coordenadas: o frete não pode ser calculado.",
  erro_temporario: "Não foi possível calcular agora. Tente de novo em instantes.",
};

/** Simulador: mesmo cálculo do site (/api/frete). */
function Simulador() {
  const [endereco, setEndereco] = useState({ rua: "", numero: "", vila: "" });
  const [erros, setErros] = useState({});
  const [resultado, setResultado] = useState(null);
  const [calculando, setCalculando] = useState(false);

  async function simular(e) {
    e.preventDefault();
    const novos = validar(endereco, ["rua", "numero", "vila"]);
    setErros(novos);
    if (temErros(novos)) return;
    setCalculando(true);
    setResultado(await simularFrete(endereco));
    setCalculando(false);
  }

  const campo = (nome) => ({
    value: endereco[nome],
    erro: erros[nome],
    onChange: (e) => setEndereco({ ...endereco, [nome]: e.target.value }),
  });

  return (
    <form noValidate onSubmit={simular} className="space-y-3">
      <Campo rotulo="Rua" maxLength={120} {...campo("rua")} />
      <div className="grid grid-cols-[7rem_1fr] gap-3">
        <Campo rotulo="Número" maxLength={10} {...campo("numero")} />
        <Campo rotulo="Vila/bairro" maxLength={80} {...campo("vila")} />
      </div>
      <button type="submit" disabled={calculando} className={CLASSE_BOTAO_PRINCIPAL}>
        {calculando ? "Calculando…" : "Simular frete"}
      </button>
      {resultado && (
        <div aria-live="polite">
          {resultado.status === "ok" ? (
            <p className="rounded-xl bg-sucesso-fundo px-3 py-2.5 text-[16px] font-bold text-sucesso">
              Frete {formatarPreco(resultado.valor)}
              {resultado.distancia_km != null && ` · ${formatarValor(resultado.distancia_km)} km em linha reta`}
            </p>
          ) : (
            <AlertaErro>{MENSAGEM_STATUS[resultado.status] ?? resultado.mensagem ?? "Não foi possível calcular."}</AlertaErro>
          )}
        </div>
      )}
    </form>
  );
}

/** /admin/frete: faixas, raio, coordenadas da loja (consulta) e simulador. */
export default function TelaFrete() {
  const [dados, setDados] = useState({ carregado: false, faixas: [], loja: null, erro: null });

  useEffect(() => {
    Promise.all([listarFaixasFrete(), buscarConfigLoja()])
      .then(([faixas, loja]) => setDados({ carregado: true, faixas, loja, erro: null }))
      .catch((e) => setDados({ carregado: true, faixas: [], loja: null, erro: e.message }));
  }, []);

  const loja = dados.loja;
  const lat = loja ? loja.loja_lat : null;
  const lng = loja ? loja.loja_lng : null;
  const raio = loja ? loja.raio_maximo_km : null;
  const semCoordenadas = dados.carregado && (lat == null || lng == null);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="traco-vinho font-titulo text-[28px] leading-tight text-ferrugem">Frete</h1>
      <AvisoSoConsulta assunto="faixas de frete, raio e coordenadas" />

      <div className="mt-4 space-y-4">
        {dados.erro ? (
          <AlertaErro>{dados.erro}</AlertaErro>
        ) : !dados.carregado ? (
          <Carregando altura="h-80" />
        ) : (
          <>
            {semCoordenadas && (
              <p role="alert" className="flex items-start gap-2 rounded-xl bg-erro-fundo px-3 py-3 font-bold text-erro ring-2 ring-erro">
                <IconeAlerta className="mt-px size-5 shrink-0" />
                A loja está sem coordenadas: nenhum frete é calculado e a entrega pelo site fica bloqueada.
              </p>
            )}

            <Bloco titulo="Faixas de frete (distância em linha reta)">
              {dados.faixas.length === 0 ? (
                <p className="text-texto-suave">Nenhuma faixa cadastrada.</p>
              ) : (
                <ul className="divide-y divide-borda-suave">
                  {dados.faixas.map((f) => (
                    <li key={f.id} className="flex flex-wrap items-center gap-2 py-2.5">
                      <span className="w-40 font-bold">{f.ate_km == null ? "Acima da última faixa" : `Até ${formatarValor(f.ate_km)} km`}</span>
                      <span className="text-lg font-bold text-ferrugem tabular-nums">{formatarPreco(f.valor)}</span>
                      <SeloAtivo ativo={f.ativo} />
                    </li>
                  ))}
                </ul>
              )}
              {raio != null && (
                <p className="mt-3 text-sm">
                  Raio máximo de entrega: <strong className="tabular-nums">{formatarValor(raio)} km</strong> (acima disso = fora da área).
                </p>
              )}
            </Bloco>

            <Bloco titulo="Loja">
              {loja && (
                <p className="text-[15px]">
                  {loja.endereco} · {loja.cidade}-{loja.uf}
                </p>
              )}
              <p className="mt-1 text-sm tabular-nums text-texto-suave">
                Coordenadas: {lat != null && lng != null ? `${lat}, ${lng}` : "não cadastradas"}
              </p>
              {lat != null && lng != null && (
                <a
                  href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 font-semibold text-link underline underline-offset-4 hover:text-ferrugem-ativo"
                >
                  <IconeMapa className="size-5" /> Conferir no mapa
                </a>
              )}
            </Bloco>

            <Bloco titulo="Simular frete de um endereço">
              <Simulador />
            </Bloco>
          </>
        )}
      </div>
    </div>
  );
}
