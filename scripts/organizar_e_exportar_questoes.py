#!/usr/bin/env python3
"""
Script que organiza o banco de dados em pastas por Matéria, Banca, Cargo,
gera planilha CSV para backup e sincroniza com a aplicação web.
"""

import json
import csv
import re
from pathlib import Path

BASE_DIR = Path("/home/antigravity")
INPUT_JSON = BASE_DIR / "dados_questoes" / "questoes_iniciais.json"
BANCO_DIR = BASE_DIR / "02_BANCO_DE_QUESTOES"
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
    if not INPUT_JSON.exists():
        print("Arquivo de questões não encontrado.")
        return

    with open(INPUT_JSON, 'r', encoding='utf-8') as f:
        questoes = json.load(f)

    print(f"📦 Total de questões para organizar: {len(questoes)}")

    # 1. Salvar Banco Geral Unificado
    with open(BANCO_DIR / "todas_as_questoes.json", 'w', encoding='utf-8') as f:
        json.dump(questoes, f, ensure_ascii=False, indent=2)

    # 2. Organizar por Matéria
    por_materia = {}
    for q in questoes:
        m = q.get('materia', 'Geral')
        por_materia.setdefault(m, []).append(q)

    for mat, lista in por_materia.items():
        slug = sanitizar_nome(mat)
        # Salva em JSON
        with open(BANCO_DIR / "por_materia" / f"{slug}.json", 'w', encoding='utf-8') as f:
            json.dump(lista, f, ensure_ascii=False, indent=2)
        
        # Salva em formato texto legível para leitura rápida humana
        with open(BANCO_DIR / "por_materia" / f"{slug}_legivel.txt", 'w', encoding='utf-8') as f:
            f.write(f"=== CADERNO DE QUESTÕES: {mat.upper()} ===\nTotal: {len(lista)} questões\n\n")
            for i, q in enumerate(lista, 1):
                f.write(f"QUESTÃO {i} - {q.get('orgao')} ({q.get('banca')} {q.get('ano')}) - {q.get('cargo')}\n")
                f.write(f"Assunto: {q.get('assunto')}\n")
                f.write(f"{q.get('enunciado')}\n\n")
                for alt in q.get('alternativas', []):
                    f.write(f"  [{alt.get('id')}] {alt.get('texto')}\n")
                f.write(f"\n✅ Gabarito: {q.get('resposta_correta')}\n")
                f.write(f"💡 Fundamentação: {q.get('fundamentacao_correta', q.get('comentario'))}\n")
                if q.get('analise_distratores'):
                    f.write("❌ Distratores:\n")
                    for d in q.get('analise_distratores'):
                        f.write(f"   • {d.get('letra')}: {d.get('motivo')}\n")
                f.write("\n" + "-"*60 + "\n\n")

    # 3. Organizar por Banca
    por_banca = {}
    for q in questoes:
        b = q.get('banca', 'Outras')
        por_banca.setdefault(b, []).append(q)

    for banca, lista in por_banca.items():
        slug = sanitizar_nome(banca)
        with open(BANCO_DIR / "por_banca" / f"{slug}.json", 'w', encoding='utf-8') as f:
            json.dump(lista, f, ensure_ascii=False, indent=2)

    # 4. Organizar por Cargo
    por_cargo = {}
    for q in questoes:
        c = q.get('cargo', 'Geral')
        por_cargo.setdefault(c, []).append(q)

    for cargo, lista in por_cargo.items():
        slug = sanitizar_nome(cargo)
        with open(BANCO_DIR / "por_cargo" / f"{slug}.json", 'w', encoding='utf-8') as f:
            json.dump(lista, f, ensure_ascii=False, indent=2)

    # 5. Gerar Planilha CSV para Backup (Abre no Excel / Google Sheets)
    csv_file = BACKUP_DIR / "questoes_enfermagem_backup.csv"
    with open(csv_file, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        writer.writerow(["ID", "Banca", "Órgão/Prefeitura", "Ano", "Cargo", "Matéria", "Assunto", "Gabarito", "Enunciado", "Fundamentação", "Dificuldade"])
        for q in questoes:
            writer.writerow([
                q.get("id"),
                q.get("banca"),
                q.get("orgao"),
                q.get("ano"),
                q.get("cargo"),
                q.get("materia"),
                q.get("assunto"),
                q.get("resposta_correta"),
                q.get("enunciado"),
                q.get("fundamentacao_correta", q.get("comentario")),
                q.get("dificuldade")
            ])
    print(f"📊 Planilha CSV gerada em: {csv_file}")

    # 6. Sincronizar com o site React
    with open(SITE_DATA_JSON, 'w', encoding='utf-8') as f:
        json.dump(questoes, f, ensure_ascii=False, indent=2)
    print(f"🚀 Sincronizado com a plataforma web!")

if __name__ == "__main__":
    organizar()
