#!/usr/bin/env python3
"""
Script de Carga em Lote de Questões para o Supabase (Pronto para +20.000 questões)
Executa upsert em blocos (batches) com merge-duplicates via REST API nativa do PostgREST.

Uso:
    python3 scripts/importar_questoes_supabase.py --url "https://xyz.supabase.co" --key "sua-service-role-key"
ou configure as variáveis no arquivo site-enfermagem/.env.local:
    VITE_SUPABASE_URL=...
    SUPABASE_SERVICE_ROLE_KEY=...
"""

import sys
import os
import json
import time
import argparse
import urllib.request
import urllib.error
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
BANCO_JSON = BASE_DIR / "02_BANCO_DE_QUESTOES" / "todas_as_questoes.json"
ENV_FILE = BASE_DIR / "site-enfermagem" / ".env.local"
ENV_EXAMPLE = BASE_DIR / "site-enfermagem" / ".env.example"

def carregar_env():
    env_vars = {}
    for p in [ENV_FILE, BASE_DIR / ".env", BASE_DIR / "site-enfermagem" / ".env"]:
        if p.exists():
            with open(p, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        env_vars[k.strip()] = v.strip().strip("'\"")
    return env_vars

def enviar_lote(url, key, lote, tentativas=3):
    endpoint = f"{url.rstrip('/')}/rest/v1/questoes"
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal"
    }
    
    payload = json.dumps(lote, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(endpoint, data=payload, headers=headers, method="POST")
    
    for tentativa in range(1, tentativas + 1):
        try:
            with urllib.request.urlopen(req, timeout=45) as resp:
                if resp.status in (200, 201, 204):
                    return True
        except urllib.error.HTTPError as e:
            err_msg = e.read().decode("utf-8", errors="ignore")
            if tentativa == tentativas:
                print(f"\n❌ Erro HTTP {e.code} ao enviar lote: {err_msg}")
                return False
            time.sleep(2 * tentativa)
        except Exception as e:
            if tentativa == tentativas:
                print(f"\n❌ Erro de conexão ao enviar lote: {e}")
                return False
            time.sleep(2 * tentativa)
    return False

def main():
    parser = argparse.ArgumentParser(description="Importador de Questões para Supabase")
    parser.add_argument("--url", help="URL do projeto Supabase (https://xyz.supabase.co)")
    parser.add_argument("--key", help="Chave service_role (ou anon com RLS liberada)")
    parser.add_argument("--arquivo", help="Caminho do arquivo JSON de questões", default=str(BANCO_JSON))
    parser.add_argument("--tamanho-lote", type=int, default=250, help="Tamanho de cada bloco de envio (padrão: 250)")
    args = parser.parse_args()

    env_vars = carregar_env()
    supabase_url = args.url or env_vars.get("VITE_SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
    supabase_key = args.key or env_vars.get("SUPABASE_SERVICE_ROLE_KEY") or env_vars.get("VITE_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    print("=" * 70)
    print("🚀 IMPORTADOR OFICIAL DE QUESTÕES PARA O SUPABASE")
    print("=" * 70)

    if not supabase_url or "seu-projeto" in supabase_url or not supabase_key:
        print("\n⚠️  ATENÇÃO: Credenciais do Supabase não fornecidas!")
        print("Para enviar as questões ao seu banco em nuvem:")
        print("1. Crie seu projeto em https://app.supabase.com")
        print("2. Execute o schema em 05_BANCO_DE_DADOS/supabase_schema.sql no SQL Editor")
        print("3. Execute este script passando os parâmetros:")
        print("   python3 scripts/importar_questoes_supabase.py --url https://xyz.supabase.co --key SEU_SERVICE_ROLE_KEY")
        print("\nOu configure no arquivo site-enfermagem/.env.local:")
        print("   VITE_SUPABASE_URL=https://xyz.supabase.co")
        print("   SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui\n")
        sys.exit(1)

    arquivo_path = Path(args.arquivo)
    if not arquivo_path.exists():
        print(f"❌ Arquivo não encontrado: {arquivo_path}")
        sys.exit(1)

    print(f"📖 Lendo questões de: {arquivo_path.name}...")
    with open(arquivo_path, "r", encoding="utf-8") as f:
        questoes = json.load(f)

    total = len(questoes)
    print(f"📊 Total de questões a importar: {total}")

    # Preparar dados com campos normalizados
    questoes_formatadas = []
    for q in questoes:
        questoes_formatadas.append({
            "id": q["id"],
            "codigo_origem": q.get("codigo_origem", q["id"]),
            "banca": q.get("banca", "SELECON"),
            "materia": q.get("materia", "Enfermagem"),
            "assunto": q.get("assunto", "Geral"),
            "cargo": q.get("cargo", "Enfermagem"),
            "orgao": q.get("orgao", "Diversos"),
            "ano": int(q.get("ano", 2024)) if str(q.get("ano", "")).isdigit() else 2024,
            "prova": q.get("prova", ""),
            "enunciado": q.get("enunciado", ""),
            "alternativas": q.get("alternativas", []),
            "resposta_correta": q.get("resposta_correta") or q.get("resposta", "A"),
            "fundamentacao_correta": q.get("fundamentacao_correta") or q.get("explicacao") or q.get("comentario", ""),
            "analise_distratores": q.get("analise_distratores", []),
            "ativo": True
        })

    lote_size = args.tamanho_lote
    total_lotes = (total + lote_size - 1) // lote_size

    print(f"📦 Enviando em {total_lotes} lotes de até {lote_size} questões...\n")

    inicio = time.time()
    sucesso_count = 0

    for i in range(total_lotes):
        inicio_idx = i * lote_size
        fim_idx = min(inicio_idx + lote_size, total)
        lote = questoes_formatadas[inicio_idx:fim_idx]

        print(f"  • Lote [{i+1}/{total_lotes}] ({len(lote)} questões: {lote[0]['id']} a {lote[-1]['id']})...", end="", flush=True)
        ok = enviar_lote(supabase_url, supabase_key, lote)
        if ok:
            sucesso_count += len(lote)
            print(" ✅ OK")
        else:
            print(" ❌ FALHA")

    duracao = time.time() - inicio
    print("\n" + "=" * 70)
    print(f"🎉 IMPORTAÇÃO CONCLUÍDA em {duracao:.2f}s!")
    print(f"  • Sucesso: {sucesso_count}/{total} questões persistidas no Supabase.")
    print("=" * 70)

if __name__ == "__main__":
    main()
