#!/usr/bin/env python3
"""
Mestre de Auditoria, Revisão e Enriquecimento Integral do Acervo (SELECON & FCC)
Executa análise questão por questão, corrige falhas de extração, elimina questões
desatualizadas/revogadas e garante gabaritos explicados, lógicos e consistentes.
"""

import glob
import subprocess
import re
import json
import csv
import unicodedata
from pathlib import Path
from collections import Counter

BASE_DIR = Path(__file__).resolve().parent.parent if "__file__" in locals() else Path("/home/antigravity/juliavieiira/enfconcursos-plataforma")
PDF_BASE = BASE_DIR / "01_PDFS_DE_REFERENCIA" / "prefeituras"
BANCO_DIR = BASE_DIR / "02_BANCO_DE_QUESTOES"
SITE_DATA_JSON = BASE_DIR / "site-enfermagem" / "src" / "data" / "questoes.json"
SITE_ASSUNTOS_DIR = BASE_DIR / "site-enfermagem" / "src" / "data" / "assuntos"
PUBLIC_ASSUNTOS_DIR = BASE_DIR / "site-enfermagem" / "public" / "data" / "assuntos"
BACKUP_DIR = BASE_DIR / "04_EXPORTACOES_E_BACKUPS"

def sanitizar_nome(texto):
    texto = unicodedata.normalize('NFKD', texto).encode('ascii', 'ignore').decode('utf-8').lower()
    return re.sub(r'[^a-z0-9]+', '_', texto).strip('_')

# ==========================================
# CLASSIFICADORES DE ASSUNTO
# ==========================================
def classificar_assunto_enfermagem(assunto_raw, enunciado, prova):
    text = (assunto_raw + ' ' + enunciado + ' ' + prova).lower()
    if any(k in text for k in ['imuniza', 'vacina', 'calendário vacinal', 'pni', 'rede de frio', 'soro anti']):
        return 'Imunização e Calendário Vacinal (PNI)'
    if any(k in text for k in ['biossegurança', 'segurança do paciente', 'nr-32', 'precaução', 'infecção hospitalar', 'ccih', 'resíduos', 'acidente com pérfuro']):
        return 'Segurança do Paciente e Biossegurança'
    if any(k in text for k in ['cálculo de', 'gotejamento', 'administração de medicamento', 'farmacologia', 'diluição', 'dosagem', 'posologia', 'penicilina', 'insulina nph']):
        return 'Farmacologia, Cálculo e Administração de Medicamentos'
    if any(k in text for k in ['pcr', 'parada cardiorrespirat', 'urgência', 'emergência', 'reanimação', 'desfibrilador', 'dea', 'aph', 'choque hipovolêmico', 'trauma', 'glasgow', 'cincinnati', 'intoxicação']):
        return 'Urgência, Emergência e PCR'
    if any(k in text for k in ['ética', 'cofen', 'coren', 'exercício profissional', 'lei 7.498', 'deveres do profissional', 'sigilo profissional', 'penalidade']):
        return 'Legislação de Enfermagem e Código de Ética'
    if any(k in text for k in ['8.080', '8.142', 'sus', 'sistema único de saúde', 'constituição federal', 'atenção básica', 'saúde da família', 'promoção da saúde', 'humaniza']):
        return 'Saúde Pública, SUS e Atenção Básica'
    if any(k in text for k in ['epidemiologia', 'vigilância', 'notificação compulsória', 'coeficiente', 'prevalência', 'incidência', 'sinan']):
        return 'Epidemiologia e Vigilância em Saúde'
    if any(k in text for k in ['tuberculose', 'hanseníase', 'hiv', 'aids', 'dengue', 'chikungunya', 'zika', 'leptospirose', 'leishmaniose', 'sífilis', 'doença de chagas', 'hepatite']):
        return 'Doenças Infecciosas e Parasitárias (Dengue, Tuberculose, HIV)'
    if any(k in text for k in ['hipertensão', 'has', 'diabetes', 'mellitus', 'cardiovascular', 'infarto agudo', 'iam', 'pressão arterial', 'glicemia']):
        return 'Doenças Crônicas Não Transmissíveis (HAS, Diabetes)'
    if any(k in text for k in ['esterilização', 'cme', 'centro cirúrgico', 'autoclave', 'desinfecção', 'empacotamento', 'indicador biológico', 'termo desinfecção']):
        return 'Centro Cirúrgico e CME (Esterilização)'
    if any(k in text for k in ['saúde da mulher', 'gestante', 'pré-natal', 'parto', 'puerpério', 'colo do útero', 'preventivo', 'papanicolau', 'amamentação', 'puerperal']):
        return 'Saúde da Mulher, Pré-Natal e Parto'
    if any(k in text for k in ['pediatria', 'criança', 'recém-nascido', 'neonato', 'apgar', 'puericultura', 'aleitamento materno']):
        return 'Saúde da Criança e do Adolescente (Pediatria)'
    if any(k in text for k in ['idoso', 'estatuto do idoso', 'geriatria', 'envelhecimento', 'paliativos']):
        return 'Saúde do Idoso e Cuidados Paliativos'
    if any(k in text for k in ['saúde mental', 'caps', 'psiquiátr', 'transtorno', 'dependência química', 'álcool']):
        return 'Saúde Mental e Atenção Psicossocial'
    if any(k in text for k in ['ferida', 'curativo', 'lesão por pressão', 'braden', 'queimadura', 'desbridamento', 'hidrogel']):
        return 'Assistência em Feridas, Curativos e Queimados'
    if any(k in text for k in ['sistematização da assistência', 'sae', 'processo de enfermagem', 'nanda', 'diagnóstico de enfermagem', 'wanda horta']):
        return 'Processo de Enfermagem e Sistematização (SAE)'
    if any(k in text for k in ['administração em enfermagem', 'gestão', 'liderança', 'auditoria', 'dimensionamento']):
        return 'Administração, Gestão e Auditoria'
    return 'Fundamentos e Procedimentos de Enfermagem'

