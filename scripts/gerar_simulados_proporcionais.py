import json
import os
import random

random.seed(42)  # Reprodutibilidade garantida

assuntos_dir = 'site-enfermagem/src/data/assuntos'
simulados_dir = '03_SIMULADOS'
os.makedirs(simulados_dir, exist_ok=True)

# Quota de Língua Portuguesa (Total = 20 questões)
port_targets = [
    ('interpretacao_e_compreensao_de_textos', 'Interpretação e Compreensão de Textos', 8),
    ('sintaxe_da_oracao_e_do_periodo', 'Sintaxe da Oração e do Período', 4),
    ('morfologia_tempos_e_modos_verbais', 'Morfologia - Tempos e Modos Verbais', 2),
    ('morfologia_classes_gramaticais', 'Morfologia - Classes Gramaticais', 1),
    ('semantica_e_significacao_das_palavras', 'Semântica e Significação das Palavras', 1),
    ('pontuacao_e_emprego_da_virgula', 'Pontuação e Emprego da Vírgula', 1),
    ('tipologia_e_generos_textuais', 'Tipologia e Gêneros Textuais', 1),
    ('ortografia_oficial_e_acentuacao_grafica', 'Ortografia Oficial e Acentuação Gráfica', 1),
    ('morfologia_pronomes_e_colocacao_pronominal', 'Morfologia - Pronomes e Colocação Pronominal', 1)
]

# Quota de Enfermagem (Total = 40 questões)
enf_targets = [
    ('doencas_infecciosas_e_parasitarias_dengue_tuberculose_hiv', 'Doenças Infecciosas e Parasitárias (Dengue, Tuberculose, HIV)', 10),
    ('fundamentos_e_procedimentos_de_enfermagem', 'Fundamentos e Procedimentos de Enfermagem', 6),
    ('saude_publica_sus_e_atencao_basica', 'Saúde Pública, SUS e Atenção Básica', 4),
    ('seguranca_do_paciente_e_biosseguranca', 'Segurança do Paciente e Biossegurança', 3),
    ('legislacao_de_enfermagem_e_codigo_de_etica', 'Legislação de Enfermagem e Código de Ética', 3),
    ('urgencia_emergencia_e_pcr', 'Urgência, Emergência e PCR', 3),
    ('doencas_cronicas_nao_transmissiveis_has_diabetes', 'Doenças Crônicas Não Transmissíveis (HAS, Diabetes)', 2),
    ('epidemiologia_e_vigilancia_em_saude', 'Epidemiologia e Vigilância em Saúde', 2),
    ('imunizacao_e_calendario_vacinal_pni', 'Imunização e Calendário Vacinal (PNI)', 2),
    ('centro_cirurgico_e_cme_esterilizacao', 'Centro Cirúrgico e CME (Esterilização)', 1),
    ('saude_do_idoso_e_cuidados_paliativos', 'Saúde do Idoso e Cuidados Paliativos', 1),
    ('saude_da_mulher_pre_natal_e_parto', 'Saúde da Mulher, Pré-Natal e Parto', 1),
    ('farmacologia_calculo_e_administracao_de_medicamentos', 'Farmacologia, Cálculo e Administração de Medicamentos', 1),
    ('administracao_gestao_e_auditoria', 'Administração, Gestão e Auditoria', 1)
]

def carregar_questoes_validas(slug):
    path = os.path.join(assuntos_dir, f'{slug}.json')
    with open(path, 'r', encoding='utf-8') as f:
        questoes = json.load(f)
    validas = []
    for q in questoes:
        if not q or not q.get('enunciado') or len(q['enunciado'].strip()) < 15:
            continue
        alts = q.get('alternativas', [])
        if not isinstance(alts, list) or len(alts) < 4:
            continue
        if not q.get('resposta_correta') or q['resposta_correta'] not in ['A', 'B', 'C', 'D', 'E']:
            continue
        validas.append(q)
    return validas

usadas_ids = set()

def selecionar_questoes(targets, modulo_nome):
    questoes_selecionadas = []
    for slug, nome_tema, qtd in targets:
        pool = carregar_questoes_validas(slug)
        # Filtrar as que não foram usadas ainda
        disponiveis = [q for q in pool if q['id'] not in usadas_ids]
        if len(disponiveis) < qtd:
            raise ValueError(f"Não há questões suficientes para {slug}: precisa {qtd}, tem {len(disponiveis)}")
        
        # Embaralhar para escolher questões representativas
        random.shuffle(disponiveis)
        escolhidas = disponiveis[:qtd]
        for q in escolhidas:
            usadas_ids.add(q['id'])
            # Clonar e anotar metadados
            item = dict(q)
            item['modulo'] = modulo_nome
            item['assunto_proporcional'] = nome_tema
            questoes_selecionadas.append(item)
    return questoes_selecionadas

simulados = []

