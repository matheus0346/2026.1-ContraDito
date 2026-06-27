// Camada de dados do diretório (fetch-all-once — ADR 003).
// Busca TODAS as páginas de cada casa via GET /api/{casa}/politicos, anota o campo
// `casa` (a API não devolve isso) e concatena num array único (~887). Roda no servidor
// (Server Component). Sem score em lugar nenhum.

import type { Casa } from "@/lib/casa";
import type { Parlamentar } from "@/lib/types";

// No host (next dev), a API responde em :8001. No Docker container, usa API_INTERNAL_URL (http://fastapi:8000).
const API_BASE = (
  process.env.API_INTERNAL_URL ?? 
  process.env.NEXT_PUBLIC_API_URL ?? 
  "http://localhost:8001"
).replace(/\/$/, "");

// tamanho máximo aceito pela API (Query le=100) — minimiza o nº de páginas/requisições.
const TAMANHO = 100;

// Item cru de GET /api/{casa}/politicos — idêntico ao canônico, porém SEM `casa`.
type ParlamentarApi = Omit<Parlamentar, "casa">;

type PaginaPoliticos = {
  total_registros: number;
  pagina_atual: number;
  tamanho_pagina: number;
  total_paginas: number;
  itens: ParlamentarApi[];
};

async function fetchPagina(casa: Casa, pagina: number): Promise<PaginaPoliticos> {
  const url = `${API_BASE}/api/${casa}/politicos?pagina=${pagina}&tamanho=${TAMANHO}`;
  // revalidate alinhado ao cache de 1h da própria API (ADR 003); erro não é cacheado,
  // então o retry da Etapa 3 sempre refaz o fetch.
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Falha ao buscar ${casa} (página ${pagina}): HTTP ${res.status}`);
  return res.json() as Promise<PaginaPoliticos>;
}

/** Busca TODAS as páginas de uma casa, seguindo total_paginas, e anota `casa` em cada item. */
export async function fetchCasaCompleta(casa: Casa): Promise<Parlamentar[]> {
  const primeira = await fetchPagina(casa, 1);
  const totalPaginas = Math.max(primeira.total_paginas, 1);

  const restantes: Promise<PaginaPoliticos>[] = [];
  for (let p = 2; p <= totalPaginas; p++) restantes.push(fetchPagina(casa, p));
  const paginas = await Promise.all(restantes);

  // Pick explícito dos campos canônicos (NÃO espalha `item`): garante que resíduos
  // não declarados pela API — score_coerencia — não vazem nem em runtime (DevTools/logs).
  return [primeira, ...paginas]
    .flatMap((pg) => pg.itens)
    .map((item) => ({
      id: item.id,
      casa, // anota a casa (API não devolve)
      nome_civil: item.nome_civil,
      nome_urna: item.nome_urna,
      partido: item.partido,
      cargo: item.cargo,
      estado: item.estado,
      status_mandato: item.status_mandato,
      url_foto: item.url_foto,
      data_ultima_atualizacao: item.data_ultima_atualizacao,
    }));
}

/** Busca câmara + senado em paralelo e concatena no array único do diretório (~887). */
export async function fetchDiretorioCompleto(): Promise<Parlamentar[]> {
  const [camara, senado] = await Promise.all([
    fetchCasaCompleta("camara"),
    fetchCasaCompleta("senado"),
  ]);
  return [...camara, ...senado];
}