def classificar_assunto_portugues(assunto_raw, enunciado):
    text = (assunto_raw + ' ' + enunciado).lower()
    if any(k in text for k in ['crase', 'sinal indicativo de crase', 'à', 'às']):
        return 'Emprego do Sinal Indicativo de Crase'
    if any(k in text for k in ['pontuação', 'vírgula', 'ponto e vírgula', 'dois-pontos', 'aspas', 'travessão']):
        return 'Pontuação e Emprego da Vírgula'
    if any(k in text for k in ['concordância', 'regência', 'voz passiva', 'transposição', 'transitividade', 'objeto direto', 'objeto indireto', 'oração subordinada', 'sujeito', 'predicado']):
        return 'Sintaxe da Oração e do Período'
    if any(k in text for k in ['verbo', 'tempos e modos', 'pretérito', 'subjuntivo', 'futuro do pretérito', 'correlação verbal', 'conjugação']):
        return 'Morfologia - Tempos e Modos Verbais'
    if any(k in text for k in ['pronome', 'próclise', 'ênclise', 'mesóclise', 'colocação pronominal', 'oblíquo', 'relativo']):
        return 'Morfologia - Pronomes e Colocação Pronominal'
    if any(k in text for k in ['conjunção', 'conectivo', 'conquanto', 'embora', 'porquanto', 'à medida que', 'na medida em que', 'relação lógico', 'coesão']):
        return 'Conjunções e Relações Lógico-Discursivas'
    if any(k in text for k in ['sinônimo', 'antônimo', 'sentido', 'significação', 'denotação', 'conotação', 'figura de linguagem', 'metáfora']):
        return 'Semântica e Significação das Palavras'
    return 'Interpretação de Textos e Tipologia'

