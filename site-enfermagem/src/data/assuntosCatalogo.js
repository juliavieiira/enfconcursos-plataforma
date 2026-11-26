// Catálogo auditado de disciplinas e assuntos para EnfConcursos
// Baseado fielmente no acervo de 3.884 questões auditadas (SELECON & FCC)

export const ASSUNTOS_PORTUGUES = [
  {
    slug: 'interpretacao_e_compreensao_de_textos',
    nome: 'Interpretação e Compreensão de Textos',
    total: 833,
    materia: 'Língua Portuguesa',
    termos: ['interpretação', 'compreensão', 'leitura', 'sentido do texto']
  },
  {
    slug: 'emprego_do_sinal_indicativo_de_crase',
    nome: 'Emprego do Sinal Indicativo de Crase',
    total: 558,
    materia: 'Língua Portuguesa',
    termos: ['crase', 'sinal indicativo de crase', 'a craseado']
  },
  {
    slug: 'semantica_e_significacao_das_palavras',
    nome: 'Semântica e Significação das Palavras',
    total: 163,
    materia: 'Língua Portuguesa',
    termos: ['semântica', 'sinonímia', 'antonímia', 'polissemia', 'conotação']
  },
  {
    slug: 'morfologia_tempos_e_modos_verbais',
    nome: 'Morfologia - Tempos e Modos Verbais',
    total: 123,
    materia: 'Língua Portuguesa',
    termos: ['verbais', 'verbo', 'conjugação', 'modo verbal']
  },
  {
    slug: 'sintaxe_da_oracao_e_do_periodo',
    nome: 'Sintaxe da Oração e do Período',
    total: 84,
    materia: 'Língua Portuguesa',
    termos: ['sintaxe', 'termo da oração', 'sujeito', 'predicado', 'concordância', 'regência']
  },
  {
    slug: 'pontuacao_e_emprego_da_virgula',
    nome: 'Pontuação e Emprego da Vírgula',
    total: 74,
    materia: 'Língua Portuguesa',
    termos: ['pontuação', 'vírgula', 'dois pontos', 'ponto e vírgula']
  },
  {
    slug: 'conjuncoes_e_relacoes_logico_discursivas',
    nome: 'Conjunções e Relações Lógico-Discursivas',
    total: 67,
    materia: 'Língua Portuguesa',
    termos: ['conjunções', 'conectivos', 'relação lógica', 'adversativa', 'concessiva']
  },
  {
    slug: 'morfologia_pronomes_e_colocacao_pronominal',
    nome: 'Morfologia - Pronomes e Colocação Pronominal',
    total: 51,
    materia: 'Língua Portuguesa',
    termos: ['pronomes', 'colocação pronominal', 'próclise', 'ênclise', 'mesóclise']
  },
  {
    slug: 'tipologia_e_generos_textuais',
    nome: 'Tipologia e Gêneros Textuais',
    total: 41,
    materia: 'Língua Portuguesa',
    termos: ['tipologia', 'gêneros textuais', 'narrativo', 'dissertativo', 'injuntivo']
  },
  {
    slug: 'coesao_textual_e_referenciacao',
    nome: 'Coesão Textual e Referenciação',
    total: 38,
    materia: 'Língua Portuguesa',
    termos: ['coesão', 'referenciação', 'anáfora', 'catáfora']
  },
  {
    slug: 'morfologia_classes_gramaticais',
    nome: 'Morfologia - Classes Gramaticais',
    total: 33,
    materia: 'Língua Portuguesa',
    termos: ['classes gramaticais', 'substantivo', 'adjetivo', 'advérbio', 'artigo']
  },
  {
    slug: 'ortografia_oficial_e_acentuacao_grafica',
    nome: 'Ortografia Oficial e Acentuação Gráfica',
    total: 24,
    materia: 'Língua Portuguesa',
    termos: ['ortografia', 'acentuação gráfica', 'novo acordo', 'oxítona', 'paroxítona']
  },
  {
    slug: 'fonologia_e_acentuacao',
    nome: 'Fonologia e Acentuação',
    total: 12,
    materia: 'Língua Portuguesa',
    termos: ['fonologia', 'fonema', 'encontros vocálicos', 'dígrafos']
  }
];

