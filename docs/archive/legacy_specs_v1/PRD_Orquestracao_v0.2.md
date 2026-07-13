---
name: prd_orquestracao
description: Documento de Requisitos de Produto (PRD) do Em Círculo
jinc-spec-version: "1.0"
project-name: "Em Círculo"
status: "active"
version: "v0.2-Alpha"
last-updated: "2026-06-07"
---

# Documento de Requisitos de Produto (PRD)

## Em Círculo: Ninguém precisa cuidar sozinho

### 1. Visão Geral e North Star

O **Em Círculo** é uma plataforma de gestão compartilhada projetada para descentralizar a carga cognitiva e operacional de cuidadores informais. O sistema atua como uma Fonte Única de Verdade (*Single Source of Truth* - SSOT) para o círculo familiar e profissional de apoio, eliminando a fragmentação de informações.

* **North Star:** O pivô central de inovação é focar na dor do cuidador como orquestrador, e não no paciente como usuário final.

### 2. Definição do Problema e Hipótese

O cuidador informal sofre de sobrecarga física e emocional intensificada pela incapacidade de dividir responsabilidades. As soluções atuais focam no idoso ou na pessoa com deficiência, ignorando o desgaste logístico de quem gerencia a rotina.

* **Hipótese Central:** Fornecer um sistema assíncrono e centralizado de tarefas e gestão medicamentosa reduzirá o estresse de coordenação e prevenirá falhas críticas (como doses duplicadas ou esquecidas).

### 3. Escopo do MVP (Minimum Viable Product)

Para mitigar o risco de *feature creep*, a versão v0.2-Alpha restringe-se estritamente à resolução da dor de coordenação e segurança farmacêutica. Funcionalidades de cálculo de *burnout* e banco de tempo comunitário estão isoladas no *roadmap* futuro.

O MVP deve entregar:

1. **Coordenação Familiar:** Distribuição de tarefas assíncronas.
2. **Gestão de Medicamentos:** Rastreabilidade de administração e controle de estoque.

### 4. Modelo de Domínio (Entidades Principais)

* **`CareGroup` (Círculo de Cuidado):** Agrupamento lógico de usuários responsáveis por um paciente. Controla permissões (*Role-Based Access Control*) distinguindo o cuidador principal (Administrador) dos membros de apoio.
* **`CareRecipient` (Pessoa Cuidada):** Perfil passivo no sistema contendo dados clínicos essenciais, alergias, tipo sanguíneo e contatos de emergência.
* **`Task` (Tarefa de Cuidado):** Unidade de coordenação. Deve conter: identificador único, título, descrição, responsável alocado (`assignee_id`), prazo (`due_date`), status atual e recorrência.
* **`MedicationProtocol` (Protocolo Medicamentoso):** Gestor de fármacos associado ao `CareRecipient`. Deve rastrear: nome do medicamento, dosagem, frequência de administração e contagem de estoque (`stock_count`).

### 5. Jornadas do Usuário (Fluxos Críticos)

#### 5.1. Fluxo de Descentralização (Task Flow)

1. O usuário Administrador instancia um `CareGroup` e cadastra o `CareRecipient`.
2. O Administrador gera um convite e adiciona membros de apoio (familiares, cuidadores contratados).
3. O Administrador cria rotinas e tarefas discretas (ex: "Administrar banho", "Comprar fraldas").
4. Membros do grupo reivindicam a autoria das tarefas.
5. O sistema notifica o grupo em tempo real sobre a conclusão da tarefa, dispensando validação manual por aplicativos de mensagens.

#### 5.2. Fluxo de Prevenção de Erros (Medication Flow)

1. O usuário cadastra um `MedicationProtocol` definindo intervalos de administração.
2. O sistema agenda execuções assíncronas para disparar alertas aos membros responsáveis pelo turno vigente.
3. O membro registra a administração na interface, gerando um *log* imutável.
4. O sistema decrementa o `stock_count`. Ao atingir o limiar de segurança, uma subtarefa automatizada ("Repor medicamento") é injetada no painel do `CareGroup`.

### 6. Requisitos Não Funcionais (NFRs) e Quality Gates

* **Acessibilidade (Quality Gate Primário):** Conformidade estrita com a diretriz WCAG 2.2 AAA e princípios do Desenho Universal. A semântica da interface deve suportar navegação primária via teclado e ser integralmente compatível com leitores de tela nativos.
* **Resiliência Offline (PWA):** O cliente deve operar como *Progressive Web App*, garantindo *Cache-First* para consultas a dados críticos (protocolos medicamentosos) em ambientes de baixa conectividade.
* **Desempenho (Backend):** Operação puramente assíncrona (FastAPI/asyncpg) para garantir I/O não bloqueante no processamento de baixas de estoque e alertas em tempo real.
* **Gestão de Dados:** Toda serialização de *datetime* no cliente deve operar sob a norma ISO 8601 com *timezone* atrelado para manter a integridade transacional na base de dados (TIMESTAMPTZ).
* **Integração CI/CD:** O projeto exige validação estrutural no Github Actions antes do *merge*, baseando-se no modelo *Specification-Driven Development* (SDD). Nenhuma lógica deve ser codificada sem a blindagem prévia dos contratos YAML/Markdown na raiz `/specs`.
