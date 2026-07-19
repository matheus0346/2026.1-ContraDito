"use client";

// Pré-visualização do Diretório de Parlamentares para a Homepage.
// Posicionado entre "Sobre o ContraDito" e "A equipe - squad 09".
// Inspirado na estrutura visual e interatividade de portais como ranking.org.br,
// adaptado à identidade do ContraDito (Dark/Glass, sem score/ranking).

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ArrowRight, UserCheck, ChevronRight } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { CASA, tint, type Casa } from "@/lib/casa";
import type { Parlamentar } from "@/lib/types";

type Mode = "todos" | Casa;

const MODES: { key: Mode; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "camara", label: "Câmara dos Deputados" },
  { key: "senado", label: "Senado Federal" },
];

function CasaBadge({ casa }: { casa: Casa }) {
  const { label, hex } = CASA[casa];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium border"
      style={{
        color: hex,
        backgroundColor: tint(hex, 12),
        borderColor: tint(hex, 35),
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: hex }} />
      {label}
    </span>
  );
}

export function DiretorioPreview({ parlamentares }: { parlamentares: Parlamentar[] }) {
  const [mode, setMode] = useState<Mode>("todos");
  const [busca, setBusca] = useState("");
  const [mostrarInativos, setMostrarInativos] = useState(false);

  // Filtra por casa e por termo de busca
  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return parlamentares
      .filter((p) => mode === "todos" || p.casa === mode)
      .filter(
        (p) =>
          mostrarInativos
            ? true
            : p.status_mandato?.toLowerCase() !== "inativo" &&
              p.status_mandato?.toLowerCase() !== "suplente"
      )
      .filter((p) =>
        q ? p.nome_urna.toLowerCase().includes(q) || p.nome_civil.toLowerCase().includes(q) || p.partido.toLowerCase().includes(q) : true
      );
  }, [parlamentares, mode, busca, mostrarInativos]);

  // Exibição de amostra de 6 parlamentares no preview da homepage (Estilo Lista Ranking)
  const amostra = useMemo(() => filtrados.slice(0, 6), [filtrados]);

  return (
    <section id="diretorio-preview" className="relative py-20 bg-card/20 border-y border-rim/30 overflow-hidden">
      {/* Luz ambiente sutil de fundo */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 z-0"
        style={{
          background: `radial-gradient(60% 40% at 50% 50%, ${tint(CASA.camara.hex, 8)}, transparent 70%)`,
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8">
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl text-bright font-bold">
              Pré-visualização dos Parlamentares
            </h2>
            <p className="text-mid mt-2 max-w-xl text-base">
              Explore o perfil, as votações nominais e discursos dos deputados federais e senadores em exercício.
            </p>
          </div>

          <Link
            href="/diretorio"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-card-alt border border-rim/50 text-bright text-sm font-medium hover:border-coherent/60 hover:bg-card transition-all group shrink-0 self-start md:self-auto"
          >
            <span>Ver todos os parlamentares</span>
            <span className="font-data text-xs text-dim group-hover:text-coherent transition-colors">
              ({parlamentares.length || 887})
            </span>
            <ArrowRight size={16} className="text-mid group-hover:text-coherent group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>

        {/* Barra de Filtros e Busca (Estilo Ranking) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-2 rounded-2xl bg-card-alt/80 border border-rim/40 backdrop-blur-md mb-8">
          {/* Tabs Seletor de Casa */}
          <div className="inline-flex p-1 rounded-xl bg-card/90 border border-rim/30 self-start sm:self-auto">
            {MODES.map((m) => {
              const active = mode === m.key;
              const hex = m.key === "todos" ? null : CASA[m.key as Casa].hex;
              return (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  className={`px-4 h-9 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                    active ? "text-bright shadow-sm" : "text-mid hover:text-bright"
                  }`}
                  style={
                    active
                      ? {
                          background: hex ? tint(hex, 20) : "var(--color-card-alt)",
                          boxShadow: `inset 0 0 0 1px ${hex ? tint(hex, 50) : "var(--color-rim)"}`,
                        }
                      : undefined
                  }
                >
                  {hex && <span className="w-2 h-2 rounded-full" style={{ background: active ? hex : tint(hex, 50) }} />}
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Mostrar inativos */}
          <label className="flex items-center gap-2 h-10 px-3 rounded-lg bg-card border border-rim/40 cursor-pointer select-none text-xs sm:text-sm text-mid hover:text-bright transition-colors self-start sm:self-auto shrink-0">
            <input
              type="checkbox"
              checked={mostrarInativos}
              onChange={(e) => setMostrarInativos(e.target.checked)}
              className="rounded bg-canvas border-rim/40 text-coherent focus:ring-0 focus:ring-offset-0 accent-coherent w-3.5 h-3.5"
            />
            <span>Incluir inativos/suplentes</span>
          </label>

          {/* Input de busca rápida na amostra */}
          <div className="relative flex-1 max-w-md">
            <label className="flex items-center gap-2 h-10 px-3.5 rounded-xl bg-card border border-rim/40 focus-within:border-coherent/60 transition-colors">
              <Search size={16} className="text-dim shrink-0" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Filtrar por nome ou partido no preview..."
                className="w-full bg-transparent outline-none text-xs sm:text-sm text-bright placeholder:text-dim"
              />
              {busca && (
                <button
                  onClick={() => setBusca("")}
                  className="text-xs text-dim hover:text-bright px-1 py-0.5 rounded"
                >
                  Limpar
                </button>
              )}
            </label>
          </div>
        </div>

        {/* Lista de Parlamentares Compacta (Estilo Ranking) */}
        {amostra.length > 0 ? (
          <div className="flex flex-col gap-2.5 w-full">
            {amostra.map((p) => {
              const casaHex = CASA[p.casa].hex;
              return (
                <Link
                  key={`${p.casa}-${p.id}`}
                  href={`/politico/${p.id}?casa=${p.casa}`}
                  prefetch={false}
                  className="group relative rounded-xl border border-rim/40 bg-card/70 hover:bg-card-alt/90 hover:border-rim/80 p-3 sm:p-3.5 flex items-center justify-between transition-all duration-200 hover:shadow-md cursor-pointer overflow-hidden gap-3"
                >
                  {/* Linha lateral indicadora de Casa */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 transition-opacity opacity-70 group-hover:opacity-100"
                    style={{ background: casaHex }}
                  />

                  {/* Informações Principais */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1 pl-1">
                    <Avatar
                      name={p.nome_urna}
                      url={p.url_foto}
                      size={44}
                      ringColor={tint(casaHex, 50)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-display text-base font-bold leading-tight group-hover:text-coherent transition-colors truncate ${p.status_mandato === "Inativo" ? "text-dim/60" : p.status_mandato === "Suplente" ? "text-dim/80" : "text-bright"}`}>
                          {p.nome_urna}
                        </h3>
                        {p.status_mandato === "Inativo" && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-dim/15 text-dim border border-rim/20 rounded font-medium shrink-0 font-data">Inativo</span>
                        )}
                        {p.status_mandato === "Suplente" && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-coherent/15 text-coherent border border-coherent/20 rounded font-medium shrink-0 font-data">Suplente</span>
                        )}
                      </div>
                      <p className="text-xs text-dim truncate mt-0.5">
                        <span>{p.cargo}</span> <span className="text-mid font-semibold">| {p.partido} - {p.estado}</span>
                      </p>
                    </div>
                  </div>

                  {/* Lado Direito: Badge de Casa & Seta */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <CasaBadge casa={p.casa} />
                    <ChevronRight size={18} className="text-dim group-hover:text-coherent group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center rounded-2xl border border-rim/30 bg-card/40">
            <p className="text-mid text-sm font-medium">Nenhum parlamentar encontrado para o filtro digitado.</p>
            <p className="text-dim text-xs mt-1">Tente buscar por outro nome ou partido, ou navegue pelo diretório completo.</p>
          </div>
        )}

        {/* Rodapé do Preview com Ação Centralizada */}
        <div className="mt-12 text-center">
          <Link
            href="/diretorio"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-coherent text-canvas font-semibold text-sm hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-coherent/10 cursor-pointer"
          >
            <span>Explorar todos os {parlamentares.length || 887} parlamentares</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
