---
jinc-spec-version: 1.0.0
project-name: Em Círculo
feature-name: Agenda de Consultas (Appointments)
status: draft
prd-ref: docs/PRD.md
sdd-ref: docs/SDD.md
related-branch: feat/agenda-consultas
coverage: "1/1 FRs mapped"
created-at: 2026-07-11
authors: Tech Lead
---

# Spec: Agenda de Consultas (Appointments)

## Coverage Report

| FR     | Requirement Summary          | Spec Element                                   | Status     |
| ------ | ---------------------------- | ---------------------------------------------- | ---------- |
| FR-001 | Agenda de Consultas Integrada | `Appointment` entity + API Contracts | 🟢 Covered |

## 1. Regras de Negócio e Validações

**BR-001: Zero-Trust (RBAC)**
  Precondition: O usuário deve estar autenticado.
  Input: Requisição para `/api/v1/care-groups/{group_id}/appointments`.
  Invariant: Acesso a dados de agendamento é estritamente limitado aos membros do círculo de cuidado.
  Output/Action: A requisição cruza `group_id` com `CareGroupMember`. Se válido, prossegue.
  Violation: E_FORBIDDEN - "Usuário não pertence ao círculo de cuidado."

**BR-002: Vinculação de Paciente**
  Precondition: Acesso ao grupo validado.
  Input: Payload contendo dados do agendamento.
  Invariant: Todo `Appointment` criado estará diretamente atrelado ao `CareRecipient`.
  Output/Action: O `care_recipient_id` é inferido ou validado com base no grupo de cuidado.
  Violation: E_NOT_FOUND - "Paciente não encontrado para o grupo especificado."

## 2. Fluxo de Sucesso
- **POST:** Rota de criação valida o payload, insere o agendamento associado ao paciente do `group_id` fornecido, retornando HTTP `201 Created` e o DTO `AppointmentResponse`.
- **GET:** Rota de listagem recupera todos os agendamentos do grupo, retornando HTTP `200 OK` com os itens ordenados por `scheduled_at` de forma decrescente (mais recentes ou futuros primeiro).

## 3. Tratamento de Erros
- `403 Forbidden`: Se o `current_user` não possuir pertencimento ativo à tabela `CareGroupMember` para o `{group_id}` especificado na rota.
- `404 Not Found`: Se o `care_group_id` ou o `appointment_id` (em operações específicas) não for encontrado.

## 4. Critérios de Aceite
1. O backend deve garantir que datas `scheduled_at` trafegadas estejam no padrão ISO-8601 (UTC).
2. A validação RBAC deve ser a primeira instrução executada nas rotas do grupo.
3. Testes devem garantir 100% de cobertura sobre os fluxos de sucesso e, obrigatoriamente, sobre a trava de segurança 403.
