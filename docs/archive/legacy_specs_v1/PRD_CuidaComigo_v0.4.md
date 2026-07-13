---
name: prd_cuida_comigo_v0.4
description: Documento de Requisitos de Produto para a fase de Onboarding (v0.4)
jinc-spec-version: "1.0"
project-name: "Em Círculo"
status: "active"
version: "v0.4-Onboarding"
last-updated: "2026-07-06"
---

# Documento de Requisitos de Produto (PRD) - Fase Onboarding (v0.4)

## Em Círculo: Ninguém precisa cuidar sozinho

### 1. Visão Geral e Objetivo da Fase
Após estabelecer a camada de segurança e identidade na fase v0.3, a Fase v0.4 foca no **Onboarding do Cuidador**. A primeira interação de um usuário recém-registrado deve permitir que ele configure a estrutura básica de operação:
1. Instanciar um Círculo de Cuidado (`CareGroup`).
2. Cadastrar a Pessoa Cuidada (`CareRecipient`).

### 2. Definição do Problema
Um usuário recém-registrado na plataforma encontra-se em um estado "vazio" (*cold start*). Sem pertencer a nenhum grupo e sem nenhum paciente vinculado, o painel de tarefas e a farmácia não possuem contexto funcional aplicável. Para evitar confusão mental ou paralisia de decisão, o fluxo inicial de onboarding deve conduzir o usuário passo a passo no cadastramento dos dados essenciais.

### 3. Escopo da Fase (Onboarding do Cuidador)
Para mitigar a fricção e guiar o usuário na fundação do sistema:
1. **Fundação do Círculo de Cuidado (CareGroup):** Criação de um grupo informando apenas o nome do círculo (ex: "Família Silva").
2. **Cadastro do Membro Administrador:** O usuário criador do grupo deve ser automaticamente cadastrado como membro daquele grupo com a função `ADMIN` (fundamental para controle de acessos futuros).
3. **Cadastro do Paciente (CareRecipient):** Vinculação de uma única pessoa sob cuidado ao grupo (Regra MVP: 1 receptor de cuidados por grupo). Deve permitir preencher nome, tipo sanguíneo, alergias e contatos de emergência de forma flexível.
4. **Fluxo do Frontend (Wizard):** Redirecionamento forçado para a tela `/onboarding` se o usuário autenticado não possuir nenhum grupo ativo. Impedir acesso ao dashboard até a conclusão das duas etapas.

### 4. Jornadas do Usuário (User Journeys)

#### 4.1. Fluxo de Fundação (Wizard Passo a Passo)
1. O usuário efetua o login ou cria a conta.
2. O sistema detecta na raiz (`/`) que o usuário não possui nenhum `CareGroup`.
3. O usuário é redirecionado para a rota `/onboarding`.
4. **Passo 1 (Círculo de Cuidado):** O usuário preenche o nome do grupo e submete. O sistema cria o grupo e define o usuário como `ADMIN` na tabela `care_group_members`.
5. **Passo 2 (Paciente):** O sistema avança para o cadastro do paciente vinculando-o ao grupo criado. O usuário insere o nome, tipo sanguíneo (opcional), alergias (lista de strings) e contatos de emergência.
6. Ao concluir a submissão, o sistema redireciona o usuário para o Painel principal (`/`), que agora exibe os dados reais do grupo e do paciente.

### 5. Requisitos Não Funcionais (NFRs) Específicos
* **Acessibilidade AAA:** O formulário deve ser 100% navegável por teclado, contendo focos visíveis, agrupamento correto em `fieldset` para campos relacionados (como contatos de emergência) e mensagens de erro descritivas anunciadas via leitores de tela.
* **Segurança e Validação:** As chamadas de escrita de grupos e pacientes devem exigir autenticação de sessão JWT (`cc_access_token`). Somente membros com a role `ADMIN` podem cadastrar ou atualizar o `CareRecipient` do grupo correspondente.
* **Estética Pro Max (Acolhimento):** Utilização de cantos arredondados (`var(--radius-xl)` / 16px) e paleta Teal/Amber contrastante para assegurar uma sensação de acolhimento clínico e tranquilidade, banindo estéticas agressivas ou ruidosas.

### 6. Métricas de Sucesso
* 100% dos novos usuários passam pelo onboarding sem travar no fluxo.
* Tentativas de acesso direto ao `/` ou `/medicamentos` sem grupos criados são interceptadas e redirecionadas para `/onboarding`.
* A tabela `care_group_members` reflete o criador como `ADMIN` imediatamente após a criação do grupo.
