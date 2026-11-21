# 📄 Como Adicionar suas Provas e Questões em PDF

Você pode colocar seus arquivos PDF de provas, gabaritos e cadernos diretamente nesta pasta organizada:

## Estrutura de Pastas:
- **`01_PDFS_DE_REFERENCIA/prefeituras/`**: Provas de prefeituras municipais (ex: cadernos da SELECON, IBAM, VUNESP, Consulpam, etc.).
- **`01_PDFS_DE_REFERENCIA/concursos_maiores/`**: Provas federais e estaduais (ex: EBSERH, Fiocruz, Ministério da Saúde, Secretarias Estaduais de Saúde).
- **`01_PDFS_DE_REFERENCIA/cadernos_simulados/`**: Cadernos temáticos prontos (ex: 100 Questões de SUS, 50 Cálculos de Medicamentos).

## Como as questões vão para o site:
1. Você coloca os PDFs nas pastas correspondentes.
2. Executa o pipeline de scripts em `scripts/` para extração, enriquecimento e auditoria.
3. As questões caem automaticamente no banco de dados do site (`site-enfermagem/src/data/questoes.json`), com gabaritos comentados, distratores explicados e estatísticas de banca atualizadas!
