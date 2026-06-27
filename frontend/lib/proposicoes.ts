// Camada de dados para integração com a API de Proposições.
// Realiza buscas paginadas e consultas de detalhe e polarização.

import type { Casa } from "@/lib/casa";
import type { Proposicao, PaginaProposicoes, PolarizacaoProposicao } from "./types";

const API_BASE = (
  process.env.API_INTERNAL_URL ?? 
  process.env.NEXT_PUBLIC_API_URL ?? 
  "http://localhost:8001"
).replace(/\/$/, "");

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    next: { revalidate: 60 }, // Cache curto por padrão, revalidado conforme necessário
    ...init,
  });
  if (!res.ok) {
    throw new Error(`Erro na API (${res.status}): ${path}`);
  }
  return res.json() as Promise<T>;
}

export type ProposicoesParams = {
  busca?: string;
  ano?: number;
  tipo?: string;
  apenasAnalisadas?: boolean;
  pagina?: number;
  tamanho?: number;
};

/**
 * Busca proposições de forma paginada para uma casa específica.
 * Como o payload da API não traz o campo `casa` preenchido, nós o carimbamos aqui.
 */
export async function obterProposicoes(
  casa: Casa,
  params: ProposicoesParams = {}
): Promise<PaginaProposicoes> {
  const q = new URLSearchParams();
  if (params.busca) q.set("busca", params.busca);
  if (params.ano) q.set("ano", String(params.ano));
  if (params.tipo) q.set("tipo", params.tipo);
  if (params.apenasAnalisadas) q.set("apenas_analisadas", "true");
  if (params.pagina) q.set("pagina", String(params.pagina));
  if (params.tamanho) q.set("tamanho", String(params.tamanho));

  const qs = q.toString();
  const path = `/api/${casa}/proposicoes${qs ? `?${qs}` : ""}`;
  
  const rawPage = await getJson<{
    total_registros: number;
    pagina_atual: number;
    tamanho_pagina: number;
    total_paginas: number;
    itens: Omit<Proposicao, "casa">[];
  }>(path);

  // Carimba a casa em cada proposição para consistência no front
  const itens = rawPage.itens.map((item) => ({
    ...item,
    casa,
  }));

  return {
    ...rawPage,
    itens,
  };
}

/**
 * Busca o perfil detalhado de uma proposição.
 */
export async function obterDetalheProposicao(casa: Casa, id: string): Promise<Proposicao> {
  const path = `/api/${casa}/proposicoes/${id}`;
  const raw = await getJson<Omit<Proposicao, "casa">>(path);
  return {
    ...raw,
    casa,
  };
}

/**
 * Busca o cálculo de polarização e distribuição de votos de uma proposição.
 */
export async function obterPolarizacaoProposicao(casa: Casa, id: string): Promise<PolarizacaoProposicao> {
  const path = `/api/${casa}/proposicoes/${id}/polarizacao`;
  return getJson<PolarizacaoProposicao>(path);
}
