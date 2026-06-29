"use client";

// Página de partidos (client): realiza filtros, busca e ordenação em memória.
// Agrupa partidos duplicados em um único card, exibindo os dados de coesão
// da Câmara e do Senado lado a lado dentro do mesmo card (com suas respectivas cores).
// Mostra o número real de proposições votadas para justificar o percentual.
// Apresenta o tooltip explicativo de forma robusta e controlada por estado no React.

import { Suspense, useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, AlertTriangle, RefreshCw, Info, ExternalLink } from "lucide-react";
import { CASA, tint, type Casa } from "@/lib/casa";
import type { CoesaoPartido, Parlamentar } from "@/lib/types";
import { normalizePartido } from "@/lib/partidos";

type Mode = "todos" | Casa;
const MODES: { key: Mode; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "camara", label: "Câmara" },
  { key: "senado", label: "Senado" },
];



function PartidosInner({
  partidos,
  parlamentares = [],
  erro,
}: {
  partidos: CoesaoPartido[];
  parlamentares?: Parlamentar[];
  erro: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const casaParam = params.get("casa");
  const modeInicial: Mode = casaParam === "camara" || casaParam === "senado" ? casaParam : "todos";

  const [busca, setBusca] = useState(params.get("busca") ?? "");
  const [mode, setMode] = useState<Mode>(modeInicial);
  const [ordem, setOrdem] = useState<"coesao-desc" | "coesao-asc" | "nome-asc" | "nome-desc">("coesao-desc");
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Conjunto de siglas com representantes ativos atualmente
  const partidosAtivos = useMemo(() => {
    if (!parlamentares || parlamentares.length === 0) return null;
    return new Set(parlamentares.map((p) => p.partido.toUpperCase()));
  }, [parlamentares]);

  // Fecha o tooltip automaticamente ao clicar em qualquer outro lugar da janela
  useEffect(() => {
    if (!showTooltip) return;
    const handleClose = (e: MouseEvent) => {
      if (tooltipRef.current && tooltipRef.current.contains(e.target as Node)) {
        return;
      }
      setShowTooltip(false);
    };
    window.addEventListener("click", handleClose);
    return () => window.removeEventListener("click", handleClose);
  }, [showTooltip]);

  // Sincroniza busca + casa na URL (contrato compartilhável)
  const syncUrl = useCallback(
    (b: string, m: Mode) => {
      const sp = new URLSearchParams();
      if (b.trim()) sp.set("busca", b.trim());
      if (m !== "todos") sp.set("casa", m);
      const qs = sp.toString();
      router.replace(`/partidos${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router]
  );

  // Agrupa os partidos para que fiquem em um único card, guardando os totais de proposições
  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { camara?: number; senado?: number; camaraProps?: number; senadoProps?: number }
    >();
    for (const p of partidos) {
      const name = p.partido.toUpperCase();
      if (
        name.startsWith("S.PART") ||
        name.startsWith("S/PART") ||
        name.startsWith("SEM PART") ||
        (partidosAtivos && !partidosAtivos.has(name))
      ) {
        continue;
      }
      if (!map.has(name)) {
        map.set(name, {});
      }
      const entry = map.get(name)!;
      if (p.casa === "camara") {
        entry.camara = p.indice_coesao;
        entry.camaraProps = p.total_proposicoes;
      }
      if (p.casa === "senado") {
        entry.senado = p.indice_coesao;
        entry.senadoProps = p.total_proposicoes;
      }
    }
    return Array.from(map.entries()).map(([partido, value]) => ({
      partido,
      ...value,
    }));
  }, [partidos]);

  // Filtro e Ordenação
  const rows = useMemo(() => {
    const q = busca.trim().toLowerCase();

    // Filtra de acordo com a casa selecionada (mostra partidos ativos naquela casa)
    let items = grouped.filter((p) => {
      if (mode === "camara") return p.camara !== undefined;
      if (mode === "senado") return p.senado !== undefined;
      return true; // todos
    });

    if (q) {
      items = items.filter((p) => p.partido.toLowerCase().includes(q));
    }

    // Ordenação
    items.sort((a, b) => {
      const getVal = (x: typeof a) => {
        if (mode === "camara") return x.camara ?? 0;
        if (mode === "senado") return x.senado ?? 0;
        // No modo todos, usa a média das duas casas (ou o valor da única existente)
        const c = x.camara ?? 0;
        const s = x.senado ?? 0;
        if (c && s) return (c + s) / 2;
        return c || s;
      };

      if (ordem === "coesao-desc") {
        return getVal(b) - getVal(a);
      } else if (ordem === "coesao-asc") {
        return getVal(a) - getVal(b);
      } else if (ordem === "nome-asc") {
        return a.partido.localeCompare(b.partido, "pt-BR");
      } else {
        return b.partido.localeCompare(a.partido, "pt-BR");
      }
    });

    return items;
  }, [grouped, busca, mode, ordem]);

  function changeMode(m: Mode) {
    setMode(m);
    syncUrl(busca, m);
  }

  // ─── Estado de erro (backend fora do ar) ───────────────────────────────────
  if (erro) {
    return (
      <div className="pt-14 min-h-screen grid place-items-center px-5">
        <div className="text-center max-w-md">
          <div className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-card border border-rim/40 mb-5">
            <AlertTriangle size={24} className="text-incoherent" />
          </div>
          <h1 className="font-display text-bright text-2xl">Não foi possível carregar a coesão</h1>
          <p className="text-mid mt-3 leading-relaxed">
            A API de coesão partidária não respondeu. Verifique se o serviço está no ar e tente novamente.
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

  // ─── Sucesso ──────────────────────────────────────────────────────────────
  return (
    <div className="pt-14 min-h-screen">
      <header className="max-w-6xl mx-auto px-5 sm:px-8 pt-10 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-bright font-black text-4xl sm:text-5xl">Coesão Partidária</h1>
              
              {/* Tooltip Explicativo Interativo (Controlado por Estado) */}
              <div className="relative mt-1 sm:mt-2 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Evita disparar o listener global de fechamento imediatamente
                    setShowTooltip((prev) => !prev);
                  }}
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  className="p-1 rounded-full text-dim hover:text-bright hover:bg-card-alt/50 transition-colors focus:outline-none cursor-pointer"
                  aria-label="Informações sobre o cálculo"
                >
                  <Info size={20} className="text-coherent" />
                </button>
                {/* Popup do Tooltip */}
                {showTooltip && (
                  <div 
                    ref={tooltipRef}
                    className="absolute left-0 top-full mt-2 w-[290px] sm:w-[460px] max-w-[calc(100vw-2.5rem)] p-4 rounded-xl border border-rim/35 bg-card/98 shadow-2xl z-50 text-xs text-mid leading-relaxed backdrop-blur-md flex flex-col sm:flex-row gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-1 duration-150"
                  >
                    {/* Coluna Esquerda: Explicação + Fórmula */}
                    <div className="flex-1">
                      <strong className="text-bright block font-semibold mb-1">Como funciona o cálculo?</strong>
                      Mede o consenso de voto das bancadas pelo <strong className="text-bright font-medium">Índice de Rice</strong>: de 0% (rachado) a 100% (unânime).
                    <div className="bg-card-alt/50 p-2.5 rounded border border-rim/20 mt-2 flex items-center justify-center gap-2 select-none font-serif text-bright">
                      <span className="text-xs font-semibold">Índice =</span>
                      <div className="flex flex-col items-center text-[10px]">
                        <span className="px-2 pb-0.5 border-b border-bright/30 text-center font-bold">
                          |Sims - Nãos|
                        </span>
                        <span className="px-2 pt-0.5 text-center font-bold">
                          Sims + Nãos
                        </span>
                      </div>
                    </div>
                    </div>
                    
                    {/* Divisor Vertical */}
                    <div className="hidden sm:block border-l border-rim/20 shrink-0" />
                    
                    {/* Coluna Direita: Exemplos */}
                    <div className="w-full sm:w-[185px] shrink-0 border-t border-rim/20 sm:border-t-0 pt-2.5 sm:pt-0">
                      <strong className="text-bright block font-semibold mb-1.5">Intuição prática:</strong>
                      <ul className="space-y-1 text-dim list-disc pl-4 text-[11px]">
                        <li><span className="text-bright font-medium">100% coesão:</span> 20 vs 0 (100% juntos)</li>
                        <li><span className="text-bright font-medium">60% coesão:</span> 16 vs 4 (80% juntos)</li>
                        <li><span className="text-bright font-medium">0% coesão:</span> 10 vs 10 (50% juntos)</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <p className="text-mid mt-2">Índice médio de consenso de voto das bancadas nas votações nominais.</p>
          </div>
        </div>
      </header>

      {/* Controles Sticky */}
      <div className="sticky top-14 z-30 bg-canvas/90 backdrop-blur-md border-y border-rim/30">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3 flex flex-wrap items-center gap-3">
          {/* Seletor de Casa */}
          <div className="inline-flex p-1 rounded-xl bg-card-alt/80 border border-rim/40">
            {MODES.map((m) => {
              const active = mode === m.key;
              const hex = m.key === "todos" ? null : CASA[m.key as Casa].hex;
              return (
                <button
                  key={m.key}
                  onClick={() => changeMode(m.key)}
                  className={`px-4 h-9 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    active ? "text-bright" : "text-mid hover:text-bright"
                  }`}
                  style={
                    active
                      ? {
                          background: hex ? tint(hex, 18) : "var(--color-card)",
                          boxShadow: `inset 0 0 0 1px ${hex ? tint(hex, 50) : "var(--color-rim)"}`,
                        }
                      : undefined
                  }
                >
                  {hex && (
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: active ? hex : tint(hex, 50) }}
                    />
                  )}
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Busca por Partido */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              syncUrl(busca, mode);
            }}
            className="flex-1 min-w-[200px]"
          >
            <label className="flex items-center gap-2 h-10 px-3 rounded-lg bg-card border border-rim/40 focus-within:border-coherent/60">
              <Search size={16} className="text-dim shrink-0" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar partido por sigla..."
                className="flex-1 bg-transparent outline-none text-sm text-bright placeholder:text-dim"
              />
            </label>
          </form>

          {/* Ordenação */}
          <select
            value={ordem}
            onChange={(e) => setOrdem(e.target.value as any)}
            className="h-10 px-3 rounded-lg bg-card border border-rim/40 text-sm text-mid cursor-pointer"
          >
            <option value="coesao-desc">Maior Coesão</option>
            <option value="coesao-asc">Menor Coesão</option>
            <option value="nome-asc">Nome (A-Z)</option>
            <option value="nome-desc">Nome (Z-A)</option>
          </select>

          <span className="text-sm text-dim ml-auto">
            <span className="font-data text-bright">{rows.length}</span> partidos
          </span>
        </div>
      </div>

      {/* Grid de Cards */}
      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rows.map((item) => {
            return (
              <div
                key={item.partido}
                className="p-5 rounded-xl border border-rim/20 bg-card hover:border-rim/45 transition-all flex flex-col justify-between min-h-[240px]"
              >
                <div>
                  <h3 className="font-display text-bright text-2xl font-black mb-4">
                    {item.partido}
                  </h3>

                  <div className="space-y-4">
                    {/* Câmara */}
                    {item.camara !== undefined && (
                      <div>
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <div className="flex items-center gap-1.5 w-20 shrink-0">
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: CASA.camara.hex }}
                            />
                            <span className="text-xs text-mid">{CASA.camara.label}</span>
                          </div>
                          <div className="w-full bg-card-alt rounded-full h-1.5 overflow-hidden border border-rim/10">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${item.camara}%`,
                                backgroundColor: CASA.camara.hex,
                              }}
                            />
                          </div>
                          <span className="font-data text-bright text-xs font-bold w-12 text-right">
                            {item.camara.toFixed(1)}%
                          </span>
                        </div>
                        <span className="text-[10px] text-dim block pl-3">
                          calculado sobre {item.camaraProps} votações
                        </span>
                      </div>
                    )}

                    {/* Senado */}
                    {item.senado !== undefined && (
                      <div>
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <div className="flex items-center gap-1.5 w-20 shrink-0">
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: CASA.senado.hex }}
                            />
                            <span className="text-xs text-mid">{CASA.senado.label}</span>
                          </div>
                          <div className="w-full bg-card-alt rounded-full h-1.5 overflow-hidden border border-rim/10">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${item.senado}%`,
                                backgroundColor: CASA.senado.hex,
                              }}
                            />
                          </div>
                          <span className="font-data text-bright text-xs font-bold w-12 text-right">
                            {item.senado.toFixed(1)}%
                          </span>
                        </div>
                        <span className="text-[10px] text-dim block pl-3">
                          calculado sobre {item.senadoProps} votações
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Link
                  href={`/diretorio?partido=${item.partido}${mode !== "todos" ? `&casa=${mode}` : ""}`}
                  className="mt-6 inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg bg-card-alt hover:bg-card-alt/80 border border-rim/30 text-xs font-semibold text-mid hover:text-coherent hover:border-coherent/40 transition-all"
                >
                  Ver parlamentares <ExternalLink size={12} />
                </Link>
              </div>
            );
          })}
        </div>

        {rows.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-dim">Nenhum partido correspondente aos filtros.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export function PartidosClient(props: {
  partidos: CoesaoPartido[];
  parlamentares?: Parlamentar[];
  erro: boolean;
}) {
  return (
    <Suspense fallback={<div className="pt-14" />}>
      <PartidosInner {...props} />
    </Suspense>
  );
}
