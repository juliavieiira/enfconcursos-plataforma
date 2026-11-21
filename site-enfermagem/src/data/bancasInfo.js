/**
 * Base de Conhecimento Estratégica por Banca Examinadora
 * Insights táticos de provas de enfermagem para prefeituras e saúde.
 */

export const BANCAS_PRECONFIGURADAS = [
  'SELECON',
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
