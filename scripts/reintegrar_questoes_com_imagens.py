#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
reintegrar_questoes_com_imagens.py
Reintegra as 20 questões que contêm imagens/gráficos/tirinhas/ECG
ao banco de dados do Supabase e aos arquivos locais do projeto.
"""

import json
import os
import re
import urllib.request
import urllib.error

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL", "https://nvbmpzpuqbdxlhkdxyri.supabase.co")

def _obter_service_key():
    if "SUPABASE_SERVICE_ROLE_KEY" in os.environ:
        return os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    env_local = os.path.join(os.path.dirname(__file__), "..", "site-enfermagem", ".env.local")
    if os.path.exists(env_local):
        with open(env_local, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                    return line.strip().split("=", 1)[1]
    return os.environ.get("VITE_SUPABASE_ANON_KEY", "")

SUPABASE_KEY = _obter_service_key()



# Definição auditada das 20 questões recuperadas
QUESTOES_RECUPERADAS = [
    # 1. Q3817668
    {
        "id": "PT0964",
        "codigo_origem": "Q3817668",
        "banca": "SELECON",
        "materia": "Língua Portuguesa",
        "assunto": "Pontuação",
        "cargo": "Motorista de Transporte Escolar",
        "orgao": "Prefeitura de Sapezal - MT",
        "ano": 2025,
        "prova": "SELECON - 2025 - Prefeitura de Sapezal - MT - Motorista de Transporte Escolar",
        "enunciado": (
            "Leia os textos das campanhas a seguir:\n\n"
            "**Texto I - Agosto Dourado:**\n"
            "![Cartaz Agosto Dourado - Incentivo ao Aleitamento Materno](/questoes_imagens/q_cartaz_agosto_dourado.png)\n"
            "Fonte: Acesso em 03/09/2025.\n\n"
            "**Texto II - Agosto Laranja:**\n"
            "![Cartaz Agosto Laranja - Conscientização sobre a Saúde das Pessoas com Deficiência](/questoes_imagens/q_cartaz_agosto_laranja.png)\n"
            "Fonte: Acesso em 03/09/2025.\n\n"
            "No Texto II, em “Respeito, empatia e ação constroem um mundo mais justo para todos”, a vírgula foi empregada para:"
        ),
        "alternativas": [
            {"id": "A", "texto": "separar itens em enumeração"},
            {"id": "B", "texto": "apresentar uma explicação"},
            {"id": "C", "texto": "separar duas orações"},
            {"id": "D", "texto": "indicar um aposto"}
        ],
        "resposta_correta": "A",
        "fundamentacao_correta": (
            "Na oração 'Respeito, empatia e ação constroem um mundo mais justo para todos', os termos "
            "'Respeito', 'empatia' e 'ação' funcionam sintaticamente como núcleos do sujeito composto. "
            "A vírgula é empregada obrigatoriamente para separar elementos de mesma função sintática dispostos em enumeração."
        ),
        "analise_distratores": [
            {"letra": "B", "motivo": "Incorreta: não há oração explicativa nem termo explicativo antecedente que justifique vírgula de explicação."},
            {"letra": "C", "motivo": "Incorreta: trata-se de uma única oração com sujeito composto, não havendo duas orações separadas pela vírgula."},
            {"letra": "D", "motivo": "Incorreta: nenhum dos termos atua como aposto; são todos núcleos coordenados do sujeito."}
        ],
        "ativo": True
    },

    # 2. Q3794729
    {
        "id": "PT0965",
        "codigo_origem": "Q3794729",
        "banca": "SELECON",
        "materia": "Língua Portuguesa",
        "assunto": "Compreensão e Interpretação de Texto",
        "cargo": "Assistente Administrativo",
        "orgao": "Prefeitura de Barra do Garças - MT",
        "ano": 2025,
        "prova": "SELECON - 2025 - Prefeitura de Barra do Garças - MT - Nível Médio",
        "enunciado": (
            "Leia a tirinha a seguir:\n\n"
            "![Tirinha Batente de Galhardo](/questoes_imagens/q_tirinha_galhardo_batente.png)\n\n"
            "Na tirinha de Galhardo, os últimos dois quadros revelam a crítica central do texto, que se direciona à(ao):"
        ),
        "alternativas": [
            {"id": "A", "texto": "diminuição da escrita no contexto cibernético"},
            {"id": "B", "texto": "dificuldade de concentração em frente às telas"},
            {"id": "C", "texto": "aprimoramento do sujeito pelos objetos tecnológicos"},
            {"id": "D", "texto": "declínio da memória e do intelecto em tempos digitais"}
        ],
        "resposta_correta": "D",
        "fundamentacao_correta": (
            "O humor crítico da tirinha de Galhardo constrói-se na oposição irônica entre o enorme poder de "
            "armazenamento dos aparelhos eletrônicos do personagem (laptop de 8GB, smartphone com mais de 2 milhões de informações, "
            "pen-drive e iPod com 10 mil músicas) e a sua escassa capacidade reflexiva/intelectual própria ('umas três ideias mequetrefes, "
            "no máximo! E olhe lá!'). O alvo da sátira é justamente o empobrecimento cognitivo e o declínio do intelecto humano na era digital."
        ),
        "analise_distratores": [
            {"letra": "A", "motivo": "Incorreta: a tirinha não discute a prática da escrita ou grafia, mas sim a capacidade mnemônica e intelectual."},
            {"letra": "B", "motivo": "Incorreta: o foco da crítica não é o déficit de atenção momentâneo diante das telas, mas a perda global de capacidade pensante."},
            {"letra": "C", "motivo": "Incorreta: a tirinha satiriza o homem que não se aprimora, tornando-se dependente e intelectualmente limitado perante suas máquinas."}
        ],
        "ativo": True
    },

    # 3. Q3722716
    {
        "id": "PT0966",
        "codigo_origem": "Q3722716",
        "banca": "SELECON",
        "materia": "Língua Portuguesa",
        "assunto": "Pontuação",
        "cargo": "Gari",
        "orgao": "Prefeitura de Nobres - MT",
        "ano": 2025,
        "prova": "SELECON - 2025 - Prefeitura de Nobres - MT - Gari",
        "enunciado": (
            "Leia o cartaz da campanha de saúde pública a seguir:\n\n"
            "![Campanha Doe Sangue HEMOPI / HGV](/questoes_imagens/q_cartaz_hemopi_doacao_sangue.png)\n"
            "Fonte: https://antigo.pi.gov.br/noticias/hgv-lanca-campanha-para-incentivar-doacaode-sangue/. Acesso em 06/07/2025.\n\n"
            "A única alternativa em que a pontuação está corretamente empregada é:"
        ),
        "alternativas": [
            {"id": "A", "texto": "“Doe sangue. É importante para a saúde pública”"},
            {"id": "B", "texto": "“Doe sangue, É importante para, a saúde pública”"},
            {"id": "C", "texto": "“Doe sangue? É importante para a saúde pública!”"},
            {"id": "D", "texto": "“Doe sangue! É importante para, a saúde pública!”"}
        ],
        "resposta_correta": "A",
        "fundamentacao_correta": (
            "Na opção [A], a oração imperativa ('Doe sangue.') encerra-se com ponto final, iniciando-se a oração "
            "subsequente com letra maiúscula ('É importante para a saúde pública'), sem intercalação indevida de vírgulas "
            "entre preposição e complemento nominal."
        ),
        "analise_distratores": [
            {"letra": "B", "motivo": "Incorreta: há vírgula separando indevidamente a preposição 'para' de seu complemento 'a saúde pública', além de letra maiúscula após vírgula comum."},
            {"letra": "C", "motivo": "Incorreta: o ponto de interrogação descaracteriza o comando exortativo de doação de sangue."},
            {"letra": "D", "motivo": "Incorreta: contém vírgula incorreta e proibida entre a preposição 'para' e 'a saúde pública'."}
        ],
        "ativo": True
    },

    # 4. Q3722711
    {
        "id": "PT0967",
        "codigo_origem": "Q3722711",
        "banca": "SELECON",
        "materia": "Língua Portuguesa",
        "assunto": "Conjunções e Relações Semânticas",
        "cargo": "Gari",
        "orgao": "Prefeitura de Nobres - MT",
        "ano": 2025,
        "prova": "SELECON - 2025 - Prefeitura de Nobres - MT - Gari",
        "enunciado": (
            "Leia o cartaz da campanha a seguir:\n\n"
            "![Campanha Doe Sangue HEMOPI / HGV](/questoes_imagens/q_cartaz_hemopi_doacao_sangue.png)\n"
            "Fonte: https://antigo.pi.gov.br/noticias/hgv-lanca-campanha-para-incentivar-doacaode-sangue/. Acesso em 06/07/2025.\n\n"
            "Na frase “Dependemos de você para recomeçar do zero”, a palavra destacada serve para indicar:"
        ),
        "alternativas": [
            {"id": "A", "texto": "causa"},
            {"id": "B", "texto": "condição"},
            {"id": "C", "texto": "finalidade"},
            {"id": "D", "texto": "consequência"}
        ],
        "resposta_correta": "C",
        "fundamentacao_correta": (
            "A preposição 'para', seguida de verbo no infinitivo ('recomeçar'), introduz oração subordinada adverbial "
            "final reduzida, exprimindo objetivo, propósito ou finalidade (equivalente a 'a fim de recomeçar do zero')."
        ),
        "analise_distratores": [
            {"letra": "A", "motivo": "Incorreta: causa indicaria o motivo anterior que gerou o fato, o que não ocorre com o conectivo 'para'."},
            {"letra": "B", "motivo": "Incorreta: condição exigiria nexo condicional hipotético como 'se' ou 'caso'."},
            {"letra": "D", "motivo": "Incorreta: consequência indicaria o efeito resultante, introduzido por conectivos como 'de modo que', 'tanto que'."}
        ],
        "ativo": True
    },

    # 5. Q3197345
    {
        "id": "PT0968",
        "codigo_origem": "Q3197345",
        "banca": "SELECON",
        "materia": "Língua Portuguesa",
        "assunto": "Compreensão e Interpretação de Texto",
        "cargo": "Apoio Operacional",
        "orgao": "Prefeitura de Sinop - MT",
        "ano": 2025,
        "prova": "SELECON - 2025 - Prefeitura de Sinop - MT - Nível Fundamental",
        "enunciado": (
            "Leia a tirinha a seguir:\n\n"
            "![Tirinha da Barata e Professora Mel](/questoes_imagens/q_tirinha_barata_mel.png)\n"
            "Fonte: Acesso em 07/01/2025.\n\n"
            "Na tirinha, o homem é uma personagem:"
        ),
        "alternativas": [
            {"id": "A", "texto": "principal, pois é tão central quanto a barata"},
            {"id": "B", "texto": "principal, pois apresenta traços físicos mais atraentes que os da barata"},
            {"id": "C", "texto": "secundária, pois não é tão central quanto a barata"},
            {"id": "D", "texto": "secundária, pois pertence à espécie humana, diferente da espécie da barata"}
        ],
        "resposta_correta": "C",
        "fundamentacao_correta": (
            "Em teoria da narrativa, o protagonista/personagem principal é aquele em torno do qual se desenrola toda a trama, "
            "conflito e desfecho dramático ou cômico (no caso, a barata apaixonada). O homem é um personagem secundário, "
            "pois sua presença no cenário serve apenas como elemento desencadeador da insegurança cômica da barata."
        ),
        "analise_distratores": [
            {"letra": "A", "motivo": "Incorreta: o homem não tem falas nem papel central na condução da narrativa."},
            {"letra": "B", "motivo": "Incorreta: traços estéticos físicos não definem o papel estrutural do personagem na narrativa literária."},
            {"letra": "D", "motivo": "Incorreta: o pertencimento à espécie biológica não é critério para classificação narratológica de personagem."}
        ],
        "ativo": True
    },

    # 6. Q3197343
    {
        "id": "PT0969",
        "codigo_origem": "Q3197343",
        "banca": "SELECON",
        "materia": "Língua Portuguesa",
        "assunto": "Coesão Textual e Pronomes",
        "cargo": "Apoio Operacional",
        "orgao": "Prefeitura de Sinop - MT",
        "ano": 2025,
        "prova": "SELECON - 2025 - Prefeitura de Sinop - MT - Nível Fundamental",
        "enunciado": (
            "Considere a tirinha a seguir:\n\n"
            "![Tirinha da Barata e Professora Mel](/questoes_imagens/q_tirinha_barata_mel.png)\n\n"
            "“Esse cara trabalha com ela”. A palavra destacada, na tirinha, faz referência:"
        ),
        "alternativas": [
            {"id": "A", "texto": "à barata"},
            {"id": "B", "texto": "à professora Mel"},
            {"id": "C", "texto": "à flor que a barata segura"},
            {"id": "D", "texto": "à casa onde mora a professora Mel"}
        ],
        "resposta_correta": "B",
        "fundamentacao_correta": (
            "O pronome pessoal do caso reto 'ela' atua como mecanismo coesivo de anáfora, referenciando e retomando "
            "a 'Professora Mel', citada no primeiro quadrinho como o objeto da afeição amorosa da barata."
        ),
        "analise_distratores": [
            {"letra": "A", "motivo": "Incorreta: a barata é a primeira pessoa que fala ('tenho algo para dizer'), sendo o sujeito da perspectiva enunciativa."},
            {"letra": "C", "motivo": "Incorreta: o pronome refere-se a uma pessoa com quem o homem trabalha, não ao buquê de flores."},
            {"letra": "D", "motivo": "Incorreta: não se trabalha 'com uma casa', mas com uma colega de trabalho (a professora Mel)."}
        ],
        "ativo": True
    },

    # 7. Q3197342
    {
        "id": "PT0970",
        "codigo_origem": "Q3197342",
        "banca": "SELECON",
        "materia": "Língua Portuguesa",
        "assunto": "Gêneros Textuais (História em Quadrinhos)",
        "cargo": "Apoio Operacional",
        "orgao": "Prefeitura de Sinop - MT",
        "ano": 2025,
        "prova": "SELECON - 2025 - Prefeitura de Sinop - MT - Nível Fundamental",
        "enunciado": (
            "Considere a tirinha a seguir:\n\n"
            "![Tirinha da Barata e Professora Mel](/questoes_imagens/q_tirinha_barata_mel.png)\n\n"
            "No segundo quadrinho, a barata está expressando:"
        ),
        "alternativas": [
            {"id": "A", "texto": "um pensamento"},
            {"id": "B", "texto": "um sentimento de júbilo"},
            {"id": "C", "texto": "uma fala direta ao homem"},
            {"id": "D", "texto": "um sentimento de muita confiança"}
        ],
        "resposta_correta": "A",
        "fundamentacao_correta": (
            "Na linguagem das histórias em quadrinhos, a tipologia gráfica dos balões possui convenções semióticas estritas: "
            "o balão com contorno em formato de nuvem e pequenos círculos apontados para a cabeça do personagem indica pensamento interior, "
            "ao passo que balões lisos com rabicho pontiagudo indicam fala verbalizada."
        ),
        "analise_distratores": [
            {"letra": "B", "motivo": "Incorreta: o sentimento demonstrado é de desespero e ciúmes, nunca de júbilo (alegria)."},
            {"letra": "C", "motivo": "Incorreta: não há fala direta ao homem, o conteúdo é restrito ao monólogo mental da personagem."},
            {"letra": "D", "motivo": "Incorreta: a barata demonstra total insegurança e sentimento de inferioridade diante do rival."}
        ],
        "ativo": True
    },

    # 8. Q3197341
    {
        "id": "PT0971",
        "codigo_origem": "Q3197341",
        "banca": "SELECON",
        "materia": "Língua Portuguesa",
        "assunto": "Compreensão e Interpretação de Texto",
        "cargo": "Apoio Operacional",
        "orgao": "Prefeitura de Sinop - MT",
        "ano": 2025,
        "prova": "SELECON - 2025 - Prefeitura de Sinop - MT - Nível Fundamental",
        "enunciado": (
            "Considere a tirinha a seguir:\n\n"
            "![Tirinha da Barata e Professora Mel](/questoes_imagens/q_tirinha_barata_mel.png)\n\n"
            "No primeiro quadrinho da tirinha, a barata está:"
        ),
        "alternativas": [
            {"id": "A", "texto": "conversando com a professora Mel"},
            {"id": "B", "texto": "sonhando com um diálogo amoroso"},
            {"id": "C", "texto": "ensaiando o que iria dizer para a amada"},
            {"id": "D", "texto": "interagindo com o homem que vem logo atrás"}
        ],
        "resposta_correta": "C",
        "fundamentacao_correta": (
            "No primeiro quadrinho, a barata caminha segurando flores e diz para si mesma em voz alta "
            "'Professora Mel, tenho algo para dizer...'. Como a professora não está presente na cena, "
            "fica evidente que ela está ensaiando o discurso que fará no momento da declaração."
        ),
        "analise_distratores": [
            {"letra": "A", "motivo": "Incorreta: a professora Mel não está em cena nem presente fisicamente no quadrinho."},
            {"letra": "B", "motivo": "Incorreta: a personagem não está dormindo ou sonhando, ela está em plena vigília caminhando na rua."},
            {"letra": "D", "motivo": "Incorreta: a barata ainda nem percebeu a aproximação do homem, não havendo interação entre eles."}
        ],
        "ativo": True
    },

    # 9. Q3470832
    {
        "id": "PT0972",
        "codigo_origem": "Q3470832",
        "banca": "SELECON",
        "materia": "Língua Portuguesa",
        "assunto": "Interpretação de Texto e Linguagem Visual (Charges)",
        "cargo": "Nível Médio",
        "orgao": "Prefeitura de Lucas do Rio Verde - MT",
        "ano": 2024,
        "prova": "SELECON - 2024 - Prefeitura de Lucas do Rio Verde - MT",
        "enunciado": (
            "Leia a charge a seguir:\n\n"
            "![Charge Queimadas Floresta por Arionauro](/questoes_imagens/q_charge_queimadas_arionauro.png)\n"
            "Fonte: Arionauro Cartuns. Visto em 17/11/2024.\n\n"
            "A charge retrata uma cena de incêndio florestal e, ao lado, os animais observam o ocorrido. "
            "Cada animal tem pensamentos relacionados ao impacto da destruição. Sobre a mensagem principal da charge, "
            "analise as afirmativas abaixo e assinale a opção que melhor representa a mensagem apresentada:"
        ),
        "alternativas": [
            {"id": "A", "texto": "A charge transmite uma mensagem de esperança, mostrando que os animais rapidamente encontram novos lugares para viver após a destruição."},
            {"id": "B", "texto": "A charge busca representar os impactos diretos do desmatamento e das queimadas na fauna, destacando o sofrimento e a perda de habitat dos animais."},
            {"id": "C", "texto": "Os pensamentos dos animais indicam que, mesmo com as queimadas, eles conseguem se adaptar facilmente às mudanças no ambiente."},
            {"id": "D", "texto": "A ilustração critica a ação da estiagem de inverno, apontando as consequências reversíveis para os seres vivos e para o ecossistema."}
        ],
        "resposta_correta": "B",
        "fundamentacao_correta": (
            "A linguagem visual da charge constrói um forte apelo ecológico ao contrastar a paisagem calcinada pelas chamas "
            "com a memória afetiva e biológica dos animais (o macaco lembrando das frutas, a ave de seu ninho, o felino do repouso nos galhos). "
            "A mensagem central foca no drama da perda irremediável de habitat e nos impactos devastadores das queimadas para a fauna silvestre."
        ),
        "analise_distratores": [
            {"letra": "A", "motivo": "Incorreta: a imagem transmite desolação e perda irreparável, em tom de denúncia e não de otimismo fútil."},
            {"letra": "C", "motivo": "Incorreta: a perda de habitat e alimento inviabiliza a vida dos animais no curto e médio prazos, refutando a ideia de adaptação fácil."},
            {"letra": "D", "motivo": "Incorreta: a destruição por incêndios criminosos não é classificada como mera estiagem e causa impactos de difícil reversão."}
        ],
        "ativo": True
    },

    # 10. Q3109055
    {
        "id": "PT0973",
        "codigo_origem": "Q3109055",
        "banca": "SELECON",
        "materia": "Língua Portuguesa",
        "assunto": "Flexão Nominal e Concordância",
        "cargo": "Motorista de Transporte Escolar",
        "orgao": "Prefeitura de Campo Novo do Parecis - MT",
        "ano": 2024,
        "prova": "SELECON - 2024 - Prefeitura de Campo Novo do Parecis - MT - Motorista de Transporte Escolar",
        "enunciado": (
            "Leia o infográfico do Ministério da Saúde a seguir:\n\n"
            "![Infográfico Sarampo - Sintomas e Transmissão](/questoes_imagens/q_infografico_sarampo_ms.png)\n"
            "Fonte: Ministério da Saúde. Acesso em 30/10/2024.\n\n"
            "Considere a frase baseada no infográfico: “A doença viral atinge qualquer idade”. No plural, essa frase estaria corretamente redigida da seguinte forma:"
        ),
        "alternativas": [
            {"id": "A", "texto": "“As doenças virais atingem qualquer idades”"},
            {"id": "B", "texto": "“As doenças virais atingem quaisquer idades”"},
            {"id": "C", "texto": "“As doenças virales atingem qualquer idades”"},
            {"id": "D", "texto": "“As doenças virales atingem quaisquer idades”"}
        ],
        "resposta_correta": "B",
        "fundamentacao_correta": (
            "A concordância nominal e verbal da frase no plural exige a flexão de todos os termos concordantes:\n"
            "- 'A doença' -> 'As doenças';\n"
            "- 'viral' (adjetivo terminado em -al) -> 'virais';\n"
            "- 'atinge' (verbo na 3ª pessoa do plural) -> 'atingem';\n"
            "- 'qualquer' (pronome indefinido que flexiona no meio da palavra) -> 'quaisquer';\n"
            "- 'idade' -> 'idades'.\n"
            "Portanto, a redação padrão perfeita é: 'As doenças virais atingem quaisquer idades'."
        ),
        "analise_distratores": [
            {"letra": "A", "motivo": "Incorreta: 'qualquer' ficou indevidamente invariável diante do substantivo plural 'idades'."},
            {"letra": "C", "motivo": "Incorreta: a forma 'virales' inexiste no português contemporâneo e 'qualquer' não foi flexionado."},
            {"letra": "D", "motivo": "Incorreta: a forma de plural para adjetivos terminados em -al é -ais (virais), não 'virales'."}
        ],
        "ativo": True
    },

    # 11. Q3103178
    {
        "id": "PT0974",
        "codigo_origem": "Q3103178",
        "banca": "SELECON",
        "materia": "Língua Portuguesa",
        "assunto": "Crase",
        "cargo": "Técnico de Infraestrutura",
        "orgao": "Prefeitura de Lucas do Rio Verde - MT",
        "ano": 2024,
        "prova": "SELECON - 2024 - Prefeitura de Lucas do Rio Verde - MT",
        "enunciado": (
            "Leia a charge a seguir:\n\n"
            "![Charge Mosquito da Dengue nos Pneus](/questoes_imagens/q_charge_mosquito_dengue_pneus.png)\n"
            "Fonte: Acesso em 02 nov. 2024.\n\n"
            "A única frase em que houve o correto emprego do acento grave (indicador de crase) é:"
        ),
        "alternativas": [
            {"id": "A", "texto": "Todo o lixo da cidade foi enviado à incineradores."},
            {"id": "B", "texto": "O primeiro à chegar foi o mosquito de maior porte."},
            {"id": "C", "texto": "Os mosquitos e outros insetos voltaram à lata de lixo."},
            {"id": "D", "texto": "Todos os pneus voltaram à ser despejados ao ar livre."}
        ],
        "resposta_correta": "C",
        "fundamentacao_correta": (
            "Na opção [C], o verbo 'voltar' rege a preposição 'a' (quem volta, volta a algum lugar) e o substantivo feminino "
            "'lata' aceita o artigo definido feminino singular 'a'. A fusão preposição + artigo (a + a = à) torna o acento grave "
            "obrigatório: 'voltaram à lata de lixo'."
        ),
        "analise_distratores": [
            {"letra": "A", "motivo": "Incorreta: não ocorre crase antes de substantivo masculino e no plural ('incineradores')."},
            {"letra": "B", "motivo": "Incorreta: é proibido o uso de crase antes de verbos ('chegar')."},
            {"letra": "D", "motivo": "Incorreta: é regra elementar a proibição do acento grave antes de verbo no infinitivo ('ser')."}
        ],
        "ativo": True
    },

    # 12. Q3096890
    {
        "id": "PT0975",
        "codigo_origem": "Q3096890",
        "banca": "SELECON",
        "materia": "Língua Portuguesa",
        "assunto": "Linguagem Verbal e Não Verbal",
        "cargo": "Nível Fundamental",
        "orgao": "Prefeitura de Lucas do Rio Verde - MT",
        "ano": 2024,
        "prova": "SELECON - 2024 - Prefeitura de Lucas do Rio Verde - MT",
        "enunciado": (
            "Leia a tirinha a seguir:\n\n"
            "![Tirinha Hagar o Horrível](/questoes_imagens/q_tirinha_hagar_bom_dia.png)\n"
            "Fonte: Acesso em: 19 ago. 2024.\n\n"
            "A tirinha apresenta:"
        ),
        "alternativas": [
            {"id": "A", "texto": "somente elementos verbais"},
            {"id": "B", "texto": "somente elementos não verbais"},
            {"id": "C", "texto": "tanto elementos verbais quanto não verbais"},
            {"id": "D", "texto": "elementos que não são nem verbais nem não verbais"}
        ],
        "resposta_correta": "C",
        "fundamentacao_correta": (
            "A tirinha é um gênero textual intrinsecamente multimodal / sincrético, que conjuga códigos verbais "
            "(as palavras grafadas nos balões de fala e pensamentos) e códigos não verbais (desenho das personagens, "
            "expressões faciais, cenário da casa e da janela, e símbolos cinéticos/visuais)."
        ),
        "analise_distratores": [
            {"letra": "A", "motivo": "Incorreta: desconsidera a arte gráfica sequencial indispensável para a narrativa da tirinha."},
            {"letra": "B", "motivo": "Incorreta: desconsidera a presença explícita dos textos em língua portuguesa presentes nos balões de diálogo."},
            {"letra": "D", "motivo": "Incorreta: todo signo comunicativo se insere na linguagem verbal, não verbal ou na união de ambas."}
        ],
        "ativo": True
    },

    # 13. Q3096889
    {
        "id": "PT0976",
        "codigo_origem": "Q3096889",
        "banca": "SELECON",
        "materia": "Língua Portuguesa",
        "assunto": "Compreensão e Interpretação de Texto",
        "cargo": "Serviços Gerais",
        "orgao": "Câmara de Itabi - SE",
        "ano": 2024,
        "prova": "SELECON - 2024 - Câmara de Itabi - SE - Serviços Gerais",
        "enunciado": (
            "Leia a tirinha a seguir:\n\n"
            "![Tirinha Hagar o Horrível](/questoes_imagens/q_tirinha_hagar_bom_dia.png)\n"
            "Fonte: Acesso em: 19 ago. 2024.\n\n"
            "A leitura da tirinha permite a inferência de que, na história, a personagem demonstrou:"
        ),
        "alternativas": [
            {"id": "A", "texto": "ânimo do início ao fim"},
            {"id": "B", "texto": "tristeza do início ao fim"},
            {"id": "C", "texto": "tristeza acentuada no início"},
            {"id": "D", "texto": "ânimo mais acentuado no início"}
        ],
        "resposta_correta": "D",
        "fundamentacao_correta": (
            "No primeiro quadrinho, Hagar manifesta grande entusiasmo e energia ('BOM DIA, MUNDO! Mais um dia de novos desafios a serem enfrentados...'). "
            "Entretanto, conforme pondera sobre as obrigações reais e aborrecimentos da rotina ('contas a serem pagas, discussões, queixas...'), "
            "seu ânimo esvazia-se gradativamente até ele se deitar novamente para dormir."
        ),
        "analise_distratores": [
            {"letra": "A", "motivo": "Incorreta: no final da história o personagem desanima completamente e volta a dormir."},
            {"letra": "B", "motivo": "Incorreta: o início da história é marcado por vigor e otimismo radiante, não tristeza."},
            {"letra": "C", "motivo": "Incorreta: o início expressa júbilo e vontade de conquistar mundos, o oposto de tristeza."}
        ],
        "ativo": True
    },

    # 14. Q3096888
    {
        "id": "PT0977",
        "codigo_origem": "Q3096888",
        "banca": "SELECON",
        "materia": "Língua Portuguesa",
        "assunto": "Compreensão e Interpretação de Texto",
        "cargo": "Serviços Gerais",
        "orgao": "Câmara de Itabi - SE",
        "ano": 2024,
        "prova": "SELECON - 2024 - Câmara de Itabi - SE - Serviços Gerais",
        "enunciado": (
            "Considere a tirinha a seguir:\n\n"
            "![Tirinha Hagar o Horrível](/questoes_imagens/q_tirinha_hagar_bom_dia.png)\n\n"
            "Na tirinha, a personagem decide dormir porque:"
        ),
        "alternativas": [
            {"id": "A", "texto": "achou que era o melhor, diante do que refletiu"},
            {"id": "B", "texto": "estava anoitecendo e já era hora habitual de dormir"},
            {"id": "C", "texto": "não encontrou amigos para compartilhar os seus desejos"},
            {"id": "D", "texto": "percebeu que já tinha conquistado tudo o que havia falado nos quadrinhos anteriores"}
        ],
        "resposta_correta": "A",
        "fundamentacao_correta": (
            "A decisão de Hagar de se deitar e puxar o cobertor decorre diretamente da reflexão que fez sobre as tarefas "
            "cansativas e desagradáveis que o aguardavam (pagar contas, enfrentar discussões, ouvir queixas). Diante desse panorama, "
            "ele concluiu que continuar dormindo era a melhor decisão a tomar."
        ),
        "analise_distratores": [
            {"letra": "B", "motivo": "Incorreta: o segundo quadrinho mostra claramente o sol nascendo no horizonte ('Bom dia mundo'), e não o anoitecer."},
            {"letra": "C", "motivo": "Incorreta: a presença de amigos sequer é mencionada ou requerida na narrativa."},
            {"letra": "D", "motivo": "Incorreta: ele não conquistou nada; pelo contrário, desiste das tarefas antes mesmo de iniciá-las."}
        ],
        "ativo": True
    },

    # 15. Q2537148
    {
        "id": "PT0978",
        "codigo_origem": "Q2537148",
        "banca": "SELECON",
        "materia": "Língua Portuguesa",
        "assunto": "Conjunções e Relações Semânticas",
        "cargo": "Técnico de Tecnologia da Informação",
        "orgao": "CEFET-RJ",
        "ano": 2024,
        "prova": "SELECON - 2024 - CEFET-RJ - Técnico de Tecnologia da Informação",
        "enunciado": (
            "Em “Nesse momento, o texto vale tanto quanto o cartum, que fala mais alto em tempos de vozes silenciadas, exílios e prisões” (4º parágrafo), "
            "os termos destacados veiculam o sentido de:"
        ),
        "alternativas": [
            {"id": "A", "texto": "causa."},
            {"id": "B", "texto": "tempo."},
            {"id": "C", "texto": "proporção."},
            {"id": "D", "texto": "comparação."}
        ],
        "resposta_correta": "D",
        "fundamentacao_correta": (
            "A locução conjuntiva comparativa correlativa 'tanto quanto' é empregada tradicionalmente na língua portuguesa "
            "para confrontar dois elementos equiparando seus valores ou intensidades ('o texto vale tanto quanto o cartum' = analogia/comparação de igualdade)."
        ),
        "analise_distratores": [
            {"letra": "A", "motivo": "Incorreta: causa é expressa por conjunções causais como 'porque', 'já que', 'visto que'."},
            {"letra": "B", "motivo": "Incorreta: tempo é introduzido por conjunções temporais como 'quando', 'enquanto', 'assim que'."},
            {"letra": "C", "motivo": "Incorreta: proporcionalidade é expressa por locuções como 'à medida que', 'à proporção que'."}
        ],
        "ativo": True
    },

    # 16. Q2347859
    {
        "id": "PT0979",
        "codigo_origem": "Q2347859",
        "banca": "SELECON",
        "materia": "Língua Portuguesa",
        "assunto": "Coesão Textual e Conectivos",
        "cargo": "Fiscal de Obras",
        "orgao": "Prefeitura de Sapezal - MT",
        "ano": 2024,
        "prova": "SELECON - 2024 - Prefeitura de Sapezal - MT - Fiscal de Obras",
        "enunciado": (
            "Leia o cartaz de orientação em saúde pública a seguir:\n\n"
            "![Guia de Orientações no Combate à Dengue](/questoes_imagens/q_guia_combate_dengue_8passos.png)\n"
            "Fonte: Acesso em: 14 dez. 2023.\n\n"
            "No trecho “Coloque o lixo em sacos plásticos e mantenha a lixeira bem fechada. Não jogue lixo em terrenos baldios”, "
            "o ponto que separa as duas frases poderia ser substituído, sem alteração de sentido, por:"
        ),
        "alternativas": [
            {"id": "A", "texto": "Com isso"},
            {"id": "B", "texto": "Para isso"},
            {"id": "C", "texto": "Além disso"},
            {"id": "D", "texto": "Apesar disso"}
        ],
        "resposta_correta": "C",
        "fundamentacao_correta": (
            "Ambas as orações estabelecem recomendações preventivas que se agregam e se somam mutuamente para o combate à proliferação "
            "do mosquito da dengue. O conectivo 'Além disso' tem natureza aditiva, permitindo a transição perfeita de soma de ideias."
        ),
        "analise_distratores": [
            {"letra": "A", "motivo": "Incorreta: 'Com isso' estabelece relação de causalidade ou consequência, distorcendo a soma de orientações."},
            {"letra": "B", "motivo": "Incorreta: 'Para isso' possui sentido de finalidade estrita de um plano prévio."},
            {"letra": "D", "motivo": "Incorreta: 'Apesar disso' possui valor concessivo/adversativo de quebra de expectativa, incompatível com o contexto."}
        ],
        "ativo": True
    },

    # 17. Q4160110
    {
        "id": "PT0980",
        "codigo_origem": "Q4160110",
        "banca": "SELECON",
        "materia": "Língua Portuguesa",
        "assunto": "Coesão Referencial e Pronomes",
        "cargo": "Motorista de Caminhão",
        "orgao": "SAAE de Nova Mutum - MT",
        "ano": 2026,
        "prova": "SELECON - 2026 - SAAE de Nova Mutum - MT - Motorista de Caminhão",
        "enunciado": (
            "Leia a imagem da campanha educativa sobre uso consciente da água:\n\n"
            "![Campanha Educativa SAAE - Água na Torneira](/questoes_imagens/q_campanha_agua_torneira.png)\n"
            "Fonte: SAAE Nova Mutum. Acesso em 11/05/2026.\n\n"
            "Na expressão “ela fechada”, o termo em destaque faz referência direta à:"
        ),
        "alternativas": [
            {"id": "A", "texto": "torneira"},
            {"id": "B", "texto": "água desperdiçada"},
            {"id": "C", "texto": "campanha educativa"},
            {"id": "D", "texto": "página da postagem nas redes sociais"}
        ],
        "resposta_correta": "A",
        "fundamentacao_correta": (
            "No texto da campanha ('Um minuto com a torneira aberta gasta 2,5L de água. Só de ler esse post com ela fechada, você já economizou bastante'), "
            "o pronome pessoal feminino 'ela' desempenha papel coesivo anafórico referindo-se diretamente à 'torneira'."
        ),
        "analise_distratores": [
            {"letra": "B", "motivo": "Incorreta: água não se fecha; o substantivo antecedente que admite estado 'aberto/fechado' é a torneira."},
            {"letra": "C", "motivo": "Incorreta: a campanha é o suporte institucional, não o objeto mecânico passível de fechamento no ato."},
            {"letra": "D", "motivo": "Incorreta: a página é onde se lê o post, mas a ação de economia refere-se à torneira."}
        ],
        "ativo": True
    },

    # 18. Q1971264 (FCC Enfermagem)
    {
        "id": "FCC_ENF0883",
        "codigo_origem": "Q1971264",
        "banca": "FCC",
        "materia": "Enfermagem",
        "assunto": "Eletrocardiografia e Monitorização Cardíaca",
        "cargo": "Analista Judiciário - Área Apoio - Enfermagem do Trabalho",
        "orgao": "TRT - 23ª REGIÃO (MT)",
        "ano": 2022,
        "prova": "FCC - 2022 - TRT - 23ª REGIÃO (MT) - Analista Judiciário - Área Apoio - Enfermagem do Trabalho",
        "enunciado": (
            "Durante uma consulta de rotina, um colaborador de 55 anos realizou um exame de eletrocardiograma. "
            "O traçado identificado no momento da monitorização está demonstrado na figura abaixo.\n\n"
            "![Traçado de Eletrocardiograma (ECG)](/questoes_imagens/q_ecg_ritmo_sinusal.png)\n\n"
            "Esse traçado indica:"
        ),
        "alternativas": [
            {"id": "A", "texto": "flutter atrial."},
            {"id": "B", "texto": "ritmo sinusal."},
            {"id": "C", "texto": "fibrilação atrial."},
            {"id": "D", "texto": "fibrilação ventricular."},
            {"id": "E", "texto": "taquicardia supraventricular."}
        ],
        "resposta_correta": "B",
        "fundamentacao_correta": (
            "A análise eletrocardiográfica do traçado apresentado revela todos os critérios fisiológicos do Ritmo Sinusal Normal:\n"
            "1. Presença de onda P de morfologia normal precedendo todo e qualquer complexo QRS;\n"
            "2. Intervalo PR constante e dentro dos limites de normalidade (0,12 a 0,20 s);\n"
            "3. Complexos QRS estreitos (< 0,12 s);\n"
            "4. Intervalos R-R regulares com frequência cardíaca fisiológica (~75 bpm).\n"
            "Portanto, trata-se inequivocamente de ritmo sinusal regular."
        ),
        "analise_distratores": [
            {"letra": "A", "motivo": "Incorreta: o flutter atrial apresentaria ondas 'F' típicas em dentes de serrote em linha de base, com frequência atrial muito elevada (250 a 350 bpm)."},
            {"letra": "C", "motivo": "Incorreta: a fibrilação atrial cursa com ausência de onda P identificável, linha de base irregular/tremida e intervalos R-R marcadamente irregulares."},
            {"letra": "D", "motivo": "Incorreta: a fibrilação ventricular é ritmo de parada cardiorrespiratória caracterizado por ondas caóticas bizarras sem QRS identificável."},
            {"letra": "E", "motivo": "Incorreta: a taquicardia supraventricular cursa com frequência cardíaca paroxística muito acelerada (> 150 bpm) e perda da visibilidade nítida da onda P."}
        ],
        "ativo": True
    },

    # 19. Q934872 (FCC Enfermagem)
    {
        "id": "FCC_ENF0884",
        "codigo_origem": "Q934872",
        "banca": "FCC",
        "materia": "Enfermagem",
        "assunto": "Epidemiologia e Demografia em Saúde",
        "cargo": "Consultor Legislativo - Saúde",
        "orgao": "Câmara Legislativa do Distrito Federal",
        "ano": 2018,
        "prova": "FCC - 2018 - CLDF - Consultor Legislativo - Saúde",
        "enunciado": (
            "Considere o gráfico abaixo elaborado a partir de séries históricas censitárias do IBGE.\n\n"
            "![Taxa média geométrica de crescimento anual da população - Brasil 1872 a 2010](/questoes_imagens/q_grafico_populacao_brasil_1872_2010.png)\n\n"
            "Uma explicação plausível para os dados é que houve:"
        ),
        "alternativas": [
            {"id": "A", "texto": "aumento do número de filhos por mulher em idade fértil somado ao declínio da Taxa de Mortalidade Infantil para a taxa das duas últimas décadas."},
            {"id": "B", "texto": "aumento da Taxa de Natalidade e diminuição na Taxa de Mortalidade para as taxas das últimas 4 décadas."},
            {"id": "C", "texto": "declínio da Taxa de Morbidade e Taxa de Mortalidade para a taxa da penúltima década."},
            {"id": "D", "texto": "declínio da Taxa de Mortalidade Infantil e Taxa de Morbidade para a taxa da última década."},
            {"id": "E", "texto": "declínio na Taxa de Fecundidade para a taxa relativa à última década."}
        ],
        "resposta_correta": "E",
        "fundamentacao_correta": (
            "A análise histórica da transição demográfica no Brasil demonstra que a taxa geométrica de crescimento populacional "
            "apresentou redução progressiva a partir dos anos 1970, acentuando-se significativamente na virada do milênio (1,64% em 1991-2000 "
            "e 1,17% em 2000-2010). O fator determinante fundamental dessa desaceleração do crescimento vegetativo nacional foi a vertiginosa "
            "e consistente queda na Taxa Global de Fecundidade (que caiu de mais de 6 filhos por mulher na década de 1960 para menos de 1,9 "
            "na década de 2000-2010, patamar inferior à taxa de reposição populacional de 2,1)."
        ),
        "analise_distratores": [
            {"letra": "A", "motivo": "Incorreta: afirma falsamente que houve aumento de filhos por mulher; a fecundidade sofreu declínio contínuo e acentuado."},
            {"letra": "B", "motivo": "Incorreta: a taxa de natalidade caiu consideravelmente nas últimas quatro décadas no país."},
            {"letra": "C", "motivo": "Incorreta: o declínio da mortalidade isoladamente provocaria aumento do crescimento populacional, e não sua desaceleração."},
            {"letra": "D", "motivo": "Incorreta: a queda da mortalidade infantil preserva vidas e elevaria o crescimento; a causa da diminuição do ritmo de crescimento é a queda na fecundidade."}
        ],
        "ativo": True
    },

    # 20. Q2762316 (FCC Língua Portuguesa)
    {
        "id": "FCC_LP0759",
        "codigo_origem": "Q2762316",
        "banca": "FCC",
        "materia": "Língua Portuguesa",
        "assunto": "Morfologia e Emprego dos Tempos Verbais",
        "cargo": "Técnico Judiciário - Área Administrativa",
        "orgao": "TRT - 11ª Região (AM e RR)",
        "ano": 2024,
        "prova": "FCC - 2024 - TRT - 11ª Região (AM e RR) - Técnico Judiciário - Área Administrativa",
        "enunciado": (
            "Considere a tirinha Bichinhos de jardim a seguir:\n\n"
            "![Tirinha Bichinhos de Jardim - Inteligência Artificial e PJ](/questoes_imagens/q_tirinha_bichinhos_jardim_ia.png)\n"
            "(Disponível em: https://bichinhosdejardim.com)\n\n"
            "O futuro do pretérito, no contexto apresentado (“estariam preocupados... nenhuma IA aceitaria...”), foi usado para referir:"
        ),
        "alternativas": [
            {"id": "A", "texto": "uma situação hipotética, associada a uma condição que, se não for cumprida, pode impedir sua realização."},
            {"id": "B", "texto": "um fato passado, anterior a outro fato também ocorrido no passado."},
            {"id": "C", "texto": "um fato futuro em relação ao momento presente."},
            {"id": "D", "texto": "uma situação hipotética que não se realizará no futuro."},
            {"id": "E", "texto": "um fato concluido no passado."}
        ],
        "resposta_correta": "A",
        "fundamentacao_correta": (
            "O futuro do pretérito do modo indicativo ('estariam', 'aceitaria') é utilizado primariamente para expressar ações "
            "hipotéticas ou prováveis, subordinadas a uma condição implícita ou explícita (incerteza em relação ao fato ou condição "
            "dependente das circunstâncias contratuais descritas no cartum)."
        ),
        "analise_distratores": [
            {"letra": "B", "motivo": "Incorreta: fato passado anterior a outro passado é a definição estrita do pretérito mais-que-perfeito."},
            {"letra": "C", "motivo": "Incorreta: fato futuro em relação ao momento presente é a definição do futuro do presente."},
            {"letra": "D", "motivo": "Incorreta: o tempo verbal denota incerteza/possibilidade condicionada, não uma afirmação categórica de que não ocorrerá."},
            {"letra": "E", "motivo": "Incorreta: fato concluído no passado é o pretérito perfeito."}
        ],
        "ativo": True
    }
]

def main():
    print(f"Iniciando reintegração de {len(QUESTOES_RECUPERADAS)} questões...")

    # 1. Atualizar 02_BANCO_DE_QUESTOES/todas_as_questoes.json
    caminho_todas = "02_BANCO_DE_QUESTOES/todas_as_questoes.json"
    with open(caminho_todas, "r", encoding="utf-8") as f:
        todas = json.load(f)

    existentes_ids = {q["id"] for q in todas}
    existentes_codigos = {q.get("codigo_origem") for q in todas}

    adicionadas_local = 0
    for q in QUESTOES_RECUPERADAS:
        if q["id"] not in existentes_ids and q.get("codigo_origem") not in existentes_codigos:
            todas.append(q)
            existentes_ids.add(q["id"])
            adicionadas_local += 1
        else:
            # Atualiza registro existente se necessário
            for idx, item in enumerate(todas):
                if item["id"] == q["id"] or item.get("codigo_origem") == q.get("codigo_origem"):
                    todas[idx] = q
                    break

    with open(caminho_todas, "w", encoding="utf-8") as f:
        json.dump(todas, f, ensure_ascii=False, indent=2)

    print(f"[LOCAL] {caminho_todas} atualizado. Total agora: {len(todas)} questões (+{adicionadas_local} novas).")

    # 2. Atualizar arquivos específicos por banca
    selecon_file = "02_BANCO_DE_QUESTOES/por_banca/selecon.json"
    if os.path.exists(selecon_file):
        with open(selecon_file, "r", encoding="utf-8") as f:
            banca_selecon = json.load(f)
        ids_banca = {q["id"] for q in banca_selecon}
        for q in QUESTOES_RECUPERADAS:
            if q["banca"] == "SELECON" and q["id"] not in ids_banca:
                banca_selecon.append(q)
                ids_banca.add(q["id"])
        with open(selecon_file, "w", encoding="utf-8") as f:
            json.dump(banca_selecon, f, ensure_ascii=False, indent=2)
        print(f"[LOCAL] {selecon_file} atualizado.")

    # 3. Inserir no Supabase via API REST
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }

    print("\nEnviando questões para o Supabase (upsert com merge-duplicates)...")
    url = f"{SUPABASE_URL}/rest/v1/questoes"
    payload_json = json.dumps(QUESTOES_RECUPERADAS, ensure_ascii=False).encode("utf-8")

    req = urllib.request.Request(url, data=payload_json, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"[SUPABASE] Sucesso! Status code: {resp.status}")
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"[SUPABASE] Erro HTTP {e.code}: {error_body}")
        raise

    print("\n--- RESUMO DA REINTEGRAÇÃO ---")
    print(f"Total de questões reintegradas: {len(QUESTOES_RECUPERADAS)}")
    for q in QUESTOES_RECUPERADAS:
        print(f"  ✓ {q['id']} ({q['codigo_origem']}) - {q['banca']} | {q['materia']} | {q['assunto']}")

if __name__ == "__main__":
    main()
