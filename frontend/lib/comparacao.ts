// Camada de dados da comparação 1×1 (Fase 2). Sem score, sem coerência.
// Usa GET /api/comparar (concordância + divergências) e as duas timelines COMPLETAS
// de votos via GET /api/{casa}/politicos/{id}/timeline, buscadas em paralelo.
// Os dois parlamentares são sempre da MESMA casa — a própria API só aceita um `casa`.

import type { Casa } from "@/lib/casa";

// Mesmo contrato do lib/diretorio.ts: no host (next dev) a API responde em :8001.
const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001").replace(/\/$/, "");

/** Uma divergência de voto entre os dois parlamentares (campos crus de /api/comparar). */
export type Divergencia = {
  proposicao_id: string;
  ementa: string | null;
  voto_politico_1: string;
  voto_politico_2: string;
};

/** Resposta de GET /api/comparar — concordância + divergências. Sem score. */
export type Comparacao = {
  concordancia_percentual: number;
  proposicoes_em_comum: number;
  divergencias: Divergencia[];
};

/** Um ponto da timeline de votos (GET .../timeline — já ordenado por data_votacao). */
export type VotoTimeline = {
  data_votacao: string;
  proposicao_id: string;
  tipo: string;
  numero: number;
  ano: number;
  ementa: string | null;
  voto_oficial: string;
};

/** Pacote completo da página: o comparativo + as duas timelines (TODAS as proposições). */
export type ComparacaoCompleta = {
  comparacao: Comparacao;
  timeline1: VotoTimeline[];
  timeline2: VotoTimeline[];
};

// fetch com revalidate alinhado ao cache de 1h da API (inerte no browser, útil no server).
async function getJson<T>(url: string, erroMsg: string): Promise<T> {
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`${erroMsg}: HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

/** GET /api/comparar — concordância + divergências entre dois parlamentares da mesma casa. */
export async function fetchComparacao(casa: Casa, id1: number, id2: number): Promise<Comparacao> {
  const url = `${API_BASE}/api/comparar?politico_id_1=${id1}&politico_id_2=${id2}&casa=${casa}`;
  return getJson<Comparacao>(url, `Falha ao comparar ${id1}×${id2} (${casa})`);
}

/** GET /api/{casa}/politicos/{id}/timeline — timeline COMPLETA (não filtra interseção). */
export async function fetchTimeline(casa: Casa, id: number): Promise<VotoTimeline[]> {
  const url = `${API_BASE}/api/${casa}/politicos/${id}/timeline`;
  return getJson<VotoTimeline[]>(url, `Falha ao buscar timeline de ${id} (${casa})`);
}

/**
 * Busca em paralelo tudo que a página precisa: o comparativo de /api/comparar e as
 * duas timelines completas. Qualquer falha propaga — a página trata com erro + retry.
 */
export async function fetchComparacaoCompleta(
  casa: Casa,
  id1: number,
  id2: number,
): Promise<ComparacaoCompleta> {
  const [comparacao, timeline1, timeline2] = await Promise.all([
    fetchComparacao(casa, id1, id2),
    fetchTimeline(casa, id1),
    fetchTimeline(casa, id2),
  ]);
  return { comparacao, timeline1, timeline2 };
}
