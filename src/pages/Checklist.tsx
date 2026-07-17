/**
 * Checklist — Checklist diário de cuidados com a sonda.
 * Permite ao paciente marcar/desmarcar cada item de cuidado realizado.
 * Exibe barra de progresso e mensagem de parabéns ao completar 100%.
 * Nota: O estado é local (não persiste no banco de dados).
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";

import { usePatientTherapies } from "@/hooks/usePatientTherapies";

/** Itens do checklist de cuidados diários. `modules` = slugs de therapy_modules.
 *  Itens sem `modules` são gerais (aparecem para todos os pacientes). */
const checklistItems = [
  { id: 1, text: "Lavei as mãos antes de manipular a sonda/estoma" },
  { id: 2, text: "Verifiquei a posição/marcação da sonda", modules: ["nutricao-enteral"] },
  { id: 3, text: "Preparei a dieta conforme orientação", modules: ["nutricao-enteral"] },
  { id: 4, text: "Mantive o paciente sentado ou com cabeceira elevada", modules: ["nutricao-enteral"] },
  { id: 5, text: "Administrei a dieta lentamente", modules: ["nutricao-enteral"] },
  { id: 6, text: "Lavei a sonda com água filtrada após o uso", modules: ["nutricao-enteral"] },
  { id: 7, text: "Limpei a pele ao redor da sonda/estoma", modules: ["nutricao-enteral", "ostomia"] },
  { id: 8, text: "Verifiquei se há sinais de vermelhidão ou vazamento" },
  { id: 9, text: "Guardei os materiais em local limpo e seco" },
  { id: 10, text: "Troquei a bolsa de ostomia conforme orientado", modules: ["ostomia"] },
  { id: 11, text: "Verifiquei a pele ao redor do estoma da ostomia", modules: ["ostomia"] },
  { id: 12, text: "Realizei a aspiração de traqueostomia com técnica limpa", modules: ["traqueostomia"] },
  { id: 13, text: "Umidifiquei a cânula de traqueostomia", modules: ["traqueostomia"] },
  { id: 14, text: "Higienizei o local de inserção do cateter de diálise", modules: ["dialise"] },
  { id: 15, text: "Troquei o curativo conforme orientação", modules: ["curativos"] },
];

const Checklist = () => {
  const navigate = useNavigate();
  const [checked, setChecked] = useState<Set<number>>(new Set());

  /** Alterna o estado de um item (marcado/desmarcado) */
  const toggle = (id: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /** Calcula a porcentagem de progresso */
  const progress = Math.round((checked.size / checklistItems.length) * 100);

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      {/* Botão de voltar para a home */}
      <button
        onClick={() => navigate("/")}
        className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </button>

      <h1 className="mb-1 text-xl font-bold text-foreground animate-fade-in">Checklist Diário</h1>
      <p className="mb-4 text-sm text-muted-foreground animate-fade-in">Marque cada cuidado realizado hoje</p>

      {/* Barra de progresso */}
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">{checked.size} de {checklistItems.length}</span>
          <span className="text-sm font-semibold text-primary">{progress}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Lista de itens do checklist */}
      <div className="flex flex-col gap-2">
        {checklistItems.map((item, index) => {
          const isChecked = checked.has(item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggle(item.id)}
              className={`animate-slide-up flex items-center gap-4 rounded-xl border p-4 text-left transition-all active:scale-[0.98] ${
                isChecked
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-card hover:border-primary/20"
              }`}
              style={{ animationDelay: `${index * 0.04}s` }}
            >
              {/* Indicador visual de check */}
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  isChecked
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/30"
                }`}
              >
                {isChecked && <Check className="h-4 w-4 text-primary-foreground" />}
              </div>
              <span
                className={`text-sm font-medium transition-colors ${
                  isChecked ? "text-muted-foreground line-through" : "text-foreground"
                }`}
              >
                {item.text}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mensagem de conclusão quando todos os itens são marcados */}
      {progress === 100 && (
        <div className="mt-6 animate-fade-in rounded-xl bg-primary/10 p-4 text-center">
          <p className="text-sm font-semibold text-primary">✅ Parabéns! Todos os cuidados foram realizados hoje.</p>
        </div>
      )}
    </div>
  );
};

export default Checklist;