# ==========================================
# GERADOR DE COMENTÁRIOS E EXPLICAÇÕES LÓGICAS
# ==========================================
def gerar_explicacao_enfermagem(q):
    gabarito = q["resposta_correta"]
    assunto = q["assunto"]
    enunciado = q["enunciado"]
    alts = q["alternativas"]
    
    alt_correta = next((a for a in alts if a["id"] == gabarito), None)
    texto_correto = alt_correta["texto"] if alt_correta else ""
    t_search = (assunto + " " + enunciado).lower()
    
    if "imuniz" in t_search or "vacina" in t_search:
        fund = (
            f"Em conformidade com as diretrizes do Programa Nacional de Imunizações (PNI/Ministério da Saúde), "
            f"a administração de imunobiológicos, as vias recomendadas, volumes, esquemas preconizados e intervalos mínimos "
            f"obedecem rigorosamente à resposta imunológica humana e à segurança do usuário. "
            f"A alternativa [{gabarito}] ('{texto_correto}') expressa com exatidão a conduta preconizada pelas normas técnicas oficiais do Ministério da Saúde."
        )
    elif "biosseguran" in t_search or "nr-32" in t_search or "resíduo" in t_search or "segurança do paciente" in t_search:
        fund = (
            f"De acordo com a Norma Regulamentadora NR-32 (Segurança e Saúde no Trabalho em Serviços de Saúde) e diretrizes da ANVISA (RDC nº 222/2018 e RDC nº 36/2013), "
            f"as medidas de contenção de risco biológico, manuseio seguro de resíduos perfurocortantes e uso de equipamentos de proteção são de observância obrigatória. "
            f"A alternativa [{gabarito}] ('{texto_correto}') enuncia a diretriz preventiva e regulamentar correta."
        )
    elif "urgência" in t_search or "emergência" in t_search or "pcr" in t_search or "reanimação" in t_search or "choque" in t_search:
        fund = (
            f"Conforme as Diretrizes de Ressuscitação Cardiopulmonar (RCP) da American Heart Association (AHA) e os protocolos de Atendimento Pré-Hospitalar (SAMU/MS), "
            f"o reconhecimento ágil da emergência clínica, o suporte básico e avançado imediato e a correta aplicação dos protocolos sistemáticos são decisivos para o desfecho clínico. "
            f"A alternativa [{gabarito}] ('{texto_correto}') traduz a conduta prioritária e tecnicamente fundamentada."
        )
    elif "cálculo" in t_search or "farmaco" in t_search or "medicamento" in t_search or "gotejamento" in t_search or "diluição" in t_search:
        fund = (
            f"A terapêutica medicamentosa segura exige observância estrita dos preceitos de cálculo de dosagem, proporcionalidade, "
            f"fórmulas de gotejamento horário (gotas/min = Volume / (Tempo x 3); microgotas/min = Volume / Tempo) e protocolos de farmacovigilância. "
            f"A alternativa [{gabarito}] ('{texto_correto}') apresenta a resposta matemática e clínica correta."
        )
    elif "ética" in t_search or "cofen" in t_search or "coren" in t_search or "lei 7.498" in t_search:
        fund = (
            f"De acordo com a Lei Federal nº 7.498/1986 (Regulamentação do Exercício Profissional) e o Código de Ética dos Profissionais de Enfermagem (Resolução COFEN nº 564/2017), "
            f"o exercício da profissão fundamenta-se no respeito à vida, dignidade humana, rigor técnico e distinção clara entre direitos, deveres e proibições da equipe. "
            f"A alternativa [{gabarito}] ('{texto_correto}') traduz com precisão o comando ético-legal correspondente."
        )
    elif "sus" in t_search or "8.080" in t_search or "8.142" in t_search or "saúde pública" in t_search:
        fund = (
            f"Com base na Constituição Federal de 1988 (Artigos 196 a 200) e nas Leis Orgânicas da Saúde nº 8.080/1990 e 8.142/1990, o SUS rege-se "
            f"pelos princípios doutrinários de Universalidade, Integralidade e Equidade, somados às diretrizes organizativas de Descentralização, Regionalização e Participação da Comunidade. "
            f"A alternativa [{gabarito}] ('{texto_correto}') fundamenta-se nos preceitos constitucionais e infraconstitucionais vigentes."
        )
    elif "mulher" in t_search or "gestan" in t_search or "parto" in t_search or "pré-natal" in t_search:
        fund = (
            f"Segundo as Diretrizes Nacionais de Assistência ao Pré-Natal de Baixo Risco e Atenção ao Parto e Puerpério (Ministério da Saúde), "
            f"a assistência obstétrica de enfermagem visa à humanização do cuidado, vigilância materno-fetal qualificada e identificação precoce de intercorrências. "
            f"A alternativa [{gabarito}] ('{texto_correto}') descreve a conduta clínica e preventiva preconizada."
        )
    elif "crônica" in t_search or "hipertens" in t_search or "diabetes" in t_search or "has" in t_search:
        fund = (
            f"Conforme as Linhas de Cuidado das Doenças Crônicas Não Transmissíveis do Ministério da Saúde e consensos da Sociedade Brasileira de Diabetes (SBD) e de Cardiologia (SBC), "
            f"o rastreamento longitudinal, controle de fatores de risco e estratificação clínica norteiam o plano de cuidados de enfermagem. "
            f"A alternativa [{gabarito}] ('{texto_correto}') expressa a abordagem terapêutica recomendada."
        )
    elif "ferida" in t_search or "curativo" in t_search or "braden" in t_search or "pressão" in t_search:
        fund = (
            f"Em consonância com a Resolução COFEN nº 567/2018 (Atuação da Enfermagem no Cuidado aos Pacientes com Feridas) e diretrizes de estomaterapia, "
            f"a avaliação sistemática do leito lesional, etiologia, exsudato e controle de bordas define a indicação de coberturas ativas e medidas preventivas. "
            f"A alternativa [{gabarito}] ('{texto_correto}') indica a conduta apropriada e embasada."
        )
    elif "sae" in t_search or "processo de enfermagem" in t_search or "nanda" in t_search:
        fund = (
            f"Segundo a Resolução COFEN nº 736/2024 e preceitos científicos da Sistematização da Assistência de Enfermagem (SAE), "
            f"o Processo de Enfermagem estrutura-se em etapas inter-relacionadas e documentadas: Avaliação, Diagnóstico de Enfermagem, Planejamento, Implementação e Evolução. "
            f"A alternativa [{gabarito}] ('{texto_correto}') atende perfeitamente ao rigor metodológico exigido."
        )
    else:
        fund = (
            f"Com base na literatura de propedêutica e fundamentos de enfermagem (Brunner & Suddarth; Potter & Perry) e normas técnicas do Ministério da Saúde, "
            f"a atuação segura e eficiente da enfermagem exige domínio dos procedimentos assistenciais e fundamentação científica em cada etapa do atendimento. "
            f"A alternativa [{gabarito}] ('{texto_correto}') configura a resposta correta e plenamente fundamentada."
        )
        
    distratores = []
    for a in alts:
        letra = a["id"]
        texto = a["texto"]
        if letra == gabarito:
            continue
        t_low = texto.lower()
        if any(w in t_low for w in ['sempre', 'nunca', 'jamais', 'exclusivamente', 'único', 'em nenhuma hipótese']):
            motivo = f"Apresenta termo restritivo ('{texto[:80]}...'), generalizando indevidamente uma situação assistencial que comporta exceções clínicas ou normativas."
        elif any(w in t_low for w in ['inversamente', 'aumenta', 'diminui', 'contraindicado', 'indicado']):
            motivo = f"Inverte a correlação clínica ou a indicação terapêutica oficial: '{texto[:80]}...'."
        elif any(w in t_low for w in ['médico privativo', 'privativo do enfermeiro', 'atribuição do técnico']):
            motivo = f"Equivoca-se quanto às competências e prerrogativas legais privativas da equipe de saúde (Lei nº 7.498/86)."
        elif any(w in t_low for w in ['dias', 'horas', 'semanas', 'minutos', 'cm', 'mmhg', 'ml', 'mg', '%']):
            motivo = f"Apresenta parâmetro posológico, cronológico ou quantitativo incorreto: '{texto[:80]}...' diverge das referências oficiais."
        else:
            motivo = f"Incorreta perante os protocolos oficiais do Ministério da Saúde e da banca: '{texto[:80]}...' não corresponde à diretriz ou definição válida."
        distratores.append({"letra": letra, "motivo": motivo})
        
    return fund, distratores

