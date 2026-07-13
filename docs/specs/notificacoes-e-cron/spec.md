---
name: spec_notificacoes_e_cron
description: Especificação Técnica do Motor de Notificações Inteligentes e Escalonamento (Cron)
jinc-spec-version: "1.0.0"
project-name: Em Círculo
feature-name: Notificações Inteligentes
status: stable
prd-ref: docs/PRD.md
sdd-ref: docs/SDD.md
created-at: 2026-07-08
---

# Especificação Técnica — Notificações Inteligentes e Cron (v1.4.0)

## 1. Escopo Técnico

Esta especificação define o contrato exato do sistema de notificações (in-app) do Em Círculo, implementado na Fase 10.1 (Frontend Polling) e Fase 10.2 (Backend Cron).

## 2. Modelagem (Pydantic / SQLModel)

```python
class NotificationType(str, Enum):
    DOSE_REGISTERED = "DOSE_REGISTERED"
    TASK_CREATED = "TASK_CREATED"
    TASK_COMPLETED = "TASK_COMPLETED"
    STOCK_ALERT = "STOCK_ALERT"
    DOSE_ATRASADA = "DOSE_ATRASADA"
```

O Motor Cron requer campos de controle em `MedicationProtocol`:
- `next_due_at`: Quando a próxima dose deverá ser ministrada.
- `last_delay_alert_sent_at`: Data da última notificação de atraso para evitar duplicações no polling de 1 minuto.

## 3. Comportamento do Agendador (Cron Job)

- **Rotina:** Roda a cada 60 segundos via `APScheduler`.
- **Query:** Busca todos os protocolos onde `next_due_at` é 10 minutos anterior ao momento atual (`now - 10 min`).
- **Debounce:** Só seleciona se `last_delay_alert_sent_at` for nulo ou menor que `next_due_at`.
- **Ação:** Cria uma `Notification` do tipo `DOSE_ATRASADA` e atualiza `last_delay_alert_sent_at = now`.

## 4. Endpoints

- `GET /api/v1/care-groups/{group_id}/notifications` (Limit=20, Ordered by created_at DESC)
- `PATCH /api/v1/notifications/{id}/read` (Marca `is_read = true`)

*(Veja spec.openapi.yaml para os contratos Swagger).*

## 5. Implementação Frontend

- **Server Action:** `markNotificationAsReadAction` aciona o PATCH ao clicar.
- **Client Side Polling:** O componente `<NotificationBell />` roda um `setInterval` de 30s. Faz re-fetch via cache busting. 
- **Sonner Toasts:** Se o topo da lista de notificações tiver um `id` não visto (`lastSeenId`), o frontend emite um alerta `toast.info` no padrão neutro AAA.
