"use client";

// Seleção da comparação 1×1: Casa + parlamentar A + parlamentar B, busca 100% em
// memória sobre o array completo (~887) que vem do Server Component (mesmos dados do
// /diretorio). Lê ?casa=&id1=&id2= como estado inicial e sincroniza a URL nas ações do
// usuário (contrato compartilhável — porta aberta para deep-link a partir do /diretorio).
// Restrição: os dois são SEMPRE da mesma Casa (a API só aceita um `casa`). Sem score.

import { Suspense, useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { CASA, tint, type Casa } from "@/lib/casa";
import type { Parlamentar } from "@/lib/types";

export type Selecao = { casa: Casa; pol1: Parlamentar | null; pol2: Parlamentar | null };

const CASAS: Casa[] = ["camara", "senado"];

// ─── Picker de um lado: busca dentro do escopo da Casa, exclui o id do outro lado ──────
function Picker({
  pool, selected, onSelect, excludeId, accent, label,
}: {
  pool: Parlamentar[];
  selected: Parlamentar | null;
  onSelect: (p: Parlamentar | null) => void;
  excludeId?: number;
  accent: string;
  label: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return pool
      .filter((p) => p.id !== excludeId)
      .filter((p) => p.nome_urna.toLowerCase().includes(q) || p.nome_civil.toLowerCase().includes(q))
      .sort((a, b) => a.nome_urna.localeCompare(b.nome_urna, "pt-BR"))
      .slice(0, 8);
  }, [pool, query, excludeId]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  if (selected) {
    return (
      <div className="glass rounded-xl p-6 flex flex-col items-center gap-4 text-center" style={{ borderColor: tint(accent, 28) }}>
        <p className="text-[10px] uppercase tracking-widest" style={{ color: accent }}>{label}</p>
        <Avatar name={selected.nome_urna} url={selected.url_foto} size={72} ringColor={tint(accent, 55)} />
        <div>
          <p className="font-display text-xl font-bold text-bright">{selected.nome_urna}</p>
          <p className="text-xs text-dim mt-1">{selected.partido} · {selected.cargo} · {selected.estado}</p>
        </div>
        <button
          onClick={() => onSelect(null)}
          className="text-xs text-dim hover:text-bright flex items-center gap-1 transition-colors"
        >
          <X size={11} /> Remover
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <div className="glass rounded-xl p-6 flex flex-col items-center gap-4">
        <p className="text-[10px] uppercase tracking-widest" style={{ color: accent }}>{label}</p>
        <div className="w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center" style={{ borderColor: tint(accent, 35) }}>
          <Search size={18} style={{ color: accent }} />
        </div>
        <input
          type="text"
          placeholder="Buscar por nome..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="w-full h-9 px-3 bg-card-alt rounded-lg border border-rim/30 text-sm text-bright placeholder:text-dim focus:outline-none focus:border-rim/60 transition-colors"
        />
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 glass-elevated rounded-xl overflow-hidden z-20 shadow-2xl">
          {results.map((p) => (
            <button
              key={p.id}
              onClick={() => { onSelect(p); setQuery(""); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-card-alt transition-colors text-left"
            >
              <Avatar name={p.nome_urna} url={p.url_foto} size={32} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-bright truncate">{p.nome_urna}</p>
                <p className="text-xs text-dim">{p.partido} · {p.estado}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SeletorInner({
  parlamentares, onChange,
}: {
  parlamentares: Parlamentar[];
  onChange: (sel: Selecao) => void;
}) {
  const router = useRouter();
  const params = useSearchParams();

  // índice (casa-id) → Parlamentar, para resolver os ids da URL no estado inicial.
  const byKey = useMemo(() => {
    const m = new Map<string, Parlamentar>();
    for (const p of parlamentares) m.set(`${p.casa}-${p.id}`, p);
    return m;
  }, [parlamentares]);

  const casaInicial: Casa = params.get("casa") === "senado" ? "senado" : "camara";
  const resolve = (idParam: string | null, c: Casa): Parlamentar | null => {
    const id = Number(idParam);
    return idParam && Number.isFinite(id) ? byKey.get(`${c}-${id}`) ?? null : null;
  };

  const [casa, setCasa] = useState<Casa>(casaInicial);
  const [pol1, setPol1] = useState<Parlamentar | null>(() => resolve(params.get("id1"), casaInicial));
  const [pol2, setPol2] = useState<Parlamentar | null>(() => resolve(params.get("id2"), casaInicial));

  // Eleva a seleção ao pai a cada mudança (e no mount, cobrindo a pré-população por URL).
  useEffect(() => { onChange({ casa, pol1, pol2 }); }, [casa, pol1, pol2, onChange]);

  // Sincroniza a URL só nas AÇÕES do usuário (não no mount — lá a gente só lê).
  const syncUrl = useCallback((c: Casa, p1: Parlamentar | null, p2: Parlamentar | null) => {
    const sp = new URLSearchParams();
    sp.set("casa", c);
    if (p1) sp.set("id1", String(p1.id));
    if (p2) sp.set("id2", String(p2.id));
    router.replace(`/comparacao?${sp.toString()}`, { scroll: false });
  }, [router]);

  const pool = useMemo(() => parlamentares.filter((p) => p.casa === casa), [parlamentares, casa]);

  // Trocar de Casa invalida ambas as seleções (eram da casa anterior).
  function changeCasa(c: Casa) {
    if (c === casa) return;
    setCasa(c); setPol1(null); setPol2(null);
    syncUrl(c, null, null);
  }
  function selectPol1(p: Parlamentar | null) { setPol1(p); syncUrl(casa, p, pol2); }
  function selectPol2(p: Parlamentar | null) { setPol2(p); syncUrl(casa, pol1, p); }

  const accent = CASA[casa].hex;

  return (
    <div className="space-y-5">
      {/* seletor de Casa (segmented) — define o escopo de busca dos dois lados */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 rounded-xl bg-card-alt/80 border border-rim/40">
          {CASAS.map((c) => {
            const active = casa === c;
            const hex = CASA[c].hex;
            return (
              <button
                key={c}
                onClick={() => changeCasa(c)}
                className={`px-5 h-9 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${active ? "text-bright" : "text-mid hover:text-bright"}`}
                style={active ? { background: tint(hex, 18), boxShadow: `inset 0 0 0 1px ${tint(hex, 50)}` } : undefined}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: active ? hex : tint(hex, 50) }} />
                {CASA[c].label}
              </button>
            );
          })}
        </div>
      </div>

      {/* dois pickers, ambos no escopo da Casa atual; cada um exclui o id do outro */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Picker pool={pool} selected={pol1} onSelect={selectPol1} excludeId={pol2?.id} accent={accent} label="Parlamentar A" />
        <Picker pool={pool} selected={pol2} onSelect={selectPol2} excludeId={pol1?.id} accent={accent} label="Parlamentar B" />
      </div>
    </div>
  );
}

export function SeletorComparacao(props: { parlamentares: Parlamentar[]; onChange: (sel: Selecao) => void }) {
  return (
    <Suspense fallback={<div className="h-48" />}>
      <SeletorInner {...props} />
    </Suspense>
  );
}
