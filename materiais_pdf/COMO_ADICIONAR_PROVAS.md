# Como Adicionar suas Provas e Questões em PDF

Você pode colocar seus arquivos PDF de provas e gabaritos diretamente nesta pasta organizada:

## Estrutura de Pastas:
- **`materiais_pdf/prefeituras/`**: Provas de prefeituras municipais (ex: `Prefeitura_Santos_Tec_Enfermagem_2024.pdf`, `Prefeitura_Guarulhos_Enfermeiro_2023.pdf`).
- **`materiais_pdf/concursos_federais_estaduais/`**: Provas maiores (ex: `EBSERH_Nacional_2024.pdf`, `Fiocruz_2023.pdf`, `Ministerio_Saude_2024.pdf`).
- **`materiais_pdf/simulados_prontos/`**: Cadernos de simulados já montados ou listas temáticas (ex: `100_Questoes_SUS_Prefeituras.pdf`, `Calculo_Medicamentos_Simulado.pdf`).

## Como as questões vão para o site:
1. Você coloca os PDFs nas pastas correspondentes.
2. Usamos o nosso script extrator localizado em `/home/antigravity/scripts/extrair_questoes_pdf.py` (ou você pode colar o texto da prova diretamente na nossa ferramenta de cadastro rápido do painel).
3. As questões caem instantaneamente no banco de dados do site (`dados_questoes/questoes.json`), prontas para os alunos resolverem no simulado ou no filtro por banca/prefeitura.