export const ASSUNTOS_ENFERMAGEM = [
  {
    slug: 'fundamentos_e_procedimentos_de_enfermagem',
    nome: 'Fundamentos e Procedimentos de Enfermagem',
    total: 274,
    materia: 'Enfermagem',
    termos: ['fundamentos', 'procedimentos', 'técnicas', 'sinais vitais']
  },
  {
    slug: 'saude_publica_sus_e_atencao_basica',
    nome: 'Saúde Pública, SUS e Atenção Básica',
    total: 225,
    materia: 'Enfermagem',
    termos: ['saúde pública', 'sus', 'atenção básica', 'saúde da família', 'promoção da saúde', '8.142', 'legislação em saúde']
  },
  {
    slug: 'seguranca_do_paciente_e_biosseguranca',
    nome: 'Segurança do Paciente e Biossegurança',
    total: 165,
    materia: 'Enfermagem',
    termos: ['segurança do paciente', 'biossegurança', 'infecção hospitalar', 'gerenciamento de resíduos']
  },
  {
    slug: 'legislacao_de_enfermagem_e_codigo_de_etica',
    nome: 'Legislação de Enfermagem e Código de Ética',
    total: 161,
    materia: 'Enfermagem',
    termos: ['legislação de enfermagem', 'código de ética', 'cofen', 'coren', 'exercício profissional', 'bioética']
  },
  {
    slug: 'urgencia_emergencia_e_pcr',
    nome: 'Urgência, Emergência e PCR',
    total: 139,
    materia: 'Enfermagem',
    termos: ['urgência', 'emergência', 'pcr', 'choques', 'primeiros socorros', 'uti', 'suporte ventilatório']
  },
  {
    slug: 'farmacologia_calculo_e_administracao_de_medicamentos',
    nome: 'Farmacologia, Cálculo e Administração de Medicamentos',
    total: 137,
    materia: 'Enfermagem',
    termos: ['farmacologia', 'medicamentos', 'cálculo de solução', 'intramuscular', 'endovenosa', 'subcutânea', 'dietas']
  },
  {
    slug: 'epidemiologia_e_vigilancia_em_saude',
    nome: 'Epidemiologia e Vigilância em Saúde',
    total: 119,
    materia: 'Enfermagem',
    termos: ['epidemiologia', 'vigilância']
  },
  {
    slug: 'imunizacao_e_calendario_vacinal_pni',
    nome: 'Imunização e Calendário Vacinal (PNI)',
    total: 108,
    materia: 'Enfermagem',
    termos: ['imunização', 'vacinal', 'vacina', 'pni', 'calendário vacinal', 'política nacional de imunização']
  },
  {
    slug: 'doencas_cronicas_nao_transmissiveis_has_diabetes',
    nome: 'Doenças Crônicas Não Transmissíveis (HAS, Diabetes)',
    total: 104,
    materia: 'Enfermagem',
    termos: ['crônicas', 'hipertensão', 'diabetes', 'cardiovasculares', 'respiratórias', 'renais', 'avc']
  },
  {
    slug: 'saude_da_mulher_pre_natal_e_parto',
    nome: 'Saúde da Mulher, Pré-Natal e Parto',
    total: 61,
    materia: 'Enfermagem',
    termos: ['saúde da mulher', 'pré-natal', 'parto', 'aborto', 'aleitamento', 'gestante', 'planejamento familiar']
  },
  {
    slug: 'doencas_infecciosas_e_parasitarias_dengue_tuberculose_hiv',
    nome: 'Doenças Infecciosas e Parasitárias (Dengue, Tuberculose, HIV)',
    total: 58,
    materia: 'Enfermagem',
    termos: ['infecciosas', 'parasitárias', 'tuberculose', 'dengue', 'hanseníase', 'hiv', 'aids', 'ist']
  },
  {
    slug: 'administracao_gestao_e_auditoria',
    nome: 'Administração, Gestão e Auditoria',
    total: 42,
    materia: 'Enfermagem',
    termos: ['administração em enfermagem', 'auditoria', 'gestão', 'liderança']
  },
  {
    slug: 'saude_do_idoso_e_cuidados_paliativos',
    nome: 'Saúde do Idoso e Cuidados Paliativos',
    total: 38,
    materia: 'Enfermagem',
    termos: ['saúde do idoso', 'cuidados paliativos']
  },
  {
    slug: 'centro_cirurgico_e_cme_esterilizacao',
    nome: 'Centro Cirúrgico e CME (Esterilização)',
    total: 38,
    materia: 'Enfermagem',
    termos: ['centro cirúrgico', 'esterilizado', 'cme', 'pós-operatório', 'trans-operatório']
  },
  {
    slug: 'processo_de_enfermagem_e_sistematizacao_sae',
    nome: 'Processo de Enfermagem e Sistematização (SAE)',
    total: 37,
    materia: 'Enfermagem',
    termos: ['processo de enfermagem', 'sistematização', 'teorias da enfermagem']
  },
  {
    slug: 'saude_mental_e_atencao_psicossocial',
    nome: 'Saúde Mental e Atenção Psicossocial',
    total: 28,
    materia: 'Enfermagem',
    termos: ['saúde mental']
  },
  {
    slug: 'assistencia_em_feridas_curativos_e_queimados',
    nome: 'Assistência em Feridas, Curativos e Queimados',
    total: 27,
    materia: 'Enfermagem',
    termos: ['feridas', 'curativos', 'queimados']
  },
  {
    slug: 'saude_da_crianca_e_do_adolescente_pediatria',
    nome: 'Saúde da Criança e do Adolescente (Pediatria)',
    total: 22,
    materia: 'Enfermagem',
    termos: ['saúde da criança', 'adolescente', 'recém-nascido', 'pediatria']
  }
];


