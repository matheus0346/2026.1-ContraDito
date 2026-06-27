"use client";

// Painel de Proposições (Client Component)
// Gerencia filtros (Casa, Busca, Tipo, Ano) e paginação do lado do servidor via URL.

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, AlertTriangle, RefreshCw, FileText, ChevronRight } from "lucide-react";
import { CASA, tint, type Casa } from "@/lib/casa";
import type { PaginaProposicoes } from "@/lib/types";
import { formatDate } from "@/lib/utils";

// Lista de anos da legislatura atual (57ª Legislatura: 2023 - 2026)
const ANOS = [2023, 2024, 2025, 2026];

// Principais tipos de proposições legislativas em ambas as casas
const TIPOS = ["PL", "PEC", "PLP", "MPV", "PDL"];

interface ClientProps {
  dados: PaginaProposicoes | null;
  erro: boolean;
  casaInicial: Casa;
  buscaInicial: string;
  anoInicial?: number;
  tipoInicial: string;
  analisadasInicial: boolean;
  paginaInicial: number;
}

function ProposicoesInner({
  dados,
  erro,
  casaInicial,
  buscaInicial,
  anoInicial,
  tipoInicial,
  analisadasInicial,
  paginaInicial,
}: ClientProps) {
  const router = useRouter();

  // Estados locais sincronizados com os valores iniciais (URL)
  const [busca, setBusca] = useState(buscaInicial);
  const [casa, setCasa] = useState<Casa>(casaInicial);
  const [ano, setAno] = useState<number | "">(anoInicial || "");
  const [tipo, setTipo] = useState(tipoInicial);
  const [analisadas, setAnalisadas] = useState(analisadasInicial);

  // Efeito para sincronizar os estados se a URL mudar (ex: botão voltar do navegador)
  useEffect(() => {
    setBusca(buscaInicial);
    setCasa(casaInicial);
    setAno(anoInicial || "");
    setTipo(tipoInicial);
    setAnalisadas(analisadasInicial);
  }, [buscaInicial, casaInicial, anoInicial, tipoInicial, analisadasInicial]);

  // Função auxiliar para atualizar a URL e causar nova busca no servidor
  function atualizarFiltros(novosFiltros: {
    busca?: string;
    casa?: Casa;
    ano?: number | "";
    tipo?: string;
    analisadas?: boolean;
    pagina?: number;
  }) {
    const proximaBusca = novosFiltros.busca !== undefined ? novosFiltros.busca : busca;
    const proximaCasa = novosFiltros.casa !== undefined ? novosFiltros.casa : casa;
    const proximoAno = novosFiltros.ano !== undefined ? novosFiltros.ano : ano;
    const proximoTipo = novosFiltros.tipo !== undefined ? novosFiltros.tipo : tipo;
    const proximaAnalisadas = novosFiltros.analisadas !== undefined ? novosFiltros.analisadas : analisadas;
    const proximaPagina = novosFiltros.pagina !== undefined ? novosFiltros.pagina : 1; // Reseta para pág 1 se mudar filtros

    const sp = new URLSearchParams();
    if (proximaBusca.trim()) sp.set("busca", proximaBusca.trim());
    if (proximaCasa !== "camara") sp.set("casa", proximaCasa); // padrão camara, então oculta se for camara
    if (proximoAno) sp.set("ano", String(proximoAno));
    if (proximoTipo) sp.set("tipo", proximoTipo);
    if (proximaAnalisadas) sp.set("analisadas", "true");
    if (proximaPagina > 1) sp.set("pagina", String(proximaPagina));

    const qs = sp.toString();
    router.push(`/proposicoes${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  // Ações de alteração dos filtros
  function handleBuscaSubmit(e: React.FormEvent) {
    e.preventDefault();
    atualizarFiltros({ busca });
  }

  function handleCasaChange(novaCasa: Casa) {
    setCasa(novaCasa);
    atualizarFiltros({ casa: novaCasa });
  }

  // ─── Estado de erro (backend fora do ar) ───────────────────────────────────
  if (erro) {
    return (
      <div className="pt-14 min-h-screen grid place-items-center px-5">
        <div className="text-center max-w-md">
          <div className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-card border border-rim/40 mb-5">
            <AlertTriangle size={24} className="text-incoherent" />
          </div>
          <h1 className="font-display text-bright text-2xl">Não foi possível carregar as proposições</h1>
          <p className="text-mid mt-3 leading-relaxed">
            A API de proposições não respondeu. Verifique se o serviço está no ar e tente novamente.
          </p>
          <button
            onClick={() => router.refresh()}
            className="mt-6 inline-flex items-center gap-2 h-11 px-5 rounded-xl font-medium bg-coherent text-canvas hover:opacity-90 transition-all"
          >
            <RefreshCw size={16} /> Tentar novamente
          </button>
          <div className="mt-4">
            <Link href="/" className="text-sm text-dim hover:text-mid">Voltar à Home</Link>
          </div>
        </div>
      </div>
    );
  }

  const itens = dados?.itens || [];
  const totalRegistros = dados?.total_registros || 0;
  const totalPaginas = dados?.total_paginas || 1;
  const paginaAtual = Math.min(paginaInicial, totalPaginas);

  const hexCasa = CASA[casa].hex;

  return (
    <div className="pt-14 min-h-screen">
      <header className="max-w-6xl mx-auto px-5 sm:px-8 pt-10 pb-5">
        <h1 className="font-display text-bright font-black text-4xl sm:text-5xl">Proposições Legislativas</h1>
        <p className="text-mid mt-2">Consulte e filtre projetos de lei, emendas constitucionais e outras votações nominais.</p>
      </header>

      {/* Controles Sticky (Filtros) */}
      <div className="sticky top-14 z-30 bg-canvas/90 backdrop-blur-md border-y border-rim/30">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3 flex flex-wrap items-center gap-3">
          
          {/* Seletor de Casa (Segmented Control) */}
          <div className="inline-flex p-1 rounded-xl bg-card-alt/80 border border-rim/40">
            {(["camara", "senado"] as Casa[]).map((c) => {
              const active = casa === c;
              const hex = CASA[c].hex;
              return (
                <button
                  key={c}
                  onClick={() => handleCasaChange(c)}
                  className={`px-4 h-9 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    active ? "text-bright" : "text-mid hover:text-bright"
                  }`}
                  style={
                    active
                      ? {
                          background: tint(hex, 18),
                          boxShadow: `inset 0 0 0 1px ${tint(hex, 50)}`,
                        }
                      : undefined
                  }
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: active ? hex : tint(hex, 50) }}
                  />
                  {CASA[c].label}
                </button>
              );
            })}
          </div>

          {/* Barra de Busca */}
          <form onSubmit={handleBuscaSubmit} className="flex-1 min-w-[220px]">
            <label className="flex items-center gap-2 h-10 px-3 rounded-lg bg-card border border-rim/40 focus-within:border-coherent/60">
              <Search size={16} className="text-dim shrink-0" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por ID (ex: PL 2630), ementa ou resumo..."
                className="flex-1 bg-transparent outline-none text-sm text-bright placeholder:text-dim"
              />
              {busca && (
                <button
                  type="button"
                  onClick={() => {
                    setBusca("");
                    atualizarFiltros({ busca: "" });
                  }}
                  className="text-xs text-dim hover:text-mid"
                >
                  limpar
                </button>
              )}
            </label>
          </form>

          {/* Filtros Secundários */}
          <select
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value);
              atualizarFiltros({ tipo: e.target.value });
            }}
            className="h-10 px-3 rounded-lg bg-card border border-rim/40 text-sm text-mid"
          >
            <option value="">Tipo — todos</option>
            {TIPOS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={ano}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : "";
              setAno(val);
              atualizarFiltros({ ano: val });
            }}
            className="h-10 px-3 rounded-lg bg-card border border-rim/40 text-sm text-mid"
          >
            <option value="">Ano — todos</option>
            {ANOS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          {/* Filtro Apenas com Resumo IA */}
          <label className="flex items-center gap-2 text-sm text-mid select-none cursor-pointer hover:text-bright transition-colors h-10 px-1">
            <input
              type="checkbox"
              checked={analisadas}
              onChange={(e) => {
                setAnalisadas(e.target.checked);
                atualizarFiltros({ analisadas: e.target.checked });
              }}
              className="w-4 h-4 rounded border-rim/40 bg-card text-coherent focus:ring-coherent focus:ring-offset-canvas"
            />
            <span>Apenas com Resumo IA</span>
          </label>

          {/* Contador de Resultados */}
          <span className="text-sm text-dim ml-auto">
            <span className="font-data text-bright">
              {totalRegistros.toLocaleString("pt-BR")}
            </span>{" "}
            proposições
          </span>
        </div>
      </div>

      {/* Lista de Proposições */}
      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-6">
        <div className="space-y-4">
          {itens.map((p) => (
            <Link
              key={p.id}
              href={`/proposicoes/${p.casa}/${p.id}`}
              className="block rounded-xl border border-rim/20 bg-card/45 hover:bg-card-alt/30 transition-all overflow-hidden group hover:border-rim/45"
            >
              <div className="flex gap-4 p-5 sm:p-6 items-start">
                {/* Indicador lateral colorido da casa */}
                <div
                  className="w-1.5 h-16 sm:h-20 rounded-full shrink-0"
                  style={{ background: hexCasa }}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="font-display text-bright font-bold text-lg sm:text-xl group-hover:text-coherent transition-colors">
                      {p.proposicao_id}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      style={{
                        color: hexCasa,
                        backgroundColor: tint(hexCasa, 10),
                      }}
                    >
                      <FileText size={12} />
                      {p.tipo}
                    </span>
                  </div>

                  <p className="text-sm text-mid mt-2.5 line-clamp-3 leading-relaxed">
                    {p.ementa}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-dim">
                    {p.data_votacao && p.resumo_executivo && (
                      <span className="flex items-center gap-1.5">
                        Votação:{" "}
                        <span className="font-data text-mid">
                          {formatDate(p.data_votacao)}
                        </span>
                      </span>
                    )}
                    <span>
                      Ano: <span className="font-data text-mid">{p.ano}</span>
                    </span>
                  </div>
                </div>

                <div className="self-center p-2 rounded-lg bg-card-alt border border-rim/10 group-hover:border-coherent/20 text-dim group-hover:text-coherent transition-colors shrink-0">
                  <ChevronRight size={18} />
                </div>
              </div>
            </Link>
          ))}

          {itens.length === 0 && (
            <div className="rounded-xl border border-rim/20 bg-card/20 py-16 text-center">
              <p className="text-sm text-dim">Nenhuma proposição encontrada para os filtros selecionados.</p>
            </div>
          )}
        </div>

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              onClick={() =>
                atualizarFiltros({ pagina: Math.max(1, paginaAtual - 1) })
              }
              disabled={paginaAtual <= 1}
              className="h-10 px-5 rounded-lg border border-rim/45 text-sm text-mid hover:text-bright disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Anterior
            </button>
            <span className="text-sm text-dim font-data select-none">
              Página {paginaAtual} de {totalPaginas}
            </span>
            <button
              onClick={() =>
                atualizarFiltros({
                  pagina: Math.min(totalPaginas, paginaAtual + 1),
                })
              }
              disabled={paginaAtual >= totalPaginas}
              className="h-10 px-5 rounded-lg border border-rim/45 text-sm text-mid hover:text-bright disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Próxima
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export function ProposicoesClient(props: ClientProps) {
  return (
    <Suspense fallback={<div className="pt-14" />}>
      <ProposicoesInner {...props} />
    </Suspense>
  );
}
