# ⚙️ Pipeline de Scripts de Automação e Processamento

Esta pasta contém o pipeline automatizado para ingestão, enriquecimento técnico, auditoria e organização das questões na plataforma.

---

## 🔄 Fluxo de Processamento por Disciplina

Quando novos cadernos de provas em PDF forem adicionados em `01_PDFS_DE_REFERENCIA/`:

### 🅰️ Pipeline de Língua Portuguesa (`scripts/extrair_questoes_portugues.py`)
* Processa os 57 PDFs de Língua Portuguesa em `01_PDFS_DE_REFERENCIA/prefeituras/portugues/`.
* Audita questões anuladas, desatualizadas ou corrompidas.
* Indexa com os códigos proprietários de 6 dígitos: **`LP0001` a `LP1135`**.
* Enriquece com fundamentação gramatical normativa (Cegalla, Bechara, Celso Cunha, Rocha Lima) e análise cirúrgica de cada distrator.
* Gera 13 cadernos temáticos em `02_BANCO_DE_QUESTOES/por_materia/portugues/` (.json e .txt legível).
* Gera planilha CSV em `04_EXPORTACOES_E_BACKUPS/questoes_portugues_backup.csv`.
* Unifica com Enfermagem em `02_BANCO_DE_QUESTOES/todas_as_questoes.json` e sincroniza o frontend em `site-enfermagem/src/data/questoes.json`.

### 🅱️ Pipeline de Enfermagem (`scripts/auditar_e_atualizar_acervo.py`)
* Processa os cadernos de Enfermagem em `01_PDFS_DE_REFERENCIA/prefeituras/enfermagem/`.
* Indexa com os códigos proprietários: **`EF0001` a `EF0872`**.
* Aplica protocolos do Ministério da Saúde, COFEN (Resolução 564/2017) e SUS.
* Gera cadernos temáticos e planilha CSV em `04_EXPORTACOES_E_BACKUPS/questoes_enfermagem_backup.csv`.

---

## 🚀 Como Executar o Pipeline

```bash
# Para processar e atualizar Língua Portuguesa + Banco Geral Unificado:
python3 scripts/extrair_questoes_portugues.py

# Para auditar e atualizar Enfermagem:
python3 scripts/auditar_e_atualizar_acervo.py
```
