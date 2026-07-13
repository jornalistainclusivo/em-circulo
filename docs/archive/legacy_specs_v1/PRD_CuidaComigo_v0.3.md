---
name: prd_cuida_comigo_v0.3
description: Documento de Requisitos de Produto para a fase de Autenticação e Segurança (v0.3)
jinc-spec-version: "1.0"
project-name: "Em Círculo"
status: "active"
version: "v0.3-Security"
last-updated: "2026-06-11"
---

# Documento de Requisitos de Produto (PRD) - Fase Autenticação (v0.3)

## Em Círculo: Ninguém precisa cuidar sozinho

### 1. Visão Geral e Objetivo da Fase
Após a validação da orquestração de cuidado no MVP (v0.2), o sistema necessita de uma fundação de identidade sólida e segura antes de integrar usuários reais. O objetivo da Fase v0.3 é implementar a **Autenticação Nativa** utilizando JWT (JSON Web Tokens) para isolar o acesso aos Círculos de Cuidado (`CareGroup`).

### 2. Definição do Problema
Atualmente, as interfaces do frontend e os endpoints do backend operam baseados em "Mocks" ou IDs estáticos, sem verificação de identidade. Isso não atende aos requisitos básicos de segurança (NFR) e privacidade de dados de saúde.

### 3. Escopo da Fase (Autenticação JWT Nativa)
Para garantir segurança e prevenção de ataques (XSS e CSRF), esta fase implementará:
1. **Identidade do Usuário (Backend):** Registro e login no FastAPI armazenando as senhas com _hashing_ robusto (`bcrypt`).
2. **Segurança de Transporte (Frontend):** Retorno do token JWT armazenado de forma segura no Next.js via cookies **HttpOnly**, impossibilitando acesso via JavaScript no cliente.
3. **Mapeamento de Contexto:** O endpoint `/api/v1/auth/me` para resgatar o contexto do usuário (a qual `CareGroup` ele pertence e sua `role`).

### 4. Jornadas do Usuário (User Journeys)

#### 4.1. Fluxo de Registro
1. O usuário acessa a página de criação de conta.
2. Insere nome, email e senha.
3. O sistema valida os critérios de senha, executa o hash (bcrypt) e salva na base de dados.
4. Redireciona para o login ou auto-autentica e gera o cookie.

#### 4.2. Fluxo de Login Seguro
1. O usuário submete email e senha.
2. O FastAPI valida o hash. Em caso de sucesso, o servidor gera um JWT assinando o `user_id`.
3. O servidor envia uma resposta com cabeçalho `Set-Cookie` restrito (`HttpOnly`, `Secure`, `SameSite=Strict`).
4. O Next.js (via Server Components ou Middleware) lê o cookie para autorizar navegação nas páginas do painel (`/dashboard`, `/medicamentos`).

### 5. Requisitos Não Funcionais (NFRs) Específicos
* **Segurança (Zero-Trust):** Senhas nunca podem trafegar em texto plano em logs, e o banco só pode armazenar hashes (Bcrypt).
* **Proteção XSS:** O Token JWT **NUNCA** deve ser armazenado no `localStorage` ou `sessionStorage`. O uso de cookies HttpOnly é inegociável, seguindo o `devops-jinc-protocol.md`.
* **Proteção CSRF:** As rotas que alteram estado (`POST`, `PATCH`, `DELETE`) no FastAPI devem exigir cabeçalhos de origem ou validar o token em conjunto com o cookie para requisições cross-origin (embora o Proxy do Next.js reduza esta fricção).

### 6. Métricas de Sucesso
* Criação de sessão bem sucedida validada por testes E2E/Integração.
* Nenhum token vazado no inspecionador de armazenamento do DevTools (Application > LocalStorage).
* O painel inicial do Next.js carrega com base no `user_id` decodificado, abandonando o `DEMO_GROUP`.
