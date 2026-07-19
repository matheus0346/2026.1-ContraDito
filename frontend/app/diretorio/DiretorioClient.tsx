"use client";

// Diretório (client): recebe o array completo (~887) do Server Component e faz
// busca/filtro/seletor de Casa 100% em memória — nenhuma chamada de rede por filtro.
// Sincroniza ?busca= e ?casa= na URL (contrato compartilhável). Estado de erro com retry.
// Identidade visual da Home: Playfair (títulos), DM Sans (corpo), JetBrains Mono (números),
// tint pulse (Câmara) / aurum (Senado) por linha. Sem score.

import { Suspense, useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { CASA, tint, type Casa } from "@/lib/casa";
import type { Parlamentar } from "@/lib/types";

type Mode = "todos" | Casa;
const MODES: { key: Mode; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "camara", label: "Câmara" },
  { key: "senado", label: "Senado" },
];
const PAGE_SIZE = 30;

function obterPaginas(atual: number, total: number): (number | string)[] {
  const paginas: (number | string)[] = [];
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) paginas.push(i);
  } else {
    paginas.push(1);
    
    if (atual > 4) {
      paginas.push("...");
    }
    
    const inicio = Math.max(2, atual - 2);
    const fim = Math.min(total - 1, atual + 2);
    
    for (let i = inicio; i <= fim; i++) {
      if (!paginas.includes(i)) paginas.push(i);
    }
    
    if (atual < total - 3) {
      paginas.push("...");
    }
    
    if (!paginas.includes(total)) {
      paginas.push(total);
    }
  }
  
  return paginas;
}

function CasaBadge({ casa }: { casa: Casa }) {
  const { label, hex } = CASA[casa];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border"
      style={{ color: hex, backgroundColor: tint(hex, 12), borderColor: tint(hex, 35) }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: hex }} />
      {label}
    </span>
  );
}

