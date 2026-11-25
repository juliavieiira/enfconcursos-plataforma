/**
 * Base de Conhecimento Estratégica por Banca Examinadora
 * Insights táticos de provas de enfermagem e língua portuguesa para concursos e prefeituras.
 */

export const BANCAS_PRECONFIGURADAS = [
  'SELECON',
  'FCC',
  'VUNESP',
  'IBAM',
  'Instituto AOCP',
  'FGV',
  'Consulpam',
  'Legalle Concursos',
  'Avança SP'
];

export const INSIGHTS_POR_BANCA = {
  SELECON: {
    nome: 'SELECON',
    Enfermagem: {
      foco1: {
        tag: 'Foco nº 1 da Banca',
        title: 'Fundamentos e Prática Diária',
        text: 'A SELECON adora cobrar procedimentos de enfermagem fundamentais: parâmetros de sinais vitais (pressão, temperatura, FC), técnicas de sondagem vesical e nasogástrica, cuidados com curativos e tipos de exsudato.'
      },
      ponto: {
        tag: 'Ponto Garantido',
        title: 'Legislação e Código de Ética',
        text: 'Questões recorrentes sobre as competências privativas do Enfermeiro vs atribuições do Técnico (Lei 7.498/86) e penalidades do novo Código de Ética (Resolução COFEN 564/2017): direitos, deveres e proibições.'
      },
      perfil: {
        tag: 'Técnico vs Enfermeiro',
        title: 'Diferença de Perfil nos Cargos',
        text: 'Para Técnico, há forte cobrança em Cálculo de Medicamentos (gotejamento/diluição) e Biossegurança (NR-32/EPI). Já para Enfermeiro, predominam Vigilância Epidemiológica, Gestão em Saúde e SAE/NANDA.'
      },
      sus: {
        tag: 'Prefeituras & SUS',
        title: 'Saúde Pública e Imunização',
        text: 'Cobrança maciça de Rede de Frio e Calendário Nacional de Vacinação (PNI), além dos princípios doutrinários e organizativos da Lei Orgânica da Saúde (Lei 8.080/90).'
      }
    },
    'Língua Portuguesa': {
      foco1: {
        tag: 'Foco Absoluto (41,4%)',
        title: 'Interpretação e Intencionalidade Discursiva',
        text: 'Mais de 41% das questões da SELECON exigem apreensão da tese central, inferências contextuais, intencionalidade comunicativa do autor e relação entre parágrafos de notícias e crônicas contemporâneas.'
      },
      ponto: {
        tag: 'Ponto Crítico de Sintaxe (17,9%)',
        title: 'Termos da Oração & Período Composto',
        text: 'Cobrança expressiva de identificação do sujeito gramatical, complementos verbais (objeto direto vs indireto), aposto explicativo e classificação de orações coordenadas e subordinadas substantivas/adverbiais.'
      },
      perfil: {
        tag: 'Morfologia & Verbos (16,5%)',
        title: 'Flexão Verbal e Classes Gramaticais',
        text: 'A banca adora exigir a correlação entre pretérito perfeito e imperfeito do indicativo, modo subjuntivo (hipótese), além de distinção morfológica entre adjetivo, substantivo, advérbio e papel anafórico de pronomes.'
      },
      sus: {
        tag: 'Norma Culta (8,0%)',
        title: 'Pontuação & Conectivos Lógicos',
        text: 'Questões certeiras sobre o emprego da vírgula (isolamento de adjuntos adverbiais deslocados, orações coordenadas) e valor semântico das conjunções subordinadas (causais, concessivas, consecutivas).'
      }
    },
    Todas: {
      foco1: {
        tag: 'Distribuição Global',
        title: 'Interpretação e Fundamentos Práticos',
        text: 'Em provas municipais da SELECON, a combinação de Interpretação Textual sólida e domínio prático de Fundamentos Assistenciais responde por mais de 50% dos pontos da prova objetiva.'
      },
      ponto: {
        tag: 'Pontos Certeiros',
        title: 'Sintaxe Normativa e Legislação do SUS',
        text: 'Sintaxe (termos da oração e pontuação) em Português e Legislação do SUS (Leis 8.080 e 8.142) em Saúde são temas de repetição obrigatória em todos os editais da banca.'
      },
      perfil: {
        tag: 'Estratégia Geral',
        title: 'Gestão de Tempo na Resolução',
        text: 'Os textos de Português costumam ser de tamanho médio a longo; resolver primeiro as questões gramaticais diretas e de cálculo poupa energia para os blocos interpretativos.'
      },
      sus: {
        tag: 'Padrão da Banca',
        title: 'Consistência das Respostas Oficiais',
        text: 'A SELECON mantém fidelidade estrita à norma culta tradicional (Cegalla/Bechara) e às diretrizes consolidadas do Ministério da Saúde.'
      }
    }
  },
  FCC: {
    nome: 'FCC (Fundação Carlos Chagas)',
    Enfermagem: {
      foco1: {
        tag: 'Padrão Clássico FCC',
        title: 'Casos Clínicos & Protocolos Assistenciais',
        text: 'A FCC é reconhecida por enunciados estruturados em casos clínicos completos, cobrando a conduta imediata do profissional de enfermagem e os protocolos ministeriais atualizados.'
      },
      ponto: {
        tag: 'Ponto Garantido',
        title: 'Legislação SUS & Imunização PNI',
        text: 'Cobrança tradicional dos artigos da Lei 8.080/90 e 8.142/90, além dos esquemas vacinais do Calendário Nacional do Ministério da Saúde.'
      },
      perfil: {
        tag: 'Diferencial de Pontuação',
        title: 'Urgência, Emergência e UTI',
        text: 'A FCC valoriza raciocínio de suporte básico e avançado de vida (diretrizes AHA), parada cardiorrespiratória e farmacologia aplicada.'
      },
      sus: {
        tag: 'Atenção Primária',
        title: 'Estratégia Saúde da Família',
        text: 'Atenção Básica, visitas domiciliares, acompanhamento de pré-natal e doenças crônicas (HAS e Diabetes).'
      }
    },
    'Língua Portuguesa': {
      foco1: {
        tag: 'Estilo Inconfundível FCC',
        title: 'Concordância, Regência e Voz Passiva',
        text: 'A FCC é famosa por cobrar a correta transposição de voz ativa para passiva e a identificação precisa do verbo concordando com o núcleo do sujeito.'
      },
      ponto: {
        tag: 'Ponto Garantido',
        title: 'Pronomes & Redação Oficial',
        text: 'Colocação pronominal refinada, emprego de pronomes relativos e adequação frasal.'
      },
      perfil: {
        tag: 'Sintaxe e Pontuação',
        title: 'Sentido e Correção Gramatical',
        text: 'Questões onde se pede para reescrever o período mantendo a correção e o sentido original.'
      },
      sus: {
        tag: 'Interpretação Textual',
        title: 'Artigos de Opinião e Filosofia',
        text: 'Textos reflexivos, filosóficos ou jornalísticos, exigindo apreensão da linha argumentativa.'
      }
    },
    Todas: {
      foco1: {
        tag: 'Perfil da Prova FCC',
        title: 'Rigor Conceitual e Casos Concretos',
        text: 'Provas equilibradas, com alto rigor técnico e enunciados bem elaborados, sem dubiedades.'
      },
      ponto: {
        tag: 'Ponto Garantido',
        title: 'Gramática Aplicada e Legislação do SUS',
        text: 'Garantir pontuação máxima em legislação de saúde pública e morfossintaxe é decisivo para alcançar as primeiras colocações.'
      },
      perfil: {
        tag: 'Critério de Desempate',
        title: 'Atenção aos Detalhes de Cada Alternativa',
        text: 'A FCC trabalha com distratores sutis. Leia atentamente cada alternativa identificando o desvio pontual.'
      },
      sus: {
        tag: 'Referência Bibliográfica',
        title: 'Manuais do Ministério da Saúde e COFEN',
        text: 'Fidelidade estrita aos cadernos de atenção básica e às resoluções do COFEN/COREN.'
      }
    }
  },
  VUNESP: {
    nome: 'VUNESP',
    foco1: {
      tag: 'Foco nº 1 da Banca',
      title: 'Casos Clínicos & Interpretação Prática',
      text: 'A VUNESP prioriza situações clínicas reais de pronto atendimento e enfermarias, exigindo raciocínio sobre a conduta imediata da equipe de enfermagem.'
    },
    ponto: {
      tag: 'Ponto Garantido',
      title: 'Farmacologia & Cálculos de Medicamentos',
      text: 'Questões rigorosas com diluição de antibióticos, cálculo de microgotas/minuto e cuidados na administração de heparina e eletrólitos concentrados.'
    },
    perfil: {
      tag: 'Técnico vs Enfermeiro',
      title: 'Divisão de Atribuições nos Plantões',
      text: 'Para Técnicos: preparo de leito, passagem de plantão, punção venosa periférica. Para Enfermeiros: dimensionamento de pessoal, auditoria e consulta de enfermagem.'
    },
    sus: {
      tag: 'Prefeituras & SUS',
      title: 'Programas de Saúde da Mulher e da Criança',
      text: 'Cobrança intensa das rotinas do Ministério da Saúde para o pré-natal de baixo risco, teste do pezinho e triagens neonatais.'
    }
  },
  IBAM: {
    nome: 'IBAM',
    foco1: {
      tag: 'Foco nº 1 da Banca',
      title: 'Atenção Primária & Saúde Coletiva',
      text: 'Banca tradicional de prefeituras que privilegia o trabalho da ESF, visitas domiciliares, acolhimento com classificação de risco e vacinação básica.'
    },
    ponto: {
      tag: 'Ponto Garantido',
      title: 'Legislação do SUS (8.080 e 8.142)',
      text: 'Questões conceituais sobre descentralização, universalidade, participação da comunidade e transferências de recursos fundo a fundo.'
    },
    perfil: {
      tag: 'Técnico vs Enfermeiro',
      title: 'Atuação na Unidade Básica de Saúde',
      text: 'Foco do Técnico na sala de curativos, sala de vacina e esterilização; foco do Enfermeiro no planejamento local e imunização de grupos prioritários.'
    },
    sus: {
      tag: 'Prefeituras & SUS',
      title: 'Vigilância Sanitária e Epidemiológica',
      text: 'Ações de controle de vetores (dengue/zika), notificação de agravos e busca ativa de sintomáticos respiratórios para tuberculose.'
    }
  },
  'Instituto AOCP': {
    nome: 'Instituto AOCP',
    foco1: {
      tag: 'Foco nº 1 da Banca',
      title: 'Urgência, Emergência e Suporte de Vida',
      text: 'Diretrizes atualizadas da AHA para PCR em adultos e pediatria, uso do DEA e abordagem sistematizada no trauma pré-hospitalar.'
    },
    ponto: {
      tag: 'Ponto Garantido',
      title: 'Biossegurança & NR-32',
      text: 'Regras de segregação de resíduos de saúde (RDC 222), precauções padrão e específicas (contato, gotículas, aerossóis) e acidentes com perfurocortantes.'
    },
    perfil: {
      tag: 'Técnico vs Enfermeiro',
      title: 'Ambiente Hospitalar & Centro Cirúrgico',
      text: 'Técnico: instrumentação cirúrgica básica, CME e monitorização. Enfermeiro: SAE perioperatória, visita pré-operatória e gestão de riscos.'
    },
    sus: {
      tag: 'Prefeituras & SUS',
      title: 'Redes de Atenção à Saúde (RAS)',
      text: 'Integração entre UBS, SAMU 192, UPAs 24h e hospitais de retaguarda, conforme decretos e portarias de consolidação do SUS.'
    }
  },
  FGV: {
    nome: 'FGV',
    foco1: {
      tag: 'Foco nº 1 da Banca',
      title: 'Raciocínio Clínico Aprofundado',
      text: 'Questões longas que exigem priorização de intervenções diante de pacientes com múltiplas comorbidades e choque de informações no enunciado.'
    },
    ponto: {
      tag: 'Ponto Garantido',
      title: 'Resoluções Normativas do COFEN',
      text: 'Pareceres técnicos sobre procedimentos complexos: punção de acesso venoso profundo por enfermeiro, passagem de PICC e classificação de risco Manchester.'
    },
    perfil: {
      tag: 'Técnico vs Enfermeiro',
      title: 'Tomada de Decisão & Liderança',
      text: 'Técnico: cumprimento rigoroso de prescrições e checagem dupla. Enfermeiro: diagnósticos da NANDA-I e indicadores de qualidade assistencial.'
    },
    sus: {
      tag: 'Prefeituras & SUS',
      title: 'Políticas Públicas & Epidemiologia Crítica',
      text: 'Análise de coeficientes de mortalidade materna/infantil, transição demográfica e determinantes sociais da saúde.'
    }
  }
};

/**
 * Retorna os insights da banca ajustados dinamicamente para a matéria selecionada.
 */
export function getInsightPorBanca(bancaNome, materiaNome = 'Todas') {
  const b = INSIGHTS_POR_BANCA[bancaNome];
  if (!b) return null;

  // Se a banca tiver subseções por matéria (como SELECON)
  if (b[materiaNome]) {
    return {
      nome: `${b.nome} (${materiaNome})`,
      ...b[materiaNome]
    };
  }

  // Fallback para 'Enfermagem' ou objeto direto
  if (b.Enfermagem && materiaNome === 'Enfermagem') {
    return { nome: `${b.nome} (Enfermagem)`, ...b.Enfermagem };
  }
  if (b['Língua Portuguesa'] && materiaNome === 'Língua Portuguesa') {
    return { nome: `${b.nome} (Língua Portuguesa)`, ...b['Língua Portuguesa'] };
  }
  if (b.Todas) {
    return { nome: b.nome, ...b.Todas };
  }

  return b;
}
