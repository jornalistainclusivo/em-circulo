#!/usr/bin/env python3
"""
Validador de Contratos SDD (Specification-Driven Development)
Garante a coerência entre entidades, rotas e metadados nos contratos YAML/Markdown.
"""
import os
import re
import sys
import logging
from pathlib import Path
from typing import Dict, Any, Tuple, Set

# Configuração de observabilidade para CI/CD (Zero-Trust mindset)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("sdd-validator")

try:
    import yaml
except ImportError:
    logger.error("PyYAML is not installed. Please run 'pip install pyyaml'.")
    sys.exit(1)

SPECS_DIR = Path("docs")

# Chaves exigidas no cabeçalho dos contratos
REQUIRED_FRONTMATTER_KEYS: Set[str] = {"jinc-spec-version", "project-name", "status"}

# Entidades Core definidas no PRD
REQUIRED_ENTITIES: Set[str] = {
    "CareGroup",
    "CareRecipient",
    "Task",
    "MedicationProtocol"
}

# Rotas essenciais para a orquestração assíncrona
REQUIRED_ROUTES: Set[str] = {
    r"/api/v1/care-groups",
    r"/api/v1/tasks"
}

def extract_frontmatter(content: str) -> Tuple[Dict[str, Any], str]:
    """Extrai e faz parsing do bloco YAML (Frontmatter) em arquivos Markdown."""
    match = re.match(r"^---\n(.*?)\n---\n(.*)", content, re.DOTALL)
    if match:
        try:
            frontmatter = yaml.safe_load(match.group(1))
            return (frontmatter if isinstance(frontmatter, dict) else {}), match.group(2)
        except yaml.YAMLError as e:
            logger.error(f"Erro de sintaxe no YAML do frontmatter: {e}")
            return {}, content
    return {}, content

def validate_frontmatter(frontmatter: Dict[str, Any], filepath: Path) -> bool:
    """Valida a presença das chaves obrigatórias exigidas pelas regras de projeto."""
    missing_keys = REQUIRED_FRONTMATTER_KEYS - set(frontmatter.keys())
    if missing_keys:
        logger.error(f"[{filepath.name}] ❌ Chaves obrigatórias ausentes no Frontmatter: {missing_keys}")
        return False
    return True

def main() -> None:
    logger.info("Iniciando validação de sintaxe e estrutura dos contratos SDD...")
    
    if not SPECS_DIR.exists() or not SPECS_DIR.is_dir():
        logger.error(f"Diretório '{SPECS_DIR}' não encontrado. Execute o script na raiz do repositório.")
        sys.exit(1)

    has_errors: bool = False
    files_checked: int = 0

    # Rastreamento de cobertura em todo o diretório specs/
    found_entities: Set[str] = set()
    found_routes: Set[str] = set()

    for file_path in SPECS_DIR.rglob("*"):
        if "archive" in file_path.parts:
            continue
        
        if file_path.suffix in [".md", ".yml", ".yaml"]:
            files_checked += 1
            logger.info(f"Analisando: {file_path.name}")
            
            try:
                content = file_path.read_text(encoding="utf-8")
                
                # Parsing YAML/Markdown
                if file_path.suffix == ".md":
                    frontmatter, body = extract_frontmatter(content)
                else:
                    frontmatter = yaml.safe_load(content) or {}
                    body = content
                
                # Validação de Frontmatter
                if "openapi.yaml" in file_path.name:
                    logger.info(f"[{file_path.name}] Ignorando frontmatter JINC para contrato OpenAPI raw.")
                elif frontmatter:
                    if not validate_frontmatter(frontmatter, file_path):
                        has_errors = True
                else:
                    logger.warning(f"[{file_path.name}] Nenhum bloco Frontmatter estruturado encontrado. Padrão exige cabeçalhos para parseamento de IA.")

                # Busca pelas Entidades Core no texto (considera variações de case como care_groups)
                content_lower = content.lower()
                for entity in REQUIRED_ENTITIES:
                    entity_lower = entity.lower()
                    snake_case = re.sub(r'(?<!^)(?=[A-Z])', '_', entity).lower()
                    
                    if entity_lower in content_lower or snake_case in content_lower:
                        found_entities.add(entity)

                # Busca pelos padrões de Rota
                for route_pattern in REQUIRED_ROUTES:
                    if re.search(route_pattern, content):
                        found_routes.add(route_pattern)

            except Exception as e:
                logger.error(f"Erro inesperado ao processar {file_path.name}: {str(e)}")
                has_errors = True

    if files_checked == 0:
        logger.error("❌ Nenhum contrato YAML/Markdown encontrado no diretório docs.")
        sys.exit(1)

    # Validação Global do PRD
    missing_global_entities = REQUIRED_ENTITIES - found_entities
    if missing_global_entities:
        logger.error(f"🚨 FALHA GRAVE (Divergência de PRD): Entidades obrigatórias omitidas nos contratos técnicos: {missing_global_entities}")
        has_errors = True

    missing_global_routes = REQUIRED_ROUTES - found_routes
    if missing_global_routes:
        logger.error(f"🚨 FALHA GRAVE (Divergência de PRD): Rotas críticas ausentes nos contratos de API: {missing_global_routes}")
        has_errors = True

    if has_errors:
        logger.error("❌ Validação estrutural do SDD falhou. Pipeline bloqueada. Corrija os erros e crie um novo commit.")
        sys.exit(1)
    
    logger.info("✅ Validação estrutural do SDD aprovada. Todos os contratos estão alinhados com as restrições do PRD.")

if __name__ == "__main__":
    main()
