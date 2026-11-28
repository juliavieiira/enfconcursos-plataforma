import React, { useState, useEffect, useMemo } from 'react';
import './App.css';
import { BANCAS_PRECONFIGURADAS, getInsightPorBanca } from './data/bancasInfo';
import { ASSUNTOS_PORTUGUES, ASSUNTOS_ENFERMAGEM } from './data/assuntosCatalogo';
import { ESTATISTICAS_AUDITADAS_BASELINE } from './data/estatisticasAuditadas';
import {
  buscarQuestoesPaginadas,
  carregarEstatisticasAcervo,
  construirResumoEstatisticas,
  contarPorFiltro,
  obterRaioXDinamico,
  gerarSimuladoSupabase
} from './services/questoesService';
import {
  Stethoscope,
  BookOpen,
  Timer,
  Award,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  HelpCircle,
  Sparkles,
  Zap,
  PieChart,
  BarChart3,
  Lightbulb,
  Target,
  Building2,
  RotateCcw,
  Crown,
  Lock,
  RefreshCw,
  Brain
} from 'lucide-react';
import { useAuth } from './context/useAuth.js';
import UserHeaderMenu from './components/UserHeaderMenu.jsx';
import AuthModal from './components/AuthModal.jsx';
import UpgradeModal from './components/UpgradeModal.jsx';
import TextoEnunciado from './components/TextoEnunciado.jsx';
import CadernoErros from './components/CadernoErros.jsx';

const CURRENT_YEAR = new Date().getFullYear();
const PAGE_SIZE = 20;