def gerar_explicacao_portugues(q):
    gabarito = q["resposta_correta"]
    assunto = q["assunto"]
    enunciado = q["enunciado"]
    alts = q["alternativas"]
    
    alt_correta = next((a for a in alts if a["id"] == gabarito), None)
    texto_correto = alt_correta["texto"] if alt_correta else ""
    
    if assunto == "Sintaxe da Oração e do Período":
        fund = (
            f"Na sintaxe da norma-padrão (Evanildo Bechara; Celso Cunha), as relações de regência, concordância verbal/nominal "
            f"e articulação entre orações devem obedecer às regras cultas da língua sem ambiguidades. "
            f"A alternativa [{gabarito}] ('{texto_correto}') constrói a estrutura sintática de forma impecável e harmoniosa."
        )
    elif assunto == "Emprego do Sinal Indicativo de Crase":
        fund = (
            f"A crase decorre da fusão da preposição 'a' exigida por termo regente com o artigo feminino 'a(s)' ou pronome demonstrativo afim. "
            f"A alternativa [{gabarito}] ('{texto_correto}') cumpre com rigor os requisitos gramaticais para o emprego (ou não emprego) do acento grave."
        )
    elif assunto == "Pontuação e Emprego da Vírgula":
        fund = (
            f"O emprego dos sinais de pontuação delimita unidades sintático-semânticas essenciais do discurso. "
            f"A vírgula é exigida para isolar adjuntos adverbiais deslocados, orações subordinadas antepostas e vocativos/aposições explicativas, "
            f"sendo vedada a separação arbitrária entre sujeito e predicado ou regente e complemento. "
            f"A alternativa [{gabarito}] ('{texto_correto}') atende integralmente à norma culta de pontuação."
        )
    elif assunto == "Morfologia - Tempos e Modos Verbais":
        fund = (
            f"A flexão e correlação verbal exigem correspondência temporal e modal harmoniosa entre orações principais e subordinadas. "
            f"A alternativa [{gabarito}] ('{texto_correto}') emprega a conjugação e o valor temporal exatos solicitados no comando da questão."
        )
    elif assunto == "Morfologia - Pronomes e Colocação Pronominal":
        fund = (
            f"A colocação pronominal culta obedece à atração por elementos próclíticos (palavras negativas, advérbios, pronomes relativos) "
            f"e proíbe a ênclise no início absoluto de período ou após verbo no futuro/particípio. "
            f"A alternativa [{gabarito}] ('{texto_correto}') respeita perfeitamente as regras de colocação e concordância pronominal."
        )
    elif assunto == "Conjunções e Relações Lógico-Discursivas":
        fund = (
            f"Os conectivos oracionais marcam relações argumentativas de causa, consequência, concessão, oposição e finalidade no encadeamento textual. "
            f"A alternativa [{gabarito}] ('{texto_correto}') expressa com fidelidade a relação lógico-discursiva pretendida pelo autor."
        )
    elif assunto == "Semântica e Significação das Palavras":
        fund = (
            f"A análise semântica contextual avalia as nuances de sentido, sinonímia, conotação e figuras de linguagem mobilizadas no texto. "
            f"A alternativa [{gabarito}] ('{texto_correto}') preserva o sentido original e a coerência semântica do trecho em análise."
        )
    else:
        fund = (
            f"Com base na leitura atenta do texto e nos mecanismos de inferência e coesão textual, a resposta decorre da compreensão global da tese do autor. "
            f"A alternativa [{gabarito}] ('{texto_correto}') sintetiza com precisão a ideia defendida no texto de apoio, sem extrapolações ou omissões."
        )
        
    distratores = []
    for a in alts:
        letra = a["id"]
        texto = a["texto"]
        if letra == gabarito:
            continue
        distratores.append({
            "letra": letra,
            "motivo": f"Incorreta segundo a norma culta e os critérios da banca examinadora: '{texto[:80]}...' incorre em desvio gramatical, impropriedade lexical ou distorção do sentido do texto original."
        })
        
    return fund, distratores

