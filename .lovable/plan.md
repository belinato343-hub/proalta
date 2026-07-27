## Objetivo

Fazer com que `belinatocursos@gmail.com` (papel hospital_admin, hoje sem hospital) enxergue os dados e vídeos do **Hospital ProAlta Teste**.

## Ponto importante

A tabela `hospitals` tem apenas **um** campo `admin_user_id`, e ele já aponta para `admin@proalta.test`. Sobrescrever esse campo faria o admin de teste perder o vínculo. Por isso o vínculo será feito pelo **perfil** do usuário, que já é o caminho de fallback usado pelo app.

## O que será feito

1. **Atualizar o perfil do usuário** (alteração de dados, não de estrutura):
   - Definir `hospital_id = a1b2c3d4-e5f6-7890-abcd-ef1234567890` (Hospital ProAlta Teste) no perfil de `belinatocursos@gmail.com`.
   - `hospitals.admin_user_id` permanece com `admin@proalta.test`.

2. **Verificar o efeito** com consultas de leitura:
   - Confirmar que o perfil ficou com o hospital correto.
   - Confirmar que os vídeos visíveis para esse hospital (globais + do hospital) aparecem na contagem esperada.

## Detalhes técnicos

O hook `useUserRole` já resolve o hospital de um `hospital_admin` em duas etapas: primeiro procura em `hospitals.admin_user_id` e, se não achar, cai para `profiles.hospital_id`. Como esse fallback já está implementado, nenhuma alteração de código é necessária — apenas o ajuste de dados. As telas `/admin`, `/admin/videos`, `/admin/pacientes` e demais passam a receber o `hospitalId` correto automaticamente.

Se você preferir que `belinatocursos@gmail.com` seja o **dono oficial** do hospital (substituindo `admin@proalta.test` em `hospitals.admin_user_id`), me avise — é uma variação de uma linha, mas o admin de teste perderia o vínculo direto.
