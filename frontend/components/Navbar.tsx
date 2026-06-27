import Link from "next/link";
import { List, GitCompareArrows, FileText } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Navbar() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 h-14 border-b border-rim/20 bg-canvas/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
        <Link href="/" className="font-display font-black tracking-tight text-lg">
          <span className="text-bright">CONTRA</span>
          <span className="text-coherent italic font-normal">dito</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/diretorio"
            className="px-3 py-1.5 inline-flex items-center gap-1.5 text-sm text-mid hover:text-bright transition-colors"
          >
            <List size={15} /> Diretório
          </Link>
          <Link
            href="/proposicoes"
            className="px-3 py-1.5 inline-flex items-center gap-1.5 text-sm text-mid hover:text-bright transition-colors"
          >
            <FileText size={15} /> Proposições
          </Link>
          <Link
            href="/comparacao"
            className="px-3 py-1.5 inline-flex items-center gap-1.5 text-sm text-mid hover:text-bright border border-white/10 rounded-full transition-colors hover:border-white/20"
          >
            <GitCompareArrows size={15} /> Comparação
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
