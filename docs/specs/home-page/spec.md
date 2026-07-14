---
name: spec_home_page
feature: Home Page Pública (Landing)
status: approved
version: 1.1.0
last-updated: 2026-07-14
sdd-ref: docs/SDD.md#5-topologia-do-frontend--home-page-modular
prd-ref: docs/PRD.md#21-estratégia-de-aquisição-plg--product-led-growth
---

# Spec: Home Page — Contrato de UI

## 1. Contexto e Objetivo

A Home Page é a entrada pública da plataforma Em Círculo. Ela não é um painel; é uma página de **conversão** que vende a transformação: do caos logístico para a tranquilidade centralizada.

**Rota:** `/` (público, sem autenticação)  
**Tipo:** Server Component (estático, sem chamadas de API)  
**Fluxo de autenticado:** Se `cc_access_token` presente → `redirect('/dashboard')` *(gerenciado no middleware ou no topo da page.tsx)*

---

## 2. Hierarquia React

```
page.tsx
├── <HomeHeader />               ← Client Component (useState para menu mobile)
└── [layout <main>]
    ├── <HeroSection />
    ├── <ProblemSection />
    ├── <SolutionSection />      ← 6 cards (adicionados: Avisos + Arquivos)
    ├── <HowItWorksSection />
    ├── <AccessibilitySection />
    └── <FinalCtaSection />
```

---

## 3. Contratos por Componente

### 3.1. `<HeroSection>`

| Elemento | Tag | Copy exata |
|---|---|---|
| Headline | `<h1>` | `Organize sua rede de apoio em um único lugar.` |
| Subtexto | `<p>` | `A Em Círculo ajuda familiares, cuidadores e pessoas de apoio a compartilhar tarefas, medicamentos e informações, reduzindo a sobrecarga de quem coordena o cuidado.` |
| CTA primário | `<a href="/login">` | `Criar meu Círculo` |
| CTA secundário | `<a href="#como-funciona">` | `Conheça a plataforma` |

**Regras:**
- `<h1>` único na página (WCAG 2.4.6).
- CTA primário com `aria-label="Criar meu Círculo gratuitamente"`.
- CTA secundário com `aria-label="Ir para a seção Como Funciona"`.

---

### 3.2. `<ProblemSection>`

| Elemento | Tag | Copy exata |
|---|---|---|
| Heading | `<h2>` | `Quando tudo depende de uma pessoa, o cuidado fica mais difícil.` |
| Card 1 — Título | `<h3>` | `Sobrecarga` |
| Card 1 — Corpo | `<p>` | `Uma única pessoa lembra de tudo.` |
| Card 2 — Título | `<h3>` | `Informações espalhadas` |
| Card 2 — Corpo | `<p>` | `Mensagens. Papéis. Ligações. Anotações. Nada está realmente organizado.` |
| Card 3 — Título | `<h3>` | `Insegurança` |
| Card 3 — Corpo | `<p>` | `Quem ficou responsável? O medicamento já foi administrado? Alguém confirmou a consulta?` |

**Regras:**
- Cards em `<ul>` com `role="list"` para semântica correta com leitores de tela.
- Cada card em `<li>` com `<article>` interno.

---

### 3.0. `<HomeHeader>` *(Client Component)*

| Elemento | Tag | Detalhe |
|---|---|---|
| Contêiner | `<header>` | `role` implícito de banner; `position: sticky; top: 0` |
| Logo | `<a href="/">` | Texto "em círculo" + `aria-label="Em Círculo — página inicial"` |
| Navegação desktop | `<nav aria-label="Menu Principal">` | Links âncora: `#problema`, `#solucao`, `#como-funciona` |
| Botão "Entrar" | `<a href="/login">` | Estilo outline (secundário) — não compete com CTAs primários |
| Botão hambúrguer | `<button>` | `aria-label="Abrir menu"` / `aria-label="Fechar menu"` conforme estado; `aria-expanded={isOpen}`; `aria-controls="mobile-menu"` |
| Menu mobile | `<nav id="mobile-menu">` | Visível apenas quando `isOpen === true`; `aria-label="Menu Mobile"` |

