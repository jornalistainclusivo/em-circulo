---
name: DEVOPS_AND_SECURITY
jinc-spec-version: "1.0.0"
project-name: Em Círculo
status: draft
---

# Protocolos de DevOps e Segurança

> Este documento alinha a infraestrutura com a abordagem Híbrida e Zero-Trust definida pelo JINC Protocol.

## 1. Versionamento Perpétuo e CI/CD
Para manter os estados de desenvolvimento perfeitamente rastreáveis:
- A equipe (humana ou agentes) deve gerar **Git Tags** semânticas e baseadas em branch: `v[Major].[Minor].[Patch]-[branch-name]`.
- Nenhuma submissão deve contornar o arquivo `checklist.py`. O pipeline de segurança precede o commit final.

## 2. Protocolo de Higiene de Ambiente (Zero-Trust)
Antes de declarar o encerramento de uma sessão ou branch:
- Devem ser executados os roteiros de limpeza (ou o comando `sanitize-local.sh` via Powershell).
- Remoção absoluta de artefatos efêmeros (`.next`, `coverage`, `build`), mas garantindo a preservação dos diretórios de ambiente protegido (`.venv`).
- Nenhuma chave secreta (`.env`, certificados) pode ser exposta no log do console ou submetida ao Git.

## 3. Estratégia de Deploy
- A infraestrutura será conteinerizada (`Docker` Multi-Stage), empregando imagens distroless ou Alpine para minimizar a superfície de ataque em produção.
- Todos os logs operacionais disparados por blocos `try/catch` no FastAPI ou Next.js devem ser processados estruturalmente para telemetria (monitoramento centralizado).

## 4. Rollback
Sempre deve existir um artefato tangível (Tag Git) correspondente à infraestrutura na versão `vX.X.X` caso as métricas operacionais falhem ou surjam erros críticos de runtime no backend (`uvicorn`).
