---
name: tech_spec_autenticacao
description: Especificação Técnica da Autenticação JWT e Segurança (v0.2)
jinc-spec-version: "1.0.0"
project-name: Em Círculo
feature-name: Autenticação JWT Native & HttpOnly Cookies
status: draft
prd-ref: specs/PRD_EmCirculo_v0.3.md
coverage: "3/3 FRs mapped"
created-at: 2026-06-11
authors: Antigravity / tech-lead
---

# Especificação Técnica — Autenticação & Segurança (v0.2)

## 1. Contexto e Objetivos
Estabelecer a camada de segurança para acesso aos recursos do sistema. Remover o estado simulado do Next.js substituindo-o pela recuperação de identidade via JWT emitido pelo FastAPI, trafegado estritamente por meio de cookies seguros.

## 2. Diagrama C4 (Container) - Fluxo de Autenticação

1. O **Next.js (Server Action / Route Handler)** recebe credenciais do formulário de login.
2. Repassa via POST para `FastAPI /api/v1/auth/login`.
3. **FastAPI** valida o hash (Bcrypt), assina um token JWT com `user_id` e o devolve.
4. O **Next.js** intercepta a resposta e emite o cabeçalho `Set-Cookie` para o Browser (HttpOnly, Secure, SameSite=Lax).
5. Requisições subsequentes ao FastAPI via Next.js Proxy embutem o Cookie ou injetam o JWT no cabeçalho `Authorization: Bearer <token>`.

## 3. Esquema Relacional Otimizado (PostgreSQL)

```sql
-- Entidade: User (Identidade Base)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_email ON users(email);
```

> **Nota:** A tabela `care_group_members` (já existente no Tech_Spec_v0.1) se conectará a esta tabela de `users` pelo `user_id`.

## 4. Contratos de API (FastAPI)

**`POST /api/v1/auth/register`**
- **Payload:** `{"email": "...", "password": "...", "full_name": "..."}`
- **Response:** `201 Created` e informações básicas (sem a senha).
- **Business Rule:** Hash de senha deve ser gerado pelo PassLib (`bcrypt`).

**`POST /api/v1/auth/login`**
- **Payload:** Formulário `OAuth2PasswordRequestForm` (username/password).
- **Response (JSON):** 
  ```json
  {
    "access_token": "eyJhbG... (JWT)",
    "token_type": "bearer"
  }
  ```

**`GET /api/v1/auth/me`**
- **Dependência:** Exige o token JWT válido.
- **Response:** Retorna os dados do `User` e a lista de `care_group_ids` ao qual pertence.

## 5. Implementação no Frontend (Next.js)

### 5.1 Server Actions (`app/actions/auth.ts`)
A submissão do login invocará um Server Action em vez de `fetch` direto no cliente.
O Server Action chamará o backend, receberá o token e usará o método `cookies().set()` do Next.js:

```typescript
import { cookies } from "next/headers";

cookies().set("cc_access_token", data.access_token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 7 // 7 days
});
```

### 5.2 Middleware de Rotas (`middleware.ts`)
Interceptar rotas protegidas (`/dashboard`, `/medicamentos`).
Se o cookie `cc_access_token` não estiver presente, redirecionar via `NextResponse.redirect(new URL('/login', request.url))`.

## 6. Prevenções e Diretrizes de Segurança (DevOps)
- A chave secreta (`SECRET_KEY`) utilizada para assinar os JWTs será carregada via variável de ambiente (`os.getenv`).
- Qualquer commit de segredos resultará em falha no `security_scan.py`.
- Expiração do Token (TTL) definida por padrão como `ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7` (1 semana).
