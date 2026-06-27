"use client";

// Detalhes da Proposições (Client Component)
// Apresenta a ementa, resumo executivo IA, link para texto integral e dados de polarização.

import Link from "next/link";
import { ArrowLeft, FileText, ExternalLink, Vote, Activity } from "lucide-react";
import { CASA, tint } from "@/lib/casa";
import type { Proposicao, PolarizacaoProposicao } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface DetalheProps {
  proposicao: Proposicao;
  polarizacao: PolarizacaoProposicao | null;
  voltarPath?: string;
}

export function ProposicaoDetalheClient({
  proposicao: p,
  polarizacao: pol,
  voltarPath,
}: DetalheProps) {
  const { hex: hexCasa, label: labelCasa } = CASA[p.casa];

  // Configuração visual do badge de classificação de polarização
  const getPolarizacaoStyle = (classificacao: string) => {
    switch (classificacao) {
      case "Consensual":
        return {
          bg: "rgba(100, 116, 139, 0.1)",
          border: "rgba(100, 116, 139, 0.3)",
          text: "#94a3b8",
        };
      case "Dividida":
        return {
          bg: "rgba(245, 158, 11, 0.1)",
          border: "rgba(245, 158, 11, 0.3)",
          text: "#f59e0b",
        };
      case "Altamente Polarizada":
        default:
        return {
          bg: "rgba(167, 139, 250, 0.1)",
          border: "rgba(167, 139, 250, 0.3)",
          text: "#a78bfa",
        };
    }
  };

  const polStyle = pol ? getPolarizacaoStyle(pol.classificacao) : null;

  return (
    <div className="pt-14 min-h-screen">
      {/* Barra superior de navegação / Breadcrumb */}
      <div className="border-b border-rim/15 bg-card/25 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <Link
            href={voltarPath ?? "/proposicoes"}
            className="inline-flex items-center gap-2 text-sm text-mid hover:text-bright transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            {voltarPath ? "Voltar para o Dossiê" : "Voltar para Proposições"}
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Cabeçalho */}
        <header className="relative pb-8 border-b border-rim/20">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border"
              style={{
                color: hexCasa,
                backgroundColor: tint(hexCasa, 12),
                borderColor: tint(hexCasa, 30),
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: hexCasa }} />
              {labelCasa}
            </span>
            <span className="text-xs text-dim font-data uppercase tracking-wider">
              {p.tipo} {p.numero}/{p.ano}
            </span>
          </div>

          <h1 className="font-display text-bright font-black text-4xl sm:text-5xl mt-4 leading-tight">
            {p.proposicao_id}
          </h1>

          {p.data_votacao && p.resumo_executivo && (
            <p className="text-sm text-dim mt-2.5">
              Votada em {formatDate(p.data_votacao)}
            </p>
          )}
        </header>

        {/* Grid de Conteúdo */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 mt-10 items-start">
          
          {/* Coluna da Esquerda (Ementa e Resumo) */}
          <div className="space-y-8 min-w-0">
            {/* Resumo Executivo (IA) */}
            <section className="rounded-xl p-6 sm:p-7 glass-elevated relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-coherent/5 rounded-full filter blur-2xl pointer-events-none" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-coherent flex items-center gap-2 mb-4">
                <Activity size={16} />
                Resumo Executivo (IA)
              </h2>
              {p.resumo_executivo ? (
                <div className="text-bright text-base leading-relaxed space-y-4 whitespace-pre-line font-display italic">
                  {p.resumo_executivo}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-mid italic">
                    Esta proposição não possui resumo executivo gerado por IA porque ela não foi submetida a uma votação nominal no plenário.
                  </p>
                  <p className="text-xs text-dim">
                    O pipeline de cruzamento do ContraDito é disparado apenas para matérias que passaram por votações nominais oficiais e contam com discursos legislativos associados na Câmara dos Deputados ou no Senado Federal.
                  </p>
                </div>
              )}
            </section>

            {/* Ementa Oficial */}
            <section className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-dim flex items-center gap-2">
                <FileText size={16} />
                Ementa Oficial
              </h2>
              <div className="rounded-xl border border-rim/20 bg-card/30 p-6">
                <p className="text-mid text-sm sm:text-base leading-relaxed whitespace-pre-line">
                  {p.ementa}
                </p>
              </div>

              {p.url_texto_inteiro && (
                <div className="pt-2">
                  <a
                    href={p.url_texto_inteiro}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-bright border border-rim/45 hover:border-bright px-4 h-10 rounded-lg transition-colors bg-card-alt/50"
                  >
                    Ler Texto Integral da Matéria
                    <ExternalLink size={13} />
                  </a>
                </div>
              )}
            </section>
          </div>

          {/* Coluna da Direita (Polarização) */}
          <aside className="space-y-6">
            <section className="rounded-xl border border-rim/20 bg-card/45 p-6 glass">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-bright flex items-center gap-2 mb-5 border-b border-rim/25 pb-3">
                <Vote size={16} className="text-mid" />
                Votação Nominal
              </h2>

              {pol ? (
                <div className="space-y-6">
                  {/* Badge de Polarização */}
                  <div>
                    <p className="text-xs text-dim mb-1.5">Classificação de Polarização</p>
                    <span
                      className="inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-semibold border"
                      style={{
                        backgroundColor: polStyle?.bg,
                        borderColor: polStyle?.border,
                        color: polStyle?.text,
                      }}
                    >
                      {pol.classificacao}
                    </span>
                  </div>

                  {/* Número da Polarização */}
                  <div>
                    <p className="text-xs text-dim">Grau de Polarização</p>
                    <p className="font-data text-4xl text-bright font-bold mt-1">
                      {pol.polarizacao.toFixed(1)}%
                    </p>
                    <p className="text-[11px] text-dim mt-1.5 leading-relaxed">
                      Mede o quão dividida a casa esteve. Quanto mais próximo de 100%, mais equilibrada foi a disputa entre Sim e Não.
                    </p>
                  </div>

                  {/* Distribuição dos Votos */}
                  <div>
                    <p className="text-xs text-dim mb-3">Distribuição de Votos Válidos</p>
                    
                    {/* Barra de Progresso customizada (Violeta vs Ciano) */}
                    <div className="h-4 w-full rounded-full overflow-hidden flex bg-dim/20 border border-rim/35">
                      <div
                        style={{
                          width: `${pol.pct_sim}%`,
                          backgroundColor: "var(--color-voto-sim)",
                        }}
                        title={`Sim: ${pol.pct_sim}%`}
                      />
                      <div
                        style={{
                          width: `${pol.pct_nao}%`,
                          backgroundColor: "var(--color-voto-nao)",
                        }}
                        title={`Não: ${pol.pct_nao}%`}
                      />
                    </div>

                    {/* Legenda das Cores */}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-mid">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--color-voto-sim)" }} />
                          Sim
                        </span>
                        <span className="font-data text-bright">
                          {pol.qtd_sim} <span className="text-dim text-[11px]">({pol.pct_sim.toFixed(1)}%)</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-mid">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--color-voto-nao)" }} />
                          Não
                        </span>
                        <span className="font-data text-bright">
                          {pol.qtd_nao} <span className="text-dim text-[11px]">({pol.pct_nao.toFixed(1)}%)</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-xs text-dim italic">
                    Dados de polarização e votos nominais não disponíveis para esta proposição no banco.
                  </p>
                </div>
              )}
            </section>
          </aside>

        </div>
      </div>
    </div>
  );
}
