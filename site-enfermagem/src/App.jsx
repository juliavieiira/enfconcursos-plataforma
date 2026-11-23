import React, { useState, useEffect, useMemo } from 'react';
import './App.css';
import { BANCAS_PRECONFIGURADAS, getInsightPorBanca } from './data/bancasInfo';
import { ASSUNTOS_PORTUGUES, ASSUNTOS_ENFERMAGEM, questaoPertenceAoAssunto, carregarQuestoesAssunto } from './data/assuntosCatalogo';
import { getPadraoSalvo } from './data/padraoBancaCatalogo';
import {
  Stethoscope,
  BookOpen,
  Timer,
  Award,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Flame,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  HelpCircle,
  FolderOpen,
  Sparkles,
  ShieldCheck,
  Zap,
  PieChart,
  BarChart3,
  Lightbulb,
  Target,
  Building2,
  Layers,
  RotateCcw
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('questoes'); // 'questoes', 'padrao', 'simulados', 'materiais'
  const [questoes, setQuestoes] = useState([]);
  const [carregandoDados, setCarregandoDados] = useState(true);

  // Modo de visualização de questões: 'individual' (1 por vez com máxima leveza e foco)
  const [modoVisualizacao, setModoVisualizacao] = useState('individual');
  const [questaoIndex, setQuestaoIndex] = useState(0);
  const [puloInput, setPuloInput] = useState('');

  // Filtros - Padrão direto na banca SELECON e no tema principal de Enfermagem
  const [buscaTexto, setBuscaTexto] = useState('');
  const [filtroBanca, setFiltroBanca] = useState('SELECON');
  const [filtroCargo, setFiltroCargo] = useState('Todos');
  const [filtroMateria, setFiltroMateria] = useState('Enfermagem');
  const [filtroAssunto, setFiltroAssunto] = useState('Fundamentos e Procedimentos de Enfermagem');

  // Carregamento sob demanda ultra-leve: carrega apenas as questões do assunto selecionado (sem pesar o navegador com 2.000 questões)
  useEffect(() => {
    let ativo = true;
    setCarregandoDados(true);

    carregarQuestoesAssunto(filtroMateria, filtroAssunto)
      .then(data => {
        if (ativo) {
          if (Array.isArray(data) && data.length > 0) {
            setQuestoes(data);
          }
          setCarregandoDados(false);
          setQuestaoIndex(0);
        }
      })
      .catch(err => {
        console.error('Erro ao carregar questões do assunto:', err);
        if (ativo) setCarregandoDados(false);
      });

    return () => { ativo = false; };
  }, [filtroMateria, filtroAssunto]);

  // Estado das respostas do usuário na aba questões
  const [respostas, setRespostas] = useState({}); // { [questionId]: { selecionada: 'A', confirmada: true } }

  // Estado do Simulado
  const [simuladoAtivo, setSimuladoAtivo] = useState(null); // null ou objeto do simulado
  const [simuladoIndex, setSimuladoIndex] = useState(0);
  const [simuladoRespostas, setSimuladoRespostas] = useState({});
  const [tempoRestante, setTempoRestante] = useState(1800); // 30 min em seg
  const [simuladoFinalizado, setSimuladoFinalizado] = useState(false);

  // Modal VIP
  const [modalVipAberto, setModalVipAberto] = useState(false);
  const [limiteExibicao, setLimiteExibicao] = useState(25);

  // Estatísticas gerais
  const totalRespondidas = Object.keys(respostas).length;
  const totalAcertos = Object.entries(respostas).filter(([id, r]) => {
    const q = questoes.find(item => item.id === id);
    return q && r.selecionada === q.resposta_correta;
  }).length;
  const taxaAcerto = totalRespondidas > 0 ? Math.round((totalAcertos / totalRespondidas) * 100) : 0;

  // Assuntos com contagens garantidas (estáticas pré-carregadas + dinâmicas do acervo)
  const assuntosConfig = useMemo(() => {
    if (!questoes || questoes.length === 0) {
      return {
        portugues: ASSUNTOS_PORTUGUES,
        enfermagem: ASSUNTOS_ENFERMAGEM
      };
    }

    const portList = ASSUNTOS_PORTUGUES.map(item => {
      const count = questoes.filter(q => questaoPertenceAoAssunto(q, item.nome)).length;
      return { ...item, total: count > 0 ? count : item.total };
    });

    const enfList = ASSUNTOS_ENFERMAGEM.map(item => {
      const count = questoes.filter(q => questaoPertenceAoAssunto(q, item.nome)).length;
      return { ...item, total: count > 0 ? count : item.total };
    });

    return { portugues: portList, enfermagem: enfList };
  }, [questoes]);

  const nomeAssuntoAtivo = filtroAssunto !== 'Todos' ? filtroAssunto : null;

  // Aba Padrão da Banca / Raio-X
  const [padraoMateria, setPadraoMateria] = useState('Todas'); // 'Todas', 'Língua Portuguesa', 'Enfermagem'
  const [padraoCargo, setPadraoCargo] = useState('Todos'); // 'Todos', etc.
  const [padraoBanca, setPadraoBanca] = useState('SELECON'); // 'Todas', 'SELECON', etc.

  // Padrão estatístico auditado salvo (carregamento instantâneo de 2.007 questões da SELECON)
  const dadosPadraoSalvo = getPadraoSalvo(padraoBanca, padraoMateria, padraoCargo);

  const todasBancasOpcoes = Array.from(new Set(['SELECON', ...BANCAS_PRECONFIGURADAS]));

  const palette = [
    '#0d9488', // teal
    '#2563eb', // blue
    '#7c3aed', // purple
    '#db2777', // pink
    '#d97706', // amber
    '#059669', // emerald
    '#dc2626', // red
    '#0891b2', // cyan
    '#4f46e5', // indigo
    '#65a30d', // lime
    '#94a3b8'  // slate (outros)
  ];

  const totalQuestoesPadrao = dadosPadraoSalvo ? dadosPadraoSalvo.total : 0;
  const listaTemasPadrao = dadosPadraoSalvo ? dadosPadraoSalvo.temas : [];

  const top10 = listaTemasPadrao.slice(0, 10);
  const outrosTotal = listaTemasPadrao.length > 10
    ? listaTemasPadrao.slice(10).reduce((acc, curr) => acc + curr.count, 0)
    : 0;

  const itensGrafico = [
    ...top10.map((item, idx) => ({
      nome: item.nome,
      slug: item.slug,
      materia: item.materia,
      count: item.count,
      percent: item.percent,
      cor: palette[idx % palette.length]
    })),
    ...(outrosTotal > 0 ? [{
      nome: 'Demais Conteúdos',
      count: outrosTotal,
      percent: totalQuestoesPadrao > 0 ? ((outrosTotal / totalQuestoesPadrao) * 100).toFixed(1) : '0.0',
      cor: palette[10]
    }] : [])
  ];

  let acumulador = 0;
  const gradientStops = itensGrafico.length > 0 ? itensGrafico.map((item, index) => {
    const inicio = acumulador;
    const itemPct = totalQuestoesPadrao > 0 ? (item.count / totalQuestoesPadrao) * 100 : 0;
    acumulador += itemPct;
    const fim = index === itensGrafico.length - 1 ? 100 : acumulador;
    return `${item.cor} ${inicio.toFixed(2)}% ${fim.toFixed(2)}%`;
  }).join(', ') : '#0d9488 0% 100%';

  const donutStyle = {
    background: `conic-gradient(${gradientStops})`
  };

  const irParaQuestoesPorTema = (temaNome, materiaTema) => {
    let mat = materiaTema;
    if (!mat || mat === 'Todas') {
      const isPort = ASSUNTOS_PORTUGUES.some(a => a.nome === temaNome);
      mat = isPort ? 'Língua Portuguesa' : 'Enfermagem';
    }
    setFiltroMateria(mat);
    setFiltroAssunto(temaNome);
    setBuscaTexto('');
    if (padraoCargo === 'Técnico de Enfermagem' || padraoCargo === 'Enfermeiro') {
      setFiltroCargo(padraoCargo);
    } else {
      setFiltroCargo('Todos');
    }
    setFiltroBanca('SELECON');
    setQuestaoIndex(0);
    setActiveTab('questoes');
    window.scrollTo({ top: 250, behavior: 'smooth' });
  };

  // Insight estratégico dinâmico por banca e disciplina
  const currentInsight = getInsightPorBanca(padraoBanca, padraoMateria) || {
    nome: padraoBanca === 'Todas' ? 'Concursos Públicos' : padraoBanca,
    foco1: {
      tag: 'Conteúdo Mais Cobrado',
      title: top10[0] ? top10[0].nome : 'Conteúdo Principal',
      text: `O tema com maior incidência nesta seleção é "${top10[0] ? top10[0].nome : 'Conteúdo Principal'}", correspondendo a ${top10[0] ? top10[0].percent : 0}% das questões analisadas.`
    },
    ponto: {
      tag: 'Ponto Garantido',
      title: padraoMateria === 'Língua Portuguesa' ? 'Sintaxe e Pontuação' : 'Legislação e Ética Profissional',
      text: padraoMateria === 'Língua Portuguesa' ? 'Sintaxe e pontuação são cobradas em praticamente todas as provas da banca.' : 'Questões de Legislação e Código de Ética caem em praticamente 100% dos concursos.'
    },
    perfil: {
      tag: 'Estratégia de Prova',
      title: 'Foco Orientado por Cargo',
      text: 'Ajuste seu cronograma priorizando os temas de maior incidência estatística no gráfico.'
    },
    sus: {
      tag: 'Critério da Banca',
      title: 'Norma Culta e Padrão da Banca',
      text: 'A banca mantém fidelidade às gramáticas de referência e protocolos oficiais.'
    }
  };

  // Filtragem
  const questoesFiltradas = questoes.filter(q => {
    const matchBusca =
      !buscaTexto ||
      (q.enunciado && q.enunciado.toLowerCase().includes(buscaTexto.toLowerCase())) ||
      (q.orgao && q.orgao.toLowerCase().includes(buscaTexto.toLowerCase())) ||
      (q.assunto && q.assunto.toLowerCase().includes(buscaTexto.toLowerCase()));

    const matchBanca = filtroBanca === 'Todas' || q.banca === filtroBanca;

    const matchCargo =
      filtroCargo === 'Todos' ||
      (q.materia === 'Enfermagem' ? q.cargo === filtroCargo : true);

    const matchMateria = filtroMateria === 'Todas' || q.materia === filtroMateria;

    const matchAssunto = questaoPertenceAoAssunto(q, filtroAssunto);

    return matchBusca && matchBanca && matchCargo && matchMateria && matchAssunto;
  });

  // Navegação de questões no Modo Individual (1 por vez com pre-loading leve)
  const totalFiltradas = questoesFiltradas.length;
  const safeIndex = totalFiltradas > 0 ? Math.min(Math.max(0, questaoIndex), totalFiltradas - 1) : 0;
  const questaoAtual = totalFiltradas > 0 ? questoesFiltradas[safeIndex] : null;

  const scrollParaQuestao = () => {
    const el = document.getElementById('questoes-anchor');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const irParaProxima = () => {
    if (safeIndex < totalFiltradas - 1) {
      setQuestaoIndex(safeIndex + 1);
      scrollParaQuestao();
    }
  };

  const irParaAnterior = () => {
    if (safeIndex > 0) {
      setQuestaoIndex(safeIndex - 1);
      scrollParaQuestao();
    }
  };

  const irParaPrimeira = () => {
    setQuestaoIndex(0);
    scrollParaQuestao();
  };

  const irParaUltima = () => {
    if (totalFiltradas > 0) {
      setQuestaoIndex(totalFiltradas - 1);
      scrollParaQuestao();
    }
  };

  const handlePuloSubmit = (e) => {
    e.preventDefault();
    const num = parseInt(puloInput, 10);
    if (!isNaN(num) && num >= 1 && num <= totalFiltradas) {
      setQuestaoIndex(num - 1);
      setPuloInput('');
      scrollParaQuestao();
    }
  };

  // Atalhos de teclado (← e →) para navegação fluida sem pesar a tela
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeTab !== 'questoes' || modoVisualizacao !== 'individual') return;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (e.key === 'ArrowRight') {
        if (safeIndex < totalFiltradas - 1) {
          setQuestaoIndex(prev => Math.min(prev + 1, totalFiltradas - 1));
          scrollParaQuestao();
        }
      } else if (e.key === 'ArrowLeft') {
        if (safeIndex > 0) {
          setQuestaoIndex(prev => Math.max(prev - 1, 0));
          scrollParaQuestao();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, modoVisualizacao, safeIndex, totalFiltradas]);

  // Temporizador do simulado
  useEffect(() => {
    let timer;
    if (simuladoAtivo && !simuladoFinalizado && tempoRestante > 0) {
      timer = setInterval(() => {
        setTempoRestante(prev => {
          if (prev <= 1) {
            setSimuladoFinalizado(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [simuladoAtivo, simuladoFinalizado, tempoRestante]);

  const formatarTempo = (segundos) => {
    const mins = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };

  const selecionarOpcaoQuestao = (questaoId, letra) => {
    if (respostas[questaoId]?.confirmada) return;
    setRespostas(prev => ({
      ...prev,
      [questaoId]: { selecionada: letra, confirmada: false }
    }));
  };

  const confirmarResposta = (questaoId) => {
    if (!respostas[questaoId]?.selecionada) return;
    setRespostas(prev => ({
      ...prev,
      [questaoId]: { ...prev[questaoId], confirmada: true }
    }));
  };

  const iniciarSimulado = (tipo) => {
    let lista;
    if (tipo === 'prefeituras') {
      lista = questoes.filter(q => q.orgao.toLowerCase().includes('prefeitura'));
    } else {
      lista = [...questoes];
    }
    setSimuladoAtivo({
      titulo: tipo === 'prefeituras' ? 'Simulado Foco Prefeituras Municipais' : 'Simulado Geral Enfermagem',
      questoes: lista
    });
    setSimuladoIndex(0);
    setSimuladoRespostas({});
    setTempoRestante(lista.length * 150); // ~2.5 min por questão
    setSimuladoFinalizado(false);
    setActiveTab('simulados');
  };

  return (
    <div className="app-root">
      {/* Navbar Superior */}
      <nav className="navbar">
        <div className="container nav-container">
          <a href="#" className="nav-brand" onClick={() => setActiveTab('questoes')}>
            <Stethoscope size={28} color="#0d9488" strokeWidth={2.5} />
            <span>Enf<span style={{ color: '#0d9488' }}>Concursos</span></span>
            <span className="brand-badge hide-micro">Prefeituras & SUS</span>
          </a>

          <div className="nav-links">
            <button
              className={`nav-link ${activeTab === 'questoes' ? 'active' : ''}`}
              onClick={() => setActiveTab('questoes')}
            >
              <BookOpen size={17} />
              <span>Questões</span>
            </button>
            <button
              className={`nav-link ${activeTab === 'padrao' ? 'active' : ''}`}
              onClick={() => setActiveTab('padrao')}
            >
              <PieChart size={17} />
              <span>Padrão da Banca</span>
            </button>
            <button
              className={`nav-link ${activeTab === 'simulados' ? 'active' : ''}`}
              onClick={() => setActiveTab('simulados')}
            >
              <Timer size={17} />
              <span>Simulados</span>
            </button>
            <button
              className={`nav-link ${activeTab === 'materiais' ? 'active' : ''}`}
              onClick={() => setActiveTab('materiais')}
            >
              <FolderOpen size={17} />
              <span>PDFs & Provas</span>
            </button>
            <button className="btn-vip-nav" onClick={() => setModalVipAberto(true)}>
              <Sparkles size={16} />
              <span>Acesso VIP R$37</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        <div className="container">
          <div className="hero-tag">
            <Flame size={15} color="#0d9488" />
            <span>Foco Estratégico em Concursos de Prefeituras</span>
          </div>
          <h1 className="hero-title">
            O Banco de Questões e Simulados para sua <span className="hero-highlight">Aprovação em Enfermagem</span>
          </h1>
          <p className="hero-subtitle">
            Mais de 10.000 questões comentadas com foco nas bancas de prefeituras (IBAM, VUNESP, Consulpam, AOCP) e grandes órgãos de saúde.
          </p>

          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-num">{questoes.length > 0 ? questoes.length.toLocaleString('pt-BR') : '2.007'}</span>
              <span className="stat-label">Questões Auditadas</span>
            </div>
            <div className="stat-item">
              <span className="stat-num">100%</span>
              <span className="stat-label">Gabaritos Comentados</span>
            </div>
            <div className="stat-item">
              <span className="stat-num">{totalRespondidas > 0 ? `${taxaAcerto}%` : '2026'}</span>
              <span className="stat-label">{totalRespondidas > 0 ? 'Sua Taxa de Acerto' : 'Provas Atualizadas'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="container main-wrapper">
        {/* ABA: BANCO DE QUESTÕES */}
        {activeTab === 'questoes' && (
          <section className="animate-fade-in">
            {/* Filtros de Pesquisa e SEO */}
            <div className="filter-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Filter size={18} color="#0d9488" />
                <h3 style={{ fontSize: '1.05rem' }}>Filtros de Estudo Direcionado</h3>
              </div>

              {/* Barra de Busca rápida */}
              <div style={{ position: 'relative', marginTop: '0.5rem' }}>
                <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="text"
                  placeholder="Pesquise por prefeitura, assunto (ex: SUS, Imunização, Nägele, PCR)..."
                  className="filter-input"
                  style={{ width: '100%', paddingLeft: '2.5rem' }}
                  value={buscaTexto}
                  onChange={e => { setBuscaTexto(e.target.value); setQuestaoIndex(0); }}
                />
              </div>

              <div className="filter-grid">
                {/* 1. Banca Organizadora */}
                <div className="filter-group">
                  <label className="filter-label">Banca Organizadora</label>
                  <select
                    className="filter-select"
                    value={filtroBanca}
                    onChange={e => { setFiltroBanca(e.target.value); setQuestaoIndex(0); }}
                  >
                    <option value="SELECON">SELECON (+2.000 questões auditadas)</option>
                    <option value="Todas">Todas as Bancas (Acervo Auditado)</option>
                    <optgroup label="Bancas em Preparação">
                      <option value="IBAM" disabled>IBAM (Em breve)</option>
                      <option value="VUNESP" disabled>VUNESP (Em breve)</option>
                      <option value="Consulpam" disabled>Consulpam (Em breve)</option>
                      <option value="AOCP" disabled>AOCP (Em breve)</option>
                      <option value="FGV" disabled>FGV (Em breve)</option>
                    </optgroup>
                  </select>
                </div>

                {/* 2. Cargo */}
                <div className="filter-group">
                  <label className="filter-label">Cargo</label>
                  <select
                    className="filter-select"
                    value={filtroCargo}
                    onChange={e => { setFiltroCargo(e.target.value); setQuestaoIndex(0); }}
                  >
                    <option value="Todos">Todos os Cargos</option>
                    <option value="Técnico de Enfermagem">Técnico de Enfermagem</option>
                    <option value="Enfermeiro">Enfermeiro</option>
                  </select>
                </div>

                {/* 3. Disciplina */}
                <div className="filter-group">
                  <label className="filter-label">Disciplina</label>
                  <select
                    className="filter-select"
                    value={filtroMateria}
                    onChange={e => {
                      const novaMateria = e.target.value;
                      setFiltroMateria(novaMateria);
                      if (novaMateria === 'Enfermagem') {
                        setFiltroAssunto('Fundamentos e Procedimentos de Enfermagem');
                      } else if (novaMateria === 'Língua Portuguesa') {
                        setFiltroAssunto('Interpretação e Compreensão de Textos');
                      } else {
                        setFiltroAssunto('Todos');
                      }
                      setQuestaoIndex(0);
                    }}
                  >
                    <option value="Enfermagem">Enfermagem</option>
                    <option value="Língua Portuguesa">Língua Portuguesa</option>
                    <option value="Todas">Todas as Disciplinas</option>
                  </select>
                </div>

                {/* 4. Assunto */}
                <div className="filter-group">
                  <label className="filter-label">Assunto</label>
                  <select
                    className="filter-select"
                    value={filtroAssunto}
                    onChange={e => {
                      const novoAssunto = e.target.value;
                      setFiltroAssunto(novoAssunto);
                      setQuestaoIndex(0);

                      // Ajusta automaticamente a Disciplina conforme o assunto escolhido se necessário
                      if (novoAssunto !== 'Todos') {
                        const isPort = assuntosConfig.portugues.some(a => a.nome === novoAssunto);
                        const isEnf = assuntosConfig.enfermagem.some(a => a.nome === novoAssunto);
                        if (isPort && filtroMateria !== 'Língua Portuguesa') {
                          setFiltroMateria('Língua Portuguesa');
                        } else if (isEnf && filtroMateria !== 'Enfermagem') {
                          setFiltroMateria('Enfermagem');
                        }
                      }
                    }}
                  >
                    <option value="Todos">
                      {filtroMateria === 'Língua Portuguesa'
                        ? 'Todos os Assuntos de Língua Portuguesa (1.135 q.)'
                        : filtroMateria === 'Enfermagem'
                        ? 'Todos os Assuntos de Enfermagem (872 q.)'
                        : 'Todos os Assuntos (2.007 q.)'}
                    </option>

                    {(filtroMateria === 'Todas' || filtroMateria === 'Língua Portuguesa') && (
                      filtroMateria === 'Todas' ? (
                        <optgroup label="📖 Língua Portuguesa">
                          {assuntosConfig.portugues.map(a => (
                            <option key={a.nome} value={a.nome}>
                              {a.nome} ({a.total} q.)
                            </option>
                          ))}
                        </optgroup>
                      ) : (
                        assuntosConfig.portugues.map(a => (
                          <option key={a.nome} value={a.nome}>
                            {a.nome} ({a.total} q.)
                          </option>
                        ))
                      )
                    )}

                    {(filtroMateria === 'Todas' || filtroMateria === 'Enfermagem') && (
                      filtroMateria === 'Todas' ? (
                        <optgroup label="🩺 Enfermagem">
                          {assuntosConfig.enfermagem.map(a => (
                            <option key={a.nome} value={a.nome}>
                              {a.nome} ({a.total} q.)
                            </option>
                          ))}
                        </optgroup>
                      ) : (
                        assuntosConfig.enfermagem.map(a => (
                          <option key={a.nome} value={a.nome}>
                            {a.nome} ({a.total} q.)
                          </option>
                        ))
                      )
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Âncora para rolagem suave */}
            <div id="questoes-anchor"></div>

            {/* Listagem de Questões */}
            {carregandoDados ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 2rem', background: '#ffffff', borderRadius: '1rem', border: '1px solid #e2e8f0', margin: '1.5rem 0' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid #ccfbf1', borderTopColor: '#0d9488', borderRadius: '50%', animation: 'enfSpin 0.75s linear infinite', margin: '0 auto 1rem' }}></div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>Carregando questões do assunto...</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Preparando modo de estudo individual focado</p>
              </div>
            ) : totalFiltradas === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 2rem', background: '#ffffff', borderRadius: '1rem', border: '1px solid #e2e8f0', margin: '1.5rem 0' }}>
                <HelpCircle size={44} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Nenhuma questão encontrada</h3>
                <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '1.25rem' }}>Tente alterar os filtros ou remover termos específicos da pesquisa.</p>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setBuscaTexto('');
                    setFiltroBanca('SELECON');
                    setFiltroCargo('Todos');
                    setFiltroMateria('Enfermagem');
                    setFiltroAssunto('Fundamentos e Procedimentos de Enfermagem');
                    setQuestaoIndex(0);
                  }}
                >
                  Restaurar Filtros Padrão
                </button>
              </div>
            ) : (
              <>
                {/* MODO 1: INDIVIDUAL (1 QUESTÃO POR VEZ COM PRE-LOADING INSTANTÂNEO) */}
                {modoVisualizacao === 'individual' && questaoAtual && (() => {
                  const q = questaoAtual;
                  const resp = respostas[q.id];
                  const confirmada = resp?.confirmada;
                  const acertou = confirmada && resp.selecionada === q.resposta_correta;
                  const pctProgresso = Math.round(((safeIndex + 1) / totalFiltradas) * 100);

                  return (
                    <div className="individual-question-wrapper animate-fade-in" key={q.id}>
                      <article className="question-card" style={{ marginBottom: '1.25rem', borderTop: '3px solid #0d9488' }}>
                        <div className="question-meta" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
                            <span className="badge" style={{ background: '#0f172a', color: '#38bdf8', fontWeight: 800 }}>
                              {q.id}
                            </span>
                            <span className="badge badge-banca">{q.banca}</span>
                            <span className="badge badge-orgao">{q.orgao} • {q.ano}</span>
                            <span className="badge badge-cargo">{q.cargo}</span>
                            <span className="badge badge-materia">{q.assunto || q.materia}</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <span style={{ fontSize: '0.84rem', color: '#0f766e', fontWeight: 700, background: '#ccfbf1', padding: '0.25rem 0.65rem', borderRadius: '1rem' }}>
                              Questão {safeIndex + 1} de {totalFiltradas} ({pctProgresso}%)
                            </span>
                            <form onSubmit={handlePuloSubmit} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <input
                                type="number"
                                min="1"
                                max={totalFiltradas}
                                placeholder="Nº"
                                title="Pular para o número da questão"
                                style={{ width: '52px', padding: '0.2rem 0.4rem', fontSize: '0.78rem', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }}
                                value={puloInput}
                                onChange={e => setPuloInput(e.target.value)}
                              />
                              <button type="submit" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', background: '#0d9488', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 700 }}>
                                Ir
                              </button>
                            </form>
                          </div>
                        </div>

                        <p className="question-text" style={{ fontSize: '1.08rem', lineHeight: '1.75' }}>
                          <strong>Enunciado:</strong> {q.enunciado}
                        </p>

                        <div className="alternativas-list">
                          {q.alternativas.map(alt => {
                            const isSelected = resp?.selecionada === alt.id;
                            let altClass = 'alt-option';
                            if (isSelected) altClass += ' selected';
                            if (confirmada) {
                              if (alt.id === q.resposta_correta) altClass += ' correct';
                              else if (isSelected && !acertou) altClass += ' wrong';
                            }

                            return (
                              <button
                                key={alt.id}
                                className={altClass}
                                onClick={() => selecionarOpcaoQuestao(q.id, alt.id)}
                                disabled={confirmada}
                                style={{ padding: '0.95rem 1.15rem' }}
                              >
                                <span className="alt-letter">{alt.id}</span>
                                <span style={{ flex: 1, fontSize: '0.98rem' }}>{alt.texto}</span>
                              </button>
                            );
                          })}
                        </div>

                        <div className="question-actions" style={{ marginTop: '1.25rem' }}>
                          {!confirmada ? (
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <button
                                className="btn-primary"
                                onClick={() => confirmarResposta(q.id)}
                                disabled={!resp?.selecionada}
                                style={{
                                  padding: '0.9rem 2.5rem',
                                  fontSize: '1.05rem',
                                  fontWeight: 700,
                                  background: resp?.selecionada ? '#0d9488' : '#94a3b8',
                                  cursor: resp?.selecionada ? 'pointer' : 'not-allowed',
                                  boxShadow: resp?.selecionada ? '0 4px 14px rgba(13, 148, 136, 0.3)' : 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.5rem'
                                }}
                              >
                                <CheckCircle2 size={20} />
                                <span>Responder Questão</span>
                              </button>
                            </div>
                          ) : (
                            <div className="feedback-result-card animate-fade-in" style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '1rem',
                              background: acertou ? '#f0fdf4' : '#fef2f2',
                              border: `2px solid ${acertou ? '#4ade80' : '#f87171'}`,
                              padding: '1.15rem 1.4rem',
                              borderRadius: '0.85rem'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                {acertou ? (
                                  <>
                                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      <CheckCircle2 size={26} color="#16a34a" />
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#15803d' }}>
                                        🎉 Parabéns! Resposta Correta!
                                      </div>
                                      <div style={{ fontSize: '0.9rem', color: '#166534' }}>
                                        Você marcou a <strong>Alternativa {q.resposta_correta}</strong>. Confira a fundamentação completa abaixo.
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      <XCircle size={26} color="#dc2626" />
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#b91c1c' }}>
                                        ✕ Resposta Incorreta!
                                      </div>
                                      <div style={{ fontSize: '0.9rem', color: '#991b1b' }}>
                                        Sua marcação foi [{resp?.selecionada}]. O gabarito oficial é a <strong>Alternativa {q.resposta_correta}</strong>.
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>

                              <div>
                                {safeIndex < totalFiltradas - 1 ? (
                                  <button
                                    type="button"
                                    className="btn-primary btn-next-pulse"
                                    onClick={irParaProxima}
                                    style={{
                                      padding: '0.85rem 2rem',
                                      fontSize: '1.05rem',
                                      fontWeight: 800,
                                      background: '#0d9488',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      borderRadius: '0.6rem',
                                      boxShadow: '0 6px 18px rgba(13, 148, 136, 0.35)'
                                    }}
                                  >
                                    <span>Próxima Questão</span>
                                    <ChevronRight size={20} />
                                  </button>
                                ) : (
                                  <span style={{ fontWeight: 800, color: '#0d9488', fontSize: '0.95rem' }}>
                                    🎉 Você concluiu a última questão deste tema!
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Comentário do Professor e Análise de Distratores */}
                        {confirmada && (
                          <div className="comment-box animate-fade-in" style={{ marginTop: '1.5rem' }}>
                            <div className="comment-section-correct">
                              <div className="comment-title-correct">
                                <CheckCircle2 size={18} color="#166534" />
                                <span>Gabarito Oficial: Alternativa {q.resposta_correta} (Fundamentação Legal / Técnica)</span>
                              </div>
                              <p className="comment-text-correct">
                                {q.fundamentacao_correta || q.comentario}
                              </p>
                            </div>

                            {q.analise_distratores && q.analise_distratores.length > 0 && (
                              <div className="comment-section-wrong">
                                <div className="comment-title-wrong">
                                  <XCircle size={17} color="#dc2626" />
                                  <span>Análise dos Distratores (Por que as outras alternativas estão incorretas):</span>
                                </div>
                                <div className="distratores-list">
                                  {q.analise_distratores.map(d => (
                                    <div key={d.letra} className="distrator-item">
                                      <span className="distrator-badge">{d.letra}</span>
                                      <div>
                                        <strong>Alternativa {d.letra}:</strong> {d.motivo}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Rodapé do comentário com ação rápida para a próxima */}
                            <div style={{
                              marginTop: '1.25rem',
                              paddingTop: '1rem',
                              borderTop: '1px solid #e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '0.75rem'
                            }}>
                              <span style={{ fontSize: '0.86rem', color: '#64748b', fontWeight: 600 }}>
                                {safeIndex < totalFiltradas - 1
                                  ? `Pronto para a próxima? Restam ${totalFiltradas - safeIndex - 1} questões neste caderno.`
                                  : 'Você completou a última questão deste caderno temático!'}
                              </span>
                              {safeIndex < totalFiltradas - 1 ? (
                                <button
                                  type="button"
                                  className="btn-primary btn-next-pulse"
                                  onClick={irParaProxima}
                                  style={{
                                    padding: '0.75rem 1.75rem',
                                    fontSize: '0.98rem',
                                    fontWeight: 800,
                                    background: '#0d9488',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    borderRadius: '0.5rem',
                                    boxShadow: '0 4px 14px rgba(13, 148, 136, 0.3)'
                                  }}
                                >
                                  <span>Avançar para a Próxima Questão</span>
                                  <ChevronRight size={18} />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn-primary"
                                  onClick={irParaPrimeira}
                                  style={{
                                    padding: '0.75rem 1.75rem',
                                    fontSize: '0.98rem',
                                    fontWeight: 700,
                                    background: '#0f766e',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    borderRadius: '0.5rem'
                                  }}
                                >
                                  <RotateCcw size={16} />
                                  <span>Recomeçar este Caderno</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </article>

                      {/* Card de Celebração de Conclusão do Caderno */}
                      {safeIndex === totalFiltradas - 1 && confirmada && (
                        <div className="caderno-concluido-card animate-fade-in" style={{
                          marginBottom: '1.5rem',
                          padding: '2rem 1.5rem',
                          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                          border: '2px solid #86efac',
                          borderRadius: '1rem',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏆</div>
                          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#166534', marginBottom: '0.5rem' }}>
                            Parabéns! Você concluiu todas as {totalFiltradas} questões deste caderno!
                          </h3>
                          <p style={{ color: '#15803d', fontSize: '0.98rem', maxWidth: '620px', margin: '0 auto 1.5rem', lineHeight: '1.6' }}>
                            Você finalizou com sucesso o estudo prático de <strong>{nomeAssuntoAtivo || filtroMateria}</strong>. Continue praticando para fixar os conteúdos mais cobrados pela banca.
                          </p>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="btn-primary"
                              onClick={irParaPrimeira}
                              style={{
                                padding: '0.8rem 1.6rem',
                                fontWeight: 700,
                                background: '#0d9488',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                borderRadius: '0.5rem'
                              }}
                            >
                              <RotateCcw size={18} />
                              <span>Recomeçar este Caderno</span>
                            </button>
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => {
                                window.scrollTo({ top: 250, behavior: 'smooth' });
                              }}
                              style={{
                                padding: '0.8rem 1.6rem',
                                fontWeight: 700,
                                background: '#ffffff',
                                border: '1px solid #cbd5e1',
                                color: '#334155',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                cursor: 'pointer',
                                borderRadius: '0.5rem'
                              }}
                            >
                              <Filter size={18} />
                              <span>Escolher Outro Assunto</span>
                            </button>
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => {
                                setActiveTab('padrao');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              style={{
                                padding: '0.8rem 1.6rem',
                                fontWeight: 700,
                                background: '#ffffff',
                                border: '1px solid #cbd5e1',
                                color: '#334155',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                cursor: 'pointer',
                                borderRadius: '0.5rem'
                              }}
                            >
                              <BarChart3 size={18} />
                              <span>Ver Raio-X da Banca</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Barra de Navegação Inferior */}
                      <div className="question-bottom-nav">
                        <div className="bottom-nav-group left">
                          <button
                            className="btn-nav-step"
                            onClick={irParaPrimeira}
                            disabled={safeIndex === 0}
                            title="Primeira questão"
                          >
                            <ChevronsLeft size={18} />
                            <span className="hide-mobile">Primeira</span>
                          </button>
                          <button
                            className="btn-nav-step btn-nav-arrow"
                            onClick={irParaAnterior}
                            disabled={safeIndex === 0}
                            title="Questão anterior (ou Tecla ←)"
                          >
                            <ChevronLeft size={18} />
                            <span>Anterior</span>
                          </button>
                        </div>

                        <div className="bottom-nav-center">
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                            Questão {safeIndex + 1} de {totalFiltradas} ({pctProgresso}%)
                          </div>
                          <div className="progress-tracker">
                            <div className="progress-bar-fill" style={{ width: `${pctProgresso}%` }}></div>
                          </div>
                        </div>

                        <div className="bottom-nav-group right">
                          <button
                            className="btn-nav-step primary btn-nav-arrow"
                            onClick={irParaProxima}
                            disabled={safeIndex >= totalFiltradas - 1}
                            title="Próxima questão (ou Tecla →)"
                          >
                            <span>Próxima</span>
                            <ChevronRight size={18} />
                          </button>
                          <button
                            className="btn-nav-step"
                            onClick={irParaUltima}
                            disabled={safeIndex >= totalFiltradas - 1}
                            title="Última questão"
                          >
                            <span className="hide-mobile">Última</span>
                            <ChevronsRight size={18} />
                          </button>
                        </div>
                      </div>

                      <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem', marginTop: '-0.75rem', marginBottom: '2rem' }}>
                        ⚡ Dica: Você também pode usar as setas <strong>← Anterior</strong> e <strong>Próxima →</strong> do teclado para avançar rapidamente.
                      </div>
                    </div>
                  );
                })()}

                {/* MODO 2: LISTA CORRIDA (OPCIONAL) */}
                {modoVisualizacao === 'lista' && (
                  <div className="list-mode-wrapper animate-fade-in">
                    {(filtroAssunto !== 'Todos' ? questoesFiltradas : questoesFiltradas.slice(0, limiteExibicao)).map((q, index) => {
                      const resp = respostas[q.id];
                      const confirmada = resp?.confirmada;
                      const acertou = confirmada && resp.selecionada === q.resposta_correta;

                      return (
                        <article key={q.id} className="question-card">
                          <div className="question-meta">
                            <span className="badge" style={{ background: '#0f172a', color: '#38bdf8', fontWeight: 800 }}>
                              {q.id}
                            </span>
                            <span className="badge badge-banca">{q.banca}</span>
                            <span className="badge badge-orgao">{q.orgao} • {q.ano}</span>
                            <span className="badge badge-cargo">{q.cargo}</span>
                            <span className="badge badge-materia">{q.assunto || q.materia}</span>
                          </div>

                          <p className="question-text">
                            <strong>Questão {index + 1}:</strong> {q.enunciado}
                          </p>

                          <div className="alternativas-list">
                            {q.alternativas.map(alt => {
                              const isSelected = resp?.selecionada === alt.id;
                              let altClass = 'alt-option';
                              if (isSelected) altClass += ' selected';
                              if (confirmada) {
                                if (alt.id === q.resposta_correta) altClass += ' correct';
                                else if (isSelected && !acertou) altClass += ' wrong';
                              }

                              return (
                                <button
                                  key={alt.id}
                                  className={altClass}
                                  onClick={() => selecionarOpcaoQuestao(q.id, alt.id)}
                                  disabled={confirmada}
                                >
                                  <span className="alt-letter">{alt.id}</span>
                                  <span style={{ flex: 1 }}>{alt.texto}</span>
                                </button>
                              );
                            })}
                          </div>

                          <div className="question-actions">
                            <div>
                              {confirmada && (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                  fontWeight: 700,
                                  color: acertou ? '#059669' : '#dc2626'
                                }}>
                                  {acertou ? (
                                    <>
                                      <CheckCircle2 size={20} />
                                      Parabéns! Resposta Correta
                                    </>
                                  ) : (
                                    <>
                                      <XCircle size={20} />
                                      Resposta Incorreta. Gabarito: {q.resposta_correta}
                                    </>
                                  )}
                                </span>
                              )}
                            </div>

                            {!confirmada && (
                              <button
                                className="btn-primary"
                                onClick={() => confirmarResposta(q.id)}
                                disabled={!resp?.selecionada}
                              >
                                Responder Questão
                              </button>
                            )}
                          </div>

                          {/* Comentário do Professor */}
                          {confirmada && (
                            <div className="comment-box animate-fade-in">
                              <div className="comment-section-correct">
                                <div className="comment-title-correct">
                                  <CheckCircle2 size={18} color="#166534" />
                                  <span>Gabarito Oficial: Alternativa {q.resposta_correta} (Fundamentação Legal / Técnica)</span>
                                </div>
                                <p className="comment-text-correct">
                                  {q.fundamentacao_correta || q.comentario}
                                </p>
                              </div>

                              {q.analise_distratores && q.analise_distratores.length > 0 && (
                                <div className="comment-section-wrong">
                                  <div className="comment-title-wrong">
                                    <XCircle size={17} color="#dc2626" />
                                    <span>Análise dos Distratores (Por que as outras alternativas estão incorretas):</span>
                                  </div>
                                  <div className="distratores-list">
                                    {q.analise_distratores.map(d => (
                                      <div key={d.letra} className="distrator-item">
                                        <span className="distrator-badge">{d.letra}</span>
                                        <div>
                                          <strong>Alternativa {d.letra}:</strong> {d.motivo}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </article>
                      );
                    })}

                    {/* Botão para carregar mais questões */}
                    {filtroAssunto === 'Todos' && limiteExibicao < questoesFiltradas.length && (
                      <div style={{ textAlign: 'center', margin: '2.5rem 0' }}>
                        <button
                          className="btn-primary"
                          style={{ padding: '0.85rem 2.2rem', fontSize: '1rem', background: '#0f172a' }}
                          onClick={() => setLimiteExibicao(prev => prev + 25)}
                        >
                          Carregar Mais 25 Questões ({questoesFiltradas.length - limiteExibicao} restantes)
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* ABA: SIMULADOS */}
        {activeTab === 'simulados' && (
          <section className="animate-fade-in">
            {!simuladoAtivo ? (
              <div>
                <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 2rem' }}>
                  <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Simulados Reais com Cronômetro</h2>
                  <p style={{ color: '#64748b' }}>
                    Treine no ritmo da prova real. Nossos simulados calculam seu tempo por questão e mostram se você estaria aprovado na nota de corte de prefeituras.
                  </p>
                </div>

                <div className="simulados-grid">
                  <div className="simulado-card">
                    <div className="simulado-header">
                      <h3 className="simulado-title">Simulado Rápido de Prefeituras</h3>
                      <p className="simulado-desc">
                        Focado nas matérias mais repetidas em concursos municipais: SUS, Imunização e Código de Ética COFEN.
                      </p>
                    </div>
                    <div className="simulado-info">
                      <span><strong>6</strong> Questões</span>
                      <span><strong>15</strong> Minutos</span>
                      <span>Bancas: IBAM / VUNESP</span>
                    </div>
                    <button className="btn-primary" onClick={() => iniciarSimulado('prefeituras')}>
                      Iniciar Simulado Gratuito
                    </button>
                  </div>

                  <div className="simulado-card" style={{ border: '2px solid #0d9488' }}>
                    <div className="simulado-header">
                      <div style={{ display: 'inline-block', background: '#ccfbf1', color: '#0f766e', fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '4px', marginBottom: '0.5rem' }}>
                        MAIS COBRADO
                      </div>
                      <h3 className="simulado-title">Simulado Completo Técnico de Enfermagem</h3>
                      <p className="simulado-desc">
                        Mix de questões de cálculo de medicação, sinais vitais, urgência e emergência e SUS.
                      </p>
                    </div>
                    <div className="simulado-info">
                      <span><strong>8</strong> Questões</span>
                      <span><strong>20</strong> Minutos</span>
                      <span>Bancas Municipais</span>
                    </div>
                    <button className="btn-primary" onClick={() => iniciarSimulado('todos')}>
                      Iniciar Simulado
                    </button>
                  </div>

                  <div className="simulado-card">
                    <div className="simulado-header">
                      <h3 className="simulado-title">Simulado EBSERH & Grandes Concursos</h3>
                      <p className="simulado-desc">
                        Questões de alto nível com perfil das bancas FGV, IBFC e Cebraspe para hospitais universitários.
                      </p>
                    </div>
                    <div className="simulado-info">
                      <span><strong>10</strong> Questões</span>
                      <span><strong>25</strong> Minutos</span>
                      <span>Nível Superior & Médio</span>
                    </div>
                    <button className="btn-primary" onClick={() => setModalVipAberto(true)}>
                      Desbloquear no Plano VIP
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* MODO EXECUÇÃO DO SIMULADO */
              <div className="simulado-runner">
                <div className="simulado-header-bar">
                  <div>
                    <h3 style={{ fontSize: '1.2rem', color: '#0f172a' }}>{simuladoAtivo.titulo}</h3>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      Questão {simuladoIndex + 1} de {simuladoAtivo.questoes.length}
                    </span>
                  </div>

                  <div className="timer-box">
                    <Timer size={20} />
                    <span>{formatarTempo(tempoRestante)}</span>
                  </div>
                </div>

                {!simuladoFinalizado ? (
                  <div>
                    {(() => {
                      const q = simuladoAtivo.questoes[simuladoIndex];
                      const selected = simuladoRespostas[q.id];

                      return (
                        <div className="question-card">
                          <div className="question-meta">
                            <span className="badge badge-banca">{q.banca}</span>
                            <span className="badge badge-orgao">{q.orgao}</span>
                            <span className="badge badge-cargo">{q.cargo}</span>
                          </div>

                          <p className="question-text">{q.enunciado}</p>

                          <div className="alternativas-list">
                            {q.alternativas.map(alt => (
                              <button
                                key={alt.id}
                                className={`alt-option ${selected === alt.id ? 'selected' : ''}`}
                                onClick={() => setSimuladoRespostas({ ...simuladoRespostas, [q.id]: alt.id })}
                              >
                                <span className="alt-letter">{alt.id}</span>
                                <span>{alt.texto}</span>
                              </button>
                            ))}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                            <button
                              className="btn-primary"
                              style={{ background: '#94a3b8' }}
                              disabled={simuladoIndex === 0}
                              onClick={() => setSimuladoIndex(simuladoIndex - 1)}
                            >
                              Anterior
                            </button>

                            {simuladoIndex < simuladoAtivo.questoes.length - 1 ? (
                              <button
                                className="btn-primary"
                                onClick={() => setSimuladoIndex(simuladoIndex + 1)}
                              >
                                Próxima Questão
                              </button>
                            ) : (
                              <button
                                className="btn-primary"
                                style={{ background: '#10b981' }}
                                onClick={() => setSimuladoFinalizado(true)}
                              >
                                Finalizar e Ver Resultado
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  /* RESULTADO DO SIMULADO */
                  <div className="question-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                    <Award size={64} color="#0d9488" style={{ margin: '0 auto 1rem' }} />
                    <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Simulado Concluído!</h2>
                    <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                      Confira abaixo o seu aproveitamento nesta simulação:
                    </p>

                    {(() => {
                      const total = simuladoAtivo.questoes.length;
                      const acertos = simuladoAtivo.questoes.filter(
                        q => simuladoRespostas[q.id] === q.resposta_correta
                      ).length;
                      const perc = Math.round((acertos / total) * 100);

                      return (
                        <div style={{ maxWidth: '400px', margin: '0 auto 2rem' }}>
                          <div style={{ fontSize: '3rem', fontWeight: 800, color: '#0d9488' }}>
                            {perc}%
                          </div>
                          <p style={{ fontWeight: 600, color: '#334155' }}>
                            Você acertou {acertos} de {total} questões
                          </p>

                          <div style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            borderRadius: '8px',
                            background: perc >= 70 ? '#ecfdf5' : '#fffbeb',
                            color: perc >= 70 ? '#065f46' : '#92400e',
                            fontWeight: 600
                          }}>
                            {perc >= 70
                              ? 'Excelente! Você estaria classificado(a) na faixa de vagas da maioria das prefeituras!'
                              : 'Atenção aos pontos fracos! Foque em Legislação do SUS e Farmacologia para subir sua nota.'}
                          </div>
                        </div>
                      );
                    })()}

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                      <button className="btn-primary" onClick={() => setSimuladoAtivo(null)}>
                        Voltar aos Simulados
                      </button>
                      <button className="btn-vip-cta" onClick={() => setModalVipAberto(true)}>
                        Ver Gabarito Comentado Completo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* ABA: MATERIAIS & PDFS */}
        {activeTab === 'materiais' && (
          <section className="animate-fade-in">
            <div className="question-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <FolderOpen size={28} color="#0d9488" />
                <div>
                  <h2 style={{ fontSize: '1.4rem' }}>Repositório de Provas e PDFs de Referência</h2>
                  <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                    Suas pastas locais estão prontas para receber provas em PDF de prefeituras e grandes concursos.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', margin: '1.5rem 0' }}>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', background: '#f8fafc' }}>
                  <h4 style={{ color: '#0f172a', marginBottom: '0.5rem' }}>📁 /01_PDFS_DE_REFERENCIA/prefeituras/</h4>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Destinado a cadernos de provas de municípios (SELECON, IBAM, VUNESP, Consulpam, Legalle, Avança SP).
                  </p>
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', background: '#f8fafc' }}>
                  <h4 style={{ color: '#0f172a', marginBottom: '0.5rem' }}>📁 /01_PDFS_DE_REFERENCIA/concursos_maiores/</h4>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Destinado a provas da EBSERH, Ministério da Saúde, Fiocruz, Secretarias de Estado de Saúde.
                  </p>
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', background: '#f8fafc' }}>
                  <h4 style={{ color: '#0f172a', marginBottom: '0.5rem' }}>📁 /01_PDFS_DE_REFERENCIA/cadernos_simulados/</h4>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Listas temáticas (ex: 100 Questões de SUS, 50 Cálculos de Medicamentos para Concurso).
                  </p>
                </div>
              </div>

              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '1.25rem', color: '#065f46' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  <Zap size={18} />
                  Sincronização Automática
                </h4>
                <p style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                  Assim que você colocar os arquivos nas pastas acima, nosso script de processamento em <code>/scripts/extrair_questoes_pdf.py</code> converterá os textos em questões interativas para o site.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ABA: PADRÃO DA BANCA (RAIO-X MULTI-BANCAS) */}
        {activeTab === 'padrao' && (
          <section className="animate-fade-in">
            <div className="padrao-hero">
              <div className="hero-tag" style={{ margin: '0 auto 1rem', display: 'inline-flex' }}>
                <Flame size={15} color="#0d9488" />
                <span>Inteligência Estatística de Concursos</span>
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
                Qual o Padrão da Banca <span style={{ color: '#0d9488' }}>{padraoBanca === 'Todas' ? 'em Concursos Públicos' : padraoBanca}</span>{padraoMateria !== 'Todas' ? ` (${padraoMateria})` : ''}?
              </h2>
              <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: '1.6' }}>
                Auditoria estatística em tempo real baseada em <strong>{totalQuestoesPadrao.toLocaleString('pt-BR')} questões auditadas</strong>. Selecione a banca examinadora, a disciplina e o cargo desejado para descobrir a probabilidade de cada tema cair na sua prova, ordenados do 1º ao último colocado.
              </p>

              {/* Card de Filtros: Banca Examinadora + Disciplina + Cargo */}
              <div className="padrao-filters-card">
                {/* Linha 1: Seleção de Bancas */}
                <div className="padrao-filter-row">
                  <div className="padrao-filter-header">
                    <span className="padrao-filter-title">
                      <Building2 size={16} color="#0d9488" />
                      1. Escolha a Banca Examinadora para Analisar:
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'none', fontWeight: 500 }}>
                      {todasBancasOpcoes.length} bancas integradas ao sistema
                    </span>
                  </div>

                  <div className="padrao-pills-row">
                    <button
                      className={`btn-padrao-pill ${padraoBanca === 'SELECON' ? 'active' : ''}`}
                      onClick={() => setPadraoBanca('SELECON')}
                    >
                      SELECON
                      <span className="pill-badge">2.007 q.</span>
                    </button>
                    <button
                      className={`btn-padrao-pill ${padraoBanca === 'Todas' ? 'active' : ''}`}
                      onClick={() => setPadraoBanca('Todas')}
                    >
                      Todas as Bancas
                      <span className="pill-badge">2.007 q.</span>
                    </button>

                    {BANCAS_PRECONFIGURADAS.filter(b => b !== 'SELECON').map(banca => (
                      <button
                        key={banca}
                        className={`btn-padrao-pill ${padraoBanca === banca ? 'active' : ''}`}
                        onClick={() => setPadraoBanca(banca)}
                      >
                        {banca}
                        <span className="pill-badge">Em Breve</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Linha 2: Seleção de Disciplina / Matéria */}
                <div className="padrao-filter-row">
                  <div className="padrao-filter-header">
                    <span className="padrao-filter-title">
                      <BookOpen size={16} color="#0d9488" />
                      2. Disciplina / Matéria:
                    </span>
                  </div>

                  <div className="padrao-pills-row">
                    <button
                      className={`btn-padrao-pill ${padraoMateria === 'Todas' ? 'active' : ''}`}
                      onClick={() => {
                        setPadraoMateria('Todas');
                        setPadraoCargo('Todos');
                      }}
                    >
                      Todas as Matérias
                      <span className="pill-badge">2.007 q.</span>
                    </button>
                    <button
                      className={`btn-padrao-pill ${padraoMateria === 'Língua Portuguesa' ? 'active' : ''}`}
                      onClick={() => {
                        setPadraoMateria('Língua Portuguesa');
                        setPadraoCargo('Todos');
                      }}
                    >
                      Língua Portuguesa
                      <span className="pill-badge">1.135 q.</span>
                    </button>
                    <button
                      className={`btn-padrao-pill ${padraoMateria === 'Enfermagem' ? 'active' : ''}`}
                      onClick={() => {
                        setPadraoMateria('Enfermagem');
                        setPadraoCargo('Todos');
                      }}
                    >
                      Enfermagem
                      <span className="pill-badge">872 q.</span>
                    </button>
                  </div>
                </div>

                {/* Linha 3: Seleção de Cargo / Nível */}
                <div className="padrao-filter-row">
                  <div className="padrao-filter-header">
                    <span className="padrao-filter-title">
                      <Layers size={16} color="#0d9488" />
                      3. Nível de Escolaridade / Cargo:
                    </span>
                  </div>

                  <div className="padrao-pills-row">
                    <button
                      className={`btn-padrao-pill ${padraoCargo === 'Todos' ? 'active' : ''}`}
                      onClick={() => setPadraoCargo('Todos')}
                    >
                      Todos os Cargos ({padraoMateria === 'Língua Portuguesa' ? '1.135 q.' : padraoMateria === 'Enfermagem' ? '872 q.' : '2.007 q.'})
                    </button>

                    {padraoMateria === 'Língua Portuguesa' ? (
                      <>
                        <button
                          className={`btn-padrao-pill ${padraoCargo === 'Técnico de Enfermagem' ? 'active' : ''}`}
                          onClick={() => setPadraoCargo('Técnico de Enfermagem')}
                        >
                          Nível Médio / Técnico (174 q.)
                        </button>
                        <button
                          className={`btn-padrao-pill ${padraoCargo === 'Enfermeiro' ? 'active' : ''}`}
                          onClick={() => setPadraoCargo('Enfermeiro')}
                        >
                          Nível Superior (77 q.)
                        </button>
                      </>
                    ) : padraoMateria === 'Enfermagem' ? (
                      <>
                        <button
                          className={`btn-padrao-pill ${padraoCargo === 'Técnico de Enfermagem' ? 'active' : ''}`}
                          onClick={() => setPadraoCargo('Técnico de Enfermagem')}
                        >
                          Técnico de Enfermagem (343 q.)
                        </button>
                        <button
                          className={`btn-padrao-pill ${padraoCargo === 'Enfermeiro' ? 'active' : ''}`}
                          onClick={() => setPadraoCargo('Enfermeiro')}
                        >
                          Enfermeiro Superior (529 q.)
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className={`btn-padrao-pill ${padraoCargo === 'Técnico de Enfermagem' ? 'active' : ''}`}
                          onClick={() => setPadraoCargo('Técnico de Enfermagem')}
                        >
                          Técnico de Enfermagem (517 q.)
                        </button>
                        <button
                          className={`btn-padrao-pill ${padraoCargo === 'Enfermeiro' ? 'active' : ''}`}
                          onClick={() => setPadraoCargo('Enfermeiro')}
                        >
                          Enfermeiro Superior (606 q.)
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Caso a banca selecionada ainda não tenha questões importadas */}
            {totalQuestoesPadrao === 0 ? (
              <div className="padrao-empty-state animate-fade-in">
                <div className="padrao-empty-icon">
                  <Building2 size={28} />
                </div>
                <h3 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.5rem' }}>
                  A banca <strong>{padraoBanca}</strong> está pré-configurada e pronta para receber questões!
                </h3>
                <p style={{ color: '#64748b', maxWidth: '580px', margin: '0 auto 1.5rem', fontSize: '0.92rem', lineHeight: '1.6' }}>
                  Atualmente o acervo conta com <strong>2.007 questões auditadas da banca SELECON</strong> (sendo 1.135 de Língua Portuguesa e 872 de Enfermagem). Assim que você fizer upload dos cadernos de provas em PDF da <strong>{padraoBanca}</strong> na pasta <code>/01_PDFS_DE_REFERENCIA/prefeituras/</code>, o gráfico de pizza e o ranking ordenado de conteúdo serão calculados instantaneamente aqui!
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setPadraoBanca('SELECON');
                      setPadraoMateria('Todas');
                      setPadraoCargo('Todos');
                    }}
                  >
                    Ver Raio-X da SELECON (2.007 Questões Auditadas)
                  </button>
                  <button
                    className="btn-padrao-pill"
                    onClick={() => setActiveTab('materiais')}
                  >
                    Ver Instruções de Envio de PDFs
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Grid Principal: Gráfico Donut/Pizza + Ranking Horizontal */}
                <div className="padrao-grid">
                  {/* Card 1: Gráfico de Pizza / Donut */}
                  <div className="padrao-card">
                    <h3 className="padrao-card-title">
                      <PieChart size={20} color="#0d9488" />
                      Distribuição Percentual: {padraoBanca === 'Todas' ? 'SELECON (Acervo Completo)' : padraoBanca}
                    </h3>
                    <p className="padrao-card-desc">
                      Proporção de cada assunto no universo de {totalQuestoesPadrao.toLocaleString('pt-BR')} questões analisadas ({padraoCargo === 'Todos' ? 'Todos os Cargos' : padraoCargo}).
                    </p>

                    <div className="donut-container">
                      <div className="donut-chart-box">
                        <div className="donut-circle" style={donutStyle}></div>
                        <div className="donut-inner-hole">
                          <span className="donut-inner-num">{totalQuestoesPadrao.toLocaleString('pt-BR')}</span>
                          <span className="donut-inner-label">Questões</span>
                        </div>
                      </div>

                      <div className="donut-legend">
                        {itensGrafico.map(item => (
                          <div key={item.nome} className="legend-item" title={`${item.nome}: ${item.count} questões (${item.percent}%)`}>
                            <span className="legend-color" style={{ backgroundColor: item.cor }}></span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                              {item.nome}
                            </span>
                            <strong style={{ fontSize: '0.78rem', color: '#0f172a' }}>{item.percent}%</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Ranking do Maior para o Menor */}
                  <div className="padrao-card">
                    <h3 className="padrao-card-title">
                      <BarChart3 size={20} color="#0d9488" />
                      Ranking: Do Mais Cobrado ao Menos Cobrado
                    </h3>
                    <p className="padrao-card-desc">
                      Clique em "Resolver" para abrir diretamente as questões do tema correspondente no banco.
                    </p>

                    <div className="ranking-list">
                      {itensGrafico.map((item, index) => {
                        const isTop1 = index === 0;
                        return (
                          <div key={item.nome} className="ranking-item">
                            <div className="ranking-label-row">
                              <span className="ranking-name">
                                <span
                                  className="ranking-pos"
                                  style={isTop1 ? { background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' } : {}}
                                >
                                  {index + 1}º
                                </span>
                                <span style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {item.nome}
                                </span>
                              </span>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <span className="ranking-metrics">
                                  {item.count} q. ({item.percent}%)
                                </span>
                                <button
                                  className="btn-topic-action"
                                  onClick={() => irParaQuestoesPorTema(item.nome, item.materia)}
                                  title={`Filtrar questões sobre ${item.nome} na banca ${padraoBanca}`}
                                >
                                  Resolver
                                  <ChevronRight size={13} />
                                </button>
                              </div>
                            </div>

                            <div className="ranking-bar-track">
                              <div
                                className="ranking-bar-fill"
                                style={{
                                  width: `${Math.max(Number(item.percent) * 3.5, 4)}%`,
                                  maxWidth: '100%',
                                  backgroundColor: item.cor
                                }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Seção de Insights Estratégicos Inteligentes */}
                <div className="padrao-card" style={{ marginTop: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <Lightbulb size={22} color="#0d9488" />
                    <h3 style={{ fontSize: '1.25rem', color: '#0f172a' }}>
                      Raio-X Inteligente & Dicas de Ouro ({currentInsight.nome})
                    </h3>
                  </div>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                    Insights táticos extraídos a partir do padrão de repetição de enunciados e pegadinhas da banca:
                  </p>

                  <div className="insights-grid" style={{ marginTop: 0 }}>
                    <div className="insight-card">
                      <div className="insight-tag">
                        <Target size={14} /> {currentInsight.foco1.tag}
                      </div>
                      <h4 className="insight-title">{currentInsight.foco1.title}</h4>
                      <p className="insight-text">
                        {currentInsight.foco1.text}
                      </p>
                    </div>

                    <div className="insight-card">
                      <div className="insight-tag">
                        <Sparkles size={14} /> {currentInsight.ponto.tag}
                      </div>
                      <h4 className="insight-title">{currentInsight.ponto.title}</h4>
                      <p className="insight-text">
                        {currentInsight.ponto.text}
                      </p>
                    </div>

                    <div className="insight-card">
                      <div className="insight-tag">
                        <Zap size={14} /> {currentInsight.perfil.tag}
                      </div>
                      <h4 className="insight-title">{currentInsight.perfil.title}</h4>
                      <p className="insight-text">
                        {currentInsight.perfil.text}
                      </p>
                    </div>

                    <div className="insight-card">
                      <div className="insight-tag">
                        <Award size={14} /> {currentInsight.sus.tag}
                      </div>
                      <h4 className="insight-title">{currentInsight.sus.title}</h4>
                      <p className="insight-text">
                        {currentInsight.sus.text}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {/* BANNER DE VENDAS / PLANO VIP (Garante a meta de R$ 10.000) */}
        <section className="vip-banner">
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#34d399', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              <ShieldCheck size={18} /> Oferta Especial de Lançamento
            </div>
            <h2 className="vip-title">Passaporte Aprovação Prefeituras VIP</h2>
            <p style={{ color: '#cbd5e1', maxWidth: '520px', fontSize: '0.95rem' }}>
              Acesso ilimitado ao banco completo com mais de 10.000 questões, simulados inéditos semanais com ranking, cadernos em PDF para download e suporte a dúvidas.
            </p>
          </div>

          <div style={{ textAlign: 'center', minWidth: '220px' }}>
            <div style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '0.9rem' }}>De R$ 97,00 por</div>
            <div className="vip-price">R$ 37,90</div>
            <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '1rem' }}>Pagamento único • Acesso Vitalício</div>
            <button className="btn-vip-cta" onClick={() => setModalVipAberto(true)}>
              Garantir Minha Vaga VIP
            </button>
          </div>
        </section>
      </main>

      {/* MODAL DE CHECKOUT VIP */}
      {modalVipAberto && (
        <div className="modal-overlay" onClick={() => setModalVipAberto(false)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.3rem' }}>Acesso VIP EnfConcursos</h3>
              <button
                onClick={() => setModalVipAberto(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <p style={{ color: '#475569', fontSize: '0.92rem', marginBottom: '1.25rem' }}>
              Desbloqueie agora todo o potencial da plataforma com garantia incondicional de 7 dias:
            </p>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534' }}>
                <CheckCircle2 size={18} color="#10b981" />
                Mais de 10.000 questões comentadas alternativa por alternativa
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534' }}>
                <CheckCircle2 size={18} color="#10b981" />
                Simulados cronometrados com nota de corte por município
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534' }}>
                <CheckCircle2 size={18} color="#10b981" />
                Download de cadernos de questões em PDF para imprimir
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534' }}>
                <CheckCircle2 size={18} color="#10b981" />
                Atualizações com novos editais e provas de 2024 a 2026
              </li>
            </ul>

            <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '1rem', textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Chave Pix Instantânea</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0d9488', margin: '0.25rem 0' }}>R$ 37,90</div>
              <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Liberação automática imediata após o pagamento</div>
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}
              onClick={() => {
                alert('Integração de checkout pronta! Podemos conectar com sua conta Kiwify, Mercado Pago ou Hotmart.');
              }}
            >
              Copiar Código Pix & Desbloquear
            </button>
          </div>
        </div>
      )}

      {/* Footer com Links SEO */}
      <footer className="footer">
        <div className="container footer-content">
          <div>
            <strong style={{ color: '#0f172a' }}>EnfConcursos</strong> — Plataforma especializada em Concursos de Enfermagem para Prefeituras e SUS.
            <div style={{ marginTop: '0.35rem', fontSize: '0.8rem' }}>
              Questões das bancas: IBAM • VUNESP • Consulpam • AOCP • FGV • Legalle • Avança SP
            </div>
          </div>
          <div>
            © {new Date().getFullYear()} EnfConcursos. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
