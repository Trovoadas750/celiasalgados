"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AcessoConta from "@/components/cliente/AcessoConta";
import { useCliente } from "@/components/cliente/ClienteProvider";

// Só aceita caminhos internos ("/perfil"), nunca "//site.com" ou URLs completas.
function destinoSeguro(volta) {
  return volta?.startsWith("/") && !volta.startsWith("//") ? volta : "/perfil";
}

export default function Entrar() {
  const params = useSearchParams();
  const router = useRouter();
  const { estado } = useCliente();
  const destino = destinoSeguro(params.get("volta"));
  const modo = params.get("modo") === "cadastro" ? "cadastro" : "entrar";

  useEffect(() => {
    if (estado === "logado") router.replace(destino);
  }, [estado, destino, router]);

  return (
    <div className="mx-auto max-w-md pt-6">
      <h1 className="font-titulo text-[28px] leading-tight text-ferrugem">
        {modo === "cadastro" ? "Crie sua conta" : "Entre na sua conta"}
      </h1>
      <p className="mb-5 mt-1 text-sm text-texto-suave">
        Com uma conta você acompanha seus pedidos e não precisa digitar seus dados toda vez.
      </p>
      <div className="rounded-2xl bg-superficie p-4 ring-1 ring-borda-suave">
        <AcessoConta key={modo} modoInicial={modo} aoConcluir={() => router.replace(destino)} />
      </div>
    </div>
  );
}
