"use client";

// Componente client de discursos: gerencia a listagem de discursos paginada no servidor.
// Oferece seletor de Casa (Câmara/Senado), busca com autocomplete em memória de parlamentares,
// paginação server-side com sincronização de URL, e um Slide-over Drawer para ler a íntegra.

import { Suspense, useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, AlertTriangle, RefreshCw, X, ArrowLeft, ArrowRight, User, Calendar, Tag, ExternalLink } from "lucide-react";
import { CASA, tint, type Casa } from "@/lib/casa";
import type { Discurso, PaginaDiscursos, Parlamentar } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";

type DiscursoIdentificado = Discurso & { parlamentar?: Parlamentar };

function DiscursosInner({
  paginaDiscursos,
  parlamentares,
  erro,
}: {
  paginaDiscursos: PaginaDiscursos;
  parlamentares: Parlamentar[];
  erro: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state
  const casaParam = searchParams.get("casa");
  const casaAtiva: Casa = casaParam === "senado" ? "senado" : "camara";
  const politicoIdParam = searchParams.get("politico_id") ? Number(searchParams.get("politico_id")) : undefined;
  const termoParam = searchParams.get("termo") ?? undefined;
  const paginaAtual = paginaDiscursos.pagina_atual;

  // Local state para busca de parlamentar no autocomplete
  const [buscaPol, setBuscaPol] = useState("");
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [discursoAberto, setDiscursoAberto] = useState<DiscursoIdentificado | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown de autocomplete ao clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fecha o Drawer ao pressionar a tecla Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setDiscursoAberto(null);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sincroniza e navega na URL
  const navegar = useCallback((novaCasa: Casa, novoPoliticoId?: number, novoTermo?: string, novaPagina: number = 1) => {
    const sp = new URLSearchParams();
    if (novaCasa !== "camara") sp.set("casa", novaCasa);
    if (novoPoliticoId) sp.set("politico_id", String(novoPoliticoId));
    if (novoTermo) sp.set("termo", novoTermo);
    if (novaPagina > 1) sp.set("pagina", String(novaPagina));
    
    const qs = sp.toString();
    router.push(`/discursos${qs ? `?${qs}` : ""}`);
  }, [router]);

  // Encontra o parlamentar do filtro ativo
  const selectedPolitico = useMemo(() => {
    if (!politicoIdParam) return undefined;
    return parlamentares.find((p) => p.id === politicoIdParam && p.casa === casaAtiva);
  }, [parlamentares, politicoIdParam, casaAtiva]);

  // Filtra parlamentares no autocomplete (em memória, apenas da casa ativa)
  const parlamentaresFiltrados = useMemo(() => {
    const baseList = parlamentares.filter((p) => p.casa === casaAtiva);
    if (!buscaPol.trim()) return baseList.slice(0, 10);
    
    const q = buscaPol.toLowerCase();
    return baseList.filter(
      (p) =>
        p.nome_urna.toLowerCase().includes(q) ||
        p.nome_civil.toLowerCase().includes(q) ||
        p.partido.toLowerCase().includes(q)
    );
  }, [parlamentares, casaAtiva, buscaPol]);

  // Formata data do formato AAAA-MM-DD para DD/MM/AAAA
  const formatarData = (dtStr: string | null) => {
    if (!dtStr) return "-";
    try {
      const date = new Date(dtStr);
      return date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
    } catch {
      return dtStr;
    }
  };

  // Mapeia discursos com metadados dos políticos correspondentes em memória
  const discursosIdentificados = useMemo(() => {
    return paginaDiscursos.itens.map((d) => {
      const pol = parlamentares.find((p) => p.id === d.politico_id && p.casa === casaAtiva);
      return {
        ...d,
        parlamentar: pol,
      };
    });
  }, [paginaDiscursos.itens, parlamentares, casaAtiva]);

  function changeCasa(c: Casa) {
    setBuscaPol("");
    setDropdownAberto(false);
    navegar(c, undefined, undefined, 1);
  }

  function selectPolitico(id: number) {
    setDropdownAberto(false);
    setBuscaPol("");
    navegar(casaAtiva, id, termoParam, 1);
  }

  function selectTermo(t: string) {
    setDropdownAberto(false);
    setBuscaPol("");
    navegar(casaAtiva, politicoIdParam, t, 1);
  }

  function clearPolitico() {
    navegar(casaAtiva, undefined, termoParam, 1);
  }

  function clearTermo() {
    navegar(casaAtiva, politicoIdParam, undefined, 1);
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (buscaPol.trim()) {
      selectTermo(buscaPol.trim());
    }
  };

  function changePage(novaPagina: number) {
    navegar(casaAtiva, politicoIdParam, termoParam, novaPagina);
  }

  // ─── Estado de erro (backend fora do ar) ───────────────────────────────────
  if (erro) {
    return (
      <div className="pt-14 min-h-screen grid place-items-center px-5">
        <div className="text-center max-w-md">
          <div className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-card border border-rim/40 mb-5">
            <AlertTriangle size={24} className="text-incoherent" />
          </div>
          <h1 className="font-display text-bright text-2xl">Não foi possível carregar os discursos</h1>
          <p className="text-mid mt-3 leading-relaxed">
            A API de discursos não respondeu. Verifique se o serviço está no ar e tente novamente.
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

  return (
    <div className="pt-14 min-h-screen">
      <header className="max-w-6xl mx-auto px-5 sm:px-8 pt-10 pb-5">
        {politicoIdParam && (
          <Link
            href={`/politico/${politicoIdParam}?casa=${casaAtiva}`}
            className="inline-flex items-center gap-1.5 text-xs text-dim hover:text-bright mb-4.5 transition-colors group cursor-pointer"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Voltar para o Dossiê do Parlamentar</span>
          </Link>
        )}
        <h1 className="font-display text-bright font-black text-4xl sm:text-5xl">Discursos em Plenário</h1>
        <p className="text-mid mt-2">Veja e consulte as transcrições das falas oficiais dos parlamentares em plenário.</p>
      </header>

      {/* Controles Sticky */}
      <div className="sticky top-14 z-30 bg-canvas/90 backdrop-blur-md border-y border-rim/30">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3 flex flex-wrap items-center gap-4">
          
          {/* Seletor de Casa (Câmara/Senado - Sem Todos pois o path exige segmentação) */}
          <div className="inline-flex p-1 rounded-xl bg-card-alt/80 border border-rim/40">
            {(["camara", "senado"] as Casa[]).map((c) => {
              const active = casaAtiva === c;
              const hex = CASA[c].hex;
              return (
                <button
                  key={c}
                  onClick={() => changeCasa(c)}
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

          {/* Autocomplete de Pesquisa Unificada (Sempre Visível) */}
          <div className="relative flex-1 min-w-[260px] md:max-w-xs" ref={dropdownRef}>
            <form onSubmit={handleSearchSubmit}>
              <label className="flex items-center gap-2 h-10 px-3 rounded-lg bg-card border border-rim/40 focus-within:border-coherent/60">
                <Search size={16} className="text-dim shrink-0" />
                <input
                  value={buscaPol}
                  onChange={(e) => {
                    setBuscaPol(e.target.value);
                    setDropdownAberto(true);
                  }}
                  onFocus={() => setDropdownAberto(true)}
                  placeholder="Buscar parlamentar ou palavra-chave..."
                  className="flex-1 bg-transparent outline-none text-sm text-bright placeholder:text-dim"
                />
              </label>
            </form>

            {dropdownAberto && (
              <div className="absolute left-0 right-0 top-full mt-1.5 max-h-60 overflow-y-auto rounded-lg border border-rim/40 bg-card/98 shadow-2xl z-40 backdrop-blur-md">
                {/* Opção especial para busca textual */}
                {buscaPol.trim() && (
                  <button
                    onClick={() => selectTermo(buscaPol.trim())}
                    className="w-full px-3 py-2.5 text-left text-xs font-semibold text-coherent hover:text-bright hover:bg-card-alt/80 border-b border-rim/15 transition-colors flex items-center gap-2"
                  >
                    <Search size={14} />
                    <span>Pesquisar termo &ldquo;{buscaPol.trim()}&rdquo; nos discursos</span>
                  </button>
                )}

                {/* Lista de parlamentares correspondentes */}
                {parlamentaresFiltrados.map((p) => (
                  <button
                    key={`${p.casa}-${p.id}`}
                    onClick={() => selectPolitico(p.id)}
                    className="w-full px-3 py-2 text-left text-xs text-mid hover:text-bright hover:bg-card-alt/80 transition-colors flex items-center gap-2"
                  >
                    <Avatar name={p.nome_urna} url={p.url_foto} size={20} />
                    <span>
                      {p.nome_urna} ({p.partido}-{p.estado})
                    </span>
                  </button>
                ))}
                {parlamentaresFiltrados.length === 0 && !buscaPol.trim() && (
                  <div className="px-3 py-2.5 text-xs text-dim text-center">Nenhum parlamentar encontrado.</div>
                )}
              </div>
            )}
          </div>

          {/* Badges de Filtros Ativos */}
          <div className="flex flex-wrap items-center gap-2">
            {selectedPolitico && (
              <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-card-alt border border-coherent/40 text-xs text-bright font-medium">
                <Avatar name={selectedPolitico.nome_urna} url={selectedPolitico.url_foto} size={18} />
                <span>{selectedPolitico.nome_urna} ({selectedPolitico.partido})</span>
                <button
                  onClick={clearPolitico}
                  className="p-0.5 rounded-full hover:bg-rim/30 text-dim hover:text-bright transition-colors"
                  aria-label="Remover filtro de parlamentar"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            {termoParam && (
              <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-card-alt border border-rim/45 text-xs text-bright font-medium">
                <Search size={11} className="text-coherent" />
                <span>Busca: &ldquo;{termoParam}&rdquo;</span>
                <button
                  onClick={clearTermo}
                  className="p-0.5 rounded-full hover:bg-rim/30 text-dim hover:text-bright transition-colors"
                  aria-label="Remover busca textual"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

          {/* Contador de Resultados */}
          <span className="text-sm text-dim ml-auto">
            {paginaDiscursos.total_registros !== -1 ? (
              <>
                <span className="font-data text-bright">
                  {paginaDiscursos.total_registros.toLocaleString("pt-BR")}
                </span>{" "}
                discursos
              </>
            ) : (
              <span className="text-bright font-semibold">Pesquisa ativa</span>
            )}
          </span>
        </div>
      </div>

      {/* Alerta de aviso amigável se houver */}
      {paginaDiscursos.aviso && (
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-6">
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs flex items-start gap-3 backdrop-blur-md">
            <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block text-amber-300 mb-0.5">Aviso sobre a busca</strong>
              {paginaDiscursos.aviso}
            </div>
          </div>
        </div>
      )}

      {/* Grid de Discursos */}
      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-6">
        {discursosIdentificados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {discursosIdentificados.map((item) => {
              const pol = item.parlamentar;
              const snippet =
                item.texto_bruto.length > 220
                  ? item.texto_bruto.substring(0, 220) + "..."
                  : item.texto_bruto;

              return (
                <div
                  key={item.id}
                  className="p-5 rounded-xl border border-rim/20 bg-card hover:border-rim/45 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Parlamentar Header */}
                    <div className="border-b border-rim/15 pb-3.5 mb-3.5">
                      {pol ? (
                        <Link
                          href={`/politico/${pol.id}?casa=${pol.casa}`}
                          prefetch={false}
                          className="flex items-center gap-3 group/pol hover:opacity-90 transition-all cursor-pointer min-w-0"
                          title={`Ver dossiê de ${pol.nome_urna}`}
                        >
                          <Avatar name={pol.nome_urna} url={pol.url_foto} size={38} ringColor={tint(CASA[pol.casa].hex, 45)} />
                          <div className="min-w-0">
                            <span className="block text-sm text-bright font-bold truncate group-hover/pol:text-coherent transition-colors">
                              {pol.nome_urna}
                            </span>
                            <span className="block text-[11px] text-dim truncate">
                              {pol.nome_civil} · {pol.partido}-{pol.estado}
                            </span>
                          </div>
                        </Link>
                      ) : (
                        <Link
                          href={`/politico/${item.politico_id}?casa=${casaAtiva}`}
                          prefetch={false}
                          className="flex items-center gap-3 group/pol hover:opacity-90 transition-all cursor-pointer min-w-0"
                          title="Ver dossiê do parlamentar"
                        >
                          <div className="w-[38px] h-[38px] rounded-full bg-card-alt flex items-center justify-center border border-rim/35">
                            <User size={18} className="text-dim" />
                          </div>
                          <div className="min-w-0">
                            <span className="block text-sm text-bright font-bold truncate group-hover/pol:text-coherent transition-colors">
                              Parlamentar ID #{item.politico_id}
                            </span>
                            <span className="block text-[11px] text-dim truncate">Informações do diretório ausentes</span>
                          </div>
                        </Link>
                      )}
                    </div>

                    {/* Metadados do discurso */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-dim mb-3">
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={13} />
                        {formatarData(item.data_discurso)}
                      </span>
                      {item.fase_evento && (
                        <span className="inline-flex items-center gap-1 capitalize">
                          <Tag size={13} />
                          {item.fase_evento.toLowerCase()}
                        </span>
                      )}
                    </div>

                    {/* Snippet do Texto */}
                    <p className="text-xs text-mid leading-relaxed font-serif line-clamp-4 select-none">
                      {snippet}
                    </p>
                  </div>

                  {/* Ação */}
                  <button
                    onClick={() => setDiscursoAberto(item)}
                    className="mt-5 w-full inline-flex items-center justify-center gap-1 h-9 px-4 rounded-lg bg-card-alt hover:bg-card-alt/80 border border-rim/30 text-xs font-semibold text-mid hover:text-bright transition-all cursor-pointer"
                  >
                    Ler discurso completo
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 border border-rim/15 rounded-xl bg-card/10">
            <p className="text-sm text-dim">Nenhum discurso encontrado para os parâmetros selecionados.</p>
          </div>
        )}

        {/* Paginação */}
        {paginaDiscursos.total_paginas > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={() => changePage(paginaAtual - 1)}
              disabled={paginaAtual <= 1}
              className="h-9 px-4 rounded-lg border border-rim/40 text-xs font-semibold text-mid hover:text-bright disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1 transition-all"
            >
              <ArrowLeft size={14} /> Anterior
            </button>
            <span className="text-xs text-dim font-data">
              Página <span className="text-bright font-bold">{paginaAtual}</span>
              {paginaDiscursos.total_registros !== -1 && (
                <> de <span className="text-bright font-bold">{paginaDiscursos.total_paginas}</span></>
              )}
            </span>
            <button
              onClick={() => changePage(paginaAtual + 1)}
              disabled={paginaAtual >= paginaDiscursos.total_paginas}
              className="h-9 px-4 rounded-lg border border-rim/40 text-xs font-semibold text-mid hover:text-bright disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1 transition-all"
            >
              Próxima <ArrowRight size={14} />
            </button>
          </div>
        )}
      </main>

      {/* ─── Slide-over Drawer lateral (Íntegra do Discurso) ───────────────── */}
      {discursoAberto && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop escurecido */}
          <button
            type="button"
            onClick={() => setDiscursoAberto(null)}
            className="absolute inset-0 w-full h-full bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
            tabIndex={-1}
            aria-hidden="true"
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex">
            {/* Drawer */}
            <div className="w-screen max-w-2xl bg-card border-l border-rim/35 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
              
              {/* Header do Drawer */}
              <div className="px-5 py-4 border-b border-rim/25 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {discursoAberto.parlamentar ? (
                    <Link
                      href={`/politico/${discursoAberto.parlamentar.id}?casa=${discursoAberto.parlamentar.casa}`}
                      prefetch={false}
                      className="flex items-center gap-3 group/drawerPol hover:opacity-90 transition-all cursor-pointer"
                      title={`Ver dossiê de ${discursoAberto.parlamentar.nome_urna}`}
                    >
                      <Avatar name={discursoAberto.parlamentar.nome_urna} url={discursoAberto.parlamentar.url_foto} size={36} ringColor={tint(CASA[discursoAberto.parlamentar.casa].hex, 45)} />
                      <div>
                        <h4 className="text-sm font-bold text-bright group-hover/drawerPol:text-coherent transition-colors">{discursoAberto.parlamentar.nome_urna}</h4>
                        <span className="text-[10px] text-dim">
                          {discursoAberto.parlamentar.partido}-{discursoAberto.parlamentar.estado} · {CASA[casaAtiva].label}
                        </span>
                      </div>
                    </Link>
                  ) : (
                    <Link
                      href={`/politico/${discursoAberto.politico_id}?casa=${casaAtiva}`}
                      prefetch={false}
                      className="flex items-center gap-3 group/drawerPol hover:opacity-90 transition-all cursor-pointer"
                      title="Ver dossiê do parlamentar"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-bright group-hover/drawerPol:text-coherent transition-colors">Parlamentar ID #{discursoAberto.politico_id}</h4>
                        <span className="text-[10px] text-dim">{CASA[casaAtiva].label}</span>
                      </div>
                    </Link>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {discursoAberto.parlamentar && (
                    <Link
                      href={`/politico/${discursoAberto.politico_id}?casa=${discursoAberto.parlamentar.casa}`}
                      prefetch={false}
                      className="px-3 h-8 inline-flex items-center gap-1.5 rounded-lg border border-rim/30 text-[11px] font-semibold text-mid hover:text-bright hover:bg-card-alt/50 transition-all shrink-0"
                    >
                      Dossiê <ExternalLink size={11} />
                    </Link>
                  )}
                  <button
                    onClick={() => setDiscursoAberto(null)}
                    className="p-1.5 rounded-full hover:bg-card-alt text-dim hover:text-bright transition-colors cursor-pointer"
                    aria-label="Fechar discurso"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Informações Auxiliares */}
              <div className="bg-card-alt/40 px-6 py-3 border-b border-rim/15 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-dim select-none">
                <span className="inline-flex items-center gap-1">
                  <Calendar size={13} />
                  Data: {formatarData(discursoAberto.data_discurso)}
                </span>
                {discursoAberto.fase_evento && (
                  <span className="inline-flex items-center gap-1 capitalize">
                    <Tag size={13} />
                    Fase: {discursoAberto.fase_evento.toLowerCase()}
                  </span>
                )}
              </div>

              {/* Corpo da Transcrição Integral */}
              <div className="flex-1 p-6 overflow-y-auto select-text selection:bg-coherent/25">
                <h3 className="font-display text-bright text-lg font-bold mb-4 border-b border-rim/10 pb-2 select-none">
                  Transcrição Integral
                </h3>
                <p className="font-serif text-sm leading-relaxed text-mid whitespace-pre-line break-words text-justify">
                  {discursoAberto.texto_bruto}
                </p>
              </div>

              {/* Footer do Drawer */}
              <div className="px-5 py-3.5 border-t border-rim/25 bg-card flex justify-end">
                <button
                  onClick={() => setDiscursoAberto(null)}
                  className="h-9 px-4 rounded-lg bg-card-alt border border-rim/30 text-xs font-semibold text-mid hover:text-bright hover:bg-card-alt/80 transition-all cursor-pointer"
                >
                  Fechar Leitura
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function DiscursosClient(props: {
  paginaDiscursos: PaginaDiscursos;
  parlamentares: Parlamentar[];
  erro: boolean;
}) {
  return (
    <Suspense fallback={<div className="pt-14" />}>
      <DiscursosInner {...props} />
    </Suspense>
  );
}