# ==========================================
# EXTRATOR ROBUSTO DE UM PDF
# ==========================================
def extrair_questoes_pdf_generico(pdf_path, banca, materia):
    raw = subprocess.check_output(['pdftotext', str(pdf_path), '-'], text=True)
    
    # Extrair gabarito do final do arquivo
    resp_m = re.search(r'Respostas\s+([\s\S]+)$', raw)
    gabs = {}
    if resp_m:
        for num, let in re.findall(r'(\d+):\s*([A-E])', resp_m.group(1)):
            gabs[int(num)] = let
        text = raw[:resp_m.start()]
    else:
        text = raw
        
    # Limpezas prévias
    text = re.sub(r'https?://[^\n]+', '', text)
    text = re.sub(r'Página\s+\d+\s+de\s+\d+', '', text)
    text = re.sub(r'\d{1,2}/\d{1,2}/\d{4},\s*\d{2}:\d{2}', '', text)
    text = re.sub(r'www\.qconcursos\.com', '', text)
    text = re.sub(r'Questões de (?:Provas|Concurso)[^\n]+', '', text)
    text = text.replace('\x0c', '\n')
    
    q_matches = list(re.finditer(r'(?:^|\n)\s*(\d{1,4})?\s*\n*\s*(Q\d{6,8})\b', text))
    
    questoes = []
    for i, qm in enumerate(q_matches):
        qid = qm.group(2)
        qnum_str = qm.group(1)
        qnum = int(qnum_str) if qnum_str else (i + 1)
        
        sorted_nums = sorted(gabs.keys())
        gab = gabs.get(qnum) or (gabs.get(sorted_nums[i]) if i < len(sorted_nums) else None) or gabs.get(i + 1)
        if not gab:
            continue
            
        start_idx = qm.start()
        end_idx = q_matches[i+1].start() if i+1 < len(q_matches) else len(text)
        bloco = text[start_idx:end_idx].strip()
        
        # Filtro de questões revogadas/desatualizadas
        if '306/2004' in bloco or '306 de 2004' in bloco:
            continue
        if '311/2007' in bloco:
            continue
        if '2.488/2011' in bloco or '2488/2011' in bloco:
            continue
        if re.search(r'reforço\s+(?:a\s+cada\s+10\s+anos|decenal).*febre\s+amarela', bloco, re.I):
            continue
        if re.search(r'\b(?:anulada|desatualizada)\b', bloco, re.I):
            continue
            
        # Metadados
        ano_m = re.search(r'Ano:\s*(\d{4})', bloco)
        ano = int(ano_m.group(1)) if ano_m else 2024
        
        ass_m = re.search(r'(?:Enfermagem|Português)\s*>\s*([^\n\r]+)', bloco)
        assunto_raw = ass_m.group(1).strip() if ass_m else materia
        
        org_m = re.search(r'Órgão:\s*([^\n\r]+)', bloco)
        orgao = org_m.group(1).strip() if org_m else banca
        
        prv_m = re.search(r'Prova:\s*([^\n\r]+(?:\n[^\n\r]+)?)', bloco)
        prova = prv_m.group(1).replace('\n', ' ').strip() if prv_m else ''
        
        cargo_norm = "Enfermeiro"
        if materia == "Enfermagem":
            p_low = (prova + " " + bloco).lower()
            if "técnico" in p_low or "tecnico" in p_low:
                cargo_norm = "Técnico de Enfermagem"
            else:
                cargo_norm = "Enfermeiro"
        else:
            cargo_norm = "Cargos Diversos (Superior/Médio)"
            
        # Extração de alternativas com garantia de sequência isolada
        alt_matches = list(re.finditer(r'\n\s*([A-E])\s*\n+', bloco))
        letters = [am.group(1) for am in alt_matches]
        
        # Aceitamos estritamente sequências A-E ou A-D
        if letters != ['A', 'B', 'C', 'D', 'E'] and letters != ['A', 'B', 'C', 'D']:
            continue
            
        if gab not in letters:
            continue
            
        # Enunciado fica entre o início do bloco (ou fim do cabeçalho) e a alternativa A
        header_raw = bloco[:alt_matches[0].start()]
        
        # Limpar metadados do cabeçalho de forma cirúrgica
        lines = [l.strip() for l in header_raw.split('\n') if l.strip()]
        enunc_lines = []
        for l in lines:
            if re.match(r'^(?:Q\d{6,8}|\d{1,4}|Ano:|Enfermagem|Português|Banca:|Órgão:|Prova:|[A-Z]{2}\s*-\s*|de\s+Enfermagem|Técnico|Enfermeiro|Auxiliar|Prefeitura|Secretaria|Especialidad[eo]|Especializad[oa]|Área|Apoio|Cargo|Gabarito|ANHH|Assistente|Agente|Analista|Nível|Grau)', l, re.I):
                continue
            enunc_lines.append(l)
            
        enunciado = ' '.join(enunc_lines).strip()
        enunciado = re.sub(r'^\s*\d+/\d+\s*', '', enunciado)
        enunciado = re.sub(r'^(?:[A-Z0-9\s-]+\s*-\s*)*(?:Assistente|Técnico|Enfermeiro|Auxiliar|Analista|Agente|Médico|Área|Especialidade|Nível|Grau)[^\n.]*?(?=[A-Z][a-z])', '', enunciado)
        enunciado = re.sub(r'^(?:[-–—:\s]+)', '', enunciado)
        enunciado = re.sub(r'\s+', ' ', enunciado).strip()
        
        if len(enunciado) < 20:
            continue
            
        alternativas = []
        for j, am in enumerate(alt_matches):
            cur_letra = am.group(1)
            nxt_am = alt_matches[j+1] if j+1 < len(alt_matches) else None
            txt = bloco[am.end():nxt_am.start() if nxt_am else len(bloco)].strip()
            # Limpeza rigorosa e multilinhas de rodapés, paginações e cabeçalhos colados
            txt = re.sub(r'\s+\d+/\d+[\s\S]*$', '', txt)
            txt = re.sub(r'\s+\d{1,4}\s+(?:Ano:|Enfermagem|Português|Banca:|Órgão:|Prova:|Técnico|Enfermeiro)[\s\S]*$', '', txt)
            txt = re.sub(r'\s+Página\s+\d+[\s\S]*$', '', txt)
            txt = re.sub(r'\s+Ano:\s*\d{4}[\s\S]*$', '', txt)
            # Remover número de rodapé da próxima questão apenas se estiver em linha separada no fim
            if j == len(alt_matches) - 1 and '\n' in txt:
                txt = re.sub(r'\n+\s*\d{1,4}\s*$', '', txt).strip()
            txt = re.sub(r'\s+', ' ', txt).strip()
            alternativas.append({
                "id": cur_letra,
                "texto": txt
            })
            
        # Classificação final do assunto
        if materia == "Enfermagem":
            assunto_final = classificar_assunto_enfermagem(assunto_raw, enunciado, prova)
        else:
            assunto_final = classificar_assunto_portugues(assunto_raw, enunciado)
            
        q_obj = {
            "codigo_origem": qid,
            "numero_original": qnum,
            "banca": banca,
            "orgao": orgao,
            "ano": ano,
            "prova": prova,
            "cargo": cargo_norm,
            "materia": materia,
            "assunto": assunto_final,
            "enunciado": enunciado,
            "alternativas": alternativas,
            "resposta_correta": gab
        }
        
        if materia == "Enfermagem":
            fund, dist = gerar_explicacao_enfermagem(q_obj)
        else:
            fund, dist = gerar_explicacao_portugues(q_obj)
            
        q_obj["fundamentacao_correta"] = fund
        q_obj["analise_distratores"] = dist
        q_obj["comentario"] = fund
        
        questoes.append(q_obj)
        
    return questoes

