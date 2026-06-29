import type { Casa } from "@/lib/casa";
import type { CoesaoPartido } from "@/lib/types";

const API_BASE = (
  process.env.API_INTERNAL_URL ?? 
  process.env.NEXT_PUBLIC_API_URL ?? 
  "http://localhost:8001"
).replace(/\/$/, "");

type CoesaoPartidoApi = {
  partido: string;
  indice_coesao: number;
  total_proposicoes: number;
};

type CoesaoGeralResponse = {
  itens: CoesaoPartidoApi[];
};

export function normalizePartido(partido: string): string {
  if (!partido) return partido;
  const p = partido.trim();
  if (p.toUpperCase() === "PODE") return "PODEMOS";
  return p;
}

async function fetchCoesaoCasa(casa: Casa): Promise<CoesaoPartido[]> {
  const url = `${API_BASE}/api/${casa}/partidos/coesao`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`Falha ao buscar coesão dos partidos para ${casa}: HTTP ${res.status}`);
  }
  const data = (await res.json()) as CoesaoGeralResponse;
  return data.itens.map((item) => ({
    partido: normalizePartido(item.partido),
    indice_coesao: item.indice_coesao,
    total_proposicoes: item.total_proposicoes,
    casa,
  }));
}

/**
 * Busca a coesão de partidos da Câmara e do Senado em paralelo, retornando um único array.
 */
export async function fetchCoesaoPartidosCompleta(): Promise<CoesaoPartido[]> {
  const [camara, senado] = await Promise.all([
    fetchCoesaoCasa("camara"),
    fetchCoesaoCasa("senado"),
  ]);
  return [...camara, ...senado];
}
