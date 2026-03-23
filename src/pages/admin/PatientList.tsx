import { useEffect, useState } from "react";
import { Search, User, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

interface Patient {
  id: string;
  user_id: string;
  nome: string | null;
  tipo_sonda: string | null;
  hospital_origem: string | null;
  created_at: string;
}

const PatientList = () => {
  const { hospitalId } = useUserRole();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hospitalId) return;

    const fetchPatients = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, user_id, nome, tipo_sonda, hospital_origem, created_at")
        .eq("hospital_id", hospitalId)
        .order("created_at", { ascending: false });

      setPatients(data ?? []);
      setLoading(false);
    };

    fetchPatients();
  }, [hospitalId]);

  const filtered = patients.filter((p) =>
    (p.nome ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (p.tipo_sonda ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-foreground">Pacientes</h1>
      <p className="mb-6 text-muted-foreground">Pacientes vinculados ao seu hospital</p>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou tipo de sonda..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <User className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium text-foreground">Nenhum paciente encontrado</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {search ? "Tente outra busca" : "Ainda não há pacientes vinculados"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((patient) => (
            <div
              key={patient.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/20"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {patient.nome || "Paciente sem nome"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {patient.tipo_sonda || "Tipo de sonda não informado"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/admin/chat?patient=${patient.user_id}`)}
                className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                Chat
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientList;
