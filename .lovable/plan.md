## Diagnóstico (verificado no banco)

**1. O admin de teste não está vinculado ao hospital**
- `hospitals` tem uma única linha: "Hospital ProAlta Teste" (`a1b2c3d4-…`) com `admin_user_id = ff20d5a1…` (usuário "Admin Hospital", antigo).
- O login que você usa (`admin@proalta.test`, `77782b2d…`) tem role `hospital_admin` e `profiles.hospital_id = a1b2c3d4-…`, mas **não** é o `admin_user_id` do hospital.
- `useUserRole` resolve o hospital por `hospitals.admin_user_id = auth.uid()` → retorna vazio (visível nos logs de rede: `hospitals?...admin_user_id=eq.77782b2d… → []`). Resultado: painéis do admin ficam sem hospital, e telas que dependem de `hospitalId` aparecem vazias.
- Observação: `AdminVideos` usa outra fonte (`profiles.hospital_id`), ou seja, há **duas formas divergentes** de descobrir o hospital do admin no código.

**2. Os pacientes de teste só têm a terapia "curativos"**
- João Silva e Pedro: terapias = `[curativos]`. Maria Santos: nenhuma.
- Os 8 vídeos que você cadastrou têm `module_slugs` = `nutricao-enteral` / `ostomia`.
- `usePatientTherapies` filtra por terapia → esses vídeos são escondidos para João e Pedro. Maria (sem terapia) cai no fallback e vê tudo.

**3. RLS dos vídeos está correta** — pacientes do hospital `a1b2…` conseguem ler os vídeos do hospital e os globais.

## Correções propostas

1. **Migração de dados**: apontar `hospitals.admin_user_id` para o usuário `admin@proalta.test` (`77782b2d…`), mantendo o hospital existente e todos os dados vinculados.
2. **Unificar a resolução do hospital do admin**: em `useUserRole`, quando a busca por `hospitals.admin_user_id` não retornar nada, usar `profiles.hospital_id` como fallback. Assim admin e telas (Dashboard, Analytics, Convites, Vídeos, Terapias) passam a usar sempre o mesmo hospital.
3. **Atribuir terapias aos pacientes de teste**: adicionar `nutricao-enteral` (e `ostomia`) para João Silva, Pedro e Maria Santos, para que os vídeos cadastrados apareçam no app do paciente.
4. **Melhorar a UX de vídeo vazio**: em `VideoLibrary`, quando o paciente tem terapias mas nenhum vídeo corresponde, mostrar mensagem explicando que o conteúdo é filtrado pelas terapias atribuídas (em vez de "Nenhum vídeo disponível").
5. **Aviso no /admin/videos**: se o admin não tiver hospital resolvido, exibir alerta claro de que o cadastro ficará bloqueado (hoje falha silenciosamente pela RLS de insert).

## Detalhes técnicos

- Migração: `UPDATE public.hospitals SET admin_user_id = '77782b2d-…' WHERE id = 'a1b2c3d4-…';` + inserts em `patient_therapies` (módulos `nutricao-enteral`, `ostomia`) para os 3 pacientes, com `ON CONFLICT DO NOTHING`.
- `src/hooks/useUserRole.tsx`: fallback para `profiles.hospital_id` quando `hospitals` não retorna linha.
- `src/pages/VideoLibrary.tsx` e `src/pages/admin/AdminVideos.tsx`: apenas mensagens/estados de UI.
- Verificação final: consultar o banco para confirmar o vínculo e as terapias, e conferir a lista de vídeos visíveis para um paciente.
