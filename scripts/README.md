# ⚙️ Pipeline de Scripts de Automação e Processamento

Esta pasta contém o pipeline automatizado para ingestão, enriquecimento técnico, auditoria e organização das questões na plataforma.

---

## 🔄 Fluxo de Processamento em 4 Etapas

Quando novos cadernos de provas em PDF forem adicionados em `01_PDFS_DE_REFERENCIA/`:

### 1️⃣ Extração Bruta (`extrair_todas_selecon.py` ou `extrair_questoes_pdf.py`)
* Lê os arquivos PDF usando `pypdf`/`pdfplumber`.
* Extrai metadados do cabeçalho oficial: Código de Origem, Banca, Órgão/Prefeitura, Ano, Prova, Cargo, Matéria e Assunto.
* Identifica enunciados, alternativas (A, B, C, D, E) e gabaritos oficiais.
* **Saída:** `02_BANCO_DE_QUESTOES/questoes_selecon_brutas.json`

### 2️⃣ Enriquecimento Científico & Legal (`enriquecer_questoes_selecon.py`)
* Acrescenta fundamentação técnica e jurídica para cada gabarito (baseada em normas do COFEN, Ministério da Saúde, SUS e ANVISA).
* Analisa **cada distrator** (por que A, B, C ou D estão erradas), eliminando comentários genéricos.
* Atribui tags de palavras-chave e nível de dificuldade.
* **Saída:** Questões enriquecidas prontas para auditoria.

### 3️⃣ Auditoria & Filtro de Desatualizadas (`auditar_e_atualizar_acervo.py`)
* Remove questões anuladas ou que não possuem gabarito oficial válido.
* Remove questões desatualizadas por mudanças legislativas (ex: normas COFEN antigas revogadas).
* Descarta blocos com alternativas incompletas ou corrompidas.
* **Saída:** `02_BANCO_DE_QUESTOES/todas_as_questoes.json`

### 4️⃣ Organização, Cadernos e Exportação (`organizar_e_exportar_questoes.py`)
* Reindexa todo o acervo com códigos proprietários exclusivos de 6 dígitos (`EF0001` a `EF0872`).
* Organiza cadernos temáticos em `02_BANCO_DE_QUESTOES/por_materia/` (arquivos `.json` e cadernos `.txt` prontos para impressão).
* Organiza pastas por banca e por cargo.
* Gera a planilha consolidada em `04_EXPORTACOES_E_BACKUPS/questoes_enfermagem_backup.csv`.
* Sincroniza diretamente com o banco de dados do site em `site-enfermagem/src/data/questoes.json`.

---

## 🚀 Como Executar o Pipeline Completo

Para reprocessar e sincronizar todo o acervo com um único comando:

```bash
python3 scripts/extrair_todas_selecon.py
python3 scripts/enriquecer_questoes_selecon.py
python3 scripts/auditar_e_atualizar_acervo.py
python3 scripts/organizar_e_exportar_questoes.py
```