function DiretorioInner({ parlamentares, erro }: { parlamentares: Parlamentar[]; erro: boolean }) {
  const router = useRouter();
  const params = useSearchParams();

  const casaParam = params.get("casa");
  const modeInicial: Mode = casaParam === "camara" || casaParam === "senado" ? casaParam : "todos";

  const [busca, setBusca] = useState(params.get("busca") ?? "");
  const [mode, setMode] = useState<Mode>(modeInicial);
  const [partido, setPartido] = useState(params.get("partido") ?? "");
  const [estado, setEstado] = useState(params.get("estado") ?? "");
  const [pagina, setPagina] = useState(1);
  const [mostrarInativos, setMostrarInativos] = useState(false);

  // Sincroniza só busca + casa na URL (contrato compartilhável); partido/estado ficam locais.
  const syncUrl = useCallback((b: string, m: Mode) => {
    const sp = new URLSearchParams();
    if (b.trim()) sp.set("busca", b.trim());
    if (m !== "todos") sp.set("casa", m);
    const qs = sp.toString();
    router.replace(`/diretorio${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [router]);

  // Escopo por casa + opções de filtro DINÂMICAS (casa-aware).
  const scoped = useMemo(
    () =>
      parlamentares
        .filter((p) => mode === "todos" || p.casa === mode)
        .filter(
          (p) =>
            mostrarInativos
              ? true
              : p.status_mandato?.toLowerCase() !== "inativo" &&
                p.status_mandato?.toLowerCase() !== "suplente"
        ),
    [parlamentares, mode, mostrarInativos]
  );
  const partidos = useMemo(() => [...new Set(scoped.map((p) => p.partido))].sort((a, b) => a.localeCompare(b, "pt-BR")), [scoped]);
  const estados = useMemo(() => [...new Set(scoped.map((p) => p.estado))].sort((a, b) => a.localeCompare(b, "pt-BR")), [scoped]);

  const rows = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return scoped
      .filter((p) => (q ? p.nome_urna.toLowerCase().includes(q) || p.nome_civil.toLowerCase().includes(q) : true))
      .filter((p) => (partido ? p.partido.toLowerCase() === partido.toLowerCase() : true))
      .filter((p) => (estado ? p.estado === estado : true))
      .sort((a, b) => a.nome_urna.localeCompare(b.nome_urna, "pt-BR"));
  }, [scoped, busca, partido, estado]);

  // Normaliza o partido vindo da URL (ex: PCDOB -> PCdoB) para bater com a capitalização do banco e selecionar no select
  useEffect(() => {
    const urlPartido = params.get("partido");
    if (urlPartido) {
      const match = partidos.find((p) => p.toLowerCase() === urlPartido.toLowerCase());
      if (match) {
        setPartido(match);
      }
    }
  }, [params, partidos]);

  // Volta para a página 1 sempre que o resultado muda.
  useEffect(() => { setPagina(1); }, [busca, mode, partido, estado, mostrarInativos]);

  const totalPaginas = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = rows.slice((paginaAtual - 1) * PAGE_SIZE, paginaAtual * PAGE_SIZE);

  // Ao trocar de casa: limpa o filtro cujo valor não existe mais no novo escopo.
  function changeMode(m: Mode) {
    setMode(m);
    const ns = parlamentares.filter((p) => m === "todos" || p.casa === m);
    if (partido && !ns.some((p) => p.partido === partido)) setPartido("");
    if (estado && !ns.some((p) => p.estado === estado)) setEstado("");
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
          <h1 className="font-display text-bright text-2xl">Não foi possível carregar o diretório</h1>
          <p className="text-mid mt-3 leading-relaxed">
            A API de parlamentares não respondeu. Verifique se o serviço está no ar e tente novamente.
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

  // ─── Diretório ──────────────────────────────────────────────────────────────
  return (
    <div className="pt-14 min-h-screen">
      <header className="max-w-6xl mx-auto px-5 sm:px-8 pt-10 pb-5">
        {params.get("partido") && (
          <Link
            href="/partidos"
            className="inline-flex items-center gap-1.5 text-xs text-dim hover:text-bright mb-4.5 transition-colors group cursor-pointer"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Voltar para Coesão por Partido</span>
          </Link>
        )}
        <h1 className="font-display text-bright font-black text-4xl sm:text-5xl">Parlamentares</h1>
        <p className="text-mid mt-2">Listagem completa — Câmara dos Deputados e Senado Federal.</p>
      </header>

      {/* controles sticky */}
      <div className="sticky top-14 z-30 bg-canvas/90 backdrop-blur-md border-y border-rim/30">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3 flex flex-wrap items-center gap-3">
          {/* seletor de Casa (segmented primário) */}
          <div className="inline-flex p-1 rounded-xl bg-card-alt/80 border border-rim/40">
            {MODES.map((m) => {
              const active = mode === m.key;
              const hex = m.key === "todos" ? null : CASA[m.key as Casa].hex;
              return (
                <button key={m.key} onClick={() => changeMode(m.key)}
                  className={`px-4 h-9 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${active ? "text-bright" : "text-mid hover:text-bright"}`}
                  style={active ? { background: hex ? tint(hex, 18) : "var(--color-card)", boxShadow: `inset 0 0 0 1px ${hex ? tint(hex, 50) : "var(--color-rim)"}` } : undefined}>
                  {hex && <span className="w-2 h-2 rounded-full" style={{ background: active ? hex : tint(hex, 50) }} />}
                  {m.label}
                </button>
              );
            })}
          </div>
          {/* busca (Enter sincroniza a URL; filtro é ao vivo) */}
          <form onSubmit={(e) => { e.preventDefault(); syncUrl(busca, mode); }} className="flex-1 min-w-[200px]">
            <label className="flex items-center gap-2 h-10 px-3 rounded-lg bg-card border border-rim/40 focus-within:border-coherent/60">
              <Search size={16} className="text-dim shrink-0" />
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar parlamentar por nome..."
                className="flex-1 bg-transparent outline-none text-sm text-bright placeholder:text-dim" />
            </label>
          </form>
          {/* filtros UF/Partido — casa-aware */}
          <select value={estado} onChange={(e) => setEstado(e.target.value)}
            className="h-10 px-3 rounded-lg bg-card border border-rim/40 text-sm text-mid">
            <option value="">UF — todas</option>
            {estados.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
          </select>
          <select value={partido} onChange={(e) => setPartido(e.target.value)}
            className="h-10 px-3 rounded-lg bg-card border border-rim/40 text-sm text-mid">
            <option value="">Partido — todos</option>
            {partidos.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          {/* Mostrar inativos */}
          <label className="flex items-center gap-2 h-10 px-3 rounded-lg bg-card border border-rim/40 cursor-pointer select-none text-sm text-mid hover:text-bright transition-colors">
            <input
              type="checkbox"
              checked={mostrarInativos}
              onChange={(e) => setMostrarInativos(e.target.checked)}
              className="rounded bg-canvas border-rim/40 text-coherent focus:ring-0 focus:ring-offset-0 accent-coherent w-3.5 h-3.5"
            />
            <span>Incluir inativos/suplentes</span>
          </label>
          <span className="text-sm text-dim ml-auto">
            <span className="font-data text-bright">{rows.length.toLocaleString("pt-BR")}</span> resultados
          </span>
        </div>
      </div>

      {/* lista */}
      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-6">
        <div className="rounded-xl border border-rim/30 overflow-hidden">
          <div className="hidden sm:grid grid-cols-[1fr_8rem_3rem_8rem_7rem] gap-4 px-5 py-2.5 bg-card-alt/60 border-b border-rim/30 text-[10px] uppercase tracking-widest text-dim">
            <span>Parlamentar</span><span>Partido</span><span>UF</span><span>Cargo</span><span className="text-right">Casa</span>
          </div>
          {visiveis.map((p) => (
            <Link
              key={`${p.casa}-${p.id}`}
              href={`/politico/${p.id}?casa=${p.casa}`}
              prefetch={false}
              className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_8rem_3rem_8rem_7rem] gap-4 items-center px-5 py-3 border-b border-rim/15 hover:bg-card-alt/40 transition-colors cursor-pointer group"
            >
              <span className="flex items-center gap-3 min-w-0">
                <span className="w-0.5 h-9 rounded-full shrink-0" style={{ background: CASA[p.casa].hex }} />
                <Avatar name={p.nome_urna} url={p.url_foto} size={40} ringColor={tint(CASA[p.casa].hex, 45)} />
                <span className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`block text-sm truncate group-hover:text-coherent transition-colors ${p.status_mandato === "Inativo" ? "text-dim/60" : p.status_mandato === "Suplente" ? "text-dim/80" : "text-bright"}`}>
                      {p.nome_urna}
                    </span>
                    {p.status_mandato === "Inativo" && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-dim/15 text-dim border border-rim/20 rounded uppercase tracking-wider shrink-0 font-medium font-data">
                        Inativo
                      </span>
                    )}
                    {p.status_mandato === "Suplente" && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-coherent/15 text-coherent border border-coherent/20 rounded uppercase tracking-wider shrink-0 font-medium font-data">
                        Suplente
                      </span>
                    )}
                  </div>
                  <span className="block text-[11px] text-dim truncate">{p.nome_civil}</span>
                </span>
              </span>
              <span className="hidden sm:block text-sm text-mid">{p.partido}</span>
              <span className="hidden sm:block font-data text-xs text-mid">{p.estado}</span>
              <span className="hidden sm:block text-xs text-dim truncate">{p.cargo}</span>
              <span className="justify-self-end"><CasaBadge casa={p.casa} /></span>
            </Link>
          ))}
          {rows.length === 0 && (
            <p className="px-5 py-16 text-center text-sm text-dim">Nenhum parlamentar para os filtros selecionados.</p>
          )}
        </div>

        {/* paginação client-side */}
        {totalPaginas > 1 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setPagina((n) => Math.max(1, n - 1))}
              disabled={paginaAtual <= 1}
              className="h-9 px-3 rounded-lg border border-rim/40 text-sm text-mid hover:text-bright disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-card/20"
            >
              Anterior
            </button>
            
            {obterPaginas(paginaAtual, totalPaginas).map((p, idx) => {
              if (p === "...") {
                return (
                  <span key={`dots-${idx}`} className="px-2 text-sm text-dim select-none font-data">
                    ...
                  </span>
                );
              }
              const active = paginaAtual === p;
              return (
                <button
                  key={`page-${p}`}
                  onClick={() => setPagina(p as number)}
                  className={`w-9 h-9 rounded-lg border text-sm font-data font-semibold transition-all flex items-center justify-center cursor-pointer ${
                    active
                      ? "bg-coherent text-canvas border-coherent shadow-md shadow-coherent/10"
                      : "border-rim/40 text-mid hover:text-bright hover:border-rim/80 bg-card/45"
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => setPagina((n) => Math.min(totalPaginas, n + 1))}
              disabled={paginaAtual >= totalPaginas}
              className="h-9 px-3 rounded-lg border border-rim/40 text-sm text-mid hover:text-bright disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-card/20"
            >
              Próxima
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export function DiretorioClient(props: { parlamentares: Parlamentar[]; erro: boolean }) {
  return (
    <Suspense fallback={<div className="pt-14" />}>
      <DiretorioInner {...props} />
    </Suspense>
  );
}
