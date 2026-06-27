"use client";

// Orquestrador client da comparação 1×1: detém a seleção (via SeletorComparacao) e só
// dispara o fetch de /api/comparar + timelines DEPOIS que os dois parlamentares estão
// escolhidos. Estados: vazio (instrução), carregando, erro (msg amigável + retry; o erro
// técnico vai só pro console), e resultado (resumo + divergências + linha do tempo).
// Sem score, ranking ou coerência. Tipos canônicos.

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Swords, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { SeletorComparacao, type Selecao } from "./SeletorComparacao";
import { TimelineVotos } from "./TimelineVotos";
import { categoriaVoto, VOTO_COR, SERIE_A, SERIE_B } from "./votos";
import { fetchComparacaoCompleta, type ComparacaoCompleta } from "@/lib/comparacao";
import { tint } from "@/lib/casa";
import type { Parlamentar } from "@/lib/types";

function VotoChip({ voto }: { voto: string }) {
  const cor = VOTO_COR[categoriaVoto(voto)];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border whitespace-nowrap"
      style={{ color: cor, borderColor: tint(cor, 35), backgroundColor: tint(cor, 12) }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cor }} />
      {voto}
    </span>
  );
}

function ErroBox({ titulo, onRetry }: { titulo: string; onRetry: () => void }) {
  return (
    <div className="mt-10 grid place-items-center">
      <div className="text-center max-w-md">
        <div className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-card border border-rim/40 mb-5">
          <AlertTriangle size={24} className="text-incoherent" />
        </div>
        <h2 className="font-display text-bright text-2xl">{titulo}</h2>
        <p className="text-mid mt-3 leading-relaxed">
          Não conseguimos falar com a API agora. Verifique a conexão e tente novamente.
        </p>
        <button
          onClick={onRetry}
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

function Resultados({ data, nomeA, nomeB }: {
  data: ComparacaoCompleta;
  nomeA: string;
  nomeB: string;
}) {
  const { comparacao, timeline1, timeline2 } = data;
  const pct = comparacao.concordancia_percentual.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

  return (
    <div className="mt-10 space-y-6">
      {/* Resumo */}
      <div className="glass rounded-xl p-6 grid grid-cols-2 gap-6">
        <div className="text-center">
          <p className="font-data text-4xl font-bold text-bright tabular-nums">{pct}%</p>
          <p className="text-xs text-dim mt-1.5">concordância nas votações em comum</p>
        </div>
        <div className="text-center border-l border-rim/30">
          <p className="font-data text-4xl font-bold text-bright tabular-nums">{comparacao.proposicoes_em_comum}</p>
          <p className="text-xs text-dim mt-1.5">proposições em comum</p>
        </div>
      </div>

      {/* Divergências */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-rim/30 flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.2em] text-dim">Divergências</p>
          <span className="text-xs text-dim">
            <span className="font-data text-mid">{comparacao.divergencias.length}</span> votos opostos
          </span>
        </div>

        {comparacao.proposicoes_em_comum === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-dim">
            Sem proposições em comum entre os dois — não há o que comparar.
          </p>
        ) : comparacao.divergencias.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-dim">
            Votaram igual em todas as {comparacao.proposicoes_em_comum} proposições em comum.
          </p>
        ) : (
          <div>
            <div className="hidden sm:grid grid-cols-[1fr_7rem_7rem] gap-4 px-5 py-2.5 bg-card-alt/60 border-b border-rim/30 text-[10px] uppercase tracking-widest text-dim">
              <span>Proposição</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{ background: SERIE_A }} />{nomeA}</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{ background: SERIE_B }} />{nomeB}</span>
            </div>
            {comparacao.divergencias.map((d) => (
              <div key={d.proposicao_id} className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_7rem_7rem] gap-4 items-center px-5 py-3 border-b border-rim/15">
                <span className="min-w-0">
                  <span className="block font-data text-sm text-bright">{d.proposicao_id}</span>
                  {d.ementa && <span className="block text-[11px] text-dim line-clamp-2 mt-0.5">{d.ementa}</span>}
                </span>
                <VotoChip voto={d.voto_politico_1} />
                <VotoChip voto={d.voto_politico_2} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Linha do tempo de votos */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-dim">Linha do tempo de votos</p>
          <div className="flex gap-4">
            {[{ nome: nomeA, cor: SERIE_A }, { nome: nomeB, cor: SERIE_B }].map(({ nome, cor }) => (
              <span key={nome} className="flex items-center gap-2 text-xs text-mid">
                <span className="w-6 h-[2px] rounded-full" style={{ background: cor }} />{nome}
              </span>
            ))}
          </div>
        </div>
        <TimelineVotos tl1={timeline1} tl2={timeline2} nomeA={nomeA} nomeB={nomeB} />
      </div>
    </div>
  );
}

export function ComparacaoClient({ parlamentares, erroInicial }: {
  parlamentares: Parlamentar[];
  erroInicial: boolean;
}) {
  const router = useRouter();
  const [sel, setSel] = useState<Selecao>({ casa: "camara", pol1: null, pol2: null });
  const [data, setData] = useState<ComparacaoCompleta | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(false);
  const [nonce, setNonce] = useState(0);

  // memoizado: o SeletorComparacao eleva a seleção via effect — sem isso, loop de render.
  const handleChange = useCallback((s: Selecao) => setSel(s), []);

  const ambos = sel.pol1 && sel.pol2;

  useEffect(() => {
    if (!sel.pol1 || !sel.pol2) { setData(null); setErro(false); setLoading(false); return; }
    let ativo = true;
    setLoading(true); setErro(false);
    fetchComparacaoCompleta(sel.casa, sel.pol1.id, sel.pol2.id)
      .then((d) => { if (ativo) { setData(d); setLoading(false); } })
      .catch((e) => {
        if (!ativo) return;
        console.error("[comparacao] falha ao carregar comparação:", e); // técnico só no console
        setErro(true); setLoading(false);
      });
    return () => { ativo = false; };
  }, [sel, nonce]);

  return (
    <div className="pt-14 min-h-screen max-w-5xl mx-auto px-4 sm:px-6 pb-24">
      <div className="pt-12 pb-10 text-center">
        <div className="inline-flex items-center gap-2 text-dim mb-3">
          <Swords size={14} />
          <span className="text-[10px] uppercase tracking-[0.25em]">Comparação</span>
        </div>
        <h1 className="font-display text-5xl sm:text-6xl font-bold text-bright">Face a Face</h1>
        <p className="text-sm text-dim mt-2.5">
          Concordância de votos e divergências entre dois parlamentares da mesma Casa.
        </p>
      </div>

      {erroInicial ? (
        <ErroBox titulo="Não foi possível carregar os parlamentares" onRetry={() => router.refresh()} />
      ) : (
        <>
          <SeletorComparacao parlamentares={parlamentares} onChange={handleChange} />

          {!ambos && (
            <p className="mt-10 text-center text-dim text-sm">
              Selecione dois parlamentares para ver a comparação.
            </p>
          )}

          {ambos && loading && (
            <div className="mt-16 flex flex-col items-center gap-3 text-dim">
              <Loader2 size={22} className="animate-spin" />
              <p className="text-sm">Carregando comparação…</p>
            </div>
          )}

          {ambos && erro && (
            <ErroBox titulo="Não foi possível carregar a comparação" onRetry={() => setNonce((n) => n + 1)} />
          )}

          {ambos && data && !loading && !erro && (
            <Resultados data={data} nomeA={sel.pol1!.nome_urna} nomeB={sel.pol2!.nome_urna} />
          )}
        </>
      )}
    </div>
  );
}
