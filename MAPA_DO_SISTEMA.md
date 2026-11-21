# 🗺️ Mapa de Armazenamento e Organização das Questões

Tudo foi estruturado em pastas numeradas, limpas e de fácil acesso para você encontrar, consultar e baixar quando quiser.

---

## 📁 Estrutura das Pastas no Seu Ambiente (`/home/antigravity`)

```
/home/antigravity/
│
├── 📂 01_PDFS_DE_REFERENCIA/                 <-- Onde ficam seus PDFs originais
│   ├── 📁 prefeituras/
│   │   ├── 📁 enfermagem/                   (Todos os cadernos e provas de Enfermagem)
│   │   └── 📁 portugues/                    (Todos os cadernos e provas de Português)
│   ├── 📁 concursos_maiores/                (EBSERH, Federais, Fiocruz)
│   └── 📁 cadernos_simulados/               (Apostilas e simulados prontos em PDF)
│
├── 📂 02_BANCO_DE_QUESTOES/                  <-- Onde ficam as questões catalogadas
│   ├── 📄 todas_as_questoes.json            (Arquivo mestre unificado)
│   ├── 📁 por_materia/                      (JSON e texto legível .txt de cada disciplina)
│   │   ├── legislacao_do_sus_legivel.txt
│   │   ├── imunizacao_e_pni_legivel.txt
│   │   ├── farmacologia_e_calculo_de_medicamentos_legivel.txt
│   │   ├── etica_e_legislacao_profissional_legivel.txt
│   │   ├── urgencia_e_emergencia_legivel.txt
│   │   ├── saude_da_mulher_legivel.txt
│   │   └── biosseguranca_e_controle_de_infeccao_legivel.txt
│   ├── 📁 por_banca/                        (IBAM, VUNESP, CONSULPAM, FGV, AOCP...)
│   └── 📁 por_cargo/                        (tecnico_de_enfermagem, enfermeiro)
│
├── 📂 03_SIMULADOS/                          <-- Provas e simulados montados
│   └── simulados prontos para aplicação no site
│
├── 📂 04_EXPORTACOES_E_BACKUPS/              <-- Backups prontos para download
│   └── 📊 questoes_enfermagem_backup.csv    (Planilha para abrir no Excel ou Google Sheets)
│
├── 📂 site-enfermagem/                       <-- Código e servidor do site interativo
│
└── 📂 scripts/                               <-- Scripts de automação
    ├── extrair_questoes_pdf.py              (Processa novos PDFs)
    └── organizar_e_exportar_questoes.py     (Gera as pastas e a planilha CSV)
```

---

## 🔍 Como você acessa depois?

1. **Para ler em formato texto como apostila:**
   * Basta abrir os arquivos em `02_BANCO_DE_QUESTOES/por_materia/*_legivel.txt`.
2. **Para abrir no Excel ou Google Planilhas:**
   * Basta abrir o arquivo `04_EXPORTACOES_E_BACKUPS/questoes_enfermagem_backup.csv`.
3. **Para colocar novas provas em PDF:**
   * Basta colocar em `01_PDFS_DE_REFERENCIA/prefeituras/` (ou arrastar no chat).
