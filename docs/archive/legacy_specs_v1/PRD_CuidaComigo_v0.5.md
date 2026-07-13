---
name: prd_cuida_comigo_v0.5
description: Requisitos de Produto para a Fase 6 - Círculo de Colaboração e RBAC (v0.5)
jinc-spec-version: "1.0"
project-name: "Em Círculo"
status: "active"
version: "v0.5-Collaboration"
last-updated: "2026-07-07"
---

# Documento de Requisitos de Produto (PRD) — Fase Colaboração e RBAC (v0.5)

## Em Círculo: Colaboração de Cuidado Segura e Centrada no Paciente

### 1. Visão Geral e Objetivo
Até agora, o aplicativo operava em modo *single-player* (apenas um cuidador associado a um grupo e paciente). A Fase v0.5 estabelece a **colaboração multi-player**, permitindo que múltiplos cuidadores colaborem no mesmo círculo de cuidado. Para garantir segurança de dados médicos e operacionais, introduzimos o **Controle de Acesso Baseado em Papéis (RBAC)** e o **Sistema de Convites** baseado em tokens seguros.

---

### 2. Definição do Problema
O cuidado continuado em saúde é uma atividade que exige revezamento e comunicação contínua (ex: familiares cuidando de um idoso, equipes de apoio rotativas). Uma única pessoa não deve arcar sozinha com a carga de trabalho. A plataforma deve permitir a inclusão de novos cuidadores sob um mesmo círculo, mas de forma controlada:
* Informações críticas (ex: exclusão de remédios ou remoção de pacientes) exigem privilégio de administrador (`ADMIN`).
* Cuidadores de apoio (`CAREGIVER`) devem poder visualizar, registrar e alterar tarefas ou remédios do dia a dia, mas nunca excluí-los.

---

### 3. Escopo Funcional da Fase

#### 3.1. Arquitetura de RBAC (ADMIN e CAREGIVER)
* **ADMIN (Administrador):**
  * Possui controle total sobre o círculo de cuidado.
  * Pode gerar links de convite para novos membros.
  * Única função autorizada a realizar operações `DELETE` (excluir grupo, excluir paciente, excluir tarefa e excluir medicamento).
* **CAREGIVER (Cuidador de Apoio):**
  * Pode visualizar o painel, assumir tarefas e registrar administração de medicamentos.
  * Pode criar e editar tarefas e medicamentos.
  * **Proibido** de gerar links de convite ou realizar exclusões de recursos.

#### 3.2. Sistema de Convites por Token Seguros (JWT)
* **Geração de Convites:** O administrador pode gerar um link contendo um token de convite atrelado ao `care_group_id` com expiração estrita de **48 horas**.
* **Aceite de Convites:** Novos usuários que acessam o link de convite processam a validação do token. Ao aceitar, são inseridos automaticamente como `CAREGIVER` no círculo de cuidado.

#### 3.3. Bypass de Onboarding no Frontend
* Se um usuário entrar no aplicativo via link de convite válido:
  * O sistema detecta o contexto do convite e o encaminha para o formulário de cadastro/login.
  * Após o cadastro/login, o token é processado e aceito, inserindo o usuário diretamente no grupo.
  * O fluxo padrão de Onboarding (que forçava a criação de um grupo e paciente) é **ignorado/ignorado**, e o usuário é redirecionado diretamente para o Dashboard (`/`) já contextualizado no grupo compartilhado.

---

### 4. Requisitos Não Funcionais (NFRs) Específicos
* **Segurança Zero-Trust:** O token de convite deve ser assinado e criptografado como um JWT (`HS256`) contendo a reivindicação do grupo e expiração, sendo impossível de ser falsificado.
* **Acessibilidade AAA:** O painel de convites deve conter botões com feedback textual instantâneo (ex: "Link copiado!" anunciado via aria-live).
* **Estética Acolhedora:** Diálogos e telas de convite seguem o Design System Pro Max com a paleta neutra e toques de Teal/Amber para manter um ambiente acolhedor.
