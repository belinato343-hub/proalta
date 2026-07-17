/**
 * Guides — Tela de seleção de orientações por tipo de sonda.
 * Exibe uma lista de categorias (Nasogástrica, Nasoenteral, Gastrostomia, Jejunostomia).
 * Ao clicar, navega para a página de detalhes com o passo a passo.
 */

import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { usePatientTherapies } from "@/hooks/usePatientTherapies";

/** Categorias de orientações disponíveis. `modules` = slugs de therapy_modules. */
const guideCategories = [
  {
    title: "Sonda Nasogástrica",
    description: "Cuidados e orientações para sonda nasogástrica",
    emoji: "🔵",
    id: "nasogastrica",
    modules: ["nutricao-enteral"],
  },
  {
    title: "Sonda Nasoenteral",
    description: "Orientações para sonda nasoenteral",
    emoji: "🟢",
    id: "nasoenteral",
    modules: ["nutricao-enteral"],
  },
  {
    title: "Gastrostomia",
    description: "Cuidados com gastrostomia (GTT)",
    emoji: "🟡",
    id: "gastrostomia",
    modules: ["nutricao-enteral"],
  },
  {
    title: "Jejunostomia",
    description: "Orientações para jejunostomia",
    emoji: "🟠",
    id: "jejunostomia",
    modules: ["nutricao-enteral"],
  },
  {
    title: "Cuidados com Ostomia",
    description: "Higiene, troca de bolsa e prevenção de irritação",
    emoji: "🫁",
    id: "ostomia",
    modules: ["ostomia"],
  },
  {
    title: "Traqueostomia",
    description: "Aspiração, umidificação e troca de cânula",
    emoji: "🌬️",
    id: "traqueostomia",
    modules: ["traqueostomia"],
  },
  {
    title: "Diálise Peritoneal / Cateter",
    description: "Cuidados com o cateter e sinais de infecção",
    emoji: "💧",
    id: "dialise",
    modules: ["dialise"],
  },
  {
    title: "Curativos",
    description: "Troca de curativos e cuidados com feridas",
    emoji: "🩹",
    id: "curativos",
    modules: ["curativos"],
  },
];

const Guides = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="mb-1 text-xl font-bold text-foreground animate-fade-in">Orientações</h1>
      <p className="mb-6 text-sm text-muted-foreground animate-fade-in">
        Selecione o tipo de sonda para ver as orientações
      </p>

      {/* Lista de categorias de sonda */}
      <div className="flex flex-col gap-3">
        {guideCategories.map((cat, index) => (
          <button
            key={cat.id}
            onClick={() => navigate(`/orientacoes/${cat.id}`)}
            className="animate-slide-up flex items-center gap-4 rounded-xl bg-card p-5 border border-border shadow-sm text-left transition-all hover:shadow-md hover:border-primary/30 active:scale-[0.98]"
            style={{ animationDelay: `${index * 0.08}s` }}
          >
            <span className="text-3xl">{cat.emoji}</span>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-foreground">{cat.title}</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">{cat.description}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default Guides;