const SIMULADOS_CATALOGO = [
  {
    numero: 1,
    tituloBase: 'Simulado Oficial #01 - Prova Completa',
    subtituloBase: '60 questões reais sorteadas no padrão estatístico da banca (20 Português + 40 Enfermagem)',
    exclusivoVip: false
  },
  {
    numero: 2,
    tituloBase: 'Simulado Oficial #02 - Prova Inédita',
    subtituloBase: 'Nova bateria de 60 questões cronometradas com foco nas pegadinhas mais cobradas',
    exclusivoVip: true
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('questoes'); // 'questoes', 'padrao', 'simulados'

  // Estatísticas em tempo real do Supabase com baseline auditado imediato (zero travamento)
  const [statsAcervo, setStatsAcervo] = useState(() => construirResumoEstatisticas(ESTATISTICAS_AUDITADAS_BASELINE));
  const [statsErro, setStatsErro] = useState(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let ativo = true;
    carregarEstatisticasAcervo(true)
      .then(res => {
        if (ativo && res && res.totalGeral > 0) {
          setStatsAcervo(res);
          setStatsErro(null);
        }
      })
      .catch(err => {
        if (ativo) {
          console.error('Erro ao carregar estatísticas do Supabase:', err);
          setStatsErro(err?.message || 'Erro ao sincronizar com o banco de dados');
        }
      });
    return () => { ativo = false; };
  }, [retryToken]);

  const totalGeralAcervo = statsAcervo?.totalGeral || 0;

  // Navegação individual focada (1 questão por vez com paginação server-side)
  const [questaoIndex, setQuestaoIndex] = useState(0);
  const [puloInput, setPuloInput] = useState('');

  // Filtros - Padrão direto na banca SELECON e no tema principal de Enfermagem
  const [buscaTexto, setBuscaTexto] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');
  const [filtroBanca, setFiltroBanca] = useState('SELECON');
  const [filtroCargo, setFiltroCargo] = useState('Todos');
  const [filtroMateria, setFiltroMateria] = useState('Enfermagem');
  const [filtroAssunto, setFiltroAssunto] = useState('Todos');

  // Debounce da busca textual (evita disparar consulta a cada tecla)
  useEffect(() => {
    const t = setTimeout(() => {
      setBuscaDebounced(buscaTexto);
      setQuestaoIndex(0);
    }, 350);
    return () => clearTimeout(t);
  }, [buscaTexto]);

  const paginaAtual = Math.floor(questaoIndex / PAGE_SIZE);
  const offsetNaPagina = questaoIndex % PAGE_SIZE;

  const [paginaDados, setPaginaDados] = useState({
    chave: '',
    itens: [],
    total: 0,
    erro: null
  });

  const chaveConsultaAtual = JSON.stringify({
    banca: filtroBanca,
    cargo: filtroMateria === 'Língua Portuguesa' ? 'Todos' : filtroCargo,
    materia: filtroMateria,
    assunto: filtroAssunto,
    busca: buscaDebounced,
    pagina: paginaAtual,
    retry: retryToken
  });

  const carregandoDados = paginaDados.chave !== chaveConsultaAtual;

  // Consulta 100% server-side no Supabase com paginação escalável (+20.000 questões)
  useEffect(() => {
    let ativo = true;
    const cargoEfetivo = filtroMateria === 'Língua Portuguesa' ? 'Todos' : filtroCargo;

    buscarQuestoesPaginadas({
      banca: filtroBanca,
      cargo: cargoEfetivo,
      materia: filtroMateria,
      assunto: filtroAssunto,
      busca: buscaDebounced,
      pagina: paginaAtual,
      tamanhoPagina: PAGE_SIZE
    })
      .then(res => {
        if (!ativo) return;
        setPaginaDados({
          chave: chaveConsultaAtual,
          itens: res.itens,
          total: res.total,
          erro: null
        });

        // Prefetch silencioso da próxima página quando o aluno se aproxima do fim da página atual
        const totalPaginas = Math.ceil(res.total / PAGE_SIZE);
        if (paginaAtual + 1 < totalPaginas) {
          buscarQuestoesPaginadas({
            banca: filtroBanca,
            cargo: cargoEfetivo,
            materia: filtroMateria,
            assunto: filtroAssunto,
            busca: buscaDebounced,
            pagina: paginaAtual + 1,
            tamanhoPagina: PAGE_SIZE
          }).catch(() => {});
        }
      })
      .catch(err => {
        if (!ativo) return;
        console.error('Erro ao buscar questões no Supabase:', err);
        setPaginaDados({
          chave: chaveConsultaAtual,
          itens: [],
          total: 0,
          erro: err.message || 'Não foi possível conectar ao banco de dados.'
        });
      });

    return () => { ativo = false; };
  }, [chaveConsultaAtual, filtroBanca, filtroCargo, filtroMateria, filtroAssunto, buscaDebounced, paginaAtual]);

  const totalFiltradas = paginaDados.total;
  const safeIndex = totalFiltradas > 0 ? Math.min(Math.max(0, questaoIndex), totalFiltradas - 1) : 0;
  const safeOffsetNaPagina = Array.isArray(paginaDados.itens) && paginaDados.itens.length > 0
    ? Math.min(offsetNaPagina, paginaDados.itens.length - 1)
    : 0;
  const questaoAtual = !carregandoDados && paginaDados.itens[safeOffsetNaPagina] ? paginaDados.itens[safeOffsetNaPagina] : null;

  // Estado das respostas do usuário na aba questões
  const [respostas, setRespostas] = useState({});

  // Estado do Simulado (gerado em tempo real do Supabase)
  const [simuladoAtivo, setSimuladoAtivo] = useState(null);
  const [carregandoSimulado, setCarregandoSimulado] = useState(false);
  const [erroSimulado, setErroSimulado] = useState(null);
  const [simuladoIndex, setSimuladoIndex] = useState(0);
  const [simuladoRespostas, setSimuladoRespostas] = useState({});
  const [tempoRestante, setTempoRestante] = useState(10800);
  const [simuladoFinalizado, setSimuladoFinalizado] = useState(false);
  const [filtroRevisaoSimulado, setFiltroRevisaoSimulado] = useState('todas');
  const [simuladoBanca, setSimuladoBanca] = useState('SELECON');
  const [simuladoBancaDropdownAberto, setSimuladoBancaDropdownAberto] = useState(false);

  // Contexto de Autenticação, Usuário e Limites
  const {
    user,
    isVip,
    questoesRespondidasHoje,
    limiteDiario,
    questoesRestantesHoje,
    podeResponderQuestao,
    registrarResposta,
    abrirModalUpgrade
  } = useAuth();

  const nomeAssuntoAtivo = filtroAssunto !== 'Todos' ? filtroAssunto : null;

  // Aba Padrão da Banca / Raio-X (100% dinâmico a partir do Supabase)
  const [padraoMateria, setPadraoMateria] = useState('Todas');
  const [padraoBanca, setPadraoBanca] = useState('SELECON');
  const [bancaDropdownAberto, setBancaDropdownAberto] = useState(false);
  const [materiaDropdownAberto, setMateriaDropdownAberto] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.padrao-dropdown-container')) {
        setBancaDropdownAberto(false);
        setMateriaDropdownAberto(false);
        setSimuladoBancaDropdownAberto(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const dadosRaioX = useMemo(
    () => obterRaioXDinamico(statsAcervo, padraoBanca, padraoMateria),
    [statsAcervo, padraoBanca, padraoMateria]
  );

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

  const totalQuestoesPadrao = dadosRaioX.total;
  const listaTemasPadrao = dadosRaioX.temas;

  const top10 = listaTemasPadrao.slice(0, 10);
  const outrosTotal = listaTemasPadrao.length > 10
    ? listaTemasPadrao.slice(10).reduce((acc, curr) => acc + curr.count, 0)
    : 0;

  const itensGrafico = [
    ...top10.map((item, idx) => ({
      nome: item.nome,
      materia: item.materia,
      count: item.count,
      percent: item.percent,
      cor: palette[idx % palette.length],
      isOutros: false
    })),
    ...(outrosTotal > 0 ? [{
      nome: 'Demais Conteúdos',
      materia: padraoMateria,
      count: outrosTotal,
      percent: totalQuestoesPadrao > 0 ? ((outrosTotal / totalQuestoesPadrao) * 100).toFixed(1) : '0.0',
      cor: palette[10],
      isOutros: true
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

  const irParaQuestoesPorTema = (temaNome, materiaTema, isOutros = false) => {
    if (isOutros) {
      const matFallback = materiaTema && materiaTema !== 'Todas' ? materiaTema : 'Enfermagem';
      setFiltroMateria(matFallback);
      setFiltroAssunto('Todos');
    } else {
      let mat = materiaTema;
      if (!mat || mat === 'Todas') {
        const isPort = ASSUNTOS_PORTUGUES.some(a => a.nome === temaNome);
        mat = isPort ? 'Língua Portuguesa' : 'Enfermagem';
      }
      setFiltroMateria(mat);
      setFiltroAssunto(temaNome);
    }
    setBuscaTexto('');
    setBuscaDebounced('');
    setFiltroCargo('Todos');
    setFiltroBanca(padraoBanca === 'Todas' ? 'Todas' : padraoBanca);
    setQuestaoIndex(0);
    setActiveTab('questoes');
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  const currentInsight = getInsightPorBanca(padraoBanca, padraoMateria) || {
    nome: padraoBanca === 'Todas' ? 'Todas as Bancas' : padraoBanca,
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
      title: 'Foco Orientado por Incidência',
      text: 'Ajuste seu cronograma priorizando os temas de maior peso estatístico no gráfico acima.'
    },
    sus: {
      tag: 'Critério da Banca',
      title: 'Norma Culta e Protocolos Oficiais',
      text: 'As provas mantêm fidelidade às gramáticas de referência e protocolos vigentes do Ministério da Saúde e COFEN.'
    }
  };

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

  // Atalhos de teclado (← e →)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeTab !== 'questoes') return;
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
  }, [activeTab, safeIndex, totalFiltradas]);

  // Temporizador do simulado
  useEffect(() => {
    if (!simuladoAtivo || simuladoFinalizado) return;
    const timer = setInterval(() => {
      setTempoRestante(prev => {
        if (prev <= 1) {
          setSimuladoFinalizado(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [simuladoAtivo, simuladoFinalizado]);

  const formatarTempo = (segundos) => {
    const horas = Math.floor(segundos / 3600);
    const mins = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    if (horas > 0) {
      return `${horas.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };

  const selecionarOpcaoQuestao = (questaoId, letra) => {
    if (respostas[questaoId]?.confirmada) return;
    setRespostas(prev => ({
      ...prev,
      [questaoId]: { selecionada: letra, confirmada: false, acertou: false }
    }));
  };

  const confirmarResposta = (questaoObj) => {
    if (!questaoObj || !questaoObj.id) return;
    const questaoId = questaoObj.id;
    const selecionada = respostas[questaoId]?.selecionada;
    if (!selecionada) return;

    if (!podeResponderQuestao()) {
      abrirModalUpgrade();
      return;
    }

    const acertou = selecionada === questaoObj.resposta_correta;
    setRespostas(prev => ({
      ...prev,
      [questaoId]: {
        ...prev[questaoId],
        confirmada: true,
        acertou
      }
    }));

    registrarResposta(questaoObj, selecionada, acertou);
  };

  const iniciarSimulado = async (itemCatalogo) => {
    if (itemCatalogo.exclusivoVip && !isVip) {
      abrirModalUpgrade();
      return;
    }

    setCarregandoSimulado(true);
    setErroSimulado(null);
    try {
      const sim = await gerarSimuladoSupabase({
        banca: simuladoBanca,
        numero: itemCatalogo.numero,
        titulo: `${simuladoBanca} • ${itemCatalogo.tituloBase}`,
        subtitulo: itemCatalogo.subtituloBase
      });
      setSimuladoAtivo(sim);
      setSimuladoIndex(0);
      setSimuladoRespostas({});
      setTempoRestante(sim.duracaoMinutos * 60);
      setSimuladoFinalizado(false);
      setFiltroRevisaoSimulado('todas');
      setActiveTab('simulados');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErroSimulado(err.message || 'Erro ao gerar simulado no Supabase.');
    } finally {
      setCarregandoSimulado(false);
    }
  };

  // Helpers de exibição de contagem em tempo real (sem exibir "(...)" enquanto carrega)
  const temStats = Boolean(statsAcervo && statsAcervo.totalGeral > 0);
  const fmtQPar = (n) => (temStats ? ` (${n.toLocaleString('pt-BR')} q.)` : '');
  const fmtQPill = (n) => (temStats ? `${n.toLocaleString('pt-BR')} q.` : 'Atualizando');
  const totalSelecon = contarPorFiltro(statsAcervo, { banca: 'SELECON' });
  const totalFcc = contarPorFiltro(statsAcervo, { banca: 'FCC' });
  const bancasAtivas = new Set(Object.keys(statsAcervo?.porBanca || {}));

  return (
    <div className="app-root">
      {/* Navbar Superior */}
      <nav className="navbar">
        <div className="container nav-container">
          <a
            href="#questoes"
            className="nav-brand"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('questoes');
            }}
          >
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
              className={`nav-link ${activeTab === 'caderno' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('caderno');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <Brain size={17} />
              <span>Caderno de Erros</span>
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
            <UserHeaderMenu totalQuestoes={totalGeralAcervo} />
          </div>
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <main className="container main-wrapper">
        {/* ABA: BANCO DE QUESTÕES */}
        {activeTab === 'questoes' && (
          <section className="animate-fade-in">
            {/* Filtros de Pesquisa */}
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
                  placeholder="Pesquise por prefeitura, assunto ou código (ex: SUS, Imunização, Crase, PCR, EF0010)"
                  className="filter-input"
                  style={{ width: '100%', paddingLeft: '2.5rem' }}
                  value={buscaTexto}
                  onChange={e => setBuscaTexto(e.target.value)}
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
                    <option value="SELECON">SELECON{fmtQPar(totalSelecon)}</option>
                    <option value="FCC">FCC{fmtQPar(totalFcc)}</option>
                    <option value="Todas">Todas as Bancas{fmtQPar(totalGeralAcervo)}</option>
                    <optgroup label="Bancas em Preparação">
                      {BANCAS_PRECONFIGURADAS.filter(b => b !== 'SELECON' && b !== 'FCC').map(b => {
                        const qtd = contarPorFiltro(statsAcervo, { banca: b });
                        return (
                          <option key={b} value={b} disabled={qtd === 0}>
                            {b}{qtd > 0 ? fmtQPar(qtd) : ' (Em breve)'}
                          </option>
                        );
                      })}
                    </optgroup>
                  </select>
                </div>

                {/* 2. Cargo */}
                <div className="filter-group">
                  <label className="filter-label">Cargo</label>
                  <select
                    className="filter-select"
                    value={filtroMateria === 'Língua Portuguesa' ? 'Todos' : filtroCargo}
                    disabled={filtroMateria === 'Língua Portuguesa'}
                    title={filtroMateria === 'Língua Portuguesa' ? 'As questões de Língua Portuguesa são comuns a todos os cargos' : 'Filtrar por cargo de Enfermagem'}
                    onChange={e => { setFiltroCargo(e.target.value); setQuestaoIndex(0); }}
                  >
                    {filtroMateria === 'Língua Portuguesa' ? (
                      <option value="Todos">Comum a todos os cargos (Português)</option>
                    ) : (
                      <>
                        <option value="Todos">Todos os Cargos</option>
                        <option value="Técnico de Enfermagem">Técnico de Enfermagem</option>
                        <option value="Enfermeiro">Enfermeiro</option>
                      </>
                    )}
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
                      setFiltroAssunto('Todos');
                      if (novaMateria === 'Língua Portuguesa') {
                        setFiltroCargo('Todos');
                      }
                      setQuestaoIndex(0);
                    }}
                  >
                    <option value="Enfermagem">
                      Enfermagem{fmtQPar(contarPorFiltro(statsAcervo, { banca: filtroBanca, materia: 'Enfermagem' }))}
                    </option>
                    <option value="Língua Portuguesa">
                      Língua Portuguesa{fmtQPar(contarPorFiltro(statsAcervo, { banca: filtroBanca, materia: 'Língua Portuguesa' }))}
                    </option>
                    <option value="Todas">
                      Todas as Disciplinas{fmtQPar(contarPorFiltro(statsAcervo, { banca: filtroBanca }))}
                    </option>
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

                      if (novoAssunto !== 'Todos') {
                        const isPort = ASSUNTOS_PORTUGUES.some(a => a.nome === novoAssunto);
                        const isEnf = ASSUNTOS_ENFERMAGEM.some(a => a.nome === novoAssunto);
                        if (isPort && filtroMateria !== 'Língua Portuguesa') {
                          setFiltroMateria('Língua Portuguesa');
                          setFiltroCargo('Todos');
                        } else if (isEnf && filtroMateria !== 'Enfermagem') {
                          setFiltroMateria('Enfermagem');
                        }
                      }
                    }}
                  >
                    <option value="Todos">
                      {(() => {
                        const qtd = contarPorFiltro(statsAcervo, { banca: filtroBanca, materia: filtroMateria });
                        if (filtroMateria === 'Língua Portuguesa') return `Todos os Assuntos de Língua Portuguesa${fmtQPar(qtd)}`;
                        if (filtroMateria === 'Enfermagem') return `Todos os Assuntos de Enfermagem${fmtQPar(qtd)}`;
                        return `Todos os Assuntos${fmtQPar(qtd)}`;
                      })()}
                    </option>

                    {(filtroMateria === 'Todas' || filtroMateria === 'Língua Portuguesa') && (
                      filtroMateria === 'Todas' ? (
                        <optgroup label="📖 Língua Portuguesa">
                          {ASSUNTOS_PORTUGUES.map(a => {
                            const qtd = contarPorFiltro(statsAcervo, { banca: filtroBanca, materia: 'Língua Portuguesa', assunto: a.nome });
                            return (
                              <option key={a.nome} value={a.nome}>
                                {a.nome}{fmtQPar(qtd)}
                              </option>
                            );
                          })}
                        </optgroup>
                      ) : (
                        ASSUNTOS_PORTUGUES.map(a => {
                          const qtd = contarPorFiltro(statsAcervo, { banca: filtroBanca, materia: 'Língua Portuguesa', assunto: a.nome });
                          return (
                            <option key={a.nome} value={a.nome}>
                              {a.nome}{fmtQPar(qtd)}
                            </option>
                          );
                        })
                      )
                    )}

                    {(filtroMateria === 'Todas' || filtroMateria === 'Enfermagem') && (
                      filtroMateria === 'Todas' ? (
                        <optgroup label="🩺 Enfermagem">
                          {ASSUNTOS_ENFERMAGEM.map(a => {
                            const qtd = contarPorFiltro(statsAcervo, { banca: filtroBanca, materia: 'Enfermagem', assunto: a.nome });
                            return (
                              <option key={a.nome} value={a.nome}>
                                {a.nome}{fmtQPar(qtd)}
                              </option>
                            );
                          })}
                        </optgroup>
                      ) : (
                        ASSUNTOS_ENFERMAGEM.map(a => {
                          const qtd = contarPorFiltro(statsAcervo, { banca: filtroBanca, materia: 'Enfermagem', assunto: a.nome });
                          return (
                            <option key={a.nome} value={a.nome}>
                              {a.nome}{fmtQPar(qtd)}
                            </option>
                          );
                        })
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
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>Carregando questões da nuvem...</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Consultando banco de dados auditado em alta velocidade</p>
              </div>
            ) : paginaDados.erro ? (
              <div style={{ textAlign: 'center', padding: '3rem 2rem', background: '#fef2f2', borderRadius: '1rem', border: '1px solid #fecaca', margin: '1.5rem 0' }}>
                <XCircle size={42} color="#dc2626" style={{ margin: '0 auto 0.75rem' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.4rem' }}>Falha ao carregar questões</h3>
                <p style={{ color: '#7f1d1d', fontSize: '0.92rem', marginBottom: '1.25rem' }}>{paginaDados.erro}</p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setRetryToken(t => t + 1)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  <RefreshCw size={16} />
                  <span>Tentar Novamente</span>
                </button>
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
                    setBuscaDebounced('');
                    setFiltroBanca('SELECON');
                    setFiltroCargo('Todos');
                    setFiltroMateria('Enfermagem');
                    setFiltroAssunto('Todos');
                    setQuestaoIndex(0);
                  }}
                >
                  Restaurar Filtros Padrão
                </button>
              </div>
            ) : (
              <>
                {/* Banner de Cota Diária para Usuários do Plano Gratuito */}
                {!isVip && (
                  <div className="quota-banner animate-fade-in">
                    <div className="quota-banner-left">
                      <Zap size={16} color="#0d9488" />
                      <span>
                        Cota Diária Gratuita: <strong>{questoesRespondidasHoje} de {limiteDiario}</strong> questões respondidas hoje ({questoesRestantesHoje} restantes)
                      </span>
                    </div>
                    <button type="button" className="quota-banner-btn" onClick={abrirModalUpgrade}>
                      <Sparkles size={12} />
                      <span>Ser VIP Ilimitado</span>
                    </button>
                  </div>
                )}

                {/* MODO INDIVIDUAL FOCADO (1 QUESTÃO POR VEZ) */}
                {questaoAtual && (() => {
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
                              Questão {safeIndex + 1} de {totalFiltradas.toLocaleString('pt-BR')} ({pctProgresso}%)
                            </span>
                            <form onSubmit={handlePuloSubmit} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <input
                                type="number"
                                min="1"
                                max={totalFiltradas}
                                placeholder="Nº"
                                title="Pular para o número da questão"
                                style={{ width: '58px', padding: '0.2rem 0.4rem', fontSize: '0.78rem', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }}
                                value={puloInput}
                                onChange={e => setPuloInput(e.target.value)}
                              />
                              <button type="submit" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', background: '#0d9488', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 700 }}>
                                Ir
                              </button>
                            </form>
                          </div>
                        </div>

                        <TextoEnunciado enunciado={q.enunciado} questaoId={q.id} />

                        <div className="alternativas-list">
                          {(q.alternativas || []).map(alt => {
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
                            !podeResponderQuestao() ? (
                              <div className="quota-limit-box animate-fade-in" style={{ margin: '0 0 1rem' }}>
                                <div style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>⚡</div>
                                <h4>Você atingiu o limite de {limiteDiario} questões gratuitas de hoje!</h4>
                                <p>
                                  Sua cota diária renova automaticamente à meia-noite. Assine o <strong>Plano VIP PRO</strong> para ter acesso ilimitado a todas as {totalGeralAcervo > 0 ? totalGeralAcervo.toLocaleString('pt-BR') : ''} questões com gabarito comentado e simulados oficiais cronometrados.
                                </p>
                                <button
                                  type="button"
                                  className="btn-primary"
                                  onClick={abrirModalUpgrade}
                                  style={{
                                    padding: '0.85rem 1.75rem',
                                    background: '#d97706',
                                    fontSize: '0.98rem',
                                    boxShadow: '0 4px 14px rgba(217, 119, 6, 0.35)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                  }}
                                >
                                  <Sparkles size={18} />
                                  <span>Desbloquear Acesso Ilimitado VIP</span>
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                  className="btn-primary"
                                  onClick={() => confirmarResposta(q)}
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
                            )
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
                                    🎉 Você concluiu a última questão deste filtro!
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
                                {q.fundamentacao_correta}
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

                            {/* Rodapé do comentário */}
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
                                  ? `Pronto para a próxima? Restam ${(totalFiltradas - safeIndex - 1).toLocaleString('pt-BR')} questões neste caderno.`
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
                            Parabéns! Você concluiu todas as {totalFiltradas.toLocaleString('pt-BR')} questões deste caderno!
                          </h3>
                          <p style={{ color: '#15803d', fontSize: '0.98rem', maxWidth: '620px', margin: '0 auto 1.5rem', lineHeight: '1.6' }}>
                            Você finalizou com sucesso o estudo prático de <strong>{nomeAssuntoAtivo || filtroMateria}</strong>. Continue praticando para fixar os conteúdos mais cobrados pela banca.
                          </p>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="btn-primary"
                              onClick={irParaPrimeira}
                              style={{ padding: '0.8rem 1.6rem', fontWeight: 700, background: '#0d9488', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.5rem' }}
                            >
                              <RotateCcw size={18} />
                              <span>Recomeçar este Caderno</span>
                            </button>
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => window.scrollTo({ top: 150, behavior: 'smooth' })}
                              style={{ padding: '0.8rem 1.6rem', fontWeight: 700, background: '#ffffff', border: '1px solid #cbd5e1', color: '#334155', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', borderRadius: '0.5rem' }}
                            >
                              <Filter size={18} />
                              <span>Escolher Outro Assunto</span>
                            </button>
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => { setActiveTab('padrao'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                              style={{ padding: '0.8rem 1.6rem', fontWeight: 700, background: '#ffffff', border: '1px solid #cbd5e1', color: '#334155', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', borderRadius: '0.5rem' }}
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
                          <button className="btn-nav-step" onClick={irParaPrimeira} disabled={safeIndex === 0} title="Primeira questão">
                            <ChevronsLeft size={18} />
                            <span className="hide-mobile">Primeira</span>
                          </button>
                          <button className="btn-nav-step btn-nav-arrow" onClick={irParaAnterior} disabled={safeIndex === 0} title="Questão anterior (ou Tecla ←)">
                            <ChevronLeft size={18} />
                            <span>Anterior</span>
                          </button>
                        </div>

                        <div className="bottom-nav-center">
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                            Questão {safeIndex + 1} de {totalFiltradas.toLocaleString('pt-BR')} ({pctProgresso}%)
                          </div>
                          <div className="progress-tracker">
                            <div className="progress-bar-fill" style={{ width: `${pctProgresso}%` }}></div>
                          </div>
                        </div>

                        <div className="bottom-nav-group right">
                          <button className="btn-nav-step primary btn-nav-arrow" onClick={irParaProxima} disabled={safeIndex >= totalFiltradas - 1} title="Próxima questão (ou Tecla →)">
                            <span>Próxima</span>
                            <ChevronRight size={18} />
                          </button>
                          <button className="btn-nav-step" onClick={irParaUltima} disabled={safeIndex >= totalFiltradas - 1} title="Última questão">
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
              </>
            )}
          </section>
        )}

        {/* ABA: SIMULADOS (100% GERADOS DO SUPABASE) */}
        {activeTab === 'simulados' && (
          <section className="animate-fade-in">
            {!simuladoAtivo ? (
              <div>
                {/* Seletor em Funil: Escolha a Banca */}
                <div style={{ maxWidth: '360px', margin: '0.5rem auto 2.5rem', textAlign: 'center' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.65rem', textAlign: 'center', letterSpacing: '-0.01em' }}>
                    (escolha a banca)
                  </h2>
                  <div className="padrao-dropdown-container" style={{ textAlign: 'left' }}>
                    <button
                      type="button"
                      className={`btn-padrao-funnel ${simuladoBancaDropdownAberto ? 'active' : ''}`}
                      onClick={() => setSimuladoBancaDropdownAberto(!simuladoBancaDropdownAberto)}
                      title="Clique para escolher a banca dos simulados"
                    >
                      <div className="funnel-left">
                        <Filter size={16} className="funnel-icon" />
                        <span className="funnel-text">{simuladoBanca}</span>
                      </div>
                      <div className="funnel-right">
                        <span className="pill-badge">
                          {bancasAtivas.has(simuladoBanca) ? '2 Simulados' : 'Em Breve'}
                        </span>
                        <ChevronDown size={16} className={`funnel-arrow ${simuladoBancaDropdownAberto ? 'open' : ''}`} />
                      </div>
                    </button>

                    {simuladoBancaDropdownAberto && (
                      <div className="padrao-dropdown-menu animate-fade-in">
                        {BANCAS_PRECONFIGURADAS.map(banca => {
                          const disponivel = bancasAtivas.has(banca) || banca === 'SELECON' || banca === 'FCC';
                          return (
                            <button
                              key={banca}
                              type="button"
                              className={`padrao-dropdown-item ${simuladoBanca === banca ? 'selected' : ''}`}
                              onClick={() => {
                                setSimuladoBanca(banca);
                                setSimuladoBancaDropdownAberto(false);
                                setErroSimulado(null);
                              }}
                            >
                              <span className="item-name">{banca}</span>
                              <span className="pill-badge">{disponivel ? '2 Simulados' : 'Em Breve'}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {erroSimulado && (
                  <div style={{ maxWidth: '640px', margin: '0 auto 1.5rem', padding: '1rem 1.25rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', color: '#991b1b', textAlign: 'center', fontWeight: 600 }}>
                    {erroSimulado}
                  </div>
                )}

                {carregandoSimulado ? (
                  <div style={{ textAlign: 'center', padding: '3.5rem 2rem', background: '#ffffff', borderRadius: '1rem', border: '1px solid #e2e8f0', maxWidth: '640px', margin: '0 auto 2rem' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid #ccfbf1', borderTopColor: '#0d9488', borderRadius: '50%', animation: 'enfSpin 0.75s linear infinite', margin: '0 auto 1rem' }}></div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>Montando Simulado {simuladoBanca}...</h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Sorteando 60 questões auditadas (20 Português + 40 Enfermagem) direto do Supabase</p>
                  </div>
                ) : (bancasAtivas.has(simuladoBanca) || simuladoBanca === 'SELECON' || simuladoBanca === 'FCC') ? (
                  <div className="simulados-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.75rem' }}>
                    {SIMULADOS_CATALOGO.map((sim, index) => {
                      const bloqueado = sim.exclusivoVip && !isVip;
                      return (
                        <div
                          key={`${simuladoBanca}-${sim.numero}`}
                          className="simulado-card"
                          style={{
                            border: index === 0 ? '2px solid #0d9488' : '1px solid var(--border)',
                            position: 'relative'
                          }}
                        >
                          <div className="simulado-header">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                background: index === 0 ? '#ccfbf1' : '#fef3c7',
                                color: index === 0 ? '#0f766e' : '#92400e',
                                fontSize: '0.78rem',
                                fontWeight: 800,
                                padding: '0.25rem 0.65rem',
                                borderRadius: '4px',
                                textTransform: 'uppercase'
                              }}>
                                {index === 0 ? `⭐ Simulado #${sim.numero} • Gratuito` : `👑 Simulado #${sim.numero} • VIP PRO`}
                              </span>
                              <span style={{ fontSize: '0.8rem', color: '#0f766e', fontWeight: 700, background: '#f0fdfa', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                Banca: {simuladoBanca}
                              </span>
                            </div>

                            <h3 className="simulado-title" style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.45rem' }}>
                              {simuladoBanca} • {sim.tituloBase}
                            </h3>
                            <p className="simulado-desc" style={{ marginBottom: '1.15rem' }}>
                              {sim.subtituloBase}
                            </p>

                            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.95rem 1.15rem', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e293b', marginBottom: '0.45rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span>📖 Módulo I: Língua Portuguesa</span>
                                <strong style={{ color: '#0d9488' }}>20 Questões</strong>
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.45', marginBottom: '0.75rem' }}>
                                Interpretação, Sintaxe, Verbos, Semântica, Pontuação, Conjunções e Crase
                              </div>

                              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e293b', marginBottom: '0.45rem', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.65rem' }}>
                                <span>🩺 Módulo II: Conhecimentos Específicos</span>
                                <strong style={{ color: '#0d9488' }}>40 Questões</strong>
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.45' }}>
                                SUS, Biossegurança, Farmacologia, Urgência/PCR, Legislação COFEN, PNI e Fundamentos
                              </div>
                            </div>
                          </div>

                          <div className="simulado-info" style={{ marginTop: 'auto', marginBottom: '1.25rem' }}>
                            <span><strong>60</strong> Questões</span>
                            <span><strong>180</strong> Minutos (3h)</span>
                            <span>Corte Mínimo: <strong>60%</strong></span>
                          </div>

                          <button
                            className="btn-primary"
                            style={{
                              width: '100%',
                              justifyContent: 'center',
                              padding: '0.85rem',
                              fontSize: '1rem',
                              fontWeight: 800,
                              background: bloqueado ? '#d97706' : '#0d9488',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                            onClick={() => iniciarSimulado(sim)}
                          >
                            {bloqueado ? (
                              <>
                                <Lock size={17} />
                                <span>Desbloquear Simulado #{sim.numero} (VIP)</span>
                              </>
                            ) : (
                              <span>Iniciar Simulado #{sim.numero} (60 Questões)</span>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="padrao-empty-state animate-fade-in" style={{ maxWidth: '640px', margin: '0 auto 2.5rem' }}>
                    <div className="padrao-empty-icon" style={{ margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BookOpen size={28} color="#0d9488" />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                      Simulados da banca {simuladoBanca} em preparação!
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                      O acervo da banca <strong>{simuladoBanca}</strong> está sendo catalogado. Assim que novas questões forem inseridas no Supabase, os simulados aparecerão automaticamente aqui!
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button type="button" className="btn-primary" onClick={() => setSimuladoBanca('SELECON')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', fontWeight: 700 }}>
                        <span>Simulados SELECON</span>
                        <ChevronRight size={16} />
                      </button>
                      <button type="button" className="btn-secondary" onClick={() => setSimuladoBanca('FCC')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', fontWeight: 700 }}>
                        <span>Simulados FCC</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* MODO EXECUÇÃO DO SIMULADO */
              (() => {
                const totalSim = simuladoAtivo.questoes.length;
                const qtdPort = simuladoAtivo.distribuicao?.portugues ?? simuladoAtivo.questoes.filter(q => q.materia === 'Língua Portuguesa').length;
                const qtdEnf = totalSim - qtdPort;

                return (
                  <div className="simulado-runner">
                    {/* Barra Superior do Simulado */}
                    <div className="simulado-header-bar" style={{ flexWrap: 'wrap', gap: '0.85rem' }}>
                      <div style={{ flex: 1, minWidth: '240px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            background: simuladoIndex < qtdPort ? '#dbeafe' : '#ccfbf1',
                            color: simuladoIndex < qtdPort ? '#1e40af' : '#0f766e'
                          }}>
                            {simuladoIndex < qtdPort ? '📖 Módulo I: Português' : '🩺 Módulo II: Enfermagem'}
                          </span>
                          <span style={{ fontSize: '0.84rem', color: '#64748b', fontWeight: 600 }}>
                            Questão {simuladoIndex + 1} de {totalSim}
                          </span>
                        </div>
                        <h3 style={{ fontSize: '1.15rem', color: '#0f172a', margin: 0, fontWeight: 800 }}>
                          {simuladoAtivo.titulo}
                        </h3>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.84rem', color: '#475569', fontWeight: 700, background: '#f1f5f9', padding: '0.35rem 0.75rem', borderRadius: '6px' }}>
                          {Object.keys(simuladoRespostas).length}/{totalSim} Respondidas
                        </span>

                        <div className="timer-box" title="Tempo restante de prova">
                          <Timer size={19} />
                          <span>{formatarTempo(tempoRestante)}</span>
                        </div>

                        {!simuladoFinalizado && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              type="button"
                              className="btn-primary"
                              style={{ background: '#10b981', padding: '0.5rem 0.95rem', fontSize: '0.85rem', fontWeight: 700 }}
                              onClick={() => {
                                const faltam = totalSim - Object.keys(simuladoRespostas).length;
                                const msg = faltam > 0
                                  ? `Você ainda tem ${faltam} questão(ões) sem resposta. Deseja realmente finalizar o simulado e ver seu resultado?`
                                  : 'Deseja finalizar o simulado e conferir sua pontuação e gabarito comentado?';
                                if (window.confirm(msg)) {
                                  setSimuladoFinalizado(true);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }
                              }}
                            >
                              Finalizar Simulado
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Tem certeza que deseja sair deste simulado? Seu progresso nesta tentativa será cancelado.')) {
                                  setSimuladoAtivo(null);
                                }
                              }}
                              style={{ padding: '0.5rem 0.85rem', fontSize: '0.82rem', fontWeight: 700, background: '#f8fafc', color: '#64748b', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                            >
                              Sair
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {!simuladoFinalizado ? (
                      <div>
                        {/* Paleta de Navegação */}
                        <div className="simulado-palette-box">
                          <div style={{ marginBottom: '0.85rem' }}>
                            <div className="palette-section-title">
                              <span>📖 Módulo I: Língua Portuguesa (Questões 01 a {qtdPort})</span>
                              <span style={{ fontSize: '0.75rem', color: '#0d9488' }}>
                                {simuladoAtivo.questoes.slice(0, qtdPort).filter(q => simuladoRespostas[q.id] !== undefined).length}/{qtdPort} respondidas
                              </span>
                            </div>
                            <div className="palette-grid">
                              {simuladoAtivo.questoes.slice(0, qtdPort).map((q, idx) => (
                                <button
                                  key={q.id}
                                  type="button"
                                  className={`palette-btn ${simuladoIndex === idx ? 'current' : ''} ${simuladoRespostas[q.id] !== undefined ? 'answered' : ''}`}
                                  onClick={() => setSimuladoIndex(idx)}
                                  title={`Questão ${idx + 1}: ${q.assunto}`}
                                >
                                  {idx + 1}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="palette-section-title">
                              <span>🩺 Módulo II: Conhecimentos Específicos em Enfermagem (Questões {qtdPort + 1} a {totalSim})</span>
                              <span style={{ fontSize: '0.75rem', color: '#0d9488' }}>
                                {simuladoAtivo.questoes.slice(qtdPort).filter(q => simuladoRespostas[q.id] !== undefined).length}/{qtdEnf} respondidas
                              </span>
                            </div>
                            <div className="palette-grid">
                              {simuladoAtivo.questoes.slice(qtdPort).map((q, idx) => {
                                const realIdx = idx + qtdPort;
                                return (
                                  <button
                                    key={q.id}
                                    type="button"
                                    className={`palette-btn ${simuladoIndex === realIdx ? 'current' : ''} ${simuladoRespostas[q.id] !== undefined ? 'answered' : ''}`}
                                    onClick={() => setSimuladoIndex(realIdx)}
                                    title={`Questão ${realIdx + 1}: ${q.assunto}`}
                                  >
                                    {realIdx + 1}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Cartão da Questão Ativa */}
                        {(() => {
                          const q = simuladoAtivo.questoes[simuladoIndex];
                          if (!q) return null;
                          const selected = simuladoRespostas[q.id];

                          return (
                            <div className="question-card" style={{ borderTop: '3px solid #0d9488' }}>
                              <div className="question-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                  <span className="badge" style={{ background: '#0f172a', color: '#38bdf8', fontWeight: 800 }}>
                                    Questão {simuladoIndex + 1} de {totalSim}
                                  </span>
                                  <span className="badge badge-banca">{q.banca}</span>
                                  <span className="badge badge-orgao">{q.orgao} • {q.ano}</span>
                                  <span className="badge badge-cargo">{q.cargo}</span>
                                  <span className="badge badge-materia" style={{ background: '#ecfdf5', color: '#065f46', fontWeight: 700 }}>
                                    {q.assunto}
                                  </span>
                                </div>

                                <div style={{ fontSize: '0.82rem', color: selected ? '#059669' : '#d97706', fontWeight: 700 }}>
                                  {selected ? `✓ Marcada: Letra ${selected}` : '⚠️ Ainda não respondida'}
                                </div>
                              </div>

                              <TextoEnunciado enunciado={q.enunciado} questaoId={q.id} />

                              <div className="alternativas-list">
                                {(q.alternativas || []).map(alt => (
                                  <button
                                    key={alt.id}
                                    type="button"
                                    className={`alt-option ${selected === alt.id ? 'selected' : ''}`}
                                    onClick={() => setSimuladoRespostas({ ...simuladoRespostas, [q.id]: alt.id })}
                                  >
                                    <span className="alt-letter">{alt.id}</span>
                                    <span style={{ flex: 1, textAlign: 'left' }}>{alt.texto}</span>
                                  </button>
                                ))}
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.75rem', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  className="btn-primary"
                                  style={{ background: '#64748b' }}
                                  disabled={simuladoIndex === 0}
                                  onClick={() => {
                                    setSimuladoIndex(simuladoIndex - 1);
                                    window.scrollTo({ top: 180, behavior: 'smooth' });
                                  }}
                                >
                                  <ChevronLeft size={18} />
                                  <span>Anterior</span>
                                </button>

                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                  {simuladoIndex < totalSim - 1 ? (
                                    <button
                                      type="button"
                                      className="btn-primary"
                                      onClick={() => {
                                        setSimuladoIndex(simuladoIndex + 1);
                                        window.scrollTo({ top: 180, behavior: 'smooth' });
                                      }}
                                    >
                                      <span>Próxima Questão</span>
                                      <ChevronRight size={18} />
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      className="btn-primary"
                                      style={{ background: '#10b981' }}
                                      onClick={() => {
                                        setSimuladoFinalizado(true);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                      }}
                                    >
                                      <Award size={18} />
                                      <span>Finalizar Prova e Ver Resultado</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      /* RESULTADO DETALHADO DO SIMULADO */
                      <div className="animate-fade-in">
                        {(() => {
                          const questoesPort = simuladoAtivo.questoes.slice(0, qtdPort);
                          const questoesEnf = simuladoAtivo.questoes.slice(qtdPort);

                          const acertosPort = questoesPort.filter(q => simuladoRespostas[q.id] === q.resposta_correta).length;
                          const percPort = qtdPort > 0 ? Math.round((acertosPort / qtdPort) * 100) : 0;

                          const acertosEnf = questoesEnf.filter(q => simuladoRespostas[q.id] === q.resposta_correta).length;
                          const percEnf = qtdEnf > 0 ? Math.round((acertosEnf / qtdEnf) * 100) : 0;

                          const totalAcertos = acertosPort + acertosEnf;
                          const percTotal = totalSim > 0 ? Math.round((totalAcertos / totalSim) * 100) : 0;
                          const isAprovado = percTotal >= 60 && percPort >= 50 && percEnf >= 50;

                          const questoesParaRevisao = simuladoAtivo.questoes.filter(q => {
                            const acertou = simuladoRespostas[q.id] === q.resposta_correta;
                            if (filtroRevisaoSimulado === 'erros') return !acertou;
                            if (filtroRevisaoSimulado === 'acertos') return acertou;
                            return true;
                          });

                          return (
                            <div>
                              <div className="question-card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', marginBottom: '2rem' }}>
                                <Award size={60} color={isAprovado ? '#0d9488' : '#eab308'} style={{ margin: '0 auto 1rem' }} />
                                <h2 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                                  Simulado Concluído com Sucesso!
                                </h2>
                                <p style={{ color: '#64748b', fontSize: '0.98rem', maxWidth: '600px', margin: '0 auto 1.5rem' }}>
                                  Resultado oficial apurado com base no gabarito das {totalSim} questões da banca <strong>{simuladoAtivo.banca}</strong>.
                                </p>

                                <div className="simulado-score-grid">
                                  <div className="simulado-score-card main">
                                    <div className="simulado-score-num">{percTotal}%</div>
                                    <div className="simulado-score-label">Pontuação Geral ({totalAcertos}/{totalSim})</div>
                                  </div>
                                  <div className="simulado-score-card">
                                    <div className="simulado-score-num" style={{ color: percPort >= 50 ? '#0d9488' : '#dc2626' }}>
                                      {percPort}%
                                    </div>
                                    <div className="simulado-score-label">Português ({acertosPort}/{qtdPort})</div>
                                  </div>
                                  <div className="simulado-score-card">
                                    <div className="simulado-score-num" style={{ color: percEnf >= 50 ? '#0d9488' : '#dc2626' }}>
                                      {percEnf}%
                                    </div>
                                    <div className="simulado-score-label">Enfermagem ({acertosEnf}/{qtdEnf})</div>
                                  </div>
                                </div>

                                <div style={{
                                  padding: '1.25rem',
                                  borderRadius: '8px',
                                  background: isAprovado ? '#ecfdf5' : '#fffbeb',
                                  border: isAprovado ? '1px solid #a7f3d0' : '1px solid #fde68a',
                                  color: isAprovado ? '#065f46' : '#92400e',
                                  textAlign: 'left',
                                  fontSize: '0.95rem',
                                  lineHeight: '1.6',
                                  marginBottom: '1.75rem'
                                }}>
                                  <div style={{ fontWeight: 800, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                    {isAprovado ? <CheckCircle2 size={19} color="#059669" /> : <XCircle size={19} color="#d97706" />}
                                    <span>{isAprovado ? '🎉 APROVADO(A) NA NOTA DE CORTE!' : '⚠️ ATENÇÃO: ABAIXO DA NOTA DE CORTE DE CONVOCAÇÃO'}</span>
                                  </div>
                                  {isAprovado ? (
                                    <p style={{ margin: 0 }}>
                                      Parabéns! Sua nota atingiu os critérios de aprovação de concursos organizados pela banca <strong>{simuladoAtivo.banca}</strong> (mínimo de 50% em cada disciplina e 60% geral).
                                    </p>
                                  ) : (
                                    <p style={{ margin: 0 }}>
                                      Nos editais organizados pela banca <strong>{simuladoAtivo.banca}</strong>, a nota de corte exige no mínimo <strong>50% em Português ({Math.ceil(qtdPort / 2)}/{qtdPort})</strong>, <strong>50% em Enfermagem ({Math.ceil(qtdEnf / 2)}/{qtdEnf})</strong> e <strong>60% geral ({Math.ceil(totalSim * 0.6)}/{totalSim})</strong>. Revise os comentários das questões que você errou logo abaixo!
                                    </p>
                                  )}
                                </div>

                                <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                  <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={() => {
                                      setSimuladoRespostas({});
                                      setSimuladoIndex(0);
                                      setTempoRestante(simuladoAtivo.duracaoMinutos * 60);
                                      setSimuladoFinalizado(false);
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                  >
                                    <RotateCcw size={17} />
                                    <span>Refazer Este Simulado</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-primary"
                                    style={{ background: '#475569' }}
                                    onClick={() => {
                                      setSimuladoAtivo(null);
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                  >
                                    <span>Escolher Outro Simulado</span>
                                  </button>
                                </div>
                              </div>

                              {/* Revisão Completa */}
                              <div style={{ marginTop: '2.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem', marginBottom: '1.25rem' }}>
                                  <div>
                                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                                      Revisão e Gabarito Oficial Comentado
                                    </h3>
                                    <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
                                      Analise alternativa por alternativa com fundamentação técnica e legal.
                                    </p>
                                  </div>

                                  <div style={{ display: 'flex', gap: '0.4rem', background: '#e2e8f0', padding: '0.25rem', borderRadius: '8px' }}>
                                    <button type="button" className={`btn-padrao-pill ${filtroRevisaoSimulado === 'todas' ? 'active' : ''}`} onClick={() => setFiltroRevisaoSimulado('todas')}>
                                      Todas ({totalSim})
                                    </button>
                                    <button type="button" className={`btn-padrao-pill ${filtroRevisaoSimulado === 'erros' ? 'active' : ''}`} onClick={() => setFiltroRevisaoSimulado('erros')}>
                                      Erros ({totalSim - totalAcertos})
                                    </button>
                                    <button type="button" className={`btn-padrao-pill ${filtroRevisaoSimulado === 'acertos' ? 'active' : ''}`} onClick={() => setFiltroRevisaoSimulado('acertos')}>
                                      Acertos ({totalAcertos})
                                    </button>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                  {questoesParaRevisao.map(q => {
                                    const respAluno = simuladoRespostas[q.id];
                                    const acertou = respAluno === q.resposta_correta;

                                    return (
                                      <div key={q.id} className="simulado-review-card" style={{ borderLeft: acertou ? '4px solid #10b981' : '4px solid #ef4444' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                          <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <span className="badge" style={{ background: '#0f172a', color: '#fff', fontWeight: 800 }}>
                                              Questão {q.numero_simulado}
                                            </span>
                                            <span className="badge badge-banca">{q.banca}</span>
                                            <span className="badge badge-orgao">{q.orgao} • {q.ano}</span>
                                            <span className="badge badge-materia">{q.assunto}</span>
                                          </div>

                                          <div>
                                            {acertou ? (
                                              <span style={{ color: '#059669', fontWeight: 800, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                                <CheckCircle2 size={16} /> Você acertou (Letra {respAluno})
                                              </span>
                                            ) : (
                                              <span style={{ color: '#dc2626', fontWeight: 800, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                                <XCircle size={16} /> {respAluno ? `Você marcou (${respAluno}), Gabarito (${q.resposta_correta})` : `Não respondida, Gabarito (${q.resposta_correta})`}
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        <TextoEnunciado enunciado={q.enunciado} questaoId={`rev-${q.id}`} />

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1.15rem' }}>
                                          {(q.alternativas || []).map(alt => {
                                            const isCorreta = alt.id === q.resposta_correta;
                                            const isMarcadaAluno = respAluno === alt.id;
                                            let bg = '#f8fafc';
                                            let border = '#e2e8f0';
                                            let textCol = '#334155';

                                            if (isCorreta) {
                                              bg = '#ecfdf5';
                                              border = '#10b981';
                                              textCol = '#065f46';
                                            } else if (isMarcadaAluno && !acertou) {
                                              bg = '#fef2f2';
                                              border = '#ef4444';
                                              textCol = '#991b1b';
                                            }

                                            return (
                                              <div key={alt.id} style={{ padding: '0.65rem 0.95rem', borderRadius: '6px', border: `1.5px solid ${border}`, background: bg, color: textCol, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: isCorreta ? '#10b981' : isMarcadaAluno ? '#ef4444' : '#cbd5e1', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 800, flexShrink: 0 }}>
                                                  {alt.id}
                                                </span>
                                                <span style={{ flex: 1, fontWeight: (isCorreta || isMarcadaAluno) ? 700 : 500 }}>
                                                  {alt.texto}
                                                </span>
                                                {isCorreta && (
                                                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#059669', background: '#d1fae5', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                                                    Gabarito Oficial
                                                  </span>
                                                )}
                                                {isMarcadaAluno && !isCorreta && (
                                                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#b91c1c', background: '#fee2e2', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                                                    Sua Escolha
                                                  </span>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>

                                        <div style={{ background: '#f8fafc', borderLeft: '3px solid #0d9488', padding: '0.9rem 1.15rem', borderRadius: '4px', fontSize: '0.88rem', lineHeight: '1.6' }}>
                                          <div style={{ fontWeight: 800, color: '#0f766e', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <CheckCircle2 size={16} /> Fundamentação Oficial (Gabarito {q.resposta_correta}):
                                          </div>
                                          <div style={{ color: '#334155' }}>
                                            {q.fundamentacao_correta || 'Gabarito Oficial conferido pela banca examinadora.'}
                                          </div>

                                          {q.analise_distratores && q.analise_distratores.length > 0 && (
                                            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #cbd5e1' }}>
                                              <div style={{ fontWeight: 700, color: '#64748b', fontSize: '0.82rem', marginBottom: '0.35rem' }}>
                                                Por que as outras alternativas estão incorretas:
                                              </div>
                                              {q.analise_distratores.map(d => (
                                                <div key={d.letra} style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '0.2rem' }}>
                                                  <strong>Letra {d.letra}:</strong> {d.motivo}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })()
            )}
          </section>
        )}

        {/* ABA: PADRÃO DA BANCA (RAIO-X 100% DINÂMICO DO SUPABASE) */}
        {activeTab === 'padrao' && (
          <section className="animate-fade-in">
            <div className="padrao-filters-card">
              {/* 1. Escolha a Banca */}
              <div className="padrao-filter-col">
                <span className="padrao-filter-label">(escolha a banca)</span>
                <div className="padrao-dropdown-container">
                  <button
                    type="button"
                    className={`btn-padrao-funnel ${bancaDropdownAberto ? 'active' : ''}`}
                    onClick={() => {
                      setBancaDropdownAberto(!bancaDropdownAberto);
                      setMateriaDropdownAberto(false);
                    }}
                    title="Clique para escolher a banca examinadora"
                  >
                    <div className="funnel-left">
                      <Filter size={16} className="funnel-icon" />
                      <span className="funnel-text">{padraoBanca === 'Todas' ? 'Todas as Bancas' : padraoBanca}</span>
                    </div>
                    <div className="funnel-right">
                      <span className="pill-badge">
                        {padraoBanca === 'Todas'
                          ? fmtQPill(totalGeralAcervo)
                          : contarPorFiltro(statsAcervo, { banca: padraoBanca }) > 0
                            ? fmtQPill(contarPorFiltro(statsAcervo, { banca: padraoBanca }))
                            : temStats ? 'Em Breve' : 'Atualizando'}
                      </span>
                      <ChevronDown size={16} className={`funnel-arrow ${bancaDropdownAberto ? 'open' : ''}`} />
                    </div>
                  </button>

                  {bancaDropdownAberto && (
                    <div className="padrao-dropdown-menu animate-fade-in">
                      <button
                        type="button"
                        className={`padrao-dropdown-item ${padraoBanca === 'SELECON' ? 'selected' : ''}`}
                        onClick={() => { setPadraoBanca('SELECON'); setBancaDropdownAberto(false); }}
                      >
                        <span className="item-name">SELECON</span>
                        <span className="pill-badge">{fmtQPill(totalSelecon)}</span>
                      </button>
                      <button
                        type="button"
                        className={`padrao-dropdown-item ${padraoBanca === 'FCC' ? 'selected' : ''}`}
                        onClick={() => { setPadraoBanca('FCC'); setBancaDropdownAberto(false); }}
                      >
                        <span className="item-name">FCC</span>
                        <span className="pill-badge">{fmtQPill(totalFcc)}</span>
                      </button>
                      <button
                        type="button"
                        className={`padrao-dropdown-item ${padraoBanca === 'Todas' ? 'selected' : ''}`}
                        onClick={() => { setPadraoBanca('Todas'); setBancaDropdownAberto(false); }}
                      >
                        <span className="item-name">Todas as Bancas</span>
                        <span className="pill-badge">{fmtQPill(totalGeralAcervo)}</span>
                      </button>
                      {BANCAS_PRECONFIGURADAS.filter(b => b !== 'SELECON' && b !== 'FCC').map(banca => {
                        const qtd = contarPorFiltro(statsAcervo, { banca });
                        return (
                          <button
                            key={banca}
                            type="button"
                            className={`padrao-dropdown-item ${padraoBanca === banca ? 'selected' : ''}`}
                            onClick={() => { setPadraoBanca(banca); setBancaDropdownAberto(false); }}
                          >
                            <span className="item-name">{banca}</span>
                            <span className="pill-badge">{qtd > 0 ? fmtQPill(qtd) : 'Em Breve'}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Disciplina / Matéria */}
              <div className="padrao-filter-col">
                <span className="padrao-filter-label">(escolha a matéria)</span>
                <div className="padrao-dropdown-container">
                  <button
                    type="button"
                    className={`btn-padrao-funnel ${materiaDropdownAberto ? 'active' : ''}`}
                    onClick={() => {
                      setMateriaDropdownAberto(!materiaDropdownAberto);
                      setBancaDropdownAberto(false);
                    }}
                    title="Clique para escolher a matéria"
                  >
                    <div className="funnel-left">
                      <Filter size={16} className="funnel-icon" />
                      <span className="funnel-text">{padraoMateria === 'Todas' ? 'Todas as Matérias' : padraoMateria}</span>
                    </div>
                    <div className="funnel-right">
                      <span className="pill-badge">
                        {fmtQPill(contarPorFiltro(statsAcervo, { banca: padraoBanca, materia: padraoMateria }))}
                      </span>
                      <ChevronDown size={16} className={`funnel-arrow ${materiaDropdownAberto ? 'open' : ''}`} />
                    </div>
                  </button>

                  {materiaDropdownAberto && (
                    <div className="padrao-dropdown-menu animate-fade-in">
                      <button
                        type="button"
                        className={`padrao-dropdown-item ${padraoMateria === 'Todas' ? 'selected' : ''}`}
                        onClick={() => { setPadraoMateria('Todas'); setMateriaDropdownAberto(false); }}
                      >
                        <span className="item-name">Todas as Matérias</span>
                        <span className="pill-badge">{fmtQPill(contarPorFiltro(statsAcervo, { banca: padraoBanca }))}</span>
                      </button>
                      <button
                        type="button"
                        className={`padrao-dropdown-item ${padraoMateria === 'Língua Portuguesa' ? 'selected' : ''}`}
                        onClick={() => { setPadraoMateria('Língua Portuguesa'); setMateriaDropdownAberto(false); }}
                      >
                        <span className="item-name">Língua Portuguesa</span>
                        <span className="pill-badge">{fmtQPill(contarPorFiltro(statsAcervo, { banca: padraoBanca, materia: 'Língua Portuguesa' }))}</span>
                      </button>
                      <button
                        type="button"
                        className={`padrao-dropdown-item ${padraoMateria === 'Enfermagem' ? 'selected' : ''}`}
                        onClick={() => { setPadraoMateria('Enfermagem'); setMateriaDropdownAberto(false); }}
                      >
                        <span className="item-name">Enfermagem</span>
                        <span className="pill-badge">{fmtQPill(contarPorFiltro(statsAcervo, { banca: padraoBanca, materia: 'Enfermagem' }))}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {!temStats ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 2rem', background: '#ffffff', borderRadius: '1rem', border: '1px solid #e2e8f0', margin: '1.5rem 0' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid #ccfbf1', borderTopColor: '#0d9488', borderRadius: '50%', animation: 'enfSpin 0.75s linear infinite', margin: '0 auto 1rem' }}></div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                  {statsErro ? 'Erro ao Carregar Estatísticas' : 'Carregando Raio-X da Banca'}
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 auto 1.25rem', maxWidth: '480px' }}>
                  {statsErro
                    ? 'Não foi possível carregar as contagens atualizadas no momento. Você pode tentar novamente clicando no botão abaixo.'
                    : 'Calculando estatísticas em tempo real do banco auditado.'}
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setRetryToken(t => t + 1)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}
                >
                  <RotateCcw size={16} />
                  <span>Tentar Novamente</span>
                </button>
              </div>
            ) : totalQuestoesPadrao === 0 ? (
              <div className="padrao-empty-state animate-fade-in">
                <div className="padrao-empty-icon">
                  <Building2 size={28} />
                </div>
                <h3 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.5rem' }}>
                  A banca <strong>{padraoBanca}</strong> está pré-configurada e pronta para receber questões!
                </h3>
                <p style={{ color: '#64748b', maxWidth: '580px', margin: '0 auto 1.5rem', fontSize: '0.92rem', lineHeight: '1.6' }}>
                  Atualmente o acervo conta com <strong>{totalGeralAcervo.toLocaleString('pt-BR')} questões auditadas</strong> ({totalSelecon.toLocaleString('pt-BR')} da SELECON e {totalFcc.toLocaleString('pt-BR')} da FCC). Assim que novas questões forem inseridas no Supabase, o Raio-X é gerado automaticamente!
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="btn-primary" onClick={() => { setPadraoBanca('SELECON'); setPadraoMateria('Todas'); }}>
                    Ver Raio-X da SELECON{fmtQPar(totalSelecon)}
                  </button>
                  <button className="btn-padrao-pill" onClick={() => { setPadraoBanca('FCC'); setPadraoMateria('Todas'); }}>
                    Ver Raio-X da FCC{fmtQPar(totalFcc)}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="padrao-grid">
                  {/* Card 1: Gráfico de Pizza / Donut */}
                  <div className="padrao-card">
                    <h3 className="padrao-card-title">
                      <PieChart size={20} color="#0d9488" />
                      Distribuição Percentual: {padraoBanca === 'Todas' ? 'Todas as Bancas (Acervo Completo)' : padraoBanca}
                    </h3>
                    <p className="padrao-card-desc">
                      Proporção real de cada assunto no universo de {totalQuestoesPadrao.toLocaleString('pt-BR')} questões auditadas.
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

                  {/* Card 2: Ranking */}
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
                              <span className="ranking-name" title={item.nome}>
                                <span
                                  className="ranking-pos"
                                  style={isTop1 ? { background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' } : {}}
                                >
                                  {index + 1}º
                                </span>
                                <span className="ranking-name-text">{item.nome}</span>
                              </span>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                <span className="ranking-metrics">
                                  {item.count.toLocaleString('pt-BR')} q. ({item.percent}%)
                                </span>
                                <button
                                  className="btn-topic-action"
                                  onClick={() => irParaQuestoesPorTema(item.nome, item.materia, item.isOutros)}
                                  title={item.isOutros ? 'Abrir todas as questões desta disciplina' : `Filtrar questões sobre ${item.nome}`}
                                >
                                  {item.isOutros ? 'Ver Todos' : 'Resolver'}
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

                {/* Insights Estratégicos */}
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
                    {currentInsight?.foco1 && (
                      <div className="insight-card">
                        <div className="insight-tag"><Target size={14} /> {currentInsight.foco1.tag || 'Foco da Banca'}</div>
                        <h4 className="insight-title">{currentInsight.foco1.title || ''}</h4>
                        <p className="insight-text">{currentInsight.foco1.text || ''}</p>
                      </div>
                    )}
                    {currentInsight?.ponto && (
                      <div className="insight-card">
                        <div className="insight-tag"><Sparkles size={14} /> {currentInsight.ponto.tag || 'Ponto Garantido'}</div>
                        <h4 className="insight-title">{currentInsight.ponto.title || ''}</h4>
                        <p className="insight-text">{currentInsight.ponto.text || ''}</p>
                      </div>
                    )}
                    {currentInsight?.perfil && (
                      <div className="insight-card">
                        <div className="insight-tag"><Zap size={14} /> {currentInsight.perfil.tag || 'Estratégia'}</div>
                        <h4 className="insight-title">{currentInsight.perfil.title || ''}</h4>
                        <p className="insight-text">{currentInsight.perfil.text || ''}</p>
                      </div>
                    )}
                    {currentInsight?.sus && (
                      <div className="insight-card">
                        <div className="insight-tag"><Award size={14} /> {currentInsight.sus.tag || 'Critério da Banca'}</div>
                        <h4 className="insight-title">{currentInsight.sus.title || ''}</h4>
                        <p className="insight-text">{currentInsight.sus.text || ''}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {/* ABA: CADERNO DE ERROS COM MENTOR IA */}
        {activeTab === 'caderno' && (
          <CadernoErros
            key={user?.id || 'visitante_anonimo'}
            user={user}
            totalGeralAcervo={totalGeralAcervo}
            aoTrocarParaQuestoes={() => {
              setActiveTab('questoes');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* BANNER DE VENDAS / PLANO VIP (Ocultado automaticamente para quem já é VIP e com preço unificado) */}
        {!isVip && (
          <section className="vip-banner">
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#34d399', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                <Crown size={18} color="#f59e0b" /> Plano VIP PRO EnfConcursos
              </div>
              <h2 className="vip-title">Acesso Ilimitado até a Sua Aprovação</h2>
              <p style={{ color: '#cbd5e1', maxWidth: '520px', fontSize: '0.95rem' }}>
                Resolva questões sem limite diário com gabarito comentado alternativa por alternativa, simulados oficiais cronometrados (SELECON e FCC) e estatísticas em tempo real.
              </p>
            </div>

            <div style={{ textAlign: 'center', minWidth: '220px' }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>A partir de</div>
              <div className="vip-price">R$ 29,90<span style={{ fontSize: '0.95rem', fontWeight: 600 }}>/mês</span></div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '1rem' }}>Garantia de 7 dias • Cancele quando quiser</div>
              <button className="btn-vip-cta" onClick={abrirModalUpgrade}>
                Garantir Acesso VIP Agora
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Modais Globais */}
      <AuthModal />
      <UpgradeModal totalQuestoes={totalGeralAcervo} />

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-content">
          <div>
            <strong style={{ color: '#0f172a' }}>EnfConcursos</strong> — Plataforma especializada em Concursos de Enfermagem para Prefeituras e SUS.
            <div style={{ marginTop: '0.35rem', fontSize: '0.8rem' }}>
              Questões das bancas: SELECON • FCC • IBAM • VUNESP • Consulpam • AOCP • FGV • Legalle • Avança SP
            </div>
          </div>
          <div>
            © {CURRENT_YEAR} EnfConcursos. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
