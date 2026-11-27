import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const STORAGE_PREFIX = 'enfconcursos_caderno_erros_';

/**
 * Retorna a chave de armazenamento local para o usuário atual
 */
function getStorageKey(userId) {
  const uid = userId || 'visitante_anonimo';
  return `${STORAGE_PREFIX}${uid}`;
}

/**
 * Base de Conhecimento Especializada: Padrões de Banca e Armadilhas Típicas
 */
const PADROES_BANCA_CONHECIMENTO = {
  FCC: {
    nome: 'Fundação Carlos Chagas (FCC)',
    focoPrincipal: 'Rigor sintático normativo, períodos compostos extensos e concisão textual.',
    pegadinhaFrequente: 'Orações subordinadas adjetivas e adverbiais intercaladas para camuflar o sujeito e induzir ao erro de concordância.',
    assuntosCriticos: {
      'Sintaxe da Oração e do Período': {
        alerta: 'A FCC explora orações desenvolvidas vs reduzidas e a transposição de voz ativa para passiva sintética com pronome "se".',
        dicaOuro: 'Ao encontrar o pronome "se" ligado a verbo transitivo direto, localize imediatamente o termo paciente. Ele é o sujeito!'
      },
      'Emprego do Sinal Indicativo de Crase': {
        alerta: 'Cobrança intensa de paralelismo sintático (de... a... vs da... à...) e crase antes de pronomes relativos ("à qual").',
        dicaOuro: 'Substitua mentalmente a palavra feminina por uma masculina. Se surgir "ao" ou "aos", haverá crase!'
      },
      'Pontuação e Emprego da Vírgula': {
        alerta: 'Proibição estrita de vírgula entre sujeito e verbo ou entre verbo e objeto, mesmo com intercalações de 3 ou mais linhas.',
        dicaOuro: 'Isole mentalmente as orações intercaladas entre travessões ou parênteses para enxergar o esqueleto sintático da oração principal.'
      },
      'Morfologia - Tempos e Modos Verbais': {
        alerta: 'Correlação no modo subjuntivo (imperfeito do subjuntivo "se fizesse" correlacionado com futuro do pretérito "faria").',
        dicaOuro: 'Atenção aos verbos irregulares derivados: manter (mantivesse), intervir (interviesse), propor (propusesse).'
      },
      'Interpretação e Compreensão de Textos': {
        alerta: 'A FCC pune alternativas com extrapolação, reducionismo ou termos absolutos ("sempre", "apenas", "exclusivamente").',
        dicaOuro: 'A alternativa correta é a síntese fidedigna do texto. Desconfie de alternativas radicais que o autor não escreveu textualmente.'
      }
    }
  },
  SELECON: {
    nome: 'Instituto SELECON',
    focoPrincipal: 'Gramática prescritiva direta, tipologia textual prática e legislação de saúde.',
    pegadinhaFrequente: 'Diferença entre encontros consonantais e dígrafos, além das funções da palavra "QUE".',
    assuntosCriticos: {
      'Ortografia Oficial e Acentuação Gráfica': {
        alerta: 'Destaque para paroxítonas terminadas em ditongo crescente vs proparoxítonas aparentes e regras do Novo Acordo.',
        dicaOuro: 'Monossílabos tônicos e oxítonas seguem regras distintas de paroxítonas. Fixe a regra das terminações: A, E, O, EM, ENS.'
      },
      'Fonologia e Acentuação': {
        alerta: 'Contagem minuciosa de fonemas vs letras e identificação de dígrafos separáveis (rr, ss, sc, sç, xc).',
        dicaOuro: 'Lembre-se: letras são sinais gráficos; fonemas são sons emitidos. Dígrafo vale 2 letras e 1 único fonema.'
      },
      'Tipologia e Gêneros Textuais': {
        alerta: 'Diferenciação clara entre textos injuntivos/instrucionais (receitas, manuais, leis) e dissertativos.',
        dicaOuro: 'Presença marcante de verbos no imperativo caracteriza a tipologia injuntiva.'
      }
    }
  },
  Enfermagem: {
    nome: 'Enfermagem & Saúde Pública',
    focoPrincipal: 'Protocolos atualizados do Ministério da Saúde, COFEN/COREN, PNI e Urgência.',
    pegadinhaFrequente: 'Confusão entre competências privativas do enfermeiro vs atribuições do técnico de enfermagem (Lei 7.498/86).',
    assuntosCriticos: {
      'Imunização e Rede de Frio': {
        alerta: 'Intervalos mínimos entre doses, temperatura ideal das câmaras (entre +2°C e +8°C) e contraindicações de vacinas vivas atenuadas.',
        dicaOuro: 'Gestantes e imunodeprimidos graves NÃO recebem vacinas de vírus ou bactérias vivas atenuadas (ex.: Tríplice Viral, Febre Amarela, BCG).'
      },
      'Cálculo e Administração de Medicamentos': {
        alerta: 'Fórmulas de gotejamento em horas vs minutos e conversão de g para mg e mL para UI.',
        dicaOuro: 'Gotas/min = Volume / (Tempo em horas x 3). Para microgotas/min = Volume / Tempo em horas.'
      },
      'Urgência e Emergência': {
        alerta: 'Atualizações das diretrizes de PCR da AHA: 100 a 120 compressões/minuto e profundidade de 5 a 6 cm.',
        dicaOuro: 'A prioridade absoluta na parada cardíaca adulta em ritmo chocável (FV/TVSP) é: Compressões imediatas + Desfibrilação precoce.'
      },
      'Ética e Legislação em Enfermagem': {
        alerta: 'Atos privativos do enfermeiro: Consulta de Enfermagem, SAE, prescrição de medicamentos em programas de saúde pública.',
        dicaOuro: 'O técnico e auxiliar participam da execução, mas o Diagnóstico de Enfermagem e a Prescrição da Assistência são privativos do Enfermeiro.'
      }
    }
  }
};

