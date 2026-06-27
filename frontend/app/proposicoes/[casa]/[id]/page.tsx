// Página de detalhes de uma proposição específica — Server Component.
// Busca os dados cadastrais da matéria e os índices de polarização em paralelo.

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { obterDetalheProposicao, obterPolarizacaoProposicao } from "@/lib/proposicoes";
import type { Casa } from "@/lib/casa";
import { ProposicaoDetalheClient } from "./ProposicaoDetalheClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    casa: string;
    id: string;
  }>;
  searchParams: Promise<{
    voltar?: string;
  }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { casa, id } = await params;
  const casaClean: Casa = casa === "senado" ? "senado" : "camara";
  
  try {
    const prop = await obterDetalheProposicao(casaClean, id);
    return {
      title: `${prop.proposicao_id} — ContraDito`,
      description: `Detalhes e ementa do ${prop.proposicao_id} votado no Congresso Nacional.`,
    };
  } catch {
    return {
      title: "Detalhes da Proposição — ContraDito",
    };
  }
}

export default async function ProposicaoDetailPage({ params, searchParams }: PageProps) {
  const { casa, id } = await params;
  const sp = await searchParams;
  const casaClean: Casa = casa === "senado" ? "senado" : "camara";

  let proposicao = null;
  let polarizacao = null;

  try {
    // Busca dados básicos da proposição
    proposicao = await obterDetalheProposicao(casaClean, id);
  } catch (err) {
    console.error("Erro ao buscar proposição:", err);
    notFound(); // Caso a proposição básica não exista, lança 404
  }

  try {
    // Busca o cálculo de polarização (votos) correspondente
    polarizacao = await obterPolarizacaoProposicao(casaClean, id);
  } catch (err) {
    console.warn("Erro (não crítico) ao buscar polarização da proposição:", err);
    // Não lança erro crítico se falhar a polarização, apenas envia nulo para tratamento no front
    polarizacao = null;
  }

  return (
    <ProposicaoDetalheClient
      proposicao={proposicao}
      polarizacao={polarizacao}
      voltarPath={sp.voltar}
    />
  );
}
