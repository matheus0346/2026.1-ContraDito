// Tipos canônicos do portal de consulta (SEM score — produto não exibe coerência).
// Parlamentar é identificado por (casa, id). Para os tipos legados com score, usados
// só pela página antiga em rework (/politico/[id]), ver `@/lib/types-legacy`.

import type { Casa } from "@/lib/casa";

export type Parlamentar = {
  id: number;
  casa: Casa;
  nome_civil: string;
  nome_urna: string;
  partido: string;
  cargo: string;
  estado: string;
  status_mandato: string;
  url_foto: string | null;
  data_ultima_atualizacao: string;
};

export type PaginaParlamentares = {
  total_registros: number;
  pagina_atual: number;
  tamanho_pagina: number;
  total_paginas: number;
  itens: Parlamentar[];
};

export type Proposicao = {
  id: string; // UUID
  proposicao_id: string; // ex: "PL 2630/2020"
  casa: Casa;
  tipo: string;
  numero: number;
  ano: number;
  ementa: string;
  data_votacao: string | null;
  url_texto_inteiro: string | null;
  resumo_executivo: string | null;
};

export type PaginaProposicoes = {
  total_registros: number;
  pagina_atual: number;
  tamanho_pagina: number;
  total_paginas: number;
  itens: Proposicao[];
};

export type PolarizacaoProposicao = {
  proposicao_id: string;
  qtd_sim: number;
  qtd_nao: number;
  pct_sim: number;
  pct_nao: number;
  polarizacao: number;
  classificacao: "Consensual" | "Dividida" | "Altamente Polarizada";
};

export type VotoProposicaoRelacao = {
  id: string;
  ementa: string;
  resumo_executivo: string | null;
  tipo: string;
  numero: number;
  ano: number;
};

export type DiscursoChunk = {
  chunk_id?: string;
  id?: string;
  discurso_id: string;
  texto_chunk: string;
  similaridade?: number;
};

export type VotoNominal = {
  id: string;
  proposicao_id: string;
  politico_id: number;
  partido_na_epoca: string | null;
  voto_oficial: string;
  chunks_proximos: DiscursoChunk[] | null;
  proposicao: VotoProposicaoRelacao | null;
};

export type PaginaVotosNominais = {
  total_registros: number;
  pagina_atual: number;
  tamanho_pagina: number;
  total_paginas: number;
  itens: VotoNominal[];
};

export type PoliticoResumoVotos = {
  politico_id: number;
  casa: string;
  total_votos: number;
  qtd_sim: number;
  qtd_nao: number;
  qtd_ausencia: number;
  qtd_abstencao: number;
  qtd_obstrucao: number;
  qtd_outros: number;
};

export type PoliticoDetalhado = {
  politico: Parlamentar;
  resumo_votos: PoliticoResumoVotos | null;
};

export type AfinidadeMembro = {
  politico: Parlamentar;
  concordancia: number;
  votos_comuns: number;
};

export type AfinidadesPoliticas = {
  gemeo: AfinidadeMembro | null;
  antipoda: AfinidadeMembro | null;
};

export type FidelidadePartidaria = {
  taxa_fidelidade: number;
  votos_alinhados: number;
  votos_rebeldes: number;
  total_votos_com_orientacao: number;
};

export type TimelinePoint = {
  data_votacao: string | null;
  proposicao_id: string;
  proposicao_uuid: string | null;
  tipo: string;
  numero: number;
  ano: number;
  ementa: string;
  voto_oficial: string;
};

export type Discurso = {
  id: string;
  politico_id: number | null;
  data_discurso: string | null;
  texto_bruto: string;
  url_video: string | null;
  sumario: string | null;
  fase_evento: string | null;
};
