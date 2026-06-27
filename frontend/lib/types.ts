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
