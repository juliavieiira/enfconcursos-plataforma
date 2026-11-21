# 🩺 EnfConcursos — Plataforma Estratégica de Questões & Simulados de Enfermagem

> **Plataforma focada em aprovação em Concursos Municipais (Prefeituras) e Grandes Órgãos de Saúde (EBSERH, SUS, Federais).**
> Acervo de questões reais com gabaritos comentados, distratores analisados individualmente e auditoria estatística por banca examinadora.

---

## 📌 Visão Geral do Projeto

O **EnfConcursos** foi desenvolvido com padrão profissional de código, arquitetura escalável e rigor científico para apoiar candidatos aos cargos de **Técnico de Enfermagem** e **Enfermeiro (Nível Superior)**.

### Métricas Atuais do Acervo:
* **872 Questões Reais da Banca SELECON** extraídas diretamente de 45 cadernos oficiais de concursos municipais.
* **Códigos Proprietários:** Indexadas sob a nomenclatura padronizada de 6 dígitos: **`EF0001` a `EF0872`**.
* **100% Comentadas:** Fundamentação legal e científica baseada no **COFEN**, **Ministério da Saúde**, **Lei 8.080/90 (SUS)**, **PNI** e **NR-32**.
* **Análise de Distratores:** Explicação detalhada de por que as alternativas erradas estão incorretas, eliminando respostas genéricas.
* **Auditoria Rigorosa:** Questões anuladas pelas bancas ou desatualizadas por mudanças na legislação (ex: Resolução COFEN 311/2007 revogada pela 564/2017) foram auditadas e excluídas do acervo ativo.

---

## 🗂️ Arquitetura de Pastas do Repositório

O repositório segue uma organização numerada, limpa e modular:

```
├── 📁 01_PDFS_DE_REFERENCIA/                 # PDFs originais das provas e cadernos de concurso
│   ├── 📁 prefeituras/                       # Provas municipais (SELECON, IBAM, VUNESP, Consulpam...)
│   │   └── 📁 selecon_questoes/              # 45 PDFs de referência da SELECON
│   ├── 📁 concursos_maiores/                 # Provas EBSERH, Fiocruz, Federais e Estaduais
│   ├── 📁 cadernos_simulados/                # Apostilas e simulados prontos em PDF
│   └── 📄 COMO_ADICIONAR_PROVAS.md           # Guia de organização para novos PDFs
│
├── 📁 02_BANCO_DE_QUESTOES/                  # Banco de dados processado e catalogado
│   ├── 📄 todas_as_questoes.json             # Acervo mestre unificado (872 questões auditadas)
│   ├── 📄 questoes_selecon_brutas.json       # Backup da extração direta dos PDFs
│   ├── 📁 por_materia/                       # Cadernos temáticos (.json e .txt legíveis)
│   ├── 📁 por_banca/                         # Questões organizadas por banca (SELECON.json...)
│   └── 📁 por_cargo/                         # Divisão por cargo (tecnico_de_enfermagem, enfermeiro)
│
├── 📁 03_SIMULADOS/                          # Estruturas e provas montadas para treino
│
├── 📁 04_EXPORTACOES_E_BACKUPS/              # Exportações para análise de dados e planilhas
│   └── 📊 questoes_enfermagem_backup.csv     # Planilha consolidada compatível com Excel e Google Sheets
│
├── 📁 scripts/                               # Pipeline de automação e ingestão de questões
│   ├── 📄 extrair_todas_selecon.py           # 1. Extração automatizada de PDFs para JSON
│   ├── 📄 enriquecer_questoes_selecon.py     # 2. Enriquecimento técnico e análise de distratores
│   ├── 📄 auditar_e_atualizar_acervo.py      # 3. Auditoria de anuladas e legislação desatualizada
│   ├── 📄 organizar_e_exportar_questoes.py   # 4. Geração de cadernos, CSV e sincronização do site
│   ├── 📄 extrair_questoes_pdf.py            # Script genérico para novos lotes de provas
│   └── 📄 README.md                          # Manual de execução dos scripts
│
├── 📁 site-enfermagem/                       # Aplicação Web (Frontend interativo)
│   ├── 📁 src/
│   │   ├── 📄 App.jsx                        # Componente principal da aplicação
│   │   ├── 📄 App.css                        # Design system e estilização responsiva
│   │   ├── 📁 data/
│   │   │   ├── 📄 questoes.json              # Banco consumido pela interface web
│   │   │   └── 📄 bancasInfo.js              # Base de conhecimento estratégico das bancas
│   │   └── 📄 main.jsx                       # Ponto de entrada React 19
│   ├── 📄 package.json                       # Dependências (React 19, Lucide Icons, Vite)
│   └── 📄 vite.config.js                     # Configuração do bundler Vite
│
├── 📄 MAPA_DO_SISTEMA.md                     # Resumo de navegação rápida das pastas
├── 📄 .gitignore                             # Regras completas de exclusão do Git
└── 📄 README.md                              # Documentação oficial do projeto
```

