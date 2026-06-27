"use client";

// Dossiê do Político (Client Component)
// Apresenta as abas: Perfil (Atividade, Fidelidade, Afinidades), Votações (Nominais, Chunks, Modal de Discurso), Timeline.

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Vote,
  Activity,
  Award,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Clock,
  ArrowRight,
} from "lucide-react";
import { CASA, tint } from "@/lib/casa";
import type {
  Parlamentar,
  PoliticoResumoVotos,
  AfinidadesPoliticas,
  FidelidadePartidaria,
  TimelinePoint,
  PaginaVotosNominais,
  Discurso,
} from "@/lib/types";
import {
  obterAfinidadesPolitico,
  obterFidelidadePartidaria,
  obterTimelineVotos,
  obterVotosNominais,
  obterDetalheDiscurso,
} from "@/lib/politicos";
import { formatDate, votoHex } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { TimelineIndividual } from "./TimelineIndividual";

type Tab = "perfil" | "votacoes" | "timeline";

const TABS: { key: Tab; label: string }[] = [
  { key: "perfil", label: "Resumo & Afinidades" },
  { key: "votacoes", label: "Votações Nominais" },
  { key: "timeline", label: "Histórico Visual" },
];

export function DossieClient({
  politico: p,
  resumoVotos,
}: {
  politico: Parlamentar;
  resumoVotos: PoliticoResumoVotos | null;
}) {
  const [tab, setTab] = useState<Tab>("perfil");

  // Dados carregados sob demanda
  const [afinidades, setAfinidades] = useState<AfinidadesPoliticas | null>(null);
  const [fidelidade, setFidelidade] = useState<FidelidadePartidaria | null>(null);
  const [timeline, setTimeline] = useState<TimelinePoint[] | null>(null);
  
  const [votos, setVotos] = useState<PaginaVotosNominais | null>(null);
  const [votosPagina, setVotosPagina] = useState(1);
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});
  const [apenasComDiscursos, setApenasComDiscursos] = useState(false);
  const [activeChunkTab, setActiveChunkTab] = useState<Record<string, number>>({});

  const toggleExpandido = (id: string) => {
    setExpandidos((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Reseta a pagina de votações quando o filtro de discursos muda
  useEffect(() => {
    setVotosPagina(1);
  }, [apenasComDiscursos]);

  // Estados de loading e erro
  const [loadingPerfil, setLoadingPerfil] = useState(false);
  const [loadingVotos, setLoadingVotos] = useState(false);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [erroPerfil, setErroPerfil] = useState(false);
  const [erroVotos, setErroVotos] = useState(false);
  const [erroTimeline, setErroTimeline] = useState(false);

  // Modal para leitura do discurso na íntegra (Rota 13)
  const [modalDiscurso, setModalDiscurso] = useState<{
    id: string;
    texto: string | null;
    sumario: string | null;
    data: string | null;
    loading: boolean;
  } | null>(null);

  const houseColor = CASA[p.casa].hex;

  // Carrega dados de Afinidades e Fidelidade quando a aba "Perfil" é selecionada
  useEffect(() => {
    if (tab === "perfil" && afinidades === null) {
      setLoadingPerfil(true);
      setErroPerfil(false);
      Promise.all([
        obterAfinidadesPolitico(p.casa, p.id),
        obterFidelidadePartidaria(p.casa, p.id),
      ])
        .then(([afin, fidel]) => {
          setAfinidades(afin);
          setFidelidade(fidel);
        })
        .catch((err) => {
          console.error("Erro ao carregar dados do perfil:", err);
          setErroPerfil(true);
        })
        .finally(() => setLoadingPerfil(false));
    }
  }, [tab, p.id, p.casa, afinidades]);

  // Carrega a listagem paginada de votos nominais (Rota 15)
  useEffect(() => {
    if (tab === "votacoes") {
      setLoadingVotos(true);
      setErroVotos(false);
      obterVotosNominais(p.casa, p.id, votosPagina, 10, apenasComDiscursos)
        .then(setVotos)
        .catch((err) => {
          console.error("Erro ao carregar votos nominais:", err);
          setErroVotos(true);
        })
        .finally(() => setLoadingVotos(false));
    }
  }, [tab, p.id, p.casa, votosPagina, apenasComDiscursos]);

  // Carrega a linha do tempo (Rota 3)
  useEffect(() => {
    if (tab === "timeline" && timeline === null) {
      setLoadingTimeline(true);
      setErroTimeline(false);
      obterTimelineVotos(p.casa, p.id)
        .then(setTimeline)
        .catch((err) => {
          console.error("Erro ao carregar linha do tempo:", err);
          setErroTimeline(true);
        })
        .finally(() => setLoadingTimeline(false));
    }
  }, [tab, p.id, p.casa, timeline]);

  // Função para abrir modal de discurso e carregar os dados
  const handleAbrirDiscurso = async (discursoId: string) => {
    setModalDiscurso({
      id: discursoId,
      texto: null,
      sumario: null,
      data: null,
      loading: true,
    });
    try {
      const disc = await obterDetalheDiscurso(p.casa, discursoId);
      setModalDiscurso({
        id: discursoId,
        texto: disc.texto_bruto,
        sumario: disc.sumario,
        data: disc.data_discurso,
        loading: false,
      });
    } catch (err) {
      console.error("Erro ao obter discurso detalhado:", err);
      setModalDiscurso((prev) => (prev ? { ...prev, loading: false } : null));
    }
  };

  // Cálculo da taxa de presença nas votações do Congresso
  const totalPresencas = resumoVotos
    ? resumoVotos.total_votos - resumoVotos.qtd_ausencia
    : 0;
  const taxaPresenca = resumoVotos?.total_votos
    ? (totalPresencas / resumoVotos.total_votos) * 100
    : 100;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
      {/* Botões/Abas */}
      <div className="flex border-b border-white/[0.08] mt-10">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative px-5 py-3 text-sm font-medium transition-colors ${
              tab === t.key ? "text-bright" : "text-dim hover:text-mid"
            }`}
          >
            {t.label}
            {tab === t.key && (
              <span
                className="absolute bottom-0 inset-x-3 h-[2px] rounded-full"
                style={{ backgroundColor: houseColor }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {/* ABA: RESUMO E AFINIDADES */}
        {tab === "perfil" && (
          <div className="space-y-8">
            {loadingPerfil ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-40 rounded-xl bg-card animate-pulse border border-rim/10" />
                <div className="h-40 rounded-xl bg-card animate-pulse border border-rim/10" />
              </div>
            ) : erroPerfil ? (
              <div className="rounded-xl border border-rim/20 bg-card/25 p-8 text-center max-w-md mx-auto mt-10">
                <AlertTriangle size={24} className="text-incoherent mx-auto mb-3" />
                <p className="text-sm text-bright font-medium">Erro ao carregar dados do perfil</p>
                <p className="text-xs text-dim mt-1.5 leading-relaxed">
                  Não foi possível obter dados analíticos e de afinidade partidária deste parlamentar.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Atividade Legislativa */}
                <div className="rounded-xl border border-rim/20 bg-card/45 p-6 glass">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-bright flex items-center gap-2 mb-5">
                    <Vote size={16} className="text-mid" />
                    Atividade em Votações
                  </h2>
                  {resumoVotos ? (
                    <div className="space-y-4">
                      {p.casa === "senado" ? (
                        <div>
                          <div className="flex justify-between items-center text-xs text-mid mb-1">
                            <span>Taxa de Presença</span>
                            <span className="font-data text-bright font-bold">
                              {taxaPresenca.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-dim/20 overflow-hidden border border-rim/35">
                            <div
                              className="h-full"
                              style={{
                                width: `${taxaPresenca}%`,
                                backgroundColor: houseColor,
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-mid mb-1">
                          Distribuição de posicionamento nas votações nominais registradas:
                        </div>
                      )}

                      {p.casa === "senado" ? (
                        <div className="grid grid-cols-3 gap-3 pt-3 text-center divide-x divide-rim/20">
                          <div>
                            <p className="font-data text-xl text-bright font-bold">
                              {resumoVotos.total_votos}
                            </p>
                            <p className="text-[10px] text-dim uppercase">Total Votos</p>
                          </div>
                          <div>
                            <p className="font-data text-xl text-bright font-bold">
                              {totalPresencas}
                            </p>
                            <p className="text-[10px] text-dim uppercase">Presenças</p>
                          </div>
                          <div>
                            <p className="font-data text-xl text-bright font-bold">
                              {resumoVotos.qtd_ausencia}
                            </p>
                            <p className="text-[10px] text-dim uppercase">Ausências</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-3 pt-3 text-center divide-x divide-rim/20">
                            <div>
                              <p className="font-data text-xl text-bright font-bold">
                                {resumoVotos.total_votos}
                              </p>
                              <p className="text-[10px] text-dim uppercase">Votos Totais</p>
                            </div>
                            <div>
                              <p className="font-data text-xl text-bright font-bold">
                                {resumoVotos.qtd_sim}
                              </p>
                              <p className="text-[10px] text-dim uppercase">Votos Sim</p>
                            </div>
                            <div>
                              <p className="font-data text-xl text-bright font-bold">
                                {resumoVotos.qtd_nao}
                              </p>
                              <p className="text-[10px] text-dim uppercase">Votos Não</p>
                            </div>
                          </div>
                          <p className="text-[10px] text-dim leading-relaxed italic border-t border-white/[0.05] pt-2">
                            Nota: Estatísticas de ausência para a Câmara dos Deputados estão em fase de processamento (estamos melhorando nossa base de dados para disponibilizar esse histórico em breve).
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-dim italic">Estatísticas de votações indisponíveis.</p>
                  )}
                </div>

                {/* Fidelidade Partidária */}
                <div className="rounded-xl border border-rim/20 bg-card/45 p-6 glass">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-bright flex items-center gap-2 mb-5">
                    <Award size={16} className="text-mid" />
                    Fidelidade Partidária
                  </h2>
                  {fidelidade ? (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center text-xs text-mid mb-1">
                          <span>Orientação Votada</span>
                          <span className="font-data text-bright font-bold">
                            {fidelidade.taxa_fidelidade.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-dim/20 overflow-hidden border border-rim/35">
                          <div
                            className="h-full bg-coherent"
                            style={{ width: `${fidelidade.taxa_fidelidade}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between text-xs pt-2">
                        <span className="text-mid">Votos alinhados:</span>
                        <span className="font-data text-bright font-semibold">{fidelidade.votos_alinhados}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-mid">Votos divergentes (rebeldes):</span>
                        <span className="font-data text-bright font-semibold">{fidelidade.votos_rebeldes}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-dim italic">Métricas de fidelidade partidária indisponíveis.</p>
                  )}
                </div>

                {/* Afinidades Ideológicas */}
                {afinidades && (
                  <div className="md:col-span-2 space-y-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-dim flex items-center gap-2">
                      <Users size={16} />
                      Afinidades na Casa (Concordância de Voto)
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Gêmeo */}
                      {afinidades.gemeo ? (
                        <Link
                          href={`/politico/${afinidades.gemeo.politico.id}?casa=${p.casa}`}
                          className="flex items-center gap-4 rounded-xl border border-rim/20 bg-card/30 p-4 hover:border-coherent/40 transition-colors"
                        >
                          <Avatar
                            name={afinidades.gemeo.politico.nome_urna}
                            url={afinidades.gemeo.politico.url_foto}
                            size={56}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] text-coherent font-bold uppercase tracking-wider">
                              Maior Afinidade (Gêmeo)
                            </span>
                            <h3 className="text-sm text-bright font-bold truncate">
                              {afinidades.gemeo.politico.nome_urna}
                            </h3>
                            <p className="text-xs text-mid">
                              {afinidades.gemeo.politico.partido}/{afinidades.gemeo.politico.estado}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-data text-lg text-coherent font-bold">
                              {afinidades.gemeo.concordancia.toFixed(1)}%
                            </p>
                            <p className="text-[9px] text-dim uppercase">
                              {afinidades.gemeo.votos_comuns} votos comuns
                            </p>
                          </div>
                        </Link>
                      ) : (
                        <div className="rounded-xl border border-rim/20 bg-card/10 p-4 text-center text-xs text-dim italic">
                          Nenhum twin ideológico identificado.
                        </div>
                      )}

                      {/* Antípoda */}
                      {afinidades.antipoda ? (
                        <Link
                          href={`/politico/${afinidades.antipoda.politico.id}?casa=${p.casa}`}
                          className="flex items-center gap-4 rounded-xl border border-rim/20 bg-card/30 p-4 hover:border-incoherent/40 transition-colors"
                        >
                          <Avatar
                            name={afinidades.antipoda.politico.nome_urna}
                            url={afinidades.antipoda.politico.url_foto}
                            size={56}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] text-incoherent font-bold uppercase tracking-wider">
                              Menor Afinidade (Antípoda)
                            </span>
                            <h3 className="text-sm text-bright font-bold truncate">
                              {afinidades.antipoda.politico.nome_urna}
                            </h3>
                            <p className="text-xs text-mid">
                              {afinidades.antipoda.politico.partido}/{afinidades.antipoda.politico.estado}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-data text-lg text-incoherent font-bold">
                              {afinidades.antipoda.concordancia.toFixed(1)}%
                            </p>
                            <p className="text-[9px] text-dim uppercase">
                              {afinidades.antipoda.votos_comuns} votos comuns
                            </p>
                          </div>
                        </Link>
                      ) : (
                        <div className="rounded-xl border border-rim/20 bg-card/10 p-4 text-center text-xs text-dim italic">
                          Nenhum antípoda ideológico identificado.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Discursos Direct Link */}
                <div className="md:col-span-2 pt-2">
                  <Link
                    href={`/politico/${p.id}/discursos?casa=${p.casa}`}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-bright border border-rim/45 hover:border-bright px-5 h-11 rounded-lg transition-colors bg-card-alt/30"
                  >
                    <BookOpen size={14} />
                    Ver Pronunciamentos e Discursos na Íntegra
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ABA: HISTÓRICO DE VOTAÇÕES NOMINAIS (ROTA 15) */}
        {tab === "votacoes" && (
          <div className="space-y-6">
            {/* Filtro por Discursos */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-rim/20 bg-card/25 backdrop-blur-sm">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="filtroDiscursos"
                  checked={apenasComDiscursos}
                  onChange={(e) => setApenasComDiscursos(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-rim/45 text-coherent focus:ring-coherent bg-card cursor-pointer"
                />
                <label htmlFor="filtroDiscursos" className="text-xs font-semibold text-bright select-none cursor-pointer">
                  Apenas proposições com discursos analisados (AI-Match)
                </label>
              </div>
              <span className="text-[10px] text-dim font-data uppercase tracking-wider">
                {votos?.total_registros ?? 0} {votos?.total_registros === 1 ? "Matéria" : "Matérias"}
              </span>
            </div>
            {loadingVotos ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-32 rounded-xl bg-card animate-pulse border border-rim/10" />
                ))}
              </div>
            ) : erroVotos ? (
              <div className="rounded-xl border border-rim/20 bg-card/25 p-8 text-center max-w-md mx-auto mt-10">
                <AlertTriangle size={24} className="text-incoherent mx-auto mb-3" />
                <p className="text-sm text-bright font-medium">Erro ao carregar votações</p>
                <p className="text-xs text-dim mt-1.5 leading-relaxed">
                  Não foi possível obter a listagem de votos nominais deste parlamentar.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {votos?.itens.map((v) => {
                  const corVoto = votoHex(v.voto_oficial);
                  const isExpandido = !!expandidos[v.id];
                  return (
                    <div
                      key={v.id}
                      className="rounded-xl border border-rim/20 bg-card/30 p-5 sm:p-6 transition-all"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Botão de expansão (setinha) */}
                          <button
                            onClick={() => toggleExpandido(v.id)}
                            className="p-1 rounded-md hover:bg-white/5 transition-colors text-dim hover:text-bright"
                            aria-label={isExpandido ? "Recolher detalhes" : "Expandir detalhes"}
                          >
                            {isExpandido ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </button>

                          <div className="min-w-0">
                            {v.proposicao ? (
                              <Link
                                href={`/proposicoes/${p.casa}/${v.proposicao.id}?voltar=${encodeURIComponent(`/politico/${p.id}?casa=${p.casa}`)}`}
                                className="font-display text-bright font-bold text-lg hover:text-coherent transition-colors block"
                              >
                                {v.proposicao_id}
                              </Link>
                            ) : (
                              <span className="font-display text-bright font-bold text-lg block">
                                {v.proposicao_id}
                              </span>
                            )}
                            {v.proposicao && (
                              <p className="text-[10px] text-dim font-data mt-0.5 uppercase tracking-wider">
                                {v.proposicao.tipo} {v.proposicao.numero}/{v.proposicao.ano}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Badge de Voto */}
                        <span
                          className="inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-bold border uppercase font-data shrink-0"
                          style={{
                            color: corVoto,
                            borderColor: `${corVoto}55`,
                            backgroundColor: `${corVoto}10`,
                          }}
                        >
                          Voto: {v.voto_oficial}
                        </span>
                      </div>

                      {/* Conteúdo Collapsible */}
                      {isExpandido && (
                        <div className="mt-5 pt-5 border-t border-rim/15 space-y-5">
                          {v.proposicao ? (
                            <div className="space-y-4">
                              <p className="text-xs text-mid leading-relaxed">
                                <span className="font-semibold text-dim">Ementa:</span> {v.proposicao.ementa}
                              </p>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                {/* Resumo Executivo */}
                                <div className="rounded-lg p-4 bg-card-alt/55 border border-rim/15 relative overflow-hidden glass-elevated">
                                  <p className="text-[10px] font-bold text-coherent uppercase tracking-wider mb-2">
                                    Resumo da IA
                                  </p>
                                  {v.proposicao.resumo_executivo ? (
                                    <p className="text-xs text-bright leading-relaxed italic font-display">
                                      {v.proposicao.resumo_executivo}
                                    </p>
                                  ) : (
                                    <div className="space-y-1.5">
                                      <p className="text-[11px] text-mid italic leading-relaxed">
                                        Esta proposição não possui resumo executivo gerado por IA porque ela não foi submetida a uma votação nominal no plenário.
                                      </p>
                                      <p className="text-[10px] text-dim leading-relaxed">
                                        O pipeline de cruzamento do ContraDito é disparado apenas para matérias que passaram por votações nominais oficiais e contam com discursos associados.
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Chunks de Discursos Associados */}
                                <div className="space-y-3">
                                  <p className="text-[10px] uppercase font-bold tracking-wider text-dim flex items-center gap-1.5">
                                    <Clock size={12} />
                                    Chunks de Discursos Analisados
                                  </p>
                                  {v.chunks_proximos && v.chunks_proximos.length > 0 ? (
                                    <div className="space-y-3">
                                      {/* Seletor de abas se houver mais de 1 chunk */}
                                      {v.chunks_proximos.length > 1 && (
                                        <div className="flex flex-wrap gap-1.5 pb-1 border-b border-rim/10">
                                          {v.chunks_proximos.map((chunk, idx) => {
                                            const activeIdx = activeChunkTab[v.id] ?? 0;
                                            const matchPercent = chunk.similaridade !== undefined
                                              ? `${(chunk.similaridade * 100).toFixed(0)}%`
                                              : `#${idx + 1}`;
                                            return (
                                              <button
                                                key={idx}
                                                onClick={() => {
                                                  setActiveChunkTab((prev) => ({ ...prev, [v.id]: idx }));
                                                }}
                                                className={`text-[9px] font-semibold font-data px-2.5 py-1 rounded transition-all uppercase ${
                                                  activeIdx === idx
                                                    ? "bg-coherent text-bright shadow-sm"
                                                    : "bg-card hover:bg-dim/10 text-mid border border-rim/15"
                                                }`}
                                              >
                                                Match {matchPercent}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      )}

                                      {/* Conteúdo do chunk ativo */}
                                      {(() => {
                                        const activeIdx = activeChunkTab[v.id] ?? 0;
                                        const chunk = v.chunks_proximos[activeIdx] || v.chunks_proximos[0];
                                        if (!chunk) return null;

                                        return (
                                          <div className="rounded-lg p-4 border border-rim/15 bg-card/10 flex flex-col justify-between gap-4 min-h-[120px]">
                                            <div className="text-xs text-mid italic leading-relaxed">
                                              &ldquo;{chunk.texto_chunk}&rdquo;
                                            </div>
                                            <div className="flex items-center justify-between gap-3 shrink-0 pt-3 border-t border-white/[0.03]">
                                              {chunk.similaridade !== undefined && (
                                                <span className="text-[9px] font-data bg-dim/20 border border-rim/20 rounded px-1.5 py-0.5 text-mid uppercase">
                                                  Match Geral: {(chunk.similaridade * 100).toFixed(0)}%
                                                </span>
                                              )}
                                              <button
                                                onClick={() => handleAbrirDiscurso(chunk.discurso_id)}
                                                className="text-[10px] font-semibold text-bright border border-rim/35 hover:border-bright px-2.5 py-1 rounded transition-colors bg-card-alt/30"
                                              >
                                                Ver na Íntegra
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-dim italic bg-card/10 p-4 rounded-lg">
                                      Nenhum trecho de discurso associado a esta votação.
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-dim italic">Detalhes da proposição indisponíveis.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {votos?.itens.length === 0 && (
                  <div className="py-16 text-center rounded-xl border border-rim/15 bg-card/10 p-8 max-w-lg mx-auto">
                    <BookOpen size={28} className="text-dim mx-auto mb-3 opacity-60" />
                    <p className="text-sm text-bright font-semibold">Nenhuma proposição encontrada</p>
                    <p className="text-xs text-dim mt-2 leading-relaxed">
                      {apenasComDiscursos
                        ? "Não identificamos discursos analisados por nossa IA relacionados às votações nominais deste parlamentar."
                        : "Nenhum voto nominal registrado para este parlamentar."}
                    </p>
                    {apenasComDiscursos && (
                      <div className="mt-6">
                        <Link
                          href={`/politico/${p.id}/discursos?casa=${p.casa}`}
                          className="inline-flex items-center gap-2 text-xs font-semibold text-bright border border-rim/45 hover:border-bright px-4 py-2 rounded-lg transition-colors bg-card-alt"
                        >
                          Ir para Pronunciamentos Integrais
                          <ArrowRight size={13} />
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* Paginação */}
                {votos && votos.total_paginas > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                      onClick={() => setVotosPagina((n) => Math.max(1, n - 1))}
                      disabled={votosPagina <= 1}
                      className="h-9 px-4 rounded-lg border border-rim/45 text-sm text-mid hover:text-bright disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Anterior
                    </button>
                    <span className="text-xs text-dim font-data select-none">
                      Página {votosPagina} de {votos.total_paginas}
                    </span>
                    <button
                      onClick={() => setVotosPagina((n) => Math.min(votos.total_paginas, n + 1))}
                      disabled={votosPagina >= votos.total_paginas}
                      className="h-9 px-4 rounded-lg border border-rim/45 text-sm text-mid hover:text-bright disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Próxima
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ABA: HISTÓRICO VISUAL (TIMELINE) (ROTA 3) */}
        {tab === "timeline" && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-dim flex items-center gap-2">
              <Activity size={16} />
              Histórico de Votos no Tempo
            </h2>
            <div className="rounded-xl border border-rim/20 bg-card/45 p-6 glass">
              {loadingTimeline ? (
                <div className="h-[300px] w-full bg-card animate-pulse rounded-lg" />
              ) : erroTimeline ? (
                <div className="py-12 text-center text-sm text-dim italic">
                  Erro ao carregar a linha do tempo.
                </div>
              ) : timeline ? (
                <TimelineIndividual points={timeline} casa={p.casa} />
              ) : null}
            </div>
            <p className="text-[11px] text-dim leading-relaxed">
              O gráfico cartesiano exibe a sequência cronológica dos votos proferidos pelo parlamentar. O eixo vertical indica a categoria do posicionamento oficial (Sim, Não ou Outros/Abstenção/Ausência). Passe o cursor sobre os pontos para ver o código e ementa correspondentes.
            </p>
          </div>
        )}
      </div>

      {/* MODAL DE DISCURSO INTEGRAL (ROTA 13) */}
      {modalDiscurso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas/85 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl border border-rim/35 bg-card p-6 sm:p-8 flex flex-col glass-elevated shadow-2xl">
            <button
              onClick={() => setModalDiscurso(null)}
              className="absolute top-4 right-4 text-xs font-semibold text-mid hover:text-bright border border-rim/35 px-2.5 py-1 rounded-lg transition-colors bg-card-alt"
            >
              Fechar
            </button>

            {modalDiscurso.loading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20">
                <RefreshCw size={24} className="text-mid animate-spin mb-3" />
                <p className="text-xs text-dim">Carregando pronunciamento integral...</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                <header className="pb-4 border-b border-rim/15">
                  <h3 className="font-display text-bright font-black text-2xl">
                    Discurso do Parlamentar
                  </h3>
                  {modalDiscurso.data && (
                    <p className="text-[10px] text-dim font-data mt-1.5 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar size={11} />
                      Pronunciado em {formatDate(modalDiscurso.data)}
                    </p>
                  )}
                </header>

                <div className="flex-1 overflow-y-auto pr-1 py-6 space-y-6">
                  {modalDiscurso.sumario && (
                    <div className="rounded-xl p-4 border border-rim/20 bg-coherent/5">
                      <h4 className="text-[10px] font-bold text-coherent uppercase tracking-wider mb-1.5">
                        Sumário Temático
                      </h4>
                      <p className="text-xs text-mid leading-relaxed italic">
                        {modalDiscurso.sumario}
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-dim uppercase tracking-wider">
                      Transcrição na Íntegra
                    </h4>
                    <p className="text-sm text-bright leading-relaxed whitespace-pre-line font-serif italic text-justify pl-3 border-l-2 border-rim/25">
                      &ldquo;{modalDiscurso.texto}&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
