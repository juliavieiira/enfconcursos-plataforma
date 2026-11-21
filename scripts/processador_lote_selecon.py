#!/usr/bin/env python3
"""
Processador em Lote para Questões da SELECON / QConcursos.
Converte o formato de entrada no padrão EnfConcursos com:
- Código proprietário de 6 dígitos: 2 letras + 4 números (ex: EF0001)
- Nossa própria numeração sequencial
- Extração de Metadados: Ano, Banca, Órgão, Prova, Cargo, Matéria e Assunto
- Estrutura de Gabarito com Fundamentação e Análise de Distratores
"""

import re
import json
from pathlib import Path

BASE_DIR = Path("/home/antigravity")
PREFIXO_CODIGO = "EF"  # EnfConcursos: 2 letras + 4 dígitos (ex: EF0001 a EF0888)

def extrair_metadados_cabecalho(cabecalho_texto):
    """
    Exemplo de entrada:
    '881 Q1242247 Enfermagem > Gestão de Processos e Equipes de Trabalho , Administração em Enfermagem
     Ano: 2019 Banca: SELECON Órgão: Prefeitura de Boa Vista - RR  Prova: SELECON - 2019 - Prefeitura de Boa Vista - RR - Assistente Técnico - Grupo Especial - Técnico de Enfermagem'
    """
    meta = {
        "codigo_origem": "",
        "materia": "Enfermagem",
        "assunto": "",
        "ano": 2024,
        "banca": "SELECON",
        "orgao": "",
        "prova": "",
        "cargo": "Enfermagem"
    }

    # Código original (ex: Q1242247)
    match_qid = re.search(r'\b(Q\d+)\b', cabecalho_texto)
    if match_qid:
        meta["codigo_origem"] = match_qid.group(1)

    # Matéria e Assunto
    match_assunto = re.search(r'Enfermagem\s*>\s*(.*?)(?=\n|Ano:|$)', cabecalho_texto, re.DOTALL)
    if match_assunto:
        meta["assunto"] = match_assunto.group(1).strip()
    else:
        meta["assunto"] = "Conhecimentos Específicos"

    # Ano
    match_ano = re.search(r'Ano:\s*(\d{4})', cabecalho_texto)
    if match_ano:
        meta["ano"] = int(match_ano.group(1))

    # Banca
    match_banca = re.search(r'Banca:\s*([^\n\r]+?)(?=\s*Órgão:|$)', cabecalho_texto)
    if match_banca:
        meta["banca"] = match_banca.group(1).strip()

    # Órgão
    match_orgao = re.search(r'Órgão:\s*([^\n\r]+?)(?=\s*Prova:|$)', cabecalho_texto)
    if match_orgao:
        meta["orgao"] = match_orgao.group(1).strip()

    # Prova
    match_prova = re.search(r'Prova:\s*([^\n\r]+)', cabecalho_texto)
    if match_prova:
        meta["prova"] = match_prova.group(1).strip()

    # Identificar Cargo (Técnico de Enfermagem vs Enfermeiro)
    texto_busca_cargo = (meta["prova"] + " " + cabecalho_texto).lower()
    if "técnico" in texto_busca_cargo or "tecnico" in texto_busca_cargo or "auxiliar" in texto_busca_cargo:
        meta["cargo"] = "Técnico de Enfermagem"
    elif "enfermeiro" in texto_busca_cargo:
        meta["cargo"] = "Enfermeiro"
    else:
        meta["cargo"] = "Enfermagem Geral"

    return meta

def gerar_codigo_nosso(numero_sequencial):
    """Gera código padrão de 6 dígitos: 2 letras + 4 números (ex: EF0001)"""
    return f"{PREFIXO_CODIGO}{numero_sequencial:04d}"

if __name__ == "__main__":
    amostra = """881 Q1242247 Enfermagem > Gestão de Processos e Equipes de Trabalho , Administração em Enfermagem
 Ano: 2019 Banca: SELECON Órgão: Prefeitura de Boa Vista - RR  Prova: SELECON - 2019 - Prefeitura de Boa Vista - RR - Assistente Técnico - Grupo Especial - Técnico de Enfermagem"""
    
    print("=== Testando Extração de Metadados ===")
    meta = extrair_metadados_cabecalho(amostra)
    print(f"Código Gerado Nosso: {gerar_codigo_nosso(1)}")
    print(json.dumps(meta, indent=2, ensure_ascii=False))
