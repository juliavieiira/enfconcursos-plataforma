#!/usr/bin/env python3
"""
Script mestre que organiza todo o banco de dados em pastas por Matéria, Banca, Cargo,
gera planilha CSV para backup e sincroniza com a aplicação web.
"""

import json
import csv
import re
from pathlib import Path

BASE_DIR = Path("/home/antigravity")
INICIAIS_JSON = BASE_DIR / "dados_questoes" / "questoes_iniciais.json"
BANCO_DIR = BASE_DIR / "02_BANCO_DE_QUESTOES"
SELECON_JSON = BANCO_DIR / "todas_as_questoes.json"
SIMULADOS_DIR = BASE_DIR / "03_SIMULADOS"
BACKUP_DIR = BASE_DIR / "04_EXPORTACOES_E_BACKUPS"
SITE_DATA_JSON = BASE_DIR / "site-enfermagem" / "src" / "data" / "questoes.json"

def sanitizar_nome(texto):
    texto = texto.lower()
    texto = re.sub(r'[áàãâä]', 'a', texto)
    texto = re.sub(r'[éèêë]', 'e', texto)
    texto = re.sub(r'[íìîï]', 'i', texto)
    texto = re.sub(r'[óòõôö]', 'o', texto)
    texto = re.sub(r'[úùûü]', 'u', texto)
    texto = re.sub(r'[ç]', 'c', texto)
    texto = re.sub(r'[^a-z0-9]+', '_', texto)
    return texto.strip('_')

def organizar():
    todas_questoes = []
    
    # 1. Carregar questões da SELECON
    if SELECON_JSON.exists():
        with open(SELECON_JSON, 'r', encoding='utf-8') as f:
            todas_questoes.extend(json.load(f))
            
    # 2. Carregar questões iniciais se não estiverem inclusas
    if INICIAIS_JSON.exists():
        with open(INICIAIS_JSON, 'r', encoding='utf-8') as f:
            iniciais = json.load(f)
            # Adicionar apenas as que não são repetidas
            existentes_ids = set(q.get("id") for q in todas_questoes)
            for q in iniciais:
                if q.get("id") not in existentes_ids:
                    todas_questoes.append(q)

    print(f"📦 Total unificado de questões para organizar: {len(todas_questoes)}")

    # Salvar Banco Geral Unificado
    with open(BANCO_DIR / "todas_as_questoes.json", 'w', encoding='utf-8') as f:
        json.dump(todas_questoes, f, ensure_ascii=False, indent=2)

    # 3. Organizar por Matéria / Assunto
    por_materia = {}
    for q in todas_questoes:
        # Pega a matéria principal
        m = q.get('assunto', q.get('materia', 'Enfermagem')).split(',')[0].strip()
        por_materia.setdefault(m, []).append(q)

    (BANCO_DIR / "por_materia").mkdir(parents=True, exist_ok=True)
    for mat, lista in por_materia.items():
        slug = sanitizar_nome(mat)[:40]
        # Salva em JSON
        with open(BANCO_DIR / "por_materia" / f"{slug}.json", 'w', encoding='utf-8') as f:
            json.dump(lista, f, ensure_ascii=False, indent=2)
        
        # Salva em formato texto legível para leitura rápida humana
        with open(BANCO_DIR / "por_materia" / f"{slug}_legivel.txt", 'w', encoding='utf-8') as f:
            f.write(f"=== CADERNO DE QUESTÕES: {mat.upper()} ===\nTotal: {len(lista)} questões\n\n")
            for i, q in enumerate(lista, 1):
                f.write(f"QUESTÃO {i} [Código: {q.get('id', '')}] - {q.get('orgao')} ({q.get('banca')} {q.get('ano')}) - {q.get('cargo')}\n")
                f.write(f"Assunto: {q.get('assunto')}\n")
                f.write(f"{q.get('enunciado')}\n\n")
                for alt in q.get('alternativas', []):
                    f.write(f"  [{alt.get('id')}] {alt.get('texto')}\n")
                f.write(f"\n✅ Gabarito: {q.get('resposta_correta')}\n")
                f.write(f"💡 Fundamentação: {q.get('fundamentacao_correta', q.get('comentario', ''))}\n")
                if q.get('analise_distratores'):
                    f.write("❌ Distratores:\n")
                    for d in q.get('analise_distratores'):
                        f.write(f"   • Alternativa {d.get('letra')}: {d.get('motivo')}\n")
                f.write("\n" + "-"*60 + "\n\n")

    # 4. Organizar por Banca
    por_banca = {}
    for q in todas_questoes:
        b = q.get('banca', 'SELECON')
        por_banca.setdefault(b, []).append(q)

    (BANCO_DIR / "por_banca").mkdir(parents=True, exist_ok=True)
    for banca, lista in por_banca.items():
        slug = sanitizar_nome(banca)
        with open(BANCO_DIR / "por_banca" / f"{slug}.json", 'w', encoding='utf-8') as f:
            json.dump(lista, f, ensure_ascii=False, indent=2)

    # 5. Organizar por Cargo
    por_cargo = {}
    for q in todas_questoes:
        c = q.get('cargo', 'Geral')
        por_cargo.setdefault(c, []).append(q)

    (BANCO_DIR / "por_cargo").mkdir(parents=True, exist_ok=True)
    for cargo, lista in por_cargo.items():
        slug = sanitizar_nome(cargo)
        with open(BANCO_DIR / "por_cargo" / f"{slug}.json", 'w', encoding='utf-8') as f:
            json.dump(lista, f, ensure_ascii=False, indent=2)

    # 6. Gerar Planilha CSV para Backup (Abre no Excel / Google Sheets)
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    csv_file = BACKUP_DIR / "questoes_enfermagem_backup.csv"
    with open(csv_file, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        writer.writerow(["ID Nosso", "Código Origem", "Banca", "Órgão/Prefeitura", "Ano", "Cargo", "Matéria", "Assunto", "Gabarito", "Enunciado", "Fundamentação Legal"])
        for q in todas_questoes:
            writer.writerow([
                q.get("id"),
                q.get("codigo_origem", ""),
                q.get("banca"),
                q.get("orgao"),
                q.get("ano"),
                q.get("cargo"),
                q.get("materia"),
                q.get("assunto"),
                q.get("resposta_correta"),
                q.get("enunciado"),
                q.get("fundamentacao_correta", q.get("comentario", ""))
            ])
    print(f"📊 Planilha CSV completa gerada em: {csv_file}")

    # 7. Sincronizar com o site React
    SITE_DATA_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(SITE_DATA_JSON, 'w', encoding='utf-8') as f:
        json.dump(todas_questoes, f, ensure_ascii=False, indent=2)
    print(f"🚀 Sincronizado com a plataforma web ({SITE_DATA_JSON})!")

if __name__ == "__main__":
    organizar()
