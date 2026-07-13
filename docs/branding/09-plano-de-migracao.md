---
title: Plano de Migração de Marca (Rebranding)
version: 1.0.0
status: Draft
last_updated: 2026-07-13
owner: JINC Apps
project: Em Círculo
jinc-spec-version: "1.0.0"
project-name: Em Círculo
---

# Plano de Migração: De "Cuida Comigo" para "Em Círculo"

## 1. Visão Geral
Este documento detalha o plano de execução técnica e operacional para a substituição da marca em todo o ecossistema do projeto. A migração será feita em fases rigorosas para garantir a estabilidade do código atual, que já atingiu um nível de maturidade e funcionamento local (FastAPI + Next.js + PostgreSQL + MinIO).

## 2. Estratégia de Execução

A regra de ouro da migração técnica é: **Alterações de nomenclatura visual não devem quebrar contratos de infraestrutura ou banco de dados a menos que estritamente necessário.**

### Fase 1: Engenharia de Requisitos (Documentação)
*Objetivo: Atualizar o "Cérebro" do projeto para alinhar a visão dos agentes e desenvolvedores.*
- [ ] **PRD & SDD:** Substituir referências de "Cuida Comigo" para "Em Círculo". Atualizar a definição do sistema de "app de tarefas" para "plataforma de coordenação de redes de apoio".
- [ ] **OpenAPI / Swagger (Backend):** Atualizar o `title` e a `description` da documentação do FastAPI (`main.py`).
- [ ] **READMEs:** Atualizar os arquivos de apresentação na raiz do monorepo, frontend e backend.

### Fase 2: Camada de Apresentação (Frontend UI/UX)
*Objetivo: Adequar a interface com o usuário e os metadados.*
- [ ] **Metadados (SEO):** Atualizar o `title` e `description` global no `src/app/layout.tsx` e em páginas específicas (ex: "Em Círculo | A rede de apoio para quem cuida").
- [ ] **Componentes React:** Executar *Search & Replace* seguro nas strings de texto renderizadas em componentes (ex: Cabeçalhos, Painel de Controle, Onboarding).
- [ ] **Ativos Visuais:** Substituir o `favicon.ico`, logos (ex: `logo.svg`, `image_abc1e6.png` referências) na pasta `public/`.
- [ ] **Emails/Notificações:** Atualizar o micro-copy das Server Actions e Toasts (ex: convites para Care Groups).

### Fase 3: Camada de Infraestrutura e Backend
*Objetivo: Adequar o under-the-hood sem corromper dados existentes.*
- [ ] **Cookies e Auth:** Avaliar se o nome do cookie de sessão (`cc_access_token`) deve mudar para algo agnóstico ou ser mantido para retrocompatibilidade.
- [ ] **Nomenclatura de Buckets S3:** Avaliar a migração de `cuidacomigo-docs` para `emcirculo-docs` no script de orquestração do `docker-compose.yml`. *Nota: como o ambiente local acabou de ser estabilizado, esta é a hora ideal para recriar o bucket antes de entrar em produção.*
- [ ] **Arquivos .env:** Validar se há chaves nomeadas com a marca antiga e padronizar.

### Fase 4: Auditoria de Resíduos (QA)
*Objetivo: Garantir que não restaram fantasmas da marca antiga.*
- [ ] Rodar auditoria no terminal (Regex): Buscar por instâncias ignoradas de `Cuida Comigo`, `cuidacomigo`, `CuidaComigo` no código-fonte.
- [ ] Compilar frontend (`npx tsc --noEmit`) para garantir que renomeações de variáveis/componentes não quebraram tipagens.

## 3. Diretrizes para os Agentes de IA

1. **Isolamento de Escopo:** Ao solicitar a ajuda de um agente, delimite o contexto. Peça para atualizar *apenas* o PRD, ou *apenas* os metadados do Next.js.
2. **Tags de Versionamento:** Cada passo da migração deve ser commitado com a tag `refactor(branding): [descricao]`, garantindo pontos fáceis de *rollback*.
3. **Zero-Trust de Quebra:** Os agentes estão proibidos de alterar nomes de tabelas SQL, colunas ou rotas de API REST `/api/v1/...` sem aprovação explícita, pois isso exigiria migrações complexas de banco de dados (Alembic) e quebra de contratos entre front e back.
