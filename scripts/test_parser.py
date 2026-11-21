#!/usr/bin/env python3
"""
Test parser for single PDF to inspect questions, options, metadata and gabarito.
"""
import subprocess
import re
import json

def parse_pdf(pdf_path):
    out = subprocess.check_output(['pdftotext', pdf_path, '-'], text=True)
    
    # Extrair gabarito do final
    respostas_match = re.search(r'Respostas\s+([\s\S]+)$', out)
    gabaritos = {}
    if respostas_match:
        pairs = re.findall(r'(\d+):\s*([A-E])', respostas_match.group(1))
        for num, let in pairs:
            gabaritos[int(num)] = let
            
    print(f"Gabaritos encontrados: {len(gabaritos)}")
    
    # Remover o bloco final de Respostas e URLs de rodapé
    texto_principal = out[:respostas_match.start()] if respostas_match else out
    
    # Dividir questões por blocos: número seguido de QID
    # Ex: "\n1\n\nQ4445455 "
    padrao_questao = re.compile(r'\n+(\d+)\s*\n+(Q\d+)\s+Enfermagem\s*>\s*([^\n\r]+)\s*\n+Ano:\s*(\d{4})\s*Banca:\s*([^\n\r]+?)\s*Órgão:\s*([^\n\r]+?)\s*Prova:\s*([^\n\r]+(?:\n[^\n\r]+)?)', re.MULTILINE)
    
    matches = list(padrao_questao.finditer(texto_principal))
    print(f"Questões identificadas no cabeçalho: {len(matches)}")
    
    questoes = []
    for i, m in enumerate(matches):
        num_ordem = int(m.group(1))
        qid = m.group(2)
        assunto = m.group(3).strip()
        ano = int(m.group(4))
        banca = m.group(5).strip()
        orgao = m.group(6).strip()
        prova = re.sub(r'\s+', ' ', m.group(7)).strip()
        
        # O corpo da questão vai do fim deste match até o início do próximo match (ou fim do texto)
        inicio_corpo = m.end()
        fim_corpo = matches[i+1].start() if i+1 < len(matches) else len(texto_principal)
        corpo = texto_principal[inicio_corpo:fim_corpo].strip()
        
        # Limpar rodapés do Qconcursos (ex: "https://www.qconcursos.com/... 1/7") e form feeds
        corpo = re.sub(r'https?://[^\n]+', '', corpo)
        corpo = re.sub(r'\d{1,2}/\d{1,2}/\d{4},\s*\d{2}:\d{2}', '', corpo)
        corpo = re.sub(r'Questões de Concurso sobre Enfermagem[^\n]+', '', corpo)
        corpo = re.sub(r'www\.qconcursos\.com', '', corpo)
        corpo = re.sub(r'\x0c', '', corpo)
        corpo = re.sub(r'\n\s*\d+\s*/\s*\d+\s*\n', '\n', corpo)
        
        # Separar enunciado das alternativas (A, B, C, D...)
        # As alternativas começam com letra maiúscula isolada em uma linha: "\nA\n" ou no início
        alt_matches = list(re.finditer(r'\n([A-E])\s*\n+', '\n' + corpo))
        
        if alt_matches:
            # Enunciado é tudo antes da primeira alternativa
            enunciado = corpo[:alt_matches[0].start()].strip()
            
            alternativas = []
            for j, am in enumerate(alt_matches):
                letra = am.group(1)
                start_alt = am.end()
                end_alt = alt_matches[j+1].start() if j+1 < len(alt_matches) else len(corpo) + 1
                # offset porque adicionamos '\n'
                start_idx = max(0, start_alt - 1)
                end_idx = min(len(corpo), end_alt - 1)
                texto_alt = re.sub(r'\s+', ' ', corpo[start_idx:end_idx]).strip()
                alternativas.append({
                    "id": letra,
                    "texto": texto_alt
                })
        else:
            enunciado = corpo.strip()
            alternativas = []
            
        gabarito = gabaritos.get(num_ordem, "")
        
        # Detectar cargo
        cargo = "Técnico de Enfermagem" if "técnico" in prova.lower() else ("Enfermeiro" if "enfermeiro" in prova.lower() else "Enfermagem")
        
        questoes.append({
            "num_original": num_ordem,
            "codigo_origem": qid,
            "assunto": assunto,
            "ano": ano,
            "banca": banca,
            "orgao": orgao,
            "prova": prova,
            "cargo": cargo,
            "enunciado": re.sub(r'\s+', ' ', enunciado).strip(),
            "alternativas": alternativas,
            "resposta_correta": gabarito
        })
        
    return questoes

if __name__ == '__main__':
    q_list = parse_pdf('/home/antigravity/01_PDFS_DE_REFERENCIA/prefeituras/selecon_questoes/Questões Concurso Enfermagem SELECON _01.pdf')
    print(f"Total extraído: {len(q_list)}")
    if q_list:
        print("\n--- PRIMEIRA QUESTÃO ---")
        print(json.dumps(q_list[0], indent=2, ensure_ascii=False))
        print("\n--- SEGUNDA QUESTÃO ---")
        print(json.dumps(q_list[1], indent=2, ensure_ascii=False))
