/**
 * GuideDetail — Tela de orientações passo a passo para cada tipo de sonda.
 * Exibe os passos em formato de carrossel (um por vez) com barra de progresso.
 * O conteúdo é estático e baseado em boas práticas médicas.
 */

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";

/** Dados dos passos de orientação para cada tipo de sonda */
const guideSteps: Record<string, { title: string; steps: { title: string; instruction: string }[] }> = {
  nasogastrica: {
    title: "Sonda Nasogástrica",
    steps: [
      { title: "Higiene das Mãos", instruction: "Lave bem as mãos com água e sabão antes de manipular a sonda. Seque com papel toalha limpo." },
      { title: "Verificar Posição", instruction: "Verifique se a marcação da sonda está no mesmo local. Se houver mudança, não administre a dieta e procure orientação." },
      { title: "Preparo da Dieta", instruction: "Prepare a dieta conforme orientação da nutricionista. Verifique a temperatura — deve estar em temperatura ambiente." },
      { title: "Administração", instruction: "Conecte a seringa ou equipo à sonda. Administre lentamente, conforme orientado. Mantenha o paciente sentado ou com cabeceira elevada." },
      { title: "Limpeza da Sonda", instruction: "Após a dieta, injete 20 a 40 ml de água filtrada pela sonda para limpeza. Feche a sonda após a lavagem." },
      { title: "Cuidados com a Pele", instruction: "Limpe a região ao redor do nariz com gaze umedecida. Troque a fixação da sonda se estiver solta ou suja." },
    ],
  },
  nasoenteral: {
    title: "Sonda Nasoenteral",
    steps: [
      { title: "Higiene das Mãos", instruction: "Lave as mãos com água e sabão antes de qualquer manipulação." },
      { title: "Verificar Fixação", instruction: "Confira se a sonda está bem fixada e se a marcação está no mesmo local." },
      { title: "Preparo da Dieta", instruction: "Siga rigorosamente a prescrição do nutricionista para tipo e volume da dieta." },
      { title: "Infusão", instruction: "Administre a dieta com o paciente sentado ou com cabeceira elevada a pelo menos 30°." },
      { title: "Lavagem", instruction: "Lave a sonda com 20-40 ml de água filtrada antes e após cada dieta e medicação." },
    ],
  },
  gastrostomia: {
    title: "Gastrostomia",
    steps: [
      { title: "Higiene", instruction: "Lave as mãos. Limpe ao redor do estoma com gaze e soro fisiológico ou água e sabão neutro." },
      { title: "Verificar o Estoma", instruction: "Observe se há vermelhidão, inchaço, secreção ou dor ao redor do estoma. Informe a equipe se houver alterações." },
      { title: "Administrar Dieta", instruction: "Conecte o equipo, administre lentamente. Mantenha o paciente sentado durante e 30 minutos após." },
      { title: "Lavagem", instruction: "Lave com 20-40 ml de água filtrada após cada uso." },
      { title: "Curativo", instruction: "Mantenha o curativo limpo e seco. Troque diariamente ou quando sujo." },
    ],
  },
  jejunostomia: {
    title: "Jejunostomia",
    steps: [
      { title: "Higiene", instruction: "Higienize as mãos antes de manipular a sonda ou o estoma." },
      { title: "Cuidados com o Estoma", instruction: "Limpe a pele ao redor com gaze e soro. Observe sinais de irritação." },
      { title: "Dieta Lenta", instruction: "A dieta deve ser administrada lentamente, em gotejamento contínuo ou conforme orientação." },
      { title: "Lavagem", instruction: "Lave a sonda com água filtrada antes e após cada uso." },
      { title: "Atenção", instruction: "Nunca administre medicamentos sem orientação. Procure a equipe em caso de dor ou vazamento." },
    ],
  },
};

const GuideDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  // Busca os dados do guia com base no ID da URL
  const guide = guideSteps[id || ""];

  // Exibe mensagem caso a orientação não exista
  if (!guide) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-6">
        <p className="text-muted-foreground">Orientação não encontrada.</p>
      </div>
    );
  }

  const step = guide.steps[currentStep];
  const isLast = currentStep === guide.steps.length - 1;
  const isFirst = currentStep === 0;

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      {/* Botão de voltar para a lista de orientações */}
      <button
        onClick={() => navigate("/orientacoes")}
        className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </button>

      <h1 className="mb-2 text-xl font-bold text-foreground">{guide.title}</h1>

      {/* Barra de progresso segmentada (uma bolinha por passo) */}
      <div className="mb-6 flex gap-1.5">
        {guide.steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= currentStep ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Card do passo atual */}
      <div className="animate-fade-in rounded-xl bg-card border border-border p-6 shadow-sm" key={currentStep}>
        <div className="mb-4 flex items-center gap-2">
          {/* Número do passo */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {currentStep + 1}
          </div>
          <h2 className="text-lg font-semibold text-foreground">{step.title}</h2>
        </div>
        <p className="text-base leading-relaxed text-muted-foreground">{step.instruction}</p>
      </div>

      {/* Botões de navegação (Anterior / Próximo / Concluir) */}
      <div className="mt-6 flex gap-3">
        {!isFirst && (
          <button
            onClick={() => setCurrentStep((s) => s - 1)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card py-4 text-sm font-medium text-foreground transition-colors hover:bg-muted active:scale-[0.98]"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </button>
        )}
        <button
          onClick={() => {
            if (isLast) {
              navigate("/orientacoes"); // Volta para a lista ao concluir
            } else {
              setCurrentStep((s) => s + 1);
            }
          }}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98]"
        >
          {isLast ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Concluir
            </>
          ) : (
            <>
              Próximo
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default GuideDetail;