/**
 * Carrega a lista completa de erros salvos localmente
 */
export function carregarErrosLocais(userId) {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(item => item && typeof item === 'object' && item.id && item.questao);
  } catch (err) {
    console.error('Erro ao ler caderno de erros local:', err);
    return [];
  }
}

/**
 * Salva a lista de erros localmente
 */
export function salvarErrosLocais(userId, listaErros) {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(listaErros));
  } catch (err) {
    console.error('Erro ao salvar caderno de erros local:', err);
  }
}

/**
 * Registra uma resposta no Caderno de Erros.
 * - Se errou: adiciona à lista com status 'pendente' (ou atualiza data se já constava).
 * - Se acertou: se a questão já estava no caderno, marca status como 'superada' (aprendida).
 */
export function registrarTentativaCaderno(questao, respostaEscolhida, acertou, userId) {
  if (!questao || !questao.id) return null;

  const errosAtuais = carregarErrosLocais(userId);
  const qid = String(questao.id);
  const indexExistente = errosAtuais.findIndex((e) => String(e.id) === qid);
  const agora = new Date().toISOString();

  let novoOuAtualizado = null;

  if (!acertou) {
    if (indexExistente >= 0) {
      // Atualiza erro existente
      const anterior = errosAtuais[indexExistente];
      novoOuAtualizado = {
        ...anterior,
        resposta_escolhida: respostaEscolhida,
        status: 'pendente',
        tentativas: (anterior.tentativas || 1) + 1,
        ultimo_erro: agora,
        questao: questao // garante questão atualizada com distratores
      };
      errosAtuais[indexExistente] = novoOuAtualizado;
    } else {
      // Novo erro registrado
      novoOuAtualizado = {
        id: qid,
        questao: questao,
        banca: questao.banca || 'FCC',
        materia: questao.materia || 'Língua Portuguesa',
        assunto: questao.assunto || 'Geral',
        cargo: questao.cargo || '',
        ano: questao.ano || 2024,
        resposta_escolhida: respostaEscolhida,
        resposta_correta: questao.resposta_correta,
        data_primeiro_erro: agora,
        ultimo_erro: agora,
        status: 'pendente',
        tentativas: 1,
        superado_em: null
      };
      errosAtuais.unshift(novoOuAtualizado);
    }
  } else {
    // Aluno acertou a questão
    if (indexExistente >= 0) {
      const anterior = errosAtuais[indexExistente];
      novoOuAtualizado = {
        ...anterior,
        status: 'superada',
        superado_em: agora,
        tentativas: (anterior.tentativas || 1) + 1
      };
      errosAtuais[indexExistente] = novoOuAtualizado;
    }
  }

  salvarErrosLocais(userId, errosAtuais);
  return novoOuAtualizado;
}

