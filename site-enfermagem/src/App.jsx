import React, { useState, useEffect } from 'react';
import './App.css';
import questoesData from './data/questoes.json';
import {
  Stethoscope,
  BookOpen,
  Timer,
  Award,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  Filter,
  Flame,
  ChevronRight,
  TrendingUp,
  FolderOpen,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  PieChart,
  BarChart3,
  Lightbulb,
  Target
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('questoes'); // 'questoes', 'padrao', 'simulados', 'materiais'
  const [questoes, setQuestoes] = useState(questoesData);

  // Filtros
  const [buscaTexto, setBuscaTexto] = useState('');
  const [filtroCargo, setFiltroCargo] = useState('Todos');
  const [filtroBanca, setFiltroBanca] = useState('Todas');
  const [filtroMateria, setFiltroMateria] = useState('Todas');
  const [filtroTipo, setFiltroTipo] = useState('Todos');

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

  // Aba Padrão da Banca / Raio-X
  const [padraoCargo, setPadraoCargo] = useState('Todos'); // 'Todos', 'Técnico de Enfermagem', 'Enfermeiro'

  // Estatísticas gerais
  const totalRespondidas = Object.keys(respostas).length;
  const totalAcertos = Object.entries(respostas).filter(([id, r]) => {
    const q = questoes.find(item => item.id === id);
    return q && r.selecionada === q.resposta_correta;
  }).length;
  const taxaAcerto = totalRespondidas > 0 ? Math.round((totalAcertos / totalRespondidas) * 100) : 0;

  // Bancas e matérias únicas para os selects
  const bancasDisponiveis = ['Todas', ...new Set(questoes.map(q => q.banca))];
  const materiasDisponiveis = ['Todas', ...new Set(questoes.map(q => q.materia))];

  // Processamento estatístico para a aba "Padrão da Banca"
  const questoesPadrao = padraoCargo === 'Todos'
    ? questoes
    : questoes.filter(q => q.cargo === padraoCargo);

  const contagemTemas = {};
  questoesPadrao.forEach(q => {
    const primary = (q.assunto || q.materia || 'Outros').split(',')[0].trim();
    contagemTemas[primary] = (contagemTemas[primary] || 0) + 1;
  });

  const temasOrdenados = Object.entries(contagemTemas)
    .sort((a, b) => b[1] - a[1]);

  const top10 = temasOrdenados.slice(0, 10);
  const outrosTotal = temasOrdenados.slice(10).reduce((acc, curr) => acc + curr[1], 0);

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

  const itensGrafico = [
    ...top10.map(([nome, count], idx) => ({
      nome,
      count,
      percent: ((count / questoesPadrao.length) * 100).toFixed(1),
      cor: palette[idx % palette.length]
    })),
    ...(outrosTotal > 0 ? [{
      nome: 'Demais Conteúdos',
      count: outrosTotal,
      percent: ((outrosTotal / questoesPadrao.length) * 100).toFixed(1),
      cor: palette[10]
    }] : [])
  ];

  let acumulador = 0;
  const gradientStops = itensGrafico.map((item, index) => {
    const inicio = acumulador;
    const itemPct = (item.count / questoesPadrao.length) * 100;
    acumulador += itemPct;
    const fim = index === itensGrafico.length - 1 ? 100 : acumulador;
    return `${item.cor} ${inicio.toFixed(2)}% ${fim.toFixed(2)}%`;
  }).join(', ');

  const donutStyle = {
    background: `conic-gradient(${gradientStops})`
  };

  const irParaQuestoesPorTema = (tema) => {
    setBuscaTexto(tema === 'Demais Conteúdos' ? '' : tema);
    if (padraoCargo !== 'Todos') {
      setFiltroCargo(padraoCargo);
    }
    setActiveTab('questoes');
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  // Filtragem
  const questoesFiltradas = questoes.filter(q => {
    const matchBusca =
      q.enunciado.toLowerCase().includes(buscaTexto.toLowerCase()) ||
      q.orgao.toLowerCase().includes(buscaTexto.toLowerCase()) ||
      q.assunto.toLowerCase().includes(buscaTexto.toLowerCase());
    const matchCargo = filtroCargo === 'Todos' || q.cargo === filtroCargo;
    const matchBanca = filtroBanca === 'Todas' || q.banca === filtroBanca;
    const matchMateria = filtroMateria === 'Todas' || q.materia === filtroMateria;
    const matchTipo =
      filtroTipo === 'Todos' ||
      (filtroTipo === 'Prefeituras' && q.orgao.toLowerCase().includes('prefeitura')) ||
      (filtroTipo === 'Grandes' && !q.orgao.toLowerCase().includes('prefeitura'));

    return matchBusca && matchCargo && matchBanca && matchMateria && matchTipo;
  });

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
            <span className="brand-badge">Prefeituras & SUS</span>
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
              <span className="stat-num">{questoes.length}</span>
              <span className="stat-label">Questões Prontas</span>
            </div>
            <div className="stat-item">
              <span className="stat-num">100%</span>
              <span className="stat-label">Gabaritos Comentados</span>
            </div>
            <div className="stat-item">
              <span className="stat-num">{taxaAcerto}%</span>
              <span className="stat-label">Sua Taxa de Acerto</span>
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
                  onChange={e => setBuscaTexto(e.target.value)}
                />
              </div>

              <div className="filter-grid">
                <div className="filter-group">
                  <label className="filter-label">Foco do Concurso</label>
                  <select
                    className="filter-select"
                    value={filtroTipo}
                    onChange={e => setFiltroTipo(e.target.value)}
                  >
                    <option value="Todos">Todos os Concursos</option>
                    <option value="Prefeituras">Apenas Prefeituras Municipais</option>
                    <option value="Grandes">Grandes Concursos (EBSERH / Federais)</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Cargo</label>
                  <select
                    className="filter-select"
                    value={filtroCargo}
                    onChange={e => setFiltroCargo(e.target.value)}
                  >
                    <option value="Todos">Todos os Cargos</option>
                    <option value="Técnico de Enfermagem">Técnico de Enfermagem</option>
                    <option value="Enfermeiro">Enfermeiro (Nível Superior)</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Banca Examinadora</label>
                  <select
                    className="filter-select"
                    value={filtroBanca}
                    onChange={e => setFiltroBanca(e.target.value)}
                  >
                    {bancasDisponiveis.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Disciplina / Matéria</label>
                  <select
                    className="filter-select"
                    value={filtroMateria}
                    onChange={e => setFiltroMateria(e.target.value)}
                  >
                    {materiasDisponiveis.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Listagem de Questões */}
            <div className="questoes-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 600, color: '#475569' }}>
                Exibindo {questoesFiltradas.length} questões encontradas
              </span>
            </div>

            {questoesFiltradas.slice(0, limiteExibicao).map((q, index) => {
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
            {limiteExibicao < questoesFiltradas.length && (
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
                  <h4 style={{ color: '#0f172a', marginBottom: '0.5rem' }}>📁 /materiais_pdf/prefeituras/</h4>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Destinado a cadernos de provas de municípios (IBAM, VUNESP, Consulpam, Legalle, Avança SP).
                  </p>
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', background: '#f8fafc' }}>
                  <h4 style={{ color: '#0f172a', marginBottom: '0.5rem' }}>📁 /materiais_pdf/concursos_federais_estaduais/</h4>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Destinado a provas da EBSERH, Ministério da Saúde, Fiocruz, Secretarias de Estado de Saúde.
                  </p>
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', background: '#f8fafc' }}>
                  <h4 style={{ color: '#0f172a', marginBottom: '0.5rem' }}>📁 /materiais_pdf/simulados_prontos/</h4>
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

        {/* ABA: PADRÃO DA BANCA (RAIO-X SELECON) */}
        {activeTab === 'padrao' && (
          <section className="animate-fade-in">
            <div className="padrao-hero">
              <div className="hero-tag" style={{ margin: '0 auto 1rem', display: 'inline-flex' }}>
                <Flame size={15} color="#0d9488" />
                <span>Inteligência Estatística de Concursos</span>
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
                Qual o Padrão da <span style={{ color: '#0d9488' }}>Banca SELECON</span>?
              </h2>
              <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: '1.6' }}>
                Auditoria estatística realizada diretamente nas <strong>{questoes.length} questões reais</strong> dos cadernos oficiais da banca. Descubra os temas com maior probabilidade de cair na sua prova ordenados do maior para o menor.
              </p>

              {/* Seletor de Cargo */}
              <div className="padrao-cargo-nav">
                <button
                  className={`btn-cargo-tab ${padraoCargo === 'Todos' ? 'active' : ''}`}
                  onClick={() => setPadraoCargo('Todos')}
                >
                  Todos os Concursos ({questoes.length})
                </button>
                <button
                  className={`btn-cargo-tab ${padraoCargo === 'Técnico de Enfermagem' ? 'active' : ''}`}
                  onClick={() => setPadraoCargo('Técnico de Enfermagem')}
                >
                  Técnico de Enfermagem (343)
                </button>
                <button
                  className={`btn-cargo-tab ${padraoCargo === 'Enfermeiro' ? 'active' : ''}`}
                  onClick={() => setPadraoCargo('Enfermeiro')}
                >
                  Enfermeiro Superior (529)
                </button>
              </div>
            </div>

            {/* Grid Principal: Gráfico Donut/Pizza + Ranking Horizontal */}
            <div className="padrao-grid">
              {/* Card 1: Gráfico de Pizza / Donut */}
              <div className="padrao-card">
                <h3 className="padrao-card-title">
                  <PieChart size={20} color="#0d9488" />
                  Distribuição Percentual dos Temas
                </h3>
                <p className="padrao-card-desc">
                  Proporção de cada assunto no universo de {questoesPadrao.length} questões analisadas ({padraoCargo === 'Todos' ? 'Geral' : padraoCargo}).
                </p>

                <div className="donut-container">
                  <div className="donut-chart-box">
                    <div className="donut-circle" style={donutStyle}></div>
                    <div className="donut-inner-hole">
                      <span className="donut-inner-num">{questoesPadrao.length}</span>
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
                              onClick={() => irParaQuestoesPorTema(item.nome)}
                              title={`Filtrar questões sobre ${item.nome}`}
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
                  Raio-X Inteligente & Dicas de Ouro da Banca SELECON
                </h3>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                Insights táticos extraídos a partir do padrão de repetição de enunciados e pegadinhas da banca:
              </p>

              <div className="insights-grid" style={{ marginTop: 0 }}>
                <div className="insight-card">
                  <div className="insight-tag">
                    <Target size={14} /> Foco nº 1 da Banca
                  </div>
                  <h4 className="insight-title">Fundamentos e Prática Diária</h4>
                  <p className="insight-text">
                    A SELECON adora cobrar procedimentos de enfermagem fundamentais: parâmetros de <strong>sinais vitais</strong> (pressão, temperatura, FC), técnicas de <strong>sondagem vesical e nasogástrica</strong>, cuidados com <strong>curativos</strong> e tipos de exsudato.
                  </p>
                </div>

                <div className="insight-card">
                  <div className="insight-tag">
                    <Sparkles size={14} /> Ponto Garantido
                  </div>
                  <h4 className="insight-title">Legislação e Código de Ética</h4>
                  <p className="insight-text">
                    Questões recorrentes sobre as competências privativas do Enfermeiro vs atribuições do Técnico (<strong>Lei 7.498/86</strong>) e penalidades do novo <strong>Código de Ética (Resolução COFEN 564/2017)</strong>: direitos, deveres e proibições.
                  </p>
                </div>

                <div className="insight-card">
                  <div className="insight-tag">
                    <Zap size={14} /> Técnico vs Enfermeiro
                  </div>
                  <h4 className="insight-title">Diferença de Perfil nos Cargos</h4>
                  <p className="insight-text">
                    Para <strong>Técnico</strong>, há forte cobrança em <em>Cálculo de Medicamentos (gotejamento/diluição)</em> e <em>Biossegurança (NR-32/EPI)</em>. Já para <strong>Enfermeiro</strong>, predominam <em>Vigilância Epidemiológica</em>, <em>Gestão em Saúde</em> e <em>SAE/NANDA</em>.
                  </p>
                </div>

                <div className="insight-card">
                  <div className="insight-tag">
                    <Award size={14} /> Prefeituras & SUS
                  </div>
                  <h4 className="insight-title">Saúde Pública e Imunização</h4>
                  <p className="insight-text">
                    Cobrança maciça de <strong>Rede de Frio e Calendário Nacional de Vacinação (PNI)</strong>, além dos princípios doutrinários e organizativos da <strong>Lei Orgânica da Saúde (Lei 8.080/90)</strong>.
                  </p>
                </div>
              </div>
            </div>
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
