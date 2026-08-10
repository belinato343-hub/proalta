# Corrigir login homecare@proalta.test e liberar acesso de teste como paciente

## Diagnóstico (confirmado)

O login de `homecare@proalta.test` está falhando com erro 500 (`Database error querying schema`). A causa está confirmada nos dados: esse usuário tem campos de token de autenticação gravados como NULL (`confirmation_token`, `recovery_token`, `email_change`, `email_change_token_new`), enquanto todos os outros usuários têm string vazia. O serviço de autenticação não consegue ler NULL nesses campos e devolve erro 500. Os demais logins (ex.: `admin@proalta.test`) funcionam normalmente.

Segundo ponto: `homecare@proalta.test` está cadastrado com o papel **homecare_admin**, ou seja, ele entra no painel `/homecare` e nunca na experiência de paciente. Ele também não está vinculado a nenhuma empresa via perfil de paciente. Portanto, mesmo depois de corrigido o login, esse e-mail não serve para testar a visão do paciente.

## O que será feito

1. **Corrigir o login quebrado**: normalizar os campos de token NULL do usuário `homecare@proalta.test` (e de qualquer outro usuário na mesma situação) para string vazia. Depois disso o login com `homecare@proalta.test` / `homecare123` volta a funcionar e cai no painel Home Care.

2. **Criar uma conta de teste de paciente dedicada**: um novo usuário `paciente@proalta.test` / `paciente123`, com:
   - papel `patient`;
   - perfil vinculado ao Hospital ProAlta Teste;
   - vínculo com a empresa "Cuidar Home Care" (para aparecer no painel Home Care);
   - terapias `nutricao-enteral` e `ostomia` atribuídas, para que a biblioteca de vídeos e as orientações apareçam filtradas corretamente.

3. **Validar** os dois logins e confirmar que o paciente enxerga vídeos, orientações e checklist.

## Detalhes técnicos

- Migração no banco: `UPDATE auth.users SET confirmation_token = '', recovery_token = '', email_change = '', email_change_token_new = '' WHERE ... IS NULL`.
- Criação do paciente de teste via função existente de seed (mesmo padrão usado para `admin@proalta.test`), seguida de inserts em `user_roles`, `profiles.hospital_id`, `patient_homecare` e `patient_therapies`.
- Nenhuma alteração de código de frontend é necessária.
