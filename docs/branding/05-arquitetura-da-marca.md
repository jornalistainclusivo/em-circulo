---
title: Arquitetura da Marca
version: 1.0.0
status: Draft
last_updated: 2026-07-12
owner: JINC Apps
project: Em Círculo
jinc-spec-version: "1.0.0"
project-name: Em Círculo
---

# Arquitetura da Marca

## Visão Geral

A Arquitetura da Marca define como a **Em Círculo** organiza seus produtos, serviços, funcionalidades e futuras extensões.

Seu objetivo é garantir consistência, escalabilidade e reconhecimento da marca, evitando que novas funcionalidades criem marcas independentes ou confundam a percepção do usuário.

A estratégia adotada é a de **Branded House**, em que uma única marca concentra todo o valor e credibilidade do ecossistema.

---

# Estratégia de Marca

## Modelo

**Branded House (Marca Monolítica)**

Toda funcionalidade faz parte da marca **Em Círculo**.

A marca principal permanece sempre em destaque.

Exemplos:

* Em Círculo
* Em Círculo Medicamentos
* Em Círculo Agenda
* Em Círculo IA
* Em Círculo Comunidade

A identidade visual, linguagem e experiência permanecem unificadas.

jinc-spec-version: "1.0.0"
project-name: Em Círculo
---

# Estrutura Hierárquica

```text
Em Círculo
│
├── Plataforma
│
├── Círculos
│   ├── Pessoas
│   ├── Tarefas
│   ├── Medicamentos
│   ├── Histórico
│   ├── Arquivos
│   └── Convites
│
├── Inteligência
│   ├── Recomendações
│   ├── Alertas Inteligentes
│   └── Assistente IA
│
├── Comunidade
│   ├── Banco de Tempo
│   ├── Rede Solidária
│   └── Voluntários
│
├── Serviços
│   ├── Profissionais
│   ├── Teleorientação
│   ├── Instituições
│   └── Parceiros
│
└── Conta
    ├── Perfil
    ├── Configurações
    └── Assinatura
```

---

# Papel da Marca

A marca principal representa:

* confiança;
* organização;
* colaboração;
* segurança;
* continuidade.

Nenhuma funcionalidade deve competir com a marca principal.

jinc-spec-version: "1.0.0"
project-name: Em Círculo
---

# Organização do Produto

A arquitetura do produto deve refletir o modelo mental do usuário.

O usuário não entra para gerenciar tarefas.

Ele entra para participar de um **Círculo**.

As funcionalidades existem para fortalecer esse Círculo.

---

# Hierarquia Conceitual

## Nível 1

### Marca

**Em Círculo**

Representa todo o ecossistema.

jinc-spec-version: "1.0.0"
project-name: Em Círculo
---

## Nível 2

### Círculo

Representa uma rede de pessoas reunidas para cuidar de alguém.

É a principal entidade funcional da plataforma.

Todo usuário pertence a um ou mais Círculos.

---

## Nível 3

Cada Círculo possui seus próprios recursos.

* Pessoas
* Tarefas
* Medicamentos
* Agenda
* Arquivos
* Histórico
* Avisos

Esses recursos não possuem identidade própria.

São componentes do Círculo.

jinc-spec-version: "1.0.0"
project-name: Em Círculo
---

# Arquitetura de Navegação

O conceito de **Círculo** deve organizar toda a experiência.

Exemplo:

```text
Em Círculo

Meu Círculo
│
├── Pessoas
├── Tarefas
├── Medicamentos
├── Agenda
├── Histórico
├── Arquivos
└── Configurações
```

A navegação deve reforçar continuamente que tudo acontece dentro de um Círculo.

---

# Evolução da Plataforma

A arquitetura foi projetada para crescer sem alterar a identidade da marca.

Possíveis evoluções:

## Inteligência Artificial

* Assistente Em Círculo
* Recomendações Inteligentes
* Planejamento Automático

jinc-spec-version: "1.0.0"
project-name: Em Círculo
---

## Saúde

* Consultas
* Exames
* Vacinas
* Documentos

---

## Comunidade

* Banco de Tempo
* Rede Solidária
* Voluntariado

jinc-spec-version: "1.0.0"
project-name: Em Círculo
---

## Mercado

* Farmácias
* Produtos
* Serviços
* Instituições

Todas essas áreas continuam subordinadas à marca principal.

---

# Arquitetura Verbal

A comunicação também deve seguir a arquitetura da marca.

## Correto

> Compartilhe esta tarefa com seu Círculo.

> Convide alguém para o seu Círculo.

> Seu Círculo recebeu uma nova atividade.

jinc-spec-version: "1.0.0"
project-name: Em Círculo
---

## Evite

> Compartilhe este recurso.

> Gerencie seus membros.

> Acesse o módulo de tarefas.

---

# Nome das Funcionalidades

Sempre utilizar nomes simples.

| Interno            | Público        |
| ------------------ | -------------- |
| CareGroup          | Círculo        |
| CareRecipient      | Pessoa Cuidada |
| Task               | Tarefa         |
| MedicationProtocol | Medicamentos   |
| ActivityLog        | Histórico      |
| Notification       | Aviso          |
| Member             | Pessoa         |
| Invitation         | Convite        |

Os nomes públicos devem refletir linguagem natural.

jinc-spec-version: "1.0.0"
project-name: Em Círculo
---

# Arquitetura Visual

Toda funcionalidade deve utilizar a identidade visual da Em Círculo.

Elementos comuns:

* mesma paleta de cores;
* mesma tipografia;
* mesmo sistema de ícones;
* mesmos componentes visuais;
* mesma linguagem fotográfica;
* mesmas diretrizes de acessibilidade.

O usuário deve perceber que está sempre dentro do mesmo ambiente.

---

# Arquitetura de Produto

A plataforma organiza quatro grandes dimensões.

## Pessoas

Quem faz parte do Círculo.

jinc-spec-version: "1.0.0"
project-name: Em Círculo
---

## Organização

O que precisa ser feito.

---

## Informação

O que todos precisam saber.

jinc-spec-version: "1.0.0"
project-name: Em Círculo
---

## Colaboração

Como as responsabilidades são compartilhadas.

Essas quatro dimensões sustentam toda a evolução do produto.

---

# Critérios para Expansão

Uma nova funcionalidade só deve ser criada se responder positivamente às seguintes perguntas:

* Fortalece o Círculo?
* Facilita a colaboração?
* Reduz a carga mental do cuidador?
* Mantém a simplicidade da plataforma?
* Está alinhada ao propósito da marca?

Caso contrário, sua inclusão deve ser reavaliada.

jinc-spec-version: "1.0.0"
project-name: Em Círculo
---

# Governança da Marca

Toda decisão sobre novos produtos, serviços ou funcionalidades deve preservar:

* o posicionamento da marca;
* a consistência da linguagem;
* a identidade visual;
* a experiência do usuário;
* a promessa institucional.

A marca deve evoluir sem fragmentar sua identidade.

---

# Resumo

A arquitetura da Em Círculo foi concebida para crescer ao longo do tempo sem perder sua essência.

Independentemente das funcionalidades adicionadas no futuro, o usuário continuará percebendo uma única marca, um único propósito e uma única promessa.

> **A tecnologia organiza.**
>
> **As pessoas cuidam.**
>
> **A Em Círculo conecta ambas.**
