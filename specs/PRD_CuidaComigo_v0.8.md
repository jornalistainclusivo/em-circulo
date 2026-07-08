---
name: prd_cuida_comigo_v0.8
description: Requisitos de Produto para a Fase 10.1 - Notificações Inteligentes e Toasts AAA (v0.8)
jinc-spec-version: "1.0"
project-name: "Cuida Comigo"
status: "active"
version: "v0.8-SmartNotifications"
last-updated: "2026-07-08"
---

# Documento de Requisitos de Produto (PRD) — Fase Notificações Inteligentes (v0.8)

## Cuida Comigo: Notificações em Tempo Real

### 1. Visão Geral e Objetivo
Para garantir que a comunicação do Círculo de Cuidado flua de forma sincronizada, a Fase 10.1 introduz um sistema de notificações em tempo real. O objetivo é avisar todos os membros do grupo sempre que uma ação crítica for tomada (ex: dose registrada ou tarefa criada/concluída), mantendo todos informados e evitando duplicação de trabalho.

---

### 2. Definição do Problema
* **Desinformação de Tarefas:** Atualmente, se um cuidador registra a administração de um medicamento, o restante do círculo não é avisado. Isso pode gerar ansiedade ou até o risco de superdosagem se a informação não for verificada ativamente.
* **Falta de Feedback Ativo:** A ausência de alertas exige que os cuidadores acessem o painel frequentemente para "descobrir" o que mudou no status do paciente.

---

### 3. Escopo Funcional da Fase

#### 3.1. Entidade de Notificações (`notifications` table)
* `care_group_id`: Relacionamento com o círculo de cuidado.
* `title`: Título curto da notificação (ex: "Medicamento Administrado").
* `message`: Corpo da mensagem contendo detalhes.
* `type`: Tipo enumerado (`DOSE_REGISTERED`, `TASK_CREATED`, `TASK_COMPLETED`, `STOCK_ALERT`).
* `is_read`: Status de leitura (booleano, default false).
* `created_at`: Timestamp de criação.

#### 3.2. Gatilhos de Notificação
* **Registrar Dose:** Ao criar um log em `medication_logs`, inserir notificação `DOSE_REGISTERED`.
* **Criar Tarefa:** Ao criar uma `Task`, inserir notificação `TASK_CREATED`.
* **Completar Tarefa:** Ao marcar uma `Task` como concluída, inserir notificação `TASK_COMPLETED`.

#### 3.3. Rotas da API
* `GET /api/v1/care-groups/{group_id}/notifications`: Retorna as notificações mais recentes do grupo, com filtros por timestamp de atualização (polling) e contagem de itens.

#### 3.4. Frontend & Componentes
* **Notification Bell:** Um componente de sino autossuficiente no cabeçalho principal, que resolve o `groupId` atual e executa polling periódico na API (30s de intervalo no backend, mas executado no client de forma robusta).
* **Toast AAA:** Utilização da biblioteca `sonner` para exibir alertas toast no padrão Design System JINC (cores neutras, acessíveis) quando uma nova notificação for recebida via polling.
* **Página de Histórico:** Rota `/notificacoes` para exibir o histórico em formato de timeline acessível.

---

### 4. Requisitos Não Funcionais (NFRs) Específicos
* **Acessibilidade WCAG 2.2 AAA:** Toasts devem ser perfeitamente legíveis (constraste 7:1) e usar suporte `aria-live` (gerenciado pelo sonner). O sino possui rótulo claro e indicador visual. Animações respeitam `prefers-reduced-motion`.
* **Performance do Polling:** O polling utiliza cache busting `Date.now()` para evitar leitura de HTTP responses antigas e opera sobre intervalos seguros que previnem vazamento de memória ou congelamento da UI (HMR support para o `app-router`).
* **Suporte a IPv4/IPv6:** A infraestrutura de fetch Server Action respeita estritamente o host `127.0.0.1` contra falhas de resolução ECONNREFUSED em ambientes Node.js 18+.
