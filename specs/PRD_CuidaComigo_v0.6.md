---
name: prd_cuida_comigo_v0.6
description: Requisitos de Produto para a Fase 8 - Enriquecimento de Perfis (v0.6)
jinc-spec-version: "1.0"
project-name: "Cuida Comigo"
status: "active"
version: "v0.6-ProfileEnrichment"
last-updated: "2026-07-07"
---

# Documento de Requisitos de Produto (PRD) — Fase Enriquecimento de Perfis (v0.6)

## Cuida Comigo: Perfis Detalhados para Cuidador e Paciente

### 1. Visão Geral e Objetivo
Para tornar o Cuida Comigo mais útil clinicamente e operacionalmente no cotidiano, precisamos ir além das informações básicas. Esta fase visa enriquecer o perfil do **Cuidador** (adicionando whatsapp de contato e sua profissão/grau de parentesco) e do **Paciente** (condições médicas pré-existentes e observações gerais do cotidiano), melhorando a colaboração e a prontidão em casos de urgência.

---

### 2. Definição do Problema
* **Comunicação entre Cuidadores:** Em círculos de cuidado compartilhados, os cuidadores precisam entrar em contato rapidamente entre si. Sem um canal direto de contato (como o WhatsApp), a comunicação externa fica prejudicada.
* **Contextualização do Cuidador:** Saber se um membro do círculo é enfermeiro, técnico ou simplesmente um familiar (mãe, filho) ajuda a delegar e entender as responsabilidades de cuidado.
* **Histórico de Saúde do Paciente:** O cotidiano de cuidado exige atenção a patologias de base (ex: hipertensão, diabetes, Alzheimer). Essas condições médicas, assim como notas gerais (ex: preferências de rotina), devem estar visíveis para qualquer cuidador que assuma o plantão.

---

### 3. Escopo Funcional da Fase

#### 3.1. Dados Adicionais do Cuidador (`users` table)
* `whatsapp`: Número de contato telefônico/WhatsApp (opcional, string).
* `profession`: Profissão, especialidade ou relação com o paciente (opcional, string).

#### 3.2. Dados Adicionais do Paciente (`care_recipients` table)
* `medical_conditions`: Histórico clínico de condições médicas e diagnósticos (opcional, texto longo).
* `observations`: Notas gerais e observações de rotina do paciente (opcional, texto longo).

#### 3.3. Rota de Edição do Perfil do Cuidador
* Rota: `PATCH /api/v1/users/me`
* Funcionalidade: Permite que qualquer cuidador autenticado atualize seu próprio nome, whatsapp e profissão.

#### 3.4. Rota de Edição do Paciente
* Rota: `PATCH /api/v1/care-recipients/{recipient_id}`
* Funcionalidade: Atualiza as novas propriedades de condições médicas e observações.

---

### 4. Requisitos Não Funcionais (NFRs) Específicos
* **Acessibilidade WCAG 2.2 AAA:** Os campos de entrada adicionados devem possuir rótulos acessíveis e legibilidade perfeita. O formulário de perfil `/perfil` deve seguir os mesmos critérios de contraste Teal/Amber.
* **Integridade Relacional:** A inclusão das colunas no banco de dados deve ser retrocompatível, inicializando com valores nulos para os usuários e pacientes existentes.
