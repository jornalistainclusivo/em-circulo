# 🤖 feat: Implementa camada de Fundação de Agendamento (Fase 10.2)

## 📝 Resumo do Contexto

Implementação dos campos `next_due_at` e `assignee_id` na entidade de Protocolos de Medicamentos para viabilizar alertas pontuais e delegação de cuidados via RBAC. As mudanças englobam o Backend (FastAPI, SQLModel, Alembic migrações) e o Frontend (React Server Actions, Tipagens de Domínio, Next.js e UI com inputs de `datetime-local` e dropdowns).

## 🔗 Issue / Ticket

Ref: Fase 10.2 Passo A

## 🏷️ Escopo de Mudança (Selecione)

- [ ] `a11y`: Acessibilidade (Sensorial ou Cognitiva).
- [x] `sec`: Correção/Aprimoramento de Segurança. (Isolamento RBAC aplicado no assignee_id).
- [ ] `infra`: Docker, CI/CD, ISR, Deploy.
- [x] `feat`: Nova funcionalidade.
- [ ] `fix`: Correção de bug.
- [ ] `refactor`: Limpeza de código/Design System.

---

## ♿ Auditoria de Inclusão (WCAG 2.2 AAA & Cognitive)

- [x] **Navegação:** Teclado funcional mapeado, sem _keyboard traps_.
- [x] **Foco:** Visível (`focus-visible:ring-2`) em elementos interativos.
- [x] **Semântica ARIA:** Aplicada conforme diretrizes do W3C.
- [x] **Contraste & Cor:** Proporção 7:1 (AAA). Zero dependência exclusiva de cor.
- [x] **Imagens & Fallbacks:** `<AutoAltImage>` implementado.
- [x] **Cognição:** Respeito a `prefers-reduced-motion`.

## 🏛️ Design System Neutro & CWV

- [x] **Paleta:** Uso exclusivo do espectro `neutral-50` a `neutral-900`.
- [x] **Métricas CWV:** LCP otimizado, sem CLS indesejado.
- [x] **Tipografia:** `font-serif` para conteúdo; `font-sans` para UI. Limite de `max-w-[70ch]`.

## 🛠️ DevOps, Higiene & Zero-Trust

- [x] **Secrets:** Ausência absoluta de credenciais. `.env` não versionado.
- [x] **Higiene Local:** Script `sanitize-local.sh` (comandos similares) executado. Nenhuma contaminação cruzada.
- [x] **Docker:** Build multi-stage testado (se aplicável).
- [x] **Versionamento:** Git Tag Semântica gerada e em remote (`git push origin vX.X.X`).

## 🧪 Plano de Teste e Rollback

1. Comandos para teste: `git fetch && git checkout main && npm run dev`
2. URL esperada: `http://localhost:3000/medicamentos` e `http://localhost:3000/`
3. **Plano de Rollback:** Reverter tag/commit da branch caso a migração Alembic gere falhas de performance.
