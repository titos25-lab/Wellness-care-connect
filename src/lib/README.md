# Integrações

O cliente Supabase está preparado em `supabase.ts`, mas só é inicializado quando as duas variáveis públicas do projeto estão configuradas no ambiente.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (ou chave publishable, conforme o projeto)

Nunca adicionar `service_role`, passwords ou segredos neste diretório nem em variáveis `VITE_*`. As variáveis com prefixo `VITE_` são incluídas no bundle do navegador.

Antes de receber dados reais de pacientes, implementar e testar autenticação, políticas RLS, consentimento, minimização de dados, retenção e procedimentos de resposta a incidentes.
