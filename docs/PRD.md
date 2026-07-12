---
name: prd_cuida_comigo
description: Documento Unificado de Requisitos de Produto (v2.0 Draft)
jinc-spec-version: "1.0.0"
project-name: Cuida Comigo
status: draft
last-updated: 2026-07-09
---

# Documento de Requisitos de Produto (PRD) — Cuida Comigo

## 1. Visão Geral (North Star)
O **Cuida Comigo** é uma plataforma desenhada para descentralizar a carga física e mental do cuidado de pessoas com necessidades especiais, idosos ou pacientes em reabilitação. O aplicativo substitui grupos informais de WhatsApp por uma governança estruturada, garantindo que toda a rede de apoio (familiares, cuidadores contratados e voluntários) esteja sincronizada em tempo real sobre rotinas, medicamentos e tarefas.

O aplicativo deve proporcionar paz de espírito, evitando superdosagem de medicamentos por falha de comunicação e garantindo que nenhuma tarefa essencial seja esquecida.

---

## 2. Personas Alvo

1. **O Cuidador Primário (Administrador):** Centraliza a responsabilidade, gerencia a burocracia do cuidado e precisa distribuir tarefas para não entrar em *burnout*.
2. **O Familiar / Voluntário (Apoio):** Deseja ajudar, mas não sabe exatamente o que precisa ser feito ou se o medicamento já foi dado.
3. **O Cuidador Contratado (Profissional):** Precisa de um *log* estruturado para justificar seu turno de trabalho.

---

## 3. Escopo Funcional (Implementado até v2.0.2)

### 3.1. Autenticação e Identidade
- Cadastro de usuários com e-mail e senha (hash bcrypt).
- Roles definidos: Administrador vs. Cuidador de Apoio.

### 3.2. Círculos de Cuidado (Care Groups)
- Capacidade de criar um Grupo de Cuidado centrado em um Paciente (Care Recipient).
- Sistema de convites para ingresso de novos membros.
- Perfil do paciente com informações críticas (tipo sanguíneo, alergias, condições médicas).

### 3.3. Gestão de Tarefas (Task Flow)
- Criação de tarefas discretas (ex: "Administrar banho").
- Status da Tarefa: PENDING, CLAIMED, IN_PROGRESS, COMPLETED, CANCELLED.
- Atribuição de responsabilidade para membros específicos.

### 3.4. Governança de Medicamentos (Medication Flow)
- Definição de Protocolos de Medicamentos (Nome, dosagem, intervalo de horas).
- Registro imutável de doses administradas (`MedicationLog`).
- Auto-agendamento inteligente: o sistema calcula o próximo horário (`next_due_at`) com base no último registro.
- Controle de estoque e limiar de segurança para avisos de reposição.

### 3.5. Motor de Notificações e Polling em Tempo Real
- Geração automática de notificações de sistema ao registrar doses ou concluir tarefas.
- Interface sincronizada via "HTTP Polling" e Toasts não-intrusivos.
- Agendador autônomo (Cron Job) que identifica atrasos na medicação (passou de 10 min de atraso) e dispara uma notificação `DOSE_ATRASADA` com debounce para não flodar o grupo.

### 3.6. Agenda de Consultas Integrada
- Um calendário focado no paciente para agendar, lembrar e organizar idas a médicos e terapeutas.
- Implementação estrita de acessibilidade (WCAG 2.2 AAA) com focus-visible e navegação linear.
- Totalmente protegido via RBAC Zero-Trust.

---

## 4. Escopo Funcional (Futuro / v2.1+)

### 4.1. Coordenação Avançada e Supervisão
- **Arquivo de Documentos Clínicos:** Repositório seguro na nuvem para armazenar receitas médicas, laudos, exames e imagens.
- **Relatório Semanal para a Família:** Geração de resumos automáticos (PDF/App) detalhando a evolução do paciente e a execução de tarefas para manter a rede de apoio informada.
- **Telemedicina Simplificada:** Atalho para agendamento de consultas ou chamadas de vídeo rápidas com profissionais da saúde.

### 4.2. Centralização do Histórico de Saúde
- **Diário de Evolução com Tags de Sintomas:** Permite o registro rápido e estruturado de alterações no quadro do paciente.
- **Controle de Mobilidade, Higiene e Tratamentos:** Trilhas de tarefas especializadas contínuas (ex: fisioterapia, fonoaudiologia).
- **Acompanhamento Nutricional e Saúde Mental:** Módulos para registrar a ingestão alimentar, hidratação, oscilações de humor e bem-estar geral.

### 4.3. Gestão Financeira e Transparência
- **Registro de Gastos:** Lançamento de despesas médicas, farmácia, honorários de cuidadores e alimentação.
- **Divisão de Custos e Controle de Pagamentos:** Ferramenta para rateio automático das despesas de cuidado entre os familiares responsáveis.
- **Prestação de Contas Automática:** Geração de balanços financeiros mensais claros para evitar conflitos sobre os custos do cuidado.

---

## 5. Requisitos Não Funcionais e Quality Gates (JINC Governance)

1. **Acessibilidade Absoluta (WCAG 2.2 AAA):**
   - Uso de paletas neutras (espectro `neutral-50` a `neutral-900`) garantindo contraste de 7:1.
   - Componentes iterativos devem usar foco visível (`focus-visible`).
   - Uso de `aria-live` gerenciado nativamente (ex: Toasts via *sonner*).
2. **Resiliência e Zero-Trust:**
   - Comunicação servidor a servidor blindada (resolução IPv4 explícita 127.0.0.1 em SSR).
   - Ausência absoluta de secrets ou chaves em frontend logs.
3. **Zero Hallucination:** 
   - Funcionalidades dependem estritamente do contrato API definido no respectivo `spec.md`.

---

## Downstream Pipeline

This PRD is the input for:

- **SDD (Architecture):** Use `sdd-creator`. Sections to focus on: Tech Considerations, Data Requirements, Performance Specs.
- **Spec (Technical Spec):** Use `spec-creator`. Sections to focus on: Functional Requirements, Acceptance Criteria, Business Rules.

PRD Status: approved
Ready for SDD: yes
