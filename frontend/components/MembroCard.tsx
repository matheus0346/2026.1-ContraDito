"use client";

// Card de membro da equipe com carrossel de 3 faces:
//   Perfil (avatar/foto, nome, papel) · Especialidades (tags) · Contato (GitHub +
//   LinkedIn/e-mail opcionais — preparados, renderizados só quando preenchidos).

import { useState } from "react";
import { Github, Linkedin, Mail, ChevronLeft, ChevronRight } from "lucide-react";
import type { Membro } from "@/lib/equipe";

const FACES = ["Perfil", "Especialidades", "Contato"] as const;

export function MembroCard({ m }: { m: Membro }) {
  const [face, setFace] = useState(0);
  const avatar = `https://avatars.githubusercontent.com/${m.handle}`;

  return (
    <div className="rounded-2xl border border-rim/40 bg-card/60 overflow-hidden flex flex-col">
      <div className="relative h-44 overflow-hidden group/card">
        <div className="flex h-full transition-transform duration-300 ease-out" style={{ transform: `translateX(-${face * 100}%)` }}>
          {/* Face 1 — Perfil */}
          <div className="w-full h-full shrink-0 grid place-items-center text-center px-4">
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatar} alt={m.nome} className="w-16 h-16 rounded-full mx-auto object-cover border border-rim/50" />
              <p className="font-display text-bright text-lg mt-2 leading-tight">{m.nome}</p>
              <p className="text-xs text-mid mt-0.5">{m.papel}</p>
            </div>
          </div>
          {/* Face 2 — Especialidades */}
          <div className="w-full h-full shrink-0 grid place-content-center px-4">
            <div className="flex flex-wrap gap-1.5 justify-center">
              {m.tags.map((t) => (
                <span key={t} className="text-[11px] px-2.5 py-1 rounded-full border border-coherent/30 text-mid bg-coherent/5">{t}</span>
              ))}
            </div>
          </div>
          {/* Face 3 — Contato */}
          <div className="w-full h-full shrink-0 grid place-content-center px-4">
            <div className="flex items-center justify-center gap-2">
              <a href={`https://github.com/${m.handle}`} target="_blank" rel="noreferrer" title="GitHub"
                 className="h-10 w-10 grid place-items-center rounded-full border border-rim/50 text-mid hover:text-bright hover:border-coherent/60 transition-colors">
                <Github size={17} />
              </a>
              {m.linkedin && (
                <a href={m.linkedin} target="_blank" rel="noreferrer" title="LinkedIn"
                   className="h-10 w-10 grid place-items-center rounded-full border border-rim/50 text-mid hover:text-bright hover:border-coherent/60 transition-colors">
                  <Linkedin size={17} />
                </a>
              )}
              {m.email && (
                <a href={`mailto:${m.email}`} title="E-mail"
                   className="h-10 w-10 grid place-items-center rounded-full border border-rim/50 text-mid hover:text-bright hover:border-coherent/60 transition-colors">
                  <Mail size={17} />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Seta Esquerda */}
        {face > 0 && (
          <button
            onClick={() => setFace(face - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-card/85 border border-rim/30 text-mid hover:text-bright hover:bg-card-alt flex items-center justify-center transition-all cursor-pointer z-10"
            title="Anterior"
          >
            <ChevronLeft size={16} />
          </button>
        )}

        {/* Seta Direita */}
        {face < FACES.length - 1 && (
          <button
            onClick={() => setFace(face + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-card/85 border border-rim/30 text-mid hover:text-bright hover:bg-card-alt flex items-center justify-center transition-all cursor-pointer z-10"
            title="Próximo"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* controles do carrossel */}
      <div className="flex items-center justify-center px-3 py-2 border-t border-rim/30 bg-card-alt/50">
        <span className="text-[10px] uppercase tracking-widest text-dim font-bold">{FACES[face]}</span>
      </div>
    </div>
  );
}
