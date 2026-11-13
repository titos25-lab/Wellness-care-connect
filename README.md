# Wellness Care Connect

Plataforma digital da **Wellness Care**, empresa moçambicana focada na intermediação, encaminhamento e gestão administrativa de pedidos de atendimento junto de profissionais de saúde independentes.

**Contacto institucional:** Wellnesscaremoz@gmail.com  
**Telefone:** +258 83 468 7186  
**Mercado inicial:** Moçambique  
**Idioma:** Português | **Moeda:** MZN

> A Wellness Care Connect não é uma clínica nem presta diretamente atos médicos. A plataforma organiza pedidos e encaminhamentos; a prestação técnica ou clínica é da responsabilidade dos profissionais independentes devidamente habilitados.

## Estado do projeto

Primeira estrutura criada:
- Landing page responsiva.
- Pesquisa e filtro demonstrativo de especialidades/profissionais.
- Formulário demonstrativo de pedido de encaminhamento.
- Estrutura inicial de schema Supabase em `supabase/schema.sql`.

**Importante:** nesta versão, os dados apresentados são demonstrativos. O formulário não envia nem guarda pedidos. Autenticação, portais reais, notificações, pagamentos e painel administrativo ainda precisam de integração backend e testes de segurança.

## Tecnologias

- React + TypeScript
- Vite
- Supabase JS (cliente preparado; ligação depende das credenciais)
- GitHub Actions para validação automática de build
- CSS responsivo

## Executar localmente

```bash
npm install
npm run dev
```

Para validar a compilação:

```bash
npm run build
```

## Configuração futura do Supabase

O ficheiro `.env.example` mostra as variáveis necessárias. Copie-o para `.env.local` e preencha os valores do seu projeto Supabase. Não publique chaves secretas nem a chave `service_role` no frontend.


1. Criar um projeto Supabase.
2. Rever os requisitos legais, de privacidade e de licenciamento aplicáveis em Moçambique.
3. Rever e aplicar o schema SQL após testes em ambiente de desenvolvimento.
4. Configurar variáveis locais `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
5. Nunca colocar chaves secretas/service-role no frontend.
6. Criar um processo administrativo seguro para atribuição de permissões de administrador.

## Próximas etapas

1. Autenticação e perfis com papéis patient, professional e admin.
2. Registo profissional, carregamento seguro e validação de documentos.
3. Fluxo real de pedidos, atribuição e confirmação.
4. Painéis separados para paciente, profissional e administração.
5. Notificações e trilho de auditoria.
6. Integração de pagamentos após validação dos fluxos comerciais e legais.
7. Testes de RLS, segurança, acessibilidade e dispositivos móveis.

## Estrutura

```
src/
  App.tsx
  main.tsx
  index.css
supabase/
  schema.sql
index.html
package.json
```
