# 🗺️ Mapa de Armazenamento e Organização das Questões

Tudo foi estruturado em pastas numeradas, limpas e de fácil acesso para você encontrar, consultar e baixar quando quiser.

---

## 📁 Estrutura das Pastas no Seu Ambiente (`/home/antigravity`)

```
/home/antigravity/
│
├── 📂 01_PDFS_DE_REFERENCIA/                 <-- Onde ficam seus PDFs originais
│   ├── 📁 prefeituras/
│   │   ├── 📁 enfermagem_selecon/           (Cadernos e Provas de Enfermagem SELECON)
│   │   ├── 📁 portugues_selecon/            (Cadernos e Provas de Língua Portuguesa SELECON)
│   │   ├── 📁 enfermagem_fcc/               (Provas de Enfermagem da FCC)
│   │   └── 📁 portugues_fcc/                (Provas de Língua Portuguesa da FCC)
│   ├── 📁 concursos_maiores/                (EBSERH, Federais, Fiocruz)
│   └── 📁 cadernos_simulados/               (Apostilas e simulados prontos em PDF)
│
├── 📂 02_BANCO_DE_QUESTOES/                  <-- Onde ficam as questões catalogadas
│   ├── 📄 todas_as_questoes.json            (Arquivo mestre unificado: 2.007 questões EF0001 a EF0872 e LP0001 a LP1135)
│   ├── 📄 questoes_portugues_selecon.json   (1.135 questões exclusivas de Português)
│   ├── 📁 por_materia/                      (JSON e texto legível .txt de cada disciplina)
│   │   ├── 📁 portugues/                    (13 cadernos temáticos de Português: crase, sintaxe, interpretação...)
│   │   ├── legislacao_do_sus_legivel.txt
│   │   ├── imunizacao_e_pni_legivel.txt
│   │   ├── farmacologia_e_calculo_de_medicamentos_legivel.txt
│   │   └── urgencia_e_emergencia_legivel.txt
│   ├── 📁 por_banca/                        (SELECON, IBAM, VUNESP, CONSULPAM, FGV, AOCP...)
│   └── 📁 por_cargo/                        (tecnico_de_enfermagem, enfermeiro, nivel_medio, nivel_superior)
│
├── 📂 03_SIMULADOS/                          <-- Provas e simulados montados
│   └── simulados prontos para aplicação no site
│
├── 📂 04_EXPORTACOES_E_BACKUPS/              <-- Backups prontos para download
│   ├── 📊 questoes_backup_completo.csv      (2.007 questões completas para Excel / Google Sheets)
│   ├── 📊 questoes_portugues_backup.csv     (1.135 questões de Português)
│   └── 📊 questoes_enfermagem_backup.csv    (872 questões de Enfermagem)
│
├── 📂 site-enfermagem/                       <-- Código e servidor do site interativo (Vite + React)
│   └── 📁 src/data/questoes.json            (Banco de dados ativo do site com 2.007 questões)
│
└── 📂 scripts/                               <-- Scripts de automação
    ├── extrair_questoes_portugues.py        (Processa, audita e padroniza os PDFs de Português: LP0001 a LP1135)
    ├── auditar_e_atualizar_acervo.py        (Audita e padroniza os PDFs de Enfermagem: EF0001 a EF0872)
    └── organizar_e_exportar_questoes.py     (Gera cadernos temáticos e backups em CSV)
```

---

## 🔍 Como você acessa depois?

1. **Para ler em formato texto como apostila:**
   * Basta abrir os arquivos em `02_BANCO_DE_QUESTOES/por_materia/*_legivel.txt` ou `02_BANCO_DE_QUESTOES/por_materia/portugues/*_legivel.txt`.
2. **Para abrir no Excel ou Google Planilhas:**
   * Basta abrir o arquivo `04_EXPORTACOES_E_BACKUPS/questoes_backup_completo.csv`.
3. **Para colocar novas provas em PDF:**
   * Provas SELECON: `01_PDFS_DE_REFERENCIA/prefeituras/enfermagem_selecon/` ou `portugues_selecon/`.
   * Provas FCC: `01_PDFS_DE_REFERENCIA/prefeituras/enfermagem_fcc/` ou `portugues_fcc/`.