/**
 * Marca manualmente uma questão como 'superada'
 */
export function marcarErroSuperado(questaoId, userId) {
  const erros = carregarErrosLocais(userId);
  const index = erros.findIndex((e) => String(e.id) === String(questaoId));
  if (index >= 0) {
    erros[index].status = 'superada';
    erros[index].superado_em = new Date().toISOString();
    salvarErrosLocais(userId, erros);
    return true;
  }
  return false;
}

/**
 * Remove uma questão definitivamente do Caderno de Erros
 */
export function removerErroDoCaderno(questaoId, userId) {
  const erros = carregarErrosLocais(userId);
  const filtrados = erros.filter((e) => String(e.id) !== String(questaoId));
  salvarErrosLocais(userId, filtrados);
  return filtrados;
}

/**
 * Remove todos os erros já superados
 */
export function limparErrosSuperados(userId) {
  const erros = carregarErrosLocais(userId);
  const pendentes = erros.filter((e) => e.status === 'pendente');
  salvarErrosLocais(userId, pendentes);
  return pendentes;
}

/**
 * Obtém a Análise Individualizada da Pegadinha ("Raio-X do Erro com IA")
 * Cruza a resposta escolhida pelo aluno com a 'analise_distratores' e 'fundamentacao_correta'.
 */
export function obterRaioXDoErro(erro) {
  if (!erro || !erro.questao) return null;

  const q = erro.questao || {};
  const letraMarcada = erro.resposta_escolhida || '';
  const gabarito = q.resposta_correta || erro.resposta_correta || '';
  const alts = Array.isArray(q.alternativas) ? q.alternativas : [];

  const altMarcadaObj = alts.find((a) => a && a.id === letraMarcada);
  const altCorretaObj = alts.find((a) => a && a.id === gabarito);

  const textoMarcado = altMarcadaObj ? altMarcadaObj.texto : '';
  const textoCorreto = altCorretaObj ? altCorretaObj.texto : '';

  // Procura a explicação específica do distrator
  const distratores = Array.isArray(q.analise_distratores) ? q.analise_distratores : [];
  const distratorObj = distratores.find((d) => d && d.letra === letraMarcada);

  let motivoErro = '';
  if (distratorObj && distratorObj.motivo) {
    motivoErro = distratorObj.motivo;
  } else {
    motivoErro = `A alternativa [${letraMarcada}] é incorreta segundo as normas da banca. Ela contraria as diretrizes teóricas ou interpretações do padrão avaliativo.`;
  }

  // Busca conselho da banca para o assunto
  const bancaChave = q.banca === 'FCC' ? 'FCC' : (q.banca === 'SELECON' ? 'SELECON' : (q.materia === 'Enfermagem' ? 'Enfermagem' : 'FCC'));
  const infoBanca = PADROES_BANCA_CONHECIMENTO[bancaChave] || PADROES_BANCA_CONHECIMENTO.FCC;
  const assuntoInfo = infoBanca?.assuntosCriticos?.[q.assunto] || null;

  return {
    letraMarcada,
    textoMarcado,
    gabarito,
    textoCorreto,
    motivoErro,
    fundamentacao: q.fundamentacao_correta || 'Consulte a bibliografia oficial e gramática normativa para fixação.',
    dicaBanca: assuntoInfo?.dicaOuro || infoBanca?.pegadinhaFrequente || 'Revise a teoria e o padrão da banca.',
    alertaTema: assuntoInfo?.alerta || infoBanca?.focoPrincipal || 'Foco nas normas da banca.',
    bancaNome: infoBanca?.nome || q.banca || 'Banca'
  };
}

