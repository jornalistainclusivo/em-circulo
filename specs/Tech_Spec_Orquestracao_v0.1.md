---
name: tech_spec_orquestracao
description: Especificação Técnica — Orquestração do Cuidado
jinc-spec-version: 1.0.0
project-name: Orquestração do Cuidado
feature-name: Core Entities & Critical Flows MVP
status: draft
prd-ref: specs/PRD_Orquestracao_v0.1.md
sdd-ref: (Arquitetura consolidada neste documento)
coverage: "4/4 FRs mapped"
created-at: 2026-06-06
authors: Antigravity / spec-creator
---

# Especificação Técnica — Orquestração do Cuidado (v0.1-Alpha)

## 1. Coverage Report

| FR | Requirement Summary | Spec Element | Status |
| :--- | :--- | :--- | :--- |
| FR-001 | Criação do Círculo de Cuidado e Paciente | Entidades `care_groups`, `care_recipients` | 🟢 Covered |
| FR-002 | Gestão de permissões de membros | Entidade `care_group_members` (Roles) | 🟢 Covered |
| FR-003 | Coordenação e assunção de tarefas | Entidade `tasks` + Rotas `/tasks` | 🟢 Covered |
| FR-004 | Prevenção de erros / Log medicamentos | Entidades `medication_protocols`, `logs` | 🟢 Covered |

---

## 2. Esquema Relacional Otimizado (PostgreSQL)

> **Nota Arquitetural:** Uso extensivo de UUIDv4 como chaves primárias para prevenção de enumeração de recursos (Insecure Direct Object Reference) e facilitação de integrações offline-first (PWA) no futuro.

```sql
-- ── 1. Tipos de Dados e ENUMs ──────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('ADMIN', 'SUPPORT');
CREATE TYPE task_status AS ENUM ('PENDING', 'CLAIMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- ── 2. Tabelas Core (Coordenação) ──────────────────────────────────────

-- Entidade: CareGroup (Círculo de Cuidado)
CREATE TABLE care_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela Associativa: Membros do CareGroup (Controle de Acesso)
CREATE TABLE care_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    care_group_id UUID NOT NULL REFERENCES care_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- Referência ao microserviço de Autenticação/Identidade
    role user_role NOT NULL DEFAULT 'SUPPORT',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_care_group_user UNIQUE(care_group_id, user_id)
);
CREATE INDEX idx_care_group_members_user_id ON care_group_members(user_id);

-- Entidade: CareRecipient (Pessoa Cuidada)
CREATE TABLE care_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    care_group_id UUID NOT NULL REFERENCES care_groups(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    blood_type VARCHAR(10),
    allergies TEXT[] DEFAULT '{}',
    emergency_contacts JSONB DEFAULT '[]'::jsonb, -- Estrutura flexível para contatos
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_care_recipient_group UNIQUE(care_group_id) -- Regra MVP: 1 Paciente por Grupo
);

-- Entidade: Task (Tarefa de Cuidado)
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    care_group_id UUID NOT NULL REFERENCES care_groups(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assignee_id UUID REFERENCES care_group_members(id) ON DELETE SET NULL,
    due_date TIMESTAMPTZ NOT NULL,
    status task_status NOT NULL DEFAULT 'PENDING',
    recurrence_rule VARCHAR(255), -- Formato RRULE (RFC 5545)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tasks_care_group_status ON tasks(care_group_id, status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- ── 3. Tabelas de Prevenção de Erros (Farmácia) ────────────────────────

-- Entidade: MedicationProtocol (Protocolo Medicamentoso)
CREATE TABLE medication_protocols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    care_recipient_id UUID NOT NULL REFERENCES care_recipients(id) ON DELETE CASCADE,
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency_interval INTERVAL NOT NULL, -- Ex: '8 hours'
    stock_count INTEGER NOT NULL DEFAULT 0,
    safety_threshold INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_stock_positive CHECK (stock_count >= 0)
);
CREATE INDEX idx_medication_protocols_recipient ON medication_protocols(care_recipient_id);

-- Entidade: MedicationLog (Registro Imutável de Administração)
CREATE TABLE medication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol_id UUID NOT NULL REFERENCES medication_protocols(id) ON DELETE CASCADE,
    administered_by UUID NOT NULL REFERENCES care_group_members(id),
    administered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_medication_logs_protocol ON medication_logs(protocol_id);
```

