"use client";

// Linha do tempo individual de votos do parlamentar.
// Eixo X = proposições ordenadas cronologicamente.
// Eixo Y = categoria de voto (Sim / Outro / Não) — posicional, não avaliativo.

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TimelinePoint } from "@/lib/types";
import { categoriaVoto, VOTO_NIVEL, NIVEL_LABEL } from "@/app/comparacao/votos";
import { CASA, type Casa } from "@/lib/casa";

type Row = {
  key: string;
  data: string;
  rotulo: string;
  nivel: number;
  voto: string;
  ementa: string;
};

function construir(points: TimelinePoint[]): Row[] {
  return points
    .filter((p) => p.data_votacao)
    .map((p) => ({
      key: p.proposicao_id,
      data: p.data_votacao!,
      rotulo: `${p.tipo} ${p.numero}/${p.ano}`,
      nivel: VOTO_NIVEL[categoriaVoto(p.voto_oficial)],
      voto: p.voto_oficial,
      ementa: p.ementa,
    }))
    .sort((a, b) => a.data.localeCompare(b.data));
}

function Tip({ active, payload }: { active?: boolean; payload?: { payload: Row }[] }) {
  if (!active || !payload?.length) return null;
  const r = payload[0].payload;
  return (
    <div className="glass-elevated rounded-xl p-4 text-xs space-y-2 shadow-2xl max-w-sm border border-rim/35">
      <p className="text-bright font-bold">{r.rotulo}</p>
      <p className="text-[10px] text-dim font-data">
        {new Date(r.data + "T12:00:00").toLocaleDateString("pt-BR")}
      </p>
      <p className="text-mid leading-relaxed line-clamp-2">
        {r.ementa}
      </p>
      <p className="text-sm font-semibold mt-1">
        Voto: <span className="text-coherent font-bold">{r.voto}</span>
      </p>
    </div>
  );
}

export function TimelineIndividual({
  points,
  casa,
}: {
  points: TimelinePoint[];
  casa: Casa;
}) {
  const rows = construir(points);
  const color = CASA[casa].hex;

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-[280px] rounded-xl bg-card border border-rim/20 text-dim text-sm italic">
        Sem votações nominais para exibir na linha do tempo.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={rows} margin={{ top: 15, right: 10, bottom: 5, left: -20 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey="data"
          tick={{ fill: "#3d4a5c", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={45}
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
          width={60}
          tickFormatter={(v: number) => NIVEL_LABEL[v] ?? ""}
        />
        <Tooltip content={<Tip />} cursor={{ stroke: "rgba(255,255,255,0.08)" }} />
        <Line
          type="stepAfter"
          dataKey="nivel"
          stroke={color}
          strokeWidth={0}
          dot={{ r: 3, fill: color, stroke: color }}
          activeDot={{ r: 4.5, fill: color, stroke: "#fff", strokeWidth: 1.5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