/**
 * Gera o Diagnóstico Geral Inteligente por Usuário e Banca
 */
export function gerarDiagnosticoInteligente({ erros = [], bancaFiltro = 'Todas' }) {
  const listaSegura = Array.isArray(erros) ? erros.filter((e) => e && typeof e === 'object') : [];
  const lista = bancaFiltro === 'Todas' ? listaSegura : listaSegura.filter((e) => e.banca === bancaFiltro);

  const total = lista.length;
  const pendentes = lista.filter((e) => e.status === 'pendente').length;
  const superados = lista.filter((e) => e.status === 'superada').length;
  const taxaSuperacao = total > 0 ? Math.round((superados / total) * 100) : 0;

  // Agrupamentos por Matéria
  const porMateria = {};
  lista.forEach((e) => {
    const mat = e.materia || 'Outras';
    porMateria[mat] = (porMateria[mat] || 0) + 1;
  });

  // Agrupamentos por Assunto
  const porAssunto = {};
  lista.forEach((e) => {
    const ass = e.assunto || 'Geral';
    porAssunto[ass] = (porAssunto[ass] || 0) + 1;
  });

  // Ordena os assuntos mais errados (Pontos Críticos)
  const assuntosOrdenados = Object.entries(porAssunto)
    .map(([assunto, qtd]) => ({
      assunto,
      qtd,
      percentual: total > 0 ? Math.round((qtd / total) * 100) : 0
    }))
    .sort((a, b) => b.qtd - a.qtd);

  const topAssuntosCriticos = assuntosOrdenados.slice(0, 4);

  // Análise da Banca selecionada
  const bancaChave = bancaFiltro === 'FCC' ? 'FCC' : (bancaFiltro === 'SELECON' ? 'SELECON' : 'FCC');
  const padraoBancaInfo = PADROES_BANCA_CONHECIMENTO[bancaChave] || PADROES_BANCA_CONHECIMENTO.FCC || {
    nome: 'Geral',
    focoPrincipal: 'Revisão sistemática de questões e fixação das pegadinhas da banca.',
    pegadinhaFrequente: 'Distratores com extrapolação e reducionismo de texto.',
    assuntosCriticos: {}
  };

  // Montagem das Recomendações Pedagógicas
  const recomendacoes = [];
  if (topAssuntosCriticos.length > 0) {
    topAssuntosCriticos.forEach((item) => {
      const infoEspecifica = padraoBancaInfo?.assuntosCriticos?.[item.assunto];
      recomendacoes.push({
        assunto: item.assunto,
        qtdErros: item.qtd,
        gravidade: item.percentual >= 30 ? 'alta' : (item.percentual >= 15 ? 'media' : 'moderada'),
        orientacao: infoEspecifica ? infoEspecifica.alerta : `Você cometeu ${item.qtd} erro(s) em ${item.assunto}. Concentre uma sessão de revisão direcionada para este microtema.`,
        dicaPratica: infoEspecifica ? infoEspecifica.dicaOuro : 'Revise a teoria e refaça as questões pendentes deste tópico no Caderno de Erros.'
      });
    });
  }

  return {
    total,
    pendentes,
    superados,
    taxaSuperacao,
    porMateria,
    topAssuntosCriticos,
    recomendacoes,
    padraoBancaInfo
  };
}