---

## 💻 Funcionalidades da Plataforma Web

1. **Aba Questões:**
   * Busca textual instantânea (enunciado, órgão, assunto).
   * Filtros combinados por cargo, banca examinadora, disciplina e tipo de concurso (Prefeituras vs. Grandes Concursos).
   * Resolução interativa com feedback de acerto/erro imediato.
   * Exibição completa da fundamentação correta e detalhamento de cada distrator.
   * Paginação progressiva ("Carregar Mais Questões").

2. **Aba Padrão da Banca (Raio-X Inteligente):**
   * **Seletor Multi-Bancas:** Alterne entre `Todas as Bancas`, `SELECON`, `VUNESP`, `IBAM`, `AOCP`, `FGV`, etc.
   * **Gráfico de Pizza / Donut:** Representação visual proporcional com cálculo matemático exato em tempo real.
   * **Ranking Decrescente:** Ordenação do 1º ao último conteúdo mais cobrado com porcentagens e barras de progresso.
   * **Botão "Resolver":** Redireciona diretamente para as questões daquele tema e daquela banca.
   * **Filtro por Cargo:** Analisa separadamente o comportamento de prova para Técnico e Enfermeiro.
   * **Dicas de Ouro da Banca:** Resumo das pegadinhas e temas queridinhos da banca selecionada.

3. **Aba Simulados:**
   * Provas cronometradas com cálculo de tempo médio por questão e nota de corte.

4. **Aba PDFs & Provas:**
   * Acesso à estrutura de arquivos e cadernos temáticos.

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos:
* Node.js (v18 ou superior)
* Python (v3.10 ou superior)

### Passo a Passo:

```bash
# 1. Clonar o repositório
git clone https://github.com/juliavieiira/enfconcursos-plataforma.git
cd enfconcursos-plataforma

# 2. Entrar na pasta do site e instalar as dependências
cd site-enfermagem
npm install

# 3. Iniciar o servidor de desenvolvimento
npm run dev

# 4. Acessar no navegador:
# http://localhost:5173
```

Para gerar a versão otimizada de produção:
```bash
npm run build
```

---

## 🔄 Como Adicionar Novas Provas e Bancas

1. Salve os arquivos PDF das novas provas em `01_PDFS_DE_REFERENCIA/prefeituras/` (ou `concursos_maiores/`).
2. Execute o pipeline de automação:
   ```bash
   python3 scripts/extrair_todas_selecon.py
   python3 scripts/enriquecer_questoes_selecon.py
   python3 scripts/auditar_e_atualizar_acervo.py
   python3 scripts/organizar_e_exportar_questoes.py
   ```
3. O script reprocessa os dados, reindexa no padrão `EF...`, atualiza a planilha CSV em `04_EXPORTACOES_E_BACKUPS/` e sincroniza o banco do site em `site-enfermagem/src/data/questoes.json`.
4. Faça commit e push no GitHub:
   ```bash
   git add -A
   git commit -m "feat: novas questoes adicionadas ao acervo"
   git push origin main
   ```

---

## 🛡️ Padrão de Qualidade dos Comentários

Todas as questões da plataforma seguem o rigor técnico:
* **Fundamentação:** Citação expressa de artigos de leis (ex: Lei 7.498/86, Lei 8.080/90, Lei 8.142/90), resoluções do COFEN e manuais técnicos do Ministério da Saúde.
* **Distratores:** Justificativa técnica pontual para cada uma das alternativas incorretas (A, B, C, D ou E).
* **Sem respostas genéricas:** Foco em fixação de conteúdo para garantir aprovação.

---

## 📄 Licença e Direitos

Projeto desenvolvido para a plataforma **EnfConcursos**. Todos os direitos reservados.
