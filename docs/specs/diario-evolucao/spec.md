---
name: spec-diario-evolucao
description: Especificação técnica para o Diário de Evolução / Relatórios Semanais (WeeklyReport).
jinc-spec-version: "1.0.0"
project-name: Em Círculo
feature: Diário de Evolução (WeeklyReport)
status: approved
version: 1.0.0
last-updated: 2026-08-24
sdd-ref: docs/SDD.md#5-topologia-do-frontend--diário-de-evolução
prd-ref: docs/PRD.md#42-diário-de-evolução-compartilhado
---

# Diário de Evolução (WeeklyReport)

## 1. Visão Geral
O recurso permite que cuidadores registrem atualizações periódicas (humor, alimentação, bem-estar e anotações livres) sobre o paciente (`CareRecipient`). O objetivo é compartilhar o andamento do cuidado com todo o Círculo de Cuidado (`CareGroup`), reduzindo a sobrecarga informacional.
Conforme decisão de produto, a entidade técnica será nomeada `WeeklyReport` mas servirá para uso diário/periódico com campos expandidos.

## 2. Modelagem de Dados

### Entidade: `WeeklyReport`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único |
| `care_recipient_id` | UUID | Chave estrangeira para `CareRecipient` |
| `author_id` | UUID | Chave estrangeira para o `CareGroupMember` que criou o registro |
| `report_date` | Date / DateTime | Data de referência do registro |
| `summary_text` | String | (Legado do plano v2) Notas gerais ou resumo. Opcional ou usado em conjunto com `wellbeing_notes`. |
| `mood` | String | Escala ou texto descritivo do humor do paciente (ex: 'BOM', 'REGULAR', 'RUIM') |
| `diet` | String | Observações sobre alimentação (ex: 'COMEU_BEM', 'RECUSOU_ALIMENTO') |
| `wellbeing_notes` | String | Anotações detalhadas sobre o bem-estar |
| `pdf_url` | String (Opcional) | (Legado) Link para relatório exportado se aplicável |
| `created_at` | DateTime | Timestamp de criação |

## 3. Comportamentos e Regras de Negócio
- **RBAC:** Apenas membros do `CareGroup` podem criar ou ler os `WeeklyReport` associados ao `CareRecipient` daquele grupo.
- **Notificação:** Ao criar um novo `WeeklyReport`, o sistema deve emitir uma notificação para o `CareGroup`, de modo que os familiares sejam avisados em tempo real via polling.

## 4. Endpoints
Ver `spec.openapi.yaml` para o contrato completo.
- `POST /api/v1/care-groups/{group_id}/recipients/{recipient_id}/weekly-reports`
- `GET /api/v1/care-groups/{group_id}/recipients/{recipient_id}/weekly-reports`
