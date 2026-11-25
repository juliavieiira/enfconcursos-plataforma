#!/usr/bin/env python3
"""
Gerador dos Simulados Oficiais da FCC no Padrão Estatístico da Banca
Cria 2 simulados completos de 60 questões (20 Português + 40 Enfermagem) rigorosamente balanceados.
Salva em site-enfermagem/src/data/simuladosData.js e em 03_SIMULADOS/
"""

import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent if "__file__" in locals() else Path("/home/antigravity")
BANCO_DIR = BASE_DIR / "02_BANCO_DE_QUESTOES"
SIMULADOS_DIR = BASE_DIR / "03_SIMULADOS"
SITE_SIMULADOS_JS = BASE_DIR / "site-enfermagem" / "src" / "data" / "simuladosData.js"

with open(BANCO_DIR / "questoes_fcc_enfermagem.json") as f:
    enf = json.load(f)
with open(BANCO_DIR / "questoes_fcc_portugues.json") as f:
    port = json.load(f)

grade_enf = [
    ('Fundamentos e Procedimentos de Enfermagem', 6),
    ('Saúde Pública, SUS e Atenção Básica', 5),
    ('Farmacologia, Cálculo e Administração de Medicamentos', 4),
    ('Legislação de Enfermagem e Código de Ética', 4),
    ('Urgência, Emergência e PCR', 3),
    ('Segurança do Paciente e Biossegurança', 3),
    ('Imunização e Calendário Vacinal (PNI)', 3),
    ('Epidemiologia e Vigilância em Saúde', 3),
    ('Doenças Crônicas Não Transmissíveis (HAS, Diabetes)', 2),
    ('Saúde da Mulher, Pré-Natal e Parto', 2),
    ('Doenças Infecciosas e Parasitárias (Dengue, Tuberculose, HIV)', 1),
    ('Administração, Gestão e Auditoria', 1),
    ('Saúde do Idoso e Cuidados Paliativos', 1),
    ('Saúde Mental e Atenção Psicossocial', 1),
    ('Centro Cirúrgico e CME (Esterilização)', 1)
]

grade_port = [
    ('Interpretação e Compreensão de Textos', 8),
    ('Sintaxe da Oração e do Período', 5),
    ('Semântica e Significação das Palavras', 2),
    ('Morfologia - Tempos e Modos Verbais', 2),
    ('Morfologia - Pronomes e Colocação Pronominal', 1),
    ('Pontuação e Emprego da Vírgula', 1),
    ('Conjunções e Relações Lógico-Discursivas', 1)
]

def selecionar_questoes(acervo, grade, offset=0):
    selecionadas = []
    usadas = set()
    for tema, qtd in grade:
        candidatas = [q for q in acervo if q['assunto'] == tema]
        # Pega a fatia com offset para o simulado 1 vs simulado 2
        inicio = offset * qtd
        fatia = candidatas[inicio:inicio + qtd]
        if len(fatia) < qtd:
            fatia = candidatas[:qtd]
        for q in fatia:
            selecionadas.append(q)
            usadas.add(q['id'])
    return selecionadas

# Montar Simulado #01 FCC
port_sim1 = selecionar_questoes(port, grade_port, offset=0)
enf_sim1 = selecionar_questoes(enf, grade_enf, offset=0)
questoes_sim1 = port_sim1 + enf_sim1
for idx, q in enumerate(questoes_sim1, 1):
    q_copy = dict(q)
    q_copy["numero_simulado"] = idx
    questoes_sim1[idx - 1] = q_copy

simulado_fcc_01 = {
    "id": "simulado-fcc-01",
    "numero": 1,
    "titulo": "Simulado Oficial FCC #01 - Edição Realista Proporcional",
    "subtitulo": "Estruturado com base na auditoria estatística oficial da Fundação Carlos Chagas (FCC)",
    "banca": "FCC",
    "totalQuestoes": 60,
    "duracaoMinutos": 180,
    "distribuicao": {
        "portugues": 20,
        "enfermagem": 40
    },
    "gradeTemas": {
        "portugues": [{"tema": t, "questoes": q} for t, q in grade_port],
        "enfermagem": [{"tema": t, "questoes": q} for t, q in grade_enf]
    },
    "questoes": questoes_sim1
}

# Montar Simulado #02 FCC (inédito, offset=1)
port_sim2 = selecionar_questoes(port, grade_port, offset=1)
enf_sim2 = selecionar_questoes(enf, grade_enf, offset=1)
questoes_sim2 = port_sim2 + enf_sim2
for idx, q in enumerate(questoes_sim2, 1):
    q_copy = dict(q)
    q_copy["numero_simulado"] = idx
    questoes_sim2[idx - 1] = q_copy

simulado_fcc_02 = {
    "id": "simulado-fcc-02",
    "numero": 2,
    "titulo": "Simulado Oficial FCC #02 - Prova Inédita Completa",
    "subtitulo": "Provas completas cronometradas no estilo clássico de casos clínicos e rigor da FCC",
    "banca": "FCC",
    "totalQuestoes": 60,
    "duracaoMinutos": 180,
    "distribuicao": {
        "portugues": 20,
        "enfermagem": 40
    },
    "gradeTemas": {
        "portugues": [{"tema": t, "questoes": q} for t, q in grade_port],
        "enfermagem": [{"tema": t, "questoes": q} for t, q in grade_enf]
    },
    "questoes": questoes_sim2
}

# Carregar simulados existentes (SELECON)
with open(SITE_SIMULADOS_JS, "r", encoding="utf-8") as f:
    content = f.read()

# Extrair JSON existente
json_start = content.find("[")
json_end = content.rfind("]") + 1
simulados_existentes = json.loads(content[json_start:json_end])

# Manter SELECON e adicionar FCC
simulados_selecon = [s for s in simulados_existentes if s.get("banca") == "SELECON"]
todos_simulados = simulados_selecon + [simulado_fcc_01, simulado_fcc_02]

# Salvar JS para o site
js_out = "// Simulados Oficiais SELECON e FCC no Padrão Estatístico de Cobrança\n"
js_out += "// 60 questões por simulado: 20 Língua Portuguesa + 40 Enfermagem\n\n"
js_out += "export const SIMULADOS_OFICIAIS = " + json.dumps(todos_simulados, ensure_ascii=False, indent=2) + ";\n"

with open(SITE_SIMULADOS_JS, "w", encoding="utf-8") as f:
    f.write(js_out)

# Salvar em 03_SIMULADOS/
SIMULADOS_DIR.mkdir(parents=True, exist_ok=True)
with open(SIMULADOS_DIR / "simulado_fcc_01.json", "w", encoding="utf-8") as f:
    json.dump(simulado_fcc_01, f, ensure_ascii=False, indent=2)
with open(SIMULADOS_DIR / "simulado_fcc_02.json", "w", encoding="utf-8") as f:
    json.dump(simulado_fcc_02, f, ensure_ascii=False, indent=2)

print(f"🎉 2 Simulados Oficiais da FCC gerados com sucesso! Total simulados na plataforma: {len(todos_simulados)}")
