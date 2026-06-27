// Normalização e apresentação NEUTRA de votos para a comparação 1×1.
// A cor diferencia categorias (SIM/NÃO/outros), nunca é julgamento de valor.

export type VotoCategoria = "sim" | "nao" | "outro";

/** Reduz qualquer voto_oficial a uma das 3 categorias (sem acento, case-insensitive). */
export function categoriaVoto(voto: string): VotoCategoria {
  const v = voto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  if (v === "sim") return "sim";
  if (v === "nao") return "nao";
  return "outro";
}

// Cores via var() do tema (definidas em globals.css). Categóricas, não avaliativas.
export const VOTO_COR: Record<VotoCategoria, string> = {
  sim: "var(--color-voto-sim)",
  nao: "var(--color-voto-nao)",
  outro: "var(--color-voto-outro)",
};

// Nível no eixo Y do gráfico — posição visual, NÃO um ranking de valor (Sim não "vale mais").
export const VOTO_NIVEL: Record<VotoCategoria, number> = { sim: 3, outro: 2, nao: 1 };
export const NIVEL_LABEL: Record<number, string> = { 3: "Sim", 2: "Outro", 1: "Não" };

// Cores das duas séries (uma por parlamentar). Também tokens do tema.
export const SERIE_A = "var(--color-serie-a)";
export const SERIE_B = "var(--color-serie-b)";
