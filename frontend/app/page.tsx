// Home (vitrine) do portal de consulta ContraDito.
// Hero com a silhueta do Congresso Nacional + storytelling + números reais + busca/
// seletor de Casa + pré-visualização do diretório (inspiração ranking.org.br) + equipe.

import { CongressoFoto } from "@/components/CongressoFoto";
import { HomeBusca } from "@/components/home/HomeBusca";
import { DiretorioPreview } from "@/components/home/DiretorioPreview";
import { SobreSection, EquipeSection } from "@/components/SobreEquipe";
import { SiteFooter } from "@/components/SiteFooter";
import { PROJECT_STATS } from "@/lib/equipe";
import { CASA, tint } from "@/lib/casa";
import { fetchDiretorioCompleto } from "@/lib/diretorio";
import type { Parlamentar } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let parlamentares: Parlamentar[] = [];
  try {
    parlamentares = await fetchDiretorioCompleto();
  } catch (error) {
    console.error("Erro ao carregar parlamentares para a homepage:", error);
  }

  return (
    <div className="pt-14">
      {/* HERO */}
      <header className="relative min-h-[86vh] flex items-center justify-center overflow-hidden px-5 text-center">
        {/* brilho ambiente (pulse/aurum) */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background: `radial-gradient(80% 60% at 50% -10%, ${tint(CASA.camara.hex, 18)}, transparent 60%), radial-gradient(55% 50% at 85% 15%, ${tint(CASA.senado.hex, 14)}, transparent 55%)`,
          }}
        />

        {/* Foto real do Congresso (Dia/Noite com transição suave de tema) */}
        <CongressoFoto />

        {/* conteúdo */}
        <div className="relative z-10 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-coherent drop-shadow-sm">
            Portal de consulta · Câmara e Senado
          </p>
          <h1 className="font-display text-bright font-black leading-[0.92] mt-5 text-6xl sm:text-8xl">
            O que dizem.<br />
            <span className="text-coherent italic font-normal">Como votam.</span>
          </h1>
          <div className="mt-20">
            <HomeBusca />
          </div>
          <p className="text-mid font-medium max-w-xl mx-auto mt-6 text-lg sm:text-xl leading-relaxed">
            Discursos, votações e proposições das duas casas legislativas, reunidos e abertos para você consultar.
          </p>
        </div>
      </header>

      {/* faixa de números reais do projeto */}
      <section className="relative z-10 border-y border-rim/30 bg-card/30">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 grid grid-cols-2 lg:grid-cols-4 divide-x divide-rim/20">
          {PROJECT_STATS.map((s) => (
            <div key={s.label} className="px-5 py-7 text-center">
              <p className="font-display text-4xl text-bright">{s.value}</p>
              <p className="text-sm text-mid mt-1 capitalize">{s.label}</p>
              <p className="text-[11px] text-dim mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 1. Sobre o ContraDito */}
      <SobreSection />

      {/* 2. Pré-visualização do Diretório (posicionado exatamente entre Sobre e Equipe, inspiração ranking.org.br) */}
      <DiretorioPreview parlamentares={parlamentares} />

      {/* 3. A equipe - Squad 09 */}
      <EquipeSection />

      <SiteFooter />
    </div>
  );
}
