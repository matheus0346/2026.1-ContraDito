"use client";

// Linha do tempo de votos das duas séries (uma por parlamentar). Eixo X = proposições
// ordenadas por data_votacao; eixo Y = categoria do voto (Sim / Outro / Não) — posicional,
// não avaliativo. UNIÃO das duas timelines (não filtra interseção): onde só um votou, a
// série do outro fica sem ponto naquele X. Sem score.

import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import type { VotoTimeline } from "@/lib/comparacao";
import { categoriaVoto, VOTO_NIVEL, NIVEL_LABEL, SERIE_A, SERIE_B } from "./votos";

type Row = {
  key: string;
  data: string;
  rotulo: string;
  nivelA: number | null;
  nivelB: number | null;
  votoA: string | null;
  votoB: string | null;
};

// Une as duas timelines por proposicao_id, mantendo TODAS as proposições, ordenadas por data.
function construir(tl1: VotoTimeline[], tl2: VotoTimeline[]): Row[] {
  const map = new Map<string, Row>();
  const add = (tl: VotoTimeline[], lado: "A" | "B") => {
    for (const v of tl) {
      const row = map.get(v.proposicao_id) ?? {
        key: v.proposicao_id,
        data: v.data_votacao,
        rotulo: `${v.tipo} ${v.numero}/${v.ano}`,
        nivelA: null, nivelB: null, votoA: null, votoB: null,
      };
      const nivel = VOTO_NIVEL[categoriaVoto(v.voto_oficial)];
      if (lado === "A") { row.nivelA = nivel; row.votoA = v.voto_oficial; }
      else { row.nivelB = nivel; row.votoB = v.voto_oficial; }
      if (v.data_votacao < row.data) row.data = v.data_votacao;
      map.set(v.proposicao_id, row);
    }
  };
  add(tl1, "A");
  add(tl2, "B");
  return [...map.values()].sort((a, b) => a.data.localeCompare(b.data));
}

function Tip({ active, payload, nomeA, nomeB }: {
  active?: boolean;
  payload?: { payload: Row }[];
  nomeA: string;
  nomeB: string;
}) {
  if (!active || !payload?.length) return null;
  const r = payload[0].payload;
  return (
    <div className="glass-elevated rounded-lg px-3 py-2.5 text-xs space-y-1.5 shadow-xl">
      <p className="text-bright font-medium">{r.rotulo}</p>
      <p className="text-dim">{new Date(r.data + "T12:00:00").toLocaleDateString("pt-BR")}</p>
      <p style={{ color: SERIE_A }}>{nomeA}: <span className="font-medium">{r.votoA ?? "—"}</span></p>
      <p style={{ color: SERIE_B }}>{nomeB}: <span className="font-medium">{r.votoB ?? "—"}</span></p>
    </div>
  );
}

export function TimelineVotos({ tl1, tl2, nomeA, nomeB }: {
  tl1: VotoTimeline[];
  tl2: VotoTimeline[];
  nomeA: string;
  nomeB: string;
}) {
  const rows = construir(tl1, tl2);

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-[280px] rounded-xl bg-card border border-rim/20 text-dim text-sm">
        Sem votações para exibir na linha do tempo.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart data={rows} margin={{ top: 10, right: 8, bottom: 4, left: -8 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey="data"
          type="category"
          allowDuplicatedCategory={false}
          tick={{ fill: "#3d4a5c", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={32}
          tickFormatter={(v: string) =>
            new Date(v + "T12:00:00").toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
          }
        />
        <YAxis
          type="number"
          domain={[0.6, 3.4]}
          ticks={[1, 2, 3]}
          tick={{ fill: "#3d4a5c", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(v: number) => NIVEL_LABEL[v] ?? ""}
        />
        <Tooltip content={<Tip nomeA={nomeA} nomeB={nomeB} />} cursor={{ stroke: "rgba(255,255,255,0.08)" }} isAnimationActive={false} />
        <Scatter dataKey="nivelA" name={nomeA} fill={SERIE_A} />
        <Scatter dataKey="nivelB" name={nomeB} fill={SERIE_B} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
