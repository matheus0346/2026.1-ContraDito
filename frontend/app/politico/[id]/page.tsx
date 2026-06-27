import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { obterPoliticoDetalhado } from "@/lib/politicos";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate } from "@/lib/utils";
import { CASA, tint, type Casa } from "@/lib/casa";
import { DossieClient } from "./DossieClient";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ casa?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const sp = await searchParams;
  const casa: Casa = sp.casa === "senado" ? "senado" : "camara";
  
  try {
    const detail = await obterPoliticoDetalhado(casa, Number(id));
    const p = detail.politico;
    return {
      title: `${p.nome_urna} — Dossiê do Parlamentar`,
      description: `Consulte o dossiê de ${p.nome_urna} (${p.partido}/${p.estado}): votos nominais, discursos, fidelidade partidária e afinidades ideológicas.`,
      openGraph: {
        title: `${p.nome_urna} — ContraDito`,
        description: `${p.partido} · ${p.cargo} · ${p.estado}`,
        images: p.url_foto ? [{ url: p.url_foto }] : [],
      },
    };
  } catch {
    return { title: "Parlamentar — ContraDito" };
  }
}

export default async function DossiePage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const casa: Casa = sp.casa === "senado" ? "senado" : "camara";

  let detail;
  try {
    detail = await obterPoliticoDetalhado(casa, Number(id));
  } catch (err) {
    console.error("Erro ao carregar político no dossiê:", err);
    notFound();
  }

  const p = detail.politico;
  const houseColor = CASA[casa].hex;

  return (
    <div className="pt-14 min-h-screen">
      {/* Barra superior de navegação / Breadcrumb */}
      <div className="border-b border-rim/15 bg-card/25 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <Link
            href="/diretorio"
            className="inline-flex items-center gap-2 text-sm text-mid hover:text-bright transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Voltar para o Diretório
          </Link>
        </div>
      </div>

      {/* Hero header */}
      <div
        className="relative"
        style={{ background: `linear-gradient(to bottom, ${tint(houseColor, 8)} 0%, transparent 100%)` }}
      >
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(to right, transparent, ${tint(houseColor, 25)}, transparent)` }}
        />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar name={p.nome_urna} url={p.url_foto} size={96} ringColor={`${houseColor}65`} />

            <div className="text-center sm:text-left">
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-bright leading-tight">
                {p.nome_urna}
              </h1>
              
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                {[p.cargo, p.partido, p.estado].map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-full border border-white/10 text-mid bg-card/30"
                  >
                    {tag}
                  </span>
                ))}
                <span
                  className="text-xs px-2.5 py-1 rounded-full text-mid font-medium border"
                  style={{
                    borderColor: tint(houseColor, 35),
                    backgroundColor: tint(houseColor, 10),
                    color: houseColor,
                  }}
                >
                  {p.status_mandato}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Abas e Componentes Clientes */}
      <DossieClient politico={p} resumoVotos={detail.resumo_votos} />
    </div>
  );
}
