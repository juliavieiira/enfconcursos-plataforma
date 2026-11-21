#!/usr/bin/env python3
"""
Script extrator e conversor de provas em PDF ou Texto para o banco de dados do site.
Gera questões com alternativas A, B, C, D, E e prepara para inserção no JSON.
"""

import os
import json
import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
PDF_DIR = BASE_DIR / "materiais_pdf"
JSON_DEST = BASE_DIR / "dados_questoes" / "questoes_iniciais.json"
APP_DATA_DEST = BASE_DIR / "site-enfermagem" / "src" / "data" / "questoes.json"

def listar_arquivos_pdf():
    print(f"=== Varrendo pasta de PDFs: {PDF_DIR} ===")
    pastas = ["prefeituras", "concursos_federais_estaduais", "simulados_prontos"]
    encontrados = []
    for pasta in pastas:
        p = PDF_DIR / pasta
        if p.exists():
            pdfs = list(p.glob("*.pdf"))
            print(f"📁 {pasta}: {len(pdfs)} arquivo(s) encontrado(s)")
            for pdf in pdfs:
                encontrados.append((pasta, pdf))
    return encontrados

def sincronizar_com_site():
    """Copia o banco de questões atualizado para a pasta de dados do app React"""
    if JSON_DEST.exists():
        with open(JSON_DEST, 'r', encoding='utf-8') as f:
            dados = json.load(f)
        
        APP_DATA_DEST.parent.mkdir(parents=True, exist_ok=True)
        with open(APP_DATA_DEST, 'w', encoding='utf-8') as f:
            json.dump(dados, f, ensure_ascii=False, indent=2)
        print(f"✅ Sincronizado com sucesso! {len(dados)} questões no site ({APP_DATA_DEST})")

if __name__ == "__main__":
    print("Script de Ingestão de Questões de Enfermagem")
    listar_arquivos_pdf()
    sincronizar_com_site()
