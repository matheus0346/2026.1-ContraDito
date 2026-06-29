// Camada de dados para integração com a API de Políticos (Dossiê).
// Realiza as consultas de perfil, afinidades, fidelidade, timeline e discursos.

import type { Casa } from "@/lib/casa";
import type {
  Parlamentar,
  PoliticoDetalhado,
  AfinidadesPoliticas,
  FidelidadePartidaria,
  TimelinePoint,
  PaginaVotosNominais,
  Discurso,
} from "./types";
import { normalizePartido } from "./partidos";

const API_BASE = (
  process.env.API_INTERNAL_URL ?? 
  process.env.NEXT_PUBLIC_API_URL ?? 
  "http://localhost:8001"
).replace(/\/$/, "");

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    next: { revalidate: 60 },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`Erro na API (${res.status}): ${path}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Busca o perfil cadastral e resumo de votos do político.
 */
export async function obterPoliticoDetalhado(casa: Casa, id: number): Promise<PoliticoDetalhado> {
  const path = `/api/${casa}/politicos/${id}`;
  const raw = await getJson<{
    politico: Omit<Parlamentar, "casa">;
    resumo_votos: PoliticoDetalhado["resumo_votos"];
  }>(path);

  return {
    politico: {
      ...raw.politico,
      partido: normalizePartido(raw.politico.partido),
      casa,
    },
    resumo_votos: raw.resumo_votos,
  };
}

/**
 * Busca a linha do tempo cronológica de votações de um parlamentar.
 */
export async function obterTimelineVotos(casa: Casa, id: number): Promise<TimelinePoint[]> {
  const path = `/api/${casa}/politicos/${id}/timeline`;
  return getJson<TimelinePoint[]>(path);
}

/**
 * Busca as afinidades (gêmeo e antípoda) de concordância de votos do político.
 */
export async function obterAfinidadesPolitico(casa: Casa, id: number): Promise<AfinidadesPoliticas> {
  const path = `/api/${casa}/politicos/${id}/afinidades`;
  const raw = await getJson<{
    gemeo: { politico: Omit<Parlamentar, "casa">; concordancia: number; votos_comuns: number } | null;
    antipoda: { politico: Omit<Parlamentar, "casa">; concordancia: number; votos_comuns: number } | null;
  }>(path);

  return {
    gemeo: raw.gemeo
      ? {
          ...raw.gemeo,
          politico: {
            ...raw.gemeo.politico,
            partido: normalizePartido(raw.gemeo.politico.partido),
            casa,
          },
        }
      : null,
    antipoda: raw.antipoda
      ? {
          ...raw.antipoda,
          politico: {
            ...raw.antipoda.politico,
            partido: normalizePartido(raw.antipoda.politico.partido),
            casa,
          },
        }
      : null,
  };
}

/**
 * Busca o índice de fidelidade partidária bruta do político.
 */
export async function obterFidelidadePartidaria(casa: Casa, id: number): Promise<FidelidadePartidaria> {
  const path = `/api/${casa}/politicos/${id}/fidelidade`;
  return getJson<FidelidadePartidaria>(path);
}

/**
 * Busca a lista paginada de todos os votos nominais do político (Rota 15).
 * Esta listagem retorna as relações de proposições (com ementa/resumo IA) e chunks de discursos.
 */
export async function obterVotosNominais(
  casa: Casa,
  politicoId: number,
  pagina = 1,
  tamanho = 20,
  apenasComDiscursos?: boolean
): Promise<PaginaVotosNominais> {
  let path = `/api/${casa}/votos?politico_id=${politicoId}&pagina=${pagina}&tamanho=${tamanho}`;
  if (apenasComDiscursos) {
    path += `&apenas_com_discursos=true`;
  }
  return getJson<PaginaVotosNominais>(path);
}

/**
 * Busca o texto integral e detalhes de um discurso específico (Rota 13).
 */
export async function obterDetalheDiscurso(casa: Casa, discursoId: string): Promise<Discurso> {
  const path = `/api/${casa}/discursos/${discursoId}`;
  return getJson<Discurso>(path);
}
