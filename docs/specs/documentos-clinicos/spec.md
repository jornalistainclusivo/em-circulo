---
name: spec
jinc-spec-version: "1.0.0"
project-name: Em Círculo
status: draft
---

# Spec: Arquivo de Documentos Clínicos (v2.1)

## 1. Visão Geral
Módulo seguro para upload, armazenamento e visualização de documentos clínicos da rede de apoio (receitas, exames e laudos). Operado sob a arquitetura S3-Compatible com forte isolamento Zero-Trust.

## 2. Regras de Negócio e Restrições (Quality Gates)

### 2.1 Regras de Upload (POST)
- **Tamanho Máximo:** 10MB por arquivo. Rejeitar HTTP 413 Payload Too Large caso exceda.
- **Formatos Permitidos:** PDF (`application/pdf`), JPG/JPEG (`image/jpeg`) e PNG (`image/png`). Rejeitar HTTP 415 Unsupported Media Type caso seja outro.
- **Armazenamento Seguro:** O backend não salva o BLOB em banco relacional, mas faz stream (ou repassa via buffer restrito em memória) para o Storage (AWS S3/MinIO). O banco armazena apenas a URI de origem (`s3_key`).

### 2.2 Controle de Acesso (RBAC) e Zero-Trust
- O endpoint exige validação rígida de RBAC cruzando o `group_id` com a tabela `CareGroupMember`. 
- Caso o usuário não pertença ao grupo do paciente, rejeitar com HTTP 403 Forbidden.

### 2.3 Mecânica de Visualização/Download (Presigned URLs)
- A rota GET de download **não devolve o binário do arquivo**. Em vez disso, devolve um JSON com um Presigned URL gerado on-the-fly pelo backend conectando-se ao S3.
- **Validade do Link:** O link pré-assinado terá expiração máxima de 5 minutos (300 segundos) a partir da sua geração.
- Isso blinda o ecossistema, garantindo que caso a URL vaze para fora do app, ela perderá o acesso quase imediatamente.