---

## 3. Contratos de API (FastAPI)

### 🤖 AI-Ready Layer (Machine Consumable)

Abaixo estão definidos os contratos assíncronos que orquestram os fluxos críticos. Todos os endpoints são projetados com `async def` para prevenir bloqueio do Event Loop e integram tarefas secundárias via `BackgroundTasks`.

### 3.1. Fluxo de Descentralização (Task Flow)

**`POST /api/v1/care-groups/{group_id}/tasks`**

- **Propósito:** Criação de uma tarefa para o grupo.
- **Request (application/json):**

  ```json
  {
    "title": "Comprar fraldas geriátricas",
    "description": "Tamanho G, pacote com 30 unidades.",
    "due_date": "2026-06-08T18:00:00Z",
    "recurrence_rule": null
  }
  ```

- **Response (201 Created):**

  ```json
  {
    "id": "e3025195-2dfb-4020-8025-a131b26117bd",
    "status": "PENDING",
    "due_date": "2026-06-08T18:00:00Z"
  }
  ```

**`PATCH /api/v1/tasks/{task_id}/claim`**

- **Propósito:** Um membro assume a execução da tarefa (evita colisão de esforços).
- **Request (application/json):**

  ```json
  {
    "assignee_member_id": "4b68453a-c852-4467-9c98-1e4b857738f7"
  }
  ```

- **Response (200 OK):**

  ```json
  {
    "id": "e3025195-2dfb-4020-8025-a131b26117bd",
    "status": "CLAIMED",
    "assignee_id": "4b68453a-c852-4467-9c98-1e4b857738f7"
  }
  ```

- **Business Rule (BR-TSK-01):** Se `status` não for `PENDING`, retorna `409 Conflict`.

**`PATCH /api/v1/tasks/{task_id}/complete`**

- **Propósito:** Marca a tarefa como concluída.
- **Side Effect (Assíncrono):** Dispara `BackgroundTasks` para notificar todos os membros do grupo visando a descentralização da informação.
- **Response (200 OK):** Status alterado para `COMPLETED`.

---

### 3.2. Fluxo de Prevenção de Erros (Medication Flow)

**`POST /api/v1/care-recipients/{recipient_id}/protocols`**

- **Propósito:** Estabelece um novo protocolo medicamentoso.
- **Request (application/json):**

  ```json
  {
    "medication_name": "Losartana Potássica",
    "dosage": "50mg",
    "frequency_interval_hours": 12,
    "stock_count": 60,
    "safety_threshold": 10
  }
  ```

- **Response (201 Created):** Retorna UUID do protocolo.

**`POST /api/v1/protocols/{protocol_id}/logs`**

- **Propósito:** Registra a administração do medicamento (Auditoria) e gerencia os níveis de estoque.
- **Request (application/json):**

  ```json
  {
    "administered_by": "4b68453a-c852-4467-9c98-1e4b857738f7",
    "administered_at": "2026-06-06T12:00:00Z",
    "notes": "Administrado junto com alimento."
  }
  ```

- **Response (201 Created):** Retorna o ID do log salvo.
- **Business Rule (BR-MED-01) - Acionado via BackgroundTasks:**
  1. O sistema injeta o log de imutabilidade na base de dados.
  2. Decrementa atomicamente `stock_count` em `-1`.
  3. **Injeção de Tarefa:** Se `stock_count` ficar igual ou inferior a `safety_threshold`, o sistema invoca internamente o serviço de Tasks para criar: `{"title": "Repor medicamento: Losartana Potássica", "status": "PENDING"}` para alertar o Círculo de Cuidado ativamente.
