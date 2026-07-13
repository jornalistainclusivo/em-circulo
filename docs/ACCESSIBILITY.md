---
name: ACCESSIBILITY
jinc-spec-version: "1.0.0"
project-name: Em Círculo
status: draft
---

# Diretrizes de Acessibilidade (JINC Protocol)

> "Acessibilidade é inegociável". A plataforma Cuida Comigo deve suportar uma arquitetura de inclusão universal, em conformidade estrita com o WCAG 2.2 AAA.

## 1. Regras de Design e Contraste
- O Design System deve operar com cores que garantam uma **proporção mínima de contraste de 7:1** (Padrão AAA).
- Restrição estética: Não utilizar cores na faixa de roxo/violeta (Purple Ban do protocolo de UI/UX JINC).
- Deve operar com "Design System Neutro" (`neutral-50` a `neutral-900`) complementado apenas com sinalizações semânticas.

## 2. Navegação por Teclado e Foco (Motor/Visual)
- Todos os elementos interativos devem ser plenamente acessíveis via a tecla `Tab`.
- **Keyboard Traps:** É terminantemente proibido aprisionar o foco do usuário em modais sem rota de escape clara (`Esc`).
- O anel de foco (`focus-visible:ring-2`) deve estar explicitamente definido em todo o projeto UI.

## 3. Semântica ARIA e Leitores de Tela
- A estrutura HTML deve utilizar as tags nativas HTML5 (`<main>`, `<nav>`, `<article>`) sempre que possível, antes de recorrer a atributos ARIA (Acessibilidade by default).
- Imagens essenciais de avatar e documentação médica devem vir acompanhadas de texto alternativo robusto e dinâmico (`<AutoAltImage>`).

## 4. Acessibilidade Cognitiva
- Respeitar a mídia e a preferência de animação do usuário (`prefers-reduced-motion: reduce`).
- Minimizar sobrecarga cognitiva: a interface deve focar as ações (limite de leitura, chamadas de ação diretas, e navegação não-ambígua).