**Regras WAI-ARIA (WCAG 2.2 — 4.1.2 Name, Role, Value):**
- `aria-expanded` reflete o estado boolean do menu em tempo real.
- `aria-controls="mobile-menu"` vincula o botão ao elemento controlado.
- Quando aberto, o primeiro item do menu recebe foco automaticamente (`autoFocus` ou `ref.focus()`).
- Pressionar `Escape` deve fechar o menu e devolver o foco ao botão hambúrguer.
- `backdrop-filter: blur()` requer `@supports` para graceful degradation.

---

### 3.3. `<SolutionSection>`

| Elemento | Tag | Copy exata |
|---|---|---|
| Heading | `<h2>` | `Um Círculo organiza tudo.` |
| Card 1 | `<h3>` | `Compartilhe tarefas` / `Todos sabem quem faz o quê.` |
| Card 2 | `<h3>` | `Medicamentos` / `Registre administrações e evite esquecimentos ou doses duplicadas.` |
| Card 3 | `<h3>` | `Histórico` / `Toda a rede acompanha as informações mais importantes.` |
| Card 4 | `<h3>` | `Convide pessoas` / `Familiares, cuidadores e profissionais trabalham juntos.` |
| Card 5 *(novo)* | `<h3>` | `Avisos` / `Centralize comunicados importantes e evite grupos confusos no WhatsApp.` |
| Card 6 *(novo)* | `<h3>` | `Arquivos` / `Guarde receitas, exames e documentos médicos com segurança.` |

**Grid:** `repeat(auto-fit, minmax(280px, 1fr))` — simétrico em desktop (3×2) e empilhado em mobile.

---

### 3.4. `<HowItWorksSection>`

| Elemento | Tag | Copy exata |
|---|---|---|
| Heading | `<h2>` | `Começar leva apenas alguns minutos.` |
| Passo 1 | `<h3>` | `1. Crie um Círculo.` |
| Passo 2 | `<h3>` | `2. Convide familiares e pessoas de confiança.` |
| Passo 3 | `<h3>` | `3. Compartilhem tarefas, medicamentos e informações.` |

**Atributos:** `id="como-funciona"` na `<section>` para o anchor link do Hero CTA secundário.

---

### 3.5. `<AccessibilitySection>`

| Elemento | Tag | Copy exata |
|---|---|---|
| Heading | `<h2>` | `Feita para todas as pessoas.` |
| Corpo | `<p>` | `A Em Círculo foi desenvolvida seguindo princípios de acessibilidade desde a arquitetura do produto.` |
| Item lista | `<li>` | Compatibilidade com leitores de tela; Navegação por teclado; Contraste conforme WCAG 2.2; Tipografia escalável; Interface simples e inclusiva. |

---

### 3.6. `<FinalCtaSection>`

| Elemento | Tag | Copy exata |
|---|---|---|
| Heading | `<h2>` | `Comece seu primeiro Círculo hoje.` |
| Corpo | `<p>` | `Organize sua rede de apoio. Compartilhe responsabilidades. Cuide com mais tranquilidade.` |
| CTA | `<a href="/login">` | `Criar meu Círculo` |

---

## 4. Regras Globais de Acessibilidade (WCAG 2.2 AAA)

| Critério | Implementação |
|---|---|
| **1.4.3 Contraste mínimo** | 7:1 — usar palette `neutral-900` sobre `neutral-50` (JINC) |
| **2.1.1 Teclado** | Todos os links e botões navegáveis via Tab/Enter |
| **2.4.7 Focus visible** | `focus-visible:outline-2 focus-visible:outline-offset-2` em todos os interativos |
| **2.4.6 Headings** | Hierarquia linear: 1 × `<h1>`, múltiplos `<h2>`, múltiplos `<h3>` |
| **1.3.1 Info and Relationships** | HTML semântico: `<main>`, `<section>`, `<article>`, `<ul>`, `<nav>` |
| **2.3.3 Animation** | `@media (prefers-reduced-motion: reduce)` cancela todas as animações |