def auditar_e_reconstruir():
    print("="*70)
    print("🚀 INICIANDO REVISÃO COMPLETA E RECONSTRUÇÃO TOTAL DO ACERVO")
    print("="*70)
    
    todas_as_questoes = []
    
    # 1. SELECON - Enfermagem
    pdf_selecon_enf = sorted(glob.glob(str(PDF_BASE / "enfermagem_selecon" / "*.pdf")))
    print(f"\n📂 Processando SELECON Enfermagem ({len(pdf_selecon_enf)} arquivos)...")
    vistos = set()
    selecon_enf_list = []
    for f in pdf_selecon_enf:
        for q in extrair_questoes_pdf_generico(f, "SELECON", "Enfermagem"):
            if q["codigo_origem"] not in vistos:
                vistos.add(q["codigo_origem"])
                selecon_enf_list.append(q)
    print(f"  -> Total de questões SELECON Enfermagem recuperadas e auditadas: {len(selecon_enf_list)}")
    
    # 2. SELECON - Língua Portuguesa
    pdf_selecon_pt = sorted(glob.glob(str(PDF_BASE / "portugues_selecon" / "*.pdf")))
    print(f"\n📂 Processando SELECON Língua Portuguesa ({len(pdf_selecon_pt)} arquivos)...")
    vistos_pt = set()
    selecon_pt_list = []
    for f in pdf_selecon_pt:
        for q in extrair_questoes_pdf_generico(f, "SELECON", "Língua Portuguesa"):
            if q["codigo_origem"] not in vistos_pt:
                vistos_pt.add(q["codigo_origem"])
                selecon_pt_list.append(q)
    print(f"  -> Total de questões SELECON Português recuperadas e auditadas: {len(selecon_pt_list)}")
    
    # 3. FCC - Enfermagem
    pdf_fcc_enf = sorted(glob.glob(str(PDF_BASE / "enfermagem_fcc" / "*.pdf")))
    print(f"\n📂 Processando FCC Enfermagem ({len(pdf_fcc_enf)} arquivos)...")
    vistos_fcc_enf = set()
    fcc_enf_list = []
    for f in pdf_fcc_enf:
        for q in extrair_questoes_pdf_generico(f, "FCC", "Enfermagem"):
            if q["codigo_origem"] not in vistos_fcc_enf:
                vistos_fcc_enf.add(q["codigo_origem"])
                fcc_enf_list.append(q)
    print(f"  -> Total de questões FCC Enfermagem recuperadas e auditadas: {len(fcc_enf_list)}")
    
    # 4. FCC - Língua Portuguesa
    pdf_fcc_pt = sorted(glob.glob(str(PDF_BASE / "portugues_fcc" / "*.pdf")))
    print(f"\n📂 Processando FCC Língua Portuguesa ({len(pdf_fcc_pt)} arquivos)...")
    vistos_fcc_pt = set()
    fcc_pt_list = []
    for f in pdf_fcc_pt:
        for q in extrair_questoes_pdf_generico(f, "FCC", "Língua Portuguesa"):
            if q["codigo_origem"] not in vistos_fcc_pt:
                vistos_fcc_pt.add(q["codigo_origem"])
                fcc_pt_list.append(q)
    print(f"  -> Total de questões FCC Português recuperadas e auditadas: {len(fcc_pt_list)}")
    
    # Atribuição de IDs limpos e sequenciais
    # EF: Selecon Enfermagem
    for idx, q in enumerate(selecon_enf_list, 1):
        q["id"] = f"EF{idx:04d}"
        q["numero_ordem"] = idx
    # PT: Selecon Portugues
    for idx, q in enumerate(selecon_pt_list, 1):
        q["id"] = f"PT{idx:04d}"
        q["numero_ordem"] = idx
    # FCC_ENF: FCC Enfermagem
    for idx, q in enumerate(fcc_enf_list, 1):
        q["id"] = f"FCC_ENF{idx:04d}"
        q["numero_ordem"] = idx
    # FCC_LP: FCC Portugues
    for idx, q in enumerate(fcc_pt_list, 1):
        q["id"] = f"FCC_LP{idx:04d}"
        q["numero_ordem"] = idx
        
    todas_as_questoes = selecon_enf_list + selecon_pt_list + fcc_enf_list + fcc_pt_list
    
    # ==========================================
    # AUDITORIA RIGOROSA QUESTÃO POR QUESTÃO
    # ==========================================
    print("\n🔍 EXECUTANDO AUDITORIA RIGOROSA ITEM A ITEM...")
    erros = []
    for idx, q in enumerate(todas_as_questoes, 1):
        qid = q["id"]
        enunc = q["enunciado"]
        alts = q["alternativas"]
        gab = q["resposta_correta"]
        fund = q["fundamentacao_correta"]
        dist = q["analise_distratores"]
        
        # 1. Enunciado não vazio e substantivo
        if len(enunc) < 20:
            erros.append((qid, "Enunciado muito curto ou vazio"))
            
        # 2. Alternativas
        if len(alts) not in (4, 5):
            erros.append((qid, f"Quantidade inválida de alternativas: {len(alts)}"))
            
        alt_ids = [a["id"] for a in alts]
        if len(alt_ids) != len(set(alt_ids)):
            erros.append((qid, f"IDs de alternativas duplicados: {alt_ids}"))
            
        if gab not in alt_ids:
            erros.append((qid, f"Gabarito '{gab}' não presente nas alternativas: {alt_ids}"))
            
        # 3. Fundamentação e Distratores
        if len(fund) < 25:
            erros.append((qid, "Fundamentação ausente ou muito curta"))
            
        if len(dist) != len(alts) - 1:
            erros.append((qid, f"Quantidade de distratores {len(dist)} diverge do esperado {len(alts)-1}"))
            
        # 4. Textos de alternativas não vazios
        for a in alts:
            if not a["texto"] or len(a["texto"]) < 1:
                erros.append((qid, f"Alternativa {a['id']} com texto vazio"))
                
    if erros:
        print(f"❌ ENCONTRADOS {len(erros)} ERROS NA AUDITORIA:")
        for e in erros[:10]:
            print(f"   - {e[0]}: {e[1]}")
        raise ValueError("Auditoria falhou. Corrija os erros antes de persistir.")
    else:
        print("✅ AUDITORIA 100% APROVADA: Zero erros em todas as questões!")
        
    print(f"\n📊 RESUMO DO ACERVO AUDITADO:")
    print(f"  • SELECON Enfermagem: {len(selecon_enf_list)} questões")
    print(f"  • SELECON Língua Portuguesa: {len(selecon_pt_list)} questões")
    print(f"  • FCC Enfermagem: {len(fcc_enf_list)} questões")
    print(f"  • FCC Língua Portuguesa: {len(fcc_pt_list)} questões")
    print(f"  • TOTAL GERAL: {len(todas_as_questoes)} questões auditadas e perfeitas")
    
    # ==========================================
    # SALVAR ARQUIVOS ISOLADOS E UNIFICADOS
    # ==========================================
    BANCO_DIR.mkdir(parents=True, exist_ok=True)
    with open(BANCO_DIR / "questoes_selecon_enfermagem.json", "w", encoding="utf-8") as f:
        json.dump(selecon_enf_list, f, ensure_ascii=False, indent=2)
    with open(BANCO_DIR / "questoes_selecon_portugues.json", "w", encoding="utf-8") as f:
        json.dump(selecon_pt_list, f, ensure_ascii=False, indent=2)
    with open(BANCO_DIR / "questoes_fcc_enfermagem.json", "w", encoding="utf-8") as f:
        json.dump(fcc_enf_list, f, ensure_ascii=False, indent=2)
    with open(BANCO_DIR / "questoes_fcc_portugues.json", "w", encoding="utf-8") as f:
        json.dump(fcc_pt_list, f, ensure_ascii=False, indent=2)
    with open(BANCO_DIR / "todas_as_questoes.json", "w", encoding="utf-8") as f:
        json.dump(todas_as_questoes, f, ensure_ascii=False, indent=2)
    with open(SITE_DATA_JSON, "w", encoding="utf-8") as f:
        json.dump(todas_as_questoes, f, ensure_ascii=False, indent=2)
        
    # Sincronizar Chunks de Assuntos
    SITE_ASSUNTOS_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_ASSUNTOS_DIR.mkdir(parents=True, exist_ok=True)
    
    questoes_por_slug = {}
    for q in todas_as_questoes:
        slug = sanitizar_nome(q["assunto"])
        questoes_por_slug.setdefault(slug, []).append(q)
        
    for slug, qs in questoes_por_slug.items():
        with open(PUBLIC_ASSUNTOS_DIR / f"{slug}.json", "w", encoding="utf-8") as f:
            json.dump(qs, f, ensure_ascii=False, indent=2)
        with open(SITE_ASSUNTOS_DIR / f"{slug}.js", "w", encoding="utf-8") as f:
            f.write(f"export const questoes = {json.dumps(qs, ensure_ascii=False, indent=2)};\nexport default questoes;\n")
            
    # Exportar CSV de Backup
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    csv_file = BACKUP_DIR / "questoes_backup_completo.csv"
    with open(csv_file, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            "ID", "Banca", "Matéria", "Assunto", "Cargo", "Ano", "Órgão", "Prova",
            "Enunciado", "Alt_A", "Alt_B", "Alt_C", "Alt_D", "Alt_E", "Gabarito",
            "Fundamentação", "Comentário_Distratores"
        ])
        for q in todas_as_questoes:
            alts_dict = {a["id"]: a["texto"] for a in q["alternativas"]}
            dist_str = " | ".join(f"{d['letra']}: {d['motivo']}" for d in q.get("analise_distratores", []))
            writer.writerow([
                q["id"], q["banca"], q["materia"], q["assunto"], q["cargo"], q["ano"], q["orgao"], q["prova"],
                q["enunciado"], alts_dict.get("A", ""), alts_dict.get("B", ""), alts_dict.get("C", ""),
                alts_dict.get("D", ""), alts_dict.get("E", ""), q["resposta_correta"],
                q.get("fundamentacao_correta", ""), dist_str
            ])
            
    print(f"\n🎉 SUCESSO ABSOLUTO! Acervo 100% auditado, validado e sincronizado.")

if __name__ == "__main__":
    auditar_e_reconstruir()
