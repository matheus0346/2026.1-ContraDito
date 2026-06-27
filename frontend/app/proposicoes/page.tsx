// Painel de proposições (Câmara / Senado) — Server Component.
// Faz o fetch paginado no servidor com base nos query params.

import { obterProposicoes } from "@/lib/proposicoes";
import type { Casa } from "@/lib/casa";
import { ProposicoesClient } from "./ProposicoesClient";

// Renderiza sempre no request para obter dados frescos com paginação.
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    busca?: string;
    casa?: string;
    ano?: string;
    tipo?: string;
    analisadas?: string;
    pagina?: string;
  }>;
}

export default async function ProposicoesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  
  // Lê parâmetros da URL
  const casa: Casa = sp.casa === "senado" ? "senado" : "camara";
  const busca = sp.busca || "";
  const ano = sp.ano ? Number(sp.ano) : undefined;
  const tipo = sp.tipo || "";
  const apenasAnalisadas = sp.analisadas === "true";
  const pagina = sp.pagina ? Number(sp.pagina) : 1;

  let dados = null;
  let erro = false;

  try {
    dados = await obterProposicoes(casa, {
      busca,
      ano,
      tipo,
      apenasAnalisadas,
      pagina,
      tamanho: 15, // 15 itens por página fica ótimo para ementas longas
    });
  } catch (err) {
    console.error("Erro ao carregar proposições no servidor:", err);
    erro = true;
  }

  return (
    <ProposicoesClient
      dados={dados}
      erro={erro}
      casaInicial={casa}
      buscaInicial={busca}
      anoInicial={ano}
      tipoInicial={tipo}
      analisadasInicial={apenasAnalisadas}
      paginaInicial={pagina}
    />
  );
}
