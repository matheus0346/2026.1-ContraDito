// Comparação 1×1 (Fase 2) — Server Component. Faz o fetch-all-once dos parlamentares
// (mesmos dados do /diretorio, ADR 003) para alimentar o seletor; a comparação em si
// (/api/comparar + timelines) só roda no client, depois que os dois são escolhidos.

import { fetchDiretorioCompleto } from "@/lib/diretorio";
import type { Parlamentar } from "@/lib/types";
import { ComparacaoClient } from "./ComparacaoClient";

export const dynamic = "force-dynamic";

export default async function ComparacaoPage() {
  let parlamentares: Parlamentar[] = [];
  let erroInicial = false;

  try {
    parlamentares = await fetchDiretorioCompleto();
  } catch {
    erroInicial = true;
  }

  return <ComparacaoClient parlamentares={parlamentares} erroInicial={erroInicial} />;
}
