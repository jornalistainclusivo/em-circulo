---
name: prd_cuida_comigo
description: Documento Unificado de Requisitos de Produto (v2.0 Draft)
jinc-spec-version: "1.0.0"
project-name: Em Círculo
status: draft
last-updated: 2026-07-14
---

# Documento de Requisitos de Produto (PRD) — Em Círculo

## 1. Visão Geral (North Star)
O **Em Círculo** constrói a rede de apoio mais confiável para quem cuida. Acreditamos que o cuidado nunca foi uma responsabilidade individual, mas sim coletiva. Nossa visão é um futuro onde nenhuma família precise depender exclusivamente da memória ou de grupos de mensagens fragmentados. 

Não somos um aplicativo de tarefas. Somos um ambiente de confiança, oferecendo ferramentas que ajudam as pessoas a cuidarem juntas. A plataforma conecta familiares, voluntários e profissionais, compartilhando responsabilidades e garantindo que todos saibam o que precisa ser feito — reduzindo a sobrecarga do cuidador principal e trazendo tranquilidade para toda a rede de apoio.

---

## 2. Personas Alvo

1. **O Cuidador Principal:** Continua no centro das decisões, mas não precisa carregar todas as responsabilidades sozinho.
2. **Familiares e Pessoas de Apoio:** Desejam contribuir de forma organizada, mesmo participando ocasionalmente, ajudando a família a cuidar junta.
3. **Cuidadores Profissionais:** Trabalham em conjunto com a família, utilizando informações organizadas, atualizadas e seguras.

---

## 2.1. Estratégia de Aquisição (PLG — Product-Led Growth)

A Home Page da plataforma é o principal vetor de aquisição. Ela não vende funcionalidades. Ela vende uma **transformação**: do caos logístico e emocional para a tranquilidade centralizada.

### Modelo de Freemium

| Plano | Público | Inclusões |
|---|---|---|
| **Gratuito** | Famílias iniciando sua rede de apoio | 1 Círculo, até 5 participantes, tarefas, medicamentos, histórico, notificações |
| **Em Círculo Plus** | Famílias com necessidades mais complexas | Múltiplos Círculos, agenda, arquivos, IA, relatórios |
| **Em Círculo Pro** | Cuidadores profissionais e instituições | Múltiplos pacientes, gestão de turnos, exportação de dados, equipes |

### Jornada de Conversão (Home → First Circle)

A Home deve conduzir o visitante, nesta ordem:
1. **Identificação do problema** — "Quando tudo depende de uma pessoa, o cuidado fica mais difícil."
2. **Validação emocional** — "Você não está sozinho."
3. **Proposta de transformação** — "Um Círculo organiza tudo."
4. **CTA de baixa fricção** — Cadastro direto para criar o primeiro Círculo (`/login`).

> Os planos pagos devem possuir página própria. A Home não apresenta preços; demonstra valor primeiro.

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

O roadmap futuro reflete nosso compromisso: ajudar as pessoas a cuidarem juntas.

### 4.1. Colaboração e Delegação no Círculo
- **Delegação de Tarefas e Responsabilidades Compartilhadas:** Ferramentas para redistribuir facilmente a carga, permitindo que membros do Círculo assumam tarefas de forma autônoma e organizada.
- **Permissões Compartilhadas e Governança:** Níveis de acesso flexíveis para garantir que a família, os profissionais e os voluntários acessem apenas as informações pertinentes ao seu papel na rede de apoio.

### 4.2. Comunicação e Confiança
- **Murais de Comunicação do Círculo:** Um espaço unificado para troca de informações, atualizações diárias e recados, substituindo a fragmentação dos grupos de mensagens e fortalecendo a confiança.
- **Diário de Evolução Compartilhado:** Registro rápido do humor, da alimentação e do bem-estar do paciente, permitindo que toda a rede saiba como o cuidado está progredindo, reduzindo a ansiedade de quem não está presente.

### 4.3. Coordenação Avançada da Rede
- **Arquivo de Documentos Clínicos e Receitas:** Repositório seguro para que qualquer cuidador de plantão ou familiar tenha acesso imediato aos laudos e prescrições.
- **Transparência e Gestão Financeira Solidária:** Funcionalidades para o registro de gastos (fármacos, honorários) e rateio automático entre os familiares, evitando conflitos e gerando paz de espírito.

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