// Mapeia assunto para o slug correspondente
export function getSlugPorAssunto(materia, nomeAssunto) {
  if (!nomeAssunto || nomeAssunto === 'Todos') {
    if (materia === 'Enfermagem') return 'enfermagem_todas';
    if (materia === 'Língua Portuguesa') return 'portugues_todas';
    return 'todas_geral';
  }
  const item = [...ASSUNTOS_PORTUGUES, ...ASSUNTOS_ENFERMAGEM].find(a => a.nome === nomeAssunto);
  return item ? item.slug : 'fundamentos_e_procedimentos_de_enfermagem';
}

// Cache em memória dos chunks carregados
const cacheQuestoesChunks = new Map();

async function carregarChunkPorSlug(slug) {
  if (cacheQuestoesChunks.has(slug)) {
    return cacheQuestoesChunks.get(slug);
  }

  // 1. Tenta carregar do public/data/assuntos/ (suportando qualquer BASE_URL)
  const rawBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
  const cleanBase = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
  const urlCandidata = `${cleanBase}data/assuntos/${slug}.json`;

  try {
    const res = await fetch(urlCandidata);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        cacheQuestoesChunks.set(slug, data);
        return data;
      }
    }
  } catch (err) {
    console.warn(`Fetch 1 (${urlCandidata}) falhou:`, err);
  }

  // 2. Fallback direto para caminho relativo
  try {
    const res2 = await fetch(`./data/assuntos/${slug}.json`);
    if (res2.ok) {
      const data2 = await res2.json();
      if (Array.isArray(data2) && data2.length > 0) {
        cacheQuestoesChunks.set(slug, data2);
        return data2;
      }
    }
  } catch (err2) {
    console.warn('Fetch 2 falhou:', err2);
  }

  // 3. Fallback dinâmico do Vite (garantido se fetch falhar em embedded preview)
  try {
    const mod = await import(`./assuntos/${slug}.json`);
    const data3 = mod.default || mod;
    if (Array.isArray(data3) && data3.length > 0) {
      cacheQuestoesChunks.set(slug, data3);
      return data3;
    }
  } catch (err3) {
    console.warn('Import dinâmico de chunk falhou:', err3);
  }

  return [];
}

// Carregamento sob demanda ultra-rápido por assunto selecionado
export async function carregarQuestoesAssunto(materia, nomeAssunto) {
  const slug = getSlugPorAssunto(materia, nomeAssunto);

  if (slug === 'todas_geral') {
    if (cacheQuestoesChunks.has('todas_geral')) {
      return cacheQuestoesChunks.get('todas_geral');
    }
    const [enf, port] = await Promise.all([
      carregarChunkPorSlug('enfermagem_todas'),
      carregarChunkPorSlug('portugues_todas')
    ]);
    const combinado = [...enf, ...port];
    if (combinado.length > 0) {
      cacheQuestoesChunks.set('todas_geral', combinado);
    }
    return combinado;
  }

  return carregarChunkPorSlug(slug);
}

// Helper para testar se uma questão corresponde ao assunto selecionado
export function questaoPertenceAoAssunto(questao, nomeAssunto) {
  if (!nomeAssunto || nomeAssunto === 'Todos') return true;
  if (!questao) return false;

  const assuntoQuestao = (questao.assunto || '').toLowerCase();
  const nomeLower = nomeAssunto.toLowerCase();

  // 1. Procura na lista de Português
  const port = ASSUNTOS_PORTUGUES.find(a => a.nome === nomeAssunto || a.nome.toLowerCase() === nomeLower);
  if (port) {
    if (questao.materia === 'Língua Portuguesa') {
      if (assuntoQuestao.includes(nomeLower) || assuntoQuestao === port.nome.toLowerCase()) return true;
      return port.termos.some(t => assuntoQuestao.includes(t.toLowerCase()));
    }
    return false;
  }

  // 2. Procura na lista de Enfermagem
  const enf = ASSUNTOS_ENFERMAGEM.find(a => a.nome === nomeAssunto || a.nome.toLowerCase() === nomeLower);
  if (enf) {
    if (questao.materia === 'Enfermagem') {
      if (assuntoQuestao.includes(nomeLower)) return true;
      return enf.termos.some(t => assuntoQuestao.includes(t.toLowerCase()));
    }
    return false;
  }

  return assuntoQuestao.includes(nomeLower);
}
