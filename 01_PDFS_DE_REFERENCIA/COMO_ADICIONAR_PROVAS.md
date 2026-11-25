# 📄 Como Adicionar suas Provas e Questões em PDF

Você pode colocar seus arquivos PDF de provas, gabaritos e cadernos diretamente nesta pasta organizada:

## Estrutura de Pastas:
- **`01_PDFS_DE_REFERENCIA/prefeituras/enfermagem_selecon/`**: Cadernos e provas de Enfermagem da SELECON.
- **`01_PDFS_DE_REFERENCIA/prefeituras/portugues_selecon/`**: Cadernos e provas de Língua Portuguesa da SELECON.
- **`01_PDFS_DE_REFERENCIA/prefeituras/enfermagem_fcc/`**: Cadernos e provas de Enfermagem da FCC.
- **`01_PDFS_DE_REFERENCIA/prefeituras/portugues_fcc/`**: Cadernos e provas de Língua Portuguesa da FCC.
- **`01_PDFS_DE_REFERENCIA/concursos_maiores/`**: Provas federais e estaduais (EBSERH, Fiocruz, Secretarias de Saúde).
- **`01_PDFS_DE_REFERENCIA/cadernos_simulados/`**: Cadernos temáticos prontos.

## Como as questões vão para o site:
1. Você coloca os PDFs nas pastas correspondentes.
2. Executa o pipeline de scripts em `scripts/` para extração, enriquecimento e auditoria.
3. As questões caem automaticamente no banco de dados do site (`site-enfermagem/src/data/questoes.json`), com gabaritos comentados, distratores explicados e estatísticas de banca atualizadas!
