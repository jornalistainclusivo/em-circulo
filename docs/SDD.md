---
name: sdd_cuida_comigo
description: Software Design Document (v2.0 Draft)
jinc-spec-version: "1.0.0"
project-name: Cuida Comigo
status: active
last-updated: 2026-07-11
prd-ref: docs/PRD.md
---

# Software Design Document (SDD) — Cuida Comigo

## 1. Visão Arquitetural
O **Cuida Comigo** segue uma arquitetura baseada em microsserviços lógicos, consistindo de um Frontend Server-Side Rendered acoplado a uma API assíncrona orientada a eventos transacionais.

### 1.1. C4 Context & Container Diagram

```mermaid
C4Context
    title Diagrama de Contexto e Containers (v1.4.0)

    Person(user, "Cuidador / Familiar", "Interage via Mobile/Web")
    
    System_Boundary(c1, "Cuida Comigo Platform") {
        Container(frontend, "Frontend Web App", "Next.js 16 (App Router)", "Renderiza UI, gerencia estado e faz polling de notificações")
        Container(api, "Backend API Service", "FastAPI (Python)", "Gerencia regras de negócio, auth e endpoints")
        Container(db, "Database", "PostgreSQL", "Armazena dados transacionais (SQLModel/Alembic)")
        Container(cron, "Cron Engine", "APScheduler (Python)", "Roda no mesmo processo da API, varrendo tabelas para gerar alertas")
    }

    Rel(user, frontend, "Acessa dashboards, registra doses, conclui tarefas", "HTTPS")
    Rel(frontend, api, "Server Actions & Polling", "JSON/REST (IPv4 strict: 127.0.0.1)")
    Rel(api, db, "Lê e Escreve", "asyncpg (TCP)")
    Rel(cron, db, "Varredura 1 min (Debounce limit)", "asyncpg (TCP)")
```

---

## 2. Tech Stack Confirmada

- **Frontend:** Next.js 16 (App Router), React, Tailwind CSS (JINC Neutral Palette), Sonner (Toasts AAA).
- **Backend:** FastAPI (Python 3.11+), SQLModel, SQLAlchemy (asyncio), Uvicorn.
- **Background Jobs:** APScheduler (AsyncIOScheduler) acoplado no _lifespan_ do FastAPI.
- **Banco de Dados:** PostgreSQL (migrações via Alembic).
- **Rede & Proxy:** Node.js 18+ com Turbopack (Exige binds explícitos em `127.0.0.1` contra IPv6 ECONNREFUSED).

---

## 3. Topologia de Dados (Principais Entidades)

O núcleo do sistema orbita ao redor do `CareGroup` (Círculo de Cuidado).
- `User`: Identidade (Hash Auth).
- `CareGroup`: Agregador do paciente (`CareRecipient`) e seus cuidadores (`CareGroupMember`).
- `Task`: Tarefas isoladas designadas (`assignee_id`) ou livres, atreladas ao Grupo.
- `MedicationProtocol`: A espinha dorsal da medicação. Define `dosage` e `frequency_interval_hours`. Possui um gatilho mecânico `next_due_at` que avança a cada dose injetada.
- `MedicationLog`: Log imutável da execução de uma dose por um cuidador no tempo.
- `Notification`: Tabela de Event-Sourcing leve consumida periodicamente pelo frontend (Polling).
- `Appointment`: Entidade para a Agenda de Consultas, atrelada por foreign key ao `CareRecipient`. Campos core da modelagem: `title` (título), `scheduled_at` (data/hora UTC), `provider_name` (especialista/médico) e `location` (local).

---

## 4. Padrões de Integração e Zero-Trust

### 4.1. Sincronização Frontend-Backend (Smart Notifications)
O aplicativo não usa WebSockets para manter compatibilidade serverless. Ao invés disso, utiliza **HTTP Polling** isolado em um *Client Component* (`NotificationBell`).
1. O frontend mantém referência ao `lastSeenId`.
2. A cada 30 segundos, consulta `GET /api/v1/care-groups/{id}/notifications?after={timestamp}`.
3. Se novos itens surgirem, atualiza a badge e dispara Toasts.

### 4.2. Motor de Cron (Auto-Scheduling)
O backend possui um motor em background (`app/scheduler.py`).
1. A cada 1 minuto, varre `MedicationProtocol` onde `next_due_at < now - 10 min`.
2. Utiliza a coluna de trava (`last_delay_alert_sent_at`) para evitar envios duplicados na mesma janela de atraso.
3. Insere alertas tipo `DOSE_ATRASADA` na tabela de `notifications`.

### 4.3. Rotas da API Core
As interações do frontend Server Actions utilizam endpoints REST assíncronos expostos pelo FastAPI:
- `/api/v1/care-groups`: Gestão do círculo de cuidado e polling de notificações.
- `/api/v1/tasks`: Criação, conclusão e atribuição de tarefas dentro do grupo.

### 4.4. Políticas de Acesso (RBAC) e Consultas
Como regra arquitetural de Zero-Trust, **todo** endpoint da agenda (GET, POST, PATCH) deve obrigatoriamente cruzar o `care_group_id` fornecido na rota com a tabela `CareGroupMember` para validar se o `current_user` possui pertencimento ativo ao círculo. Nenhuma operação na tabela `Appointment` deve ocorrer sem essa validação prévia.
