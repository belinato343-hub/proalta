import { useState } from "react";
import { Send } from "lucide-react";

const faqItems = [
  { q: "A sonda saiu, o que fazer?", a: "Não tente recolocar. Feche a extremidade da sonda, mantenha a calma e procure atendimento médico imediatamente." },
  { q: "Posso dar medicamentos pela sonda?", a: "Apenas medicamentos prescritos e orientados pela equipe. Sempre lave a sonda com água antes e depois." },
  { q: "A dieta pode ser esquentada?", a: "A dieta deve estar em temperatura ambiente. Nunca aqueça no micro-ondas ou fogão." },
];

const Questions = () => {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (message.trim()) {
      setSent(true);
      setMessage("");
      setTimeout(() => setSent(false), 3000);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="mb-1 text-xl font-bold text-foreground animate-fade-in">Dúvidas</h1>
      <p className="mb-6 text-sm text-muted-foreground animate-fade-in">Perguntas frequentes e envio de dúvidas</p>

      {/* FAQ */}
      <div className="mb-8 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Perguntas Frequentes</h2>
        {faqItems.map((item, index) => (
          <div
            key={index}
            className="animate-slide-up rounded-xl bg-card border border-border p-4 shadow-sm"
            style={{ animationDelay: `${index * 0.08}s` }}
          >
            <p className="text-sm font-semibold text-foreground">{item.q}</p>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>

      {/* Send Question */}
      <div className="rounded-xl bg-card border border-border p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Envie sua dúvida</h2>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escreva sua pergunta aqui..."
          className="w-full resize-none rounded-lg border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          rows={4}
        />
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 active:scale-[0.98]"
        >
          <Send className="h-4 w-4" />
          Enviar Dúvida
        </button>
        {sent && (
          <p className="mt-3 animate-fade-in text-center text-sm font-medium text-primary">
            ✅ Dúvida enviada! A equipe responderá em breve.
          </p>
        )}
      </div>
    </div>
  );
};

export default Questions;
