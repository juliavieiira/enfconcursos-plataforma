#!/usr/bin/env python3
"""
Gera as estatísticas auditadas da FCC e atualiza o arquivo padraoBancaCatalogo.js
"""

import json
from collections import Counter
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent if "__file__" in locals() else Path("/home/antigravity")
BANCO_DIR = BASE_DIR / "02_BANCO_DE_QUESTOES"
CATALOGO_JS = BASE_DIR / "site-enfermagem" / "src" / "data" / "padraoBancaCatalogo.js"

with open(BANCO_DIR / "questoes_fcc_enfermagem.json") as f:
    enf = json.load(f)
with open(BANCO_DIR / "questoes_fcc_portugues.json") as f:
    port = json.load(f)

slug_map = {
    'Interpretação e Compreensão de Textos': 'interpretacao_e_compreensao_de_textos',
    'Sintaxe da Oração e do Período': 'sintaxe_da_oracao_e_do_periodo',
    'Morfologia - Tempos e Modos Verbais': 'morfologia_tempos_e_modos_verbais',
    'Morfologia - Classes Gramaticais': 'morfologia_classes_gramaticais',
    'Semântica e Significação das Palavras': 'semantica_e_significacao_das_palavras',
    'Pontuação e Emprego da Vírgula': 'pontuacao_e_emprego_da_virgula',
    'Tipologia e Gêneros Textuais': 'tipologia_e_generos_textuais',
    'Ortografia Oficial e Acentuação Gráfica': 'ortografia_oficial_e_acentuacao_grafica',
    'Morfologia - Pronomes e Colocação Pronominal': 'morfologia_pronomes_e_colocacao_pronominal',
    'Coesão Textual e Referenciação': 'coesao_textual_e_referenciacao',
    'Conjunções e Relações Lógico-Discursivas': 'conjuncoes_e_relacoes_logico_discursivas',
    'Fonologia e Acentuação': 'fonologia_e_acentuacao',
    'Emprego do Sinal Indicativo de Crase': 'emprego_do_sinal_indicativo_de_crase',
    'Fundamentos e Procedimentos de Enfermagem': 'fundamentos_e_procedimentos_de_enfermagem',
    'Doenças Infecciosas e Parasitárias (Dengue, Tuberculose, HIV)': 'doencas_infecciosas_e_parasitarias_dengue_tuberculose_hiv',
    'Saúde Pública, SUS e Atenção Básica': 'saude_publica_sus_e_atencao_basica',
    'Segurança do Paciente e Biossegurança': 'seguranca_do_paciente_e_biosseguranca',
    'Urgência, Emergência e PCR': 'urgencia_emergencia_e_pcr',
    'Legislação de Enfermagem e Código de Ética': 'legislacao_de_enfermagem_e_codigo_de_etica',
    'Doenças Crônicas Não Transmissíveis (HAS, Diabetes)': 'doencas_cronicas_nao_transmissiveis_has_diabetes',
    'Farmacologia, Cálculo e Administração de Medicamentos': 'farmacologia_calculo_e_administracao_de_medicamentos',
    'Saúde da Mulher, Pré-Natal e Parto': 'saude_da_mulher_pre_natal_e_parto',
    'Epidemiologia e Vigilância em Saúde': 'epidemiologia_e_vigilancia_em_saude',
    'Imunização e Calendário Vacinal (PNI)': 'imunizacao_e_calendario_vacinal_pni',
    'Centro Cirúrgico e CME (Esterilização)': 'centro_cirurgico_e_cme_esterilizacao',
    'Saúde do Idoso e Cuidados Paliativos': 'saude_do_idoso_e_cuidados_paliativos',
    'Saúde da Criança e do Adolescente (Pediatria)': 'saude_da_crianca_e_do_adolescente_pediatria',
    'Assistência em Feridas, Curativos e Queimados': 'assistencia_em_feridas_curativos_e_queimados',
    'Administração, Gestão e Auditoria': 'administracao_gestao_e_auditoria',
    'Processo de Enfermagem e Sistematização (SAE)': 'processo_de_enfermagem_e_sistematizacao_sae',
    'Saúde Mental e Atenção Psicossocial': 'saude_mental_e_atencao_psicossocial'
}

