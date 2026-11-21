#!/usr/bin/env python3
"""
Script que organiza EXCLUSIVAMENTE as questões vindas dos PDFs enviados pelo usuário.
Gera pastas por Matéria, Banca, Cargo, planilha CSV para backup e sincroniza com a aplicação web.
"""

import json
import csv
import re
import shutil
from pathlib import Path

BASE_DIR = Path("/home/antigravity")
BANCO_DIR = BASE_DIR / "02_BANCO_DE_QUESTOES"
SELECON_ENRIQUECIDO = BANCO_DIR / "todas_as_questoes.json"
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
    if not SELECON_ENRIQUECIDO.exists():
        print("Arquivo de questões enriquecidas não encontrado.")
        return

    with open(SELECON_ENRIQUECIDO, 'r', encoding='utf-8') as f:
        questoes = json.load(f)

    # Filtrar estritamente para manter APENAS as questões da SELECON dos PDFs
    questoes = [q for q in questoes if q.get("banca") == "SELECON"]

    # Reindexar rigorosamente de EF0001 até o total exato
    for idx, q in enumerate(questoes, 1):
        q["id"] = f"EF{idx:04d}"
        q["numero_ordem"] = idx

    print(f"📦 Total exclusivo dos PDFs da SELECON: {len(questoes)} questões")

    # Limpar e recriar pastas de organização para não sobrar arquivos antigos
    for sub in ["por_materia", "por_banca", "por_cargo"]:
        d = BANCO_DIR / sub
        if d.exists():
            shutil.rmtree(d)
        d.mkdir(parents=True, exist_ok=True)

    # 1. Salvar Banco Geral Unificado Exclusivo
    with open(BANCO_DIR / "todas_as_questoes.json", 'w', encoding='utf-8') as f:
        json.dump(questoes, f, ensure_ascii=False, indent=2)

    # 2. Organizar por Matéria / Assunto
    por_materia = {}
    for q in questoes:
        m = q.get('assunto', q.get('materia', 'Enfermagem')).split(',')[0].strip()
        por_materia.setdefault(m, []).append(q)

    for mat, lista in por_materia.items():
        slug = sanitizar_nome(mat)[:40]
        # Salva em JSON
        with open(BANCO_DIR / "por_materia" / f"{slug}.json", 'w', encoding='utf-8') as f:
            json.dump(lista, f, ensure_ascii=False, indent=2)
        
        # Salva em formato texto legível
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

    # 3. Organizar por Banca (Apenas SELECON)
    por_banca = {}
    for q in questoes:
        b = q.get('banca', 'SELECON')
        por_banca.setdefault(b, []).append(q)

    for banca, lista in por_banca.items():
        slug = sanitizar_nome(banca)
        with open(BANCO_DIR / "por_banca" / f"{slug}.json", 'w', encoding='utf-8') as f:
            json.dump(lista, f, ensure_ascii=False, indent=2)

    # 4. Organizar por Cargo
    por_cargo = {}
    for q in questoes:
        c = q.get('cargo', 'Enfermagem Geral')
        por_cargo.setdefault(c, []).append(q)

    for cargo, lista in por_cargo.items():
        slug = sanitizar_nome(cargo)
        with open(BANCO_DIR / "por_cargo" / f"{slug}.json", 'w', encoding='utf-8') as f:
            json.dump(lista, f, ensure_ascii=False, indent=2)

    # 5. Gerar Planilha CSV para Backup (Abre no Excel / Google Sheets)
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    csv_file = BACKUP_DIR / "questoes_enfermagem_backup.csv"
    with open(csv_file, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        writer.writerow(["ID Nosso", "Código Origem", "Banca", "Órgão/Prefeitura", "Ano", "Cargo", "Matéria", "Assunto", "Gabarito", "Enunciado", "Fundamentação Legal"])
        for q in questoes:
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
    print(f"📊 Planilha CSV gerada em: {csv_file}")

    # 6. Sincronizar com o site React
    SITE_DATA_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(SITE_DATA_JSON, 'w', encoding='utf-8') as f:
        json.dump(questoes, f, ensure_ascii=False, indent=2)
    print(f"🚀 Sincronizado exclusivamente com a plataforma web ({len(questoes)} questões)!")

if __name__ == "__main__":
    organizar()