for num in [1, 2]:
    print(f"\n--- Gerando Simulado SELECON #{num:02d} ---")
    port_q = selecionar_questoes(port_targets, 'Módulo I - Língua Portuguesa')
    enf_q = selecionar_questoes(enf_targets, 'Módulo II - Conhecimentos Específicos de Enfermagem')
    
    print(f"Português: {len(port_q)} questões")
    print(f"Enfermagem: {len(enf_q)} questões")
    
    # Numerar questões de 1 a 60
    todas_simulado = []
    num_q = 1
    for q in port_q:
        q_copy = dict(q)
        q_copy['numero_simulado'] = num_q
        todas_simulado.append(q_copy)
        num_q += 1
        
    for q in enf_q:
        q_copy = dict(q)
        q_copy['numero_simulado'] = num_q
        todas_simulado.append(q_copy)
        num_q += 1

    simulado_obj = {
        'id': f'simulado-selecon-{num:02d}',
        'numero': num,
        'titulo': f'Simulado Oficial SELECON #{num:02d} - Edição Realista Proporcional',
        'subtitulo': 'Baseado fielmente na distribuição estatística da banca examinadora SELECON',
        'banca': 'SELECON',
        'totalQuestoes': 60,
        'duracaoMinutos': 180,
        'distribuicao': {
            'portugues': 20,
            'enfermagem': 40
        },
        'gradeTemas': {
            'portugues': [
                {'tema': nome, 'questoes': qtd} for _, nome, qtd in port_targets
            ],
            'enfermagem': [
                {'tema': nome, 'questoes': qtd} for _, nome, qtd in enf_targets
            ]
        },
        'questoes': todas_simulado
    }
    simulados.append(simulado_obj)

print(f"\nTotal de questões únicas utilizadas: {len(usadas_ids)}")

# Salvar JSONs e TXTs em 03_SIMULADOS/
for sim in simulados:
    json_path = f"03_SIMULADOS/{sim['id']}.json"
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(sim, f, ensure_ascii=False, indent=2)
    print(f"Salvo: {json_path}")
    
    txt_path = f"03_SIMULADOS/{sim['id']}_legivel.txt"
    with open(txt_path, 'w', encoding='utf-8') as f:
        f.write(f"================================================================================\n")
        f.write(f"{sim['titulo'].upper()}\n")
        f.write(f"{sim['subtitulo']}\n")
        f.write(f"Banca: {sim['banca']} | Total: 60 Questões (20 Português + 40 Enfermagem) | Tempo: 3 Horas\n")
        f.write(f"================================================================================\n\n")
        
        f.write("--- MÓDULO I: LÍNGUA PORTUGUESA (QUESTÕES 01 A 20) ---\n\n")
        for q in sim['questoes'][:20]:
            f.write(f"[QUESTÃO {q['numero_simulado']:02d}] (ID: {q['id']} - {q['orgao']} / {q['ano']})\n")
            f.write(f"Tema Estatístico: {q['assunto_proporcional']}\n")
            f.write(f"Enunciado:\n{q['enunciado']}\n\n")
            for alt in q['alternativas']:
                f.write(f"  ({alt['id']}) {alt['texto']}\n")
            f.write("\n" + "-"*60 + "\n\n")
            
        f.write("\n--- MÓDULO II: CONHECIMENTOS ESPECÍFICOS DE ENFERMAGEM (QUESTÕES 21 A 60) ---\n\n")
        for q in sim['questoes'][20:]:
            f.write(f"[QUESTÃO {q['numero_simulado']:02d}] (ID: {q['id']} - {q['orgao']} / {q['ano']})\n")
            f.write(f"Tema Estatístico: {q['assunto_proporcional']}\n")
            f.write(f"Enunciado:\n{q['enunciado']}\n\n")
            for alt in q['alternativas']:
                f.write(f"  ({alt['id']}) {alt['texto']}\n")
            f.write("\n" + "-"*60 + "\n\n")
            
        f.write("\n================================================================================\n")
        f.write("GABARITO OFICIAL E FUNDAMENTAÇÃO DOS COMENTÁRIOS\n")
        f.write("================================================================================\n\n")
        for q in sim['questoes']:
            f.write(f"Q.{q['numero_simulado']:02d} -> Resposta Correta: [{q['resposta_correta']}]\n")
            coment = q.get('fundamentacao_correta') or q.get('comentario') or 'Gabarito Oficial conferido.'
            f.write(f"Fundamentação: {coment}\n")
            f.write("\n")
    print(f"Salvo: {txt_path}")

# Salvar também o arquivo JS para import direto no site
js_content = f"// Simulados Oficiais SELECON gerados rigorosamente com a distribuição proporcional da banca\n"
js_content += f"// 60 questões: 20 Língua Portuguesa + 40 Enfermagem\n\n"
js_content += f"export const SIMULADOS_OFICIAIS = {json.dumps(simulados, ensure_ascii=False, indent=2)};\n"

js_path = 'site-enfermagem/src/data/simuladosData.js'
with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js_content)
print(f"Salvo: {js_path}")