def build_stats(subset):
    total = len(subset)
    counts = Counter(q['assunto'] for q in subset)
    temas = []
    for ass, cnt in counts.most_common():
        pct = (cnt / total * 100) if total > 0 else 0
        mat = next((q['materia'] for q in subset if q['assunto'] == ass), 'Enfermagem')
        temas.append({
            "nome": ass,
            "slug": slug_map.get(ass, "fundamentos_e_procedimentos_de_enfermagem"),
            "materia": mat,
            "count": cnt,
            "percent": f"{pct:.1f}"
        })
    return {"total": total, "temas": temas}

all_fcc = enf + port
enf_enfermeiro = [q for q in enf if q.get("cargo") == "Enfermeiro"]
enf_tecnico = [q for q in enf if q.get("cargo") == "Técnico de Enfermagem"]

padrao_fcc = {
    "Todas_Todos": build_stats(all_fcc),
    "Todas_Enfermeiro": build_stats(enf_enfermeiro + port),
    "Todas_Técnico de Enfermagem": build_stats(enf_tecnico + port),
    "Enfermagem_Todos": build_stats(enf),
    "Enfermagem_Enfermeiro": build_stats(enf_enfermeiro),
    "Enfermagem_Técnico de Enfermagem": build_stats(enf_tecnico),
    "Língua Portuguesa_Todos": build_stats(port),
    "Língua Portuguesa_Enfermeiro": build_stats(port),
    "Língua Portuguesa_Técnico de Enfermagem": build_stats(port)
}

print(f"Estatísticas FCC calculadas: Total {len(all_fcc)} questões ({len(enf)} Enfermagem + {len(port)} Português).")

# Ler o catalogo atual e adicionar PADRAO_FCC_SALVO
with open(CATALOGO_JS, "r", encoding="utf-8") as f:
    code = f.read()

# Remover PADRAO_FCC_SALVO anterior se houver
if "export const PADRAO_FCC_SALVO" in code:
    code = code[:code.find("export const PADRAO_FCC_SALVO")]

# Injetar PADRAO_FCC_SALVO antes de export function getPadraoSalvo
fcc_json = json.dumps(padrao_fcc, ensure_ascii=False, indent=2)
fcc_block = f"""
export const PADRAO_FCC_SALVO = {fcc_json};

export function getPadraoSalvo(banca, materia, cargo) {{
  if (banca === "FCC") {{
    const matKey = materia || "Todas";
    let cargoKey = "Todos";
    const cargoNorm = (cargo || "").toLowerCase();
    if (cargoNorm.includes("técnico") || cargoNorm.includes("tecnico")) {{
      cargoKey = "Técnico de Enfermagem";
    }} else if (cargoNorm.includes("enfermeir")) {{
      cargoKey = "Enfermeiro";
    }}
    const chave = `${{matKey}}_${{cargoKey}}`;
    if (PADRAO_FCC_SALVO[chave]) {{
      return PADRAO_FCC_SALVO[chave];
    }}
    return PADRAO_FCC_SALVO["Todas_Todos"];
  }}

  if (banca !== "SELECON" && banca !== "Todas") {{
    return null;
  }}
  const matKey = materia || "Todas";
  let cargoKey = "Todos";
  const cargoNorm = (cargo || "").toLowerCase();
  if (cargoNorm.includes("técnico") || cargoNorm.includes("tecnico")) {{
    cargoKey = "Técnico de Enfermagem";
  }} else if (cargoNorm.includes("enfermeir")) {{
    cargoKey = "Enfermeiro";
  }}

  const chave = `${{matKey}}_${{cargoKey}}`;
  if (PADRAO_SELECON_SALVO[chave]) {{
    return PADRAO_SELECON_SALVO[chave];
  }}
  return PADRAO_SELECON_SALVO["Todas_Todos"];
}}
"""

if "export function getPadraoSalvo" in code:
    idx = code.find("export function getPadraoSalvo")
    novo_code = code[:idx].rstrip() + "\n" + fcc_block
else:
    novo_code = code.rstrip() + "\n" + fcc_block

with open(CATALOGO_JS, "w", encoding="utf-8") as f:
    f.write(novo_code)

print("✅ Catalogo padraoBancaCatalogo.js atualizado com sucesso com os dados da FCC!")
