import React, { useState, useEffect, useMemo } from 'react';
import {
  Brain,
  AlertTriangle,
  CheckCircle2,
  Target,
  Sparkles,
  BookOpen,
  RotateCcw,
  Trash2,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Award,
  Lightbulb,
  HelpCircle,
  TrendingDown,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import TextoEnunciado from './TextoEnunciado';
import {
  carregarErrosLocais,
  removerErroDoCaderno,
  limparErrosSuperados,
  gerarDiagnosticoInteligente,
  obterRaioXDoErro,
  registrarTentativaCaderno
} from '../services/cadernoErrosService';

export default function CadernoErros({ user, totalGeralAcervo, aoTrocarParaQuestoes }) {
  const [erros, setErros] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState('pendente'); // 'todos' | 'pendente' | 'superada'
  const [filtroBanca, setFiltroBanca] = useState('Todas');
  const [filtroMateria, setFiltroMateria] = useState('Todas');
  const [termoBusca, setTermoBusca] = useState('');

  // Questão em treino ativo no caderno
  const [respostasTreino, setRespostasTreino] = useState({});
  const [raioXVisivel, setRaioXVisivel] = useState({});
  const [feedbackTreino, setFeedbackTreino] = useState({});

  // Carrega os erros do usuário
  const carregarErros = () => {
    const dados = carregarErrosLocais(user?.id);
    setErros(dados);
  };

  useEffect(() => {
    carregarErros();
  }, [user]);

  // Lista filtrada de erros
  const errosFiltrados = useMemo(() => {
    if (!Array.isArray(erros)) return [];
    return erros.filter((e) => {
      if (!e || typeof e !== 'object' || !e.id || !e.questao) return false;
      // Filtro Status
      if (filtroStatus !== 'todos' && e.status !== filtroStatus) return false;
      // Filtro Banca
      if (filtroBanca !== 'Todas' && e.banca !== filtroBanca) return false;
      // Filtro Matéria
      if (filtroMateria !== 'Todas' && e.materia !== filtroMateria) return false;
      // Busca
      if (termoBusca && termoBusca.trim()) {
        const t = termoBusca.toLowerCase();
        const noId = (e.id || '').toLowerCase().includes(t);
        const noEnunc = (e.questao?.enunciado || '').toLowerCase().includes(t);
        const noAssunto = (e.assunto || '').toLowerCase().includes(t);
        if (!noId && !noEnunc && !noAssunto) return false;
      }
      return true;
    });
  }, [erros, filtroStatus, filtroBanca, filtroMateria, termoBusca]);

  // Diagnóstico Inteligente baseado nos erros do usuário
  const diagnostico = useMemo(() => {
    return gerarDiagnosticoInteligente({
      erros,
      bancaFiltro: filtroBanca
    });
  }, [erros, filtroBanca]);

  // Ação de responder uma questão dentro do caderno de erros
  const selecionarOpcaoTreino = (questaoId, letra) => {
    if (respostasTreino[questaoId]?.confirmada) return;
    setRespostasTreino((prev) => ({
      ...prev,
      [questaoId]: { selecionada: letra, confirmada: false }
    }));
  };

  const confirmarRespostaTreino = (erroItem) => {
    const qid = erroItem.id;
    const selecionada = respostasTreino[qid]?.selecionada;
    if (!selecionada) return;

    const acertou = selecionada === erroItem.resposta_correta;

    // Registra a tentativa no serviço
    registrarTentativaCaderno(erroItem.questao, selecionada, acertou, user?.id);

    // Atualiza estado local de respostas e feedback
    setRespostasTreino((prev) => ({
      ...prev,
      [qid]: {
        selecionada,
        confirmada: true,
        acertou
      }
    }));

    setFeedbackTreino((prev) => ({
      ...prev,
      [qid]: {
        acertou,
        mensagem: acertou
          ? '🎉 Sensacional! Você acertou e superou essa pegadinha da banca!'
          : '⚠️ Você ainda caiu em um distrator. Veja o Raio-X abaixo para fixar a regra definitiva.'
      }
    }));

    // Abre o Raio-X automaticamente se errar
    if (!acertou) {
      setRaioXVisivel((prev) => ({ ...prev, [qid]: true }));
    }

    // Recarrega a lista para atualizar status
    setTimeout(carregarErros, 400);
  };

  const alternarRaioX = (qid) => {
    setRaioXVisivel((prev) => ({ ...prev, [qid]: !prev[qid] }));
  };

  const handleRemoverErro = (qid) => {
    if (window.confirm('Deseja remover esta questão do seu Caderno de Erros?')) {
      removerErroDoCaderno(qid, user?.id);
      carregarErros();
    }
  };

  const handleLimparSuperados = () => {
    if (window.confirm('Deseja limpar todas as questões já superadas?')) {
      limparErrosSuperados(user?.id);
      carregarErros();
    }
  };

  // Carrega dados de demonstração caso o usuário ainda não tenha erros
  const carregarDemonstracao = () => {
    const erroDemo1 = {
      id: 'FCC_LP0012',
      banca: 'FCC',
      materia: 'Língua Portuguesa',
      assunto: 'Emprego do Sinal Indicativo de Crase',
      cargo: 'Técnico Judiciário',
      ano: 2024,
      resposta_escolhida: 'B',
      resposta_correta: 'C',
      data_primeiro_erro: new Date().toISOString(),
      ultimo_erro: new Date().toISOString(),
      status: 'pendente',
      tentativas: 1,
      questao: {
        id: 'FCC_LP0012',
        banca: 'FCC',
        materia: 'Língua Portuguesa',
        assunto: 'Emprego do Sinal Indicativo de Crase',
        ano: 2024,
        enunciado: 'O sinal indicativo de crase está empregado em conformidade com a norma-padrão da língua portuguesa em:',
        resposta_correta: 'C',
        alternativas: [
          { id: 'A', texto: 'O autor referiu-se à ela com admiração e respeito durante a cerimônia.' },
          { id: 'B', texto: 'Os pesquisadores começaram à pesquisar novos métodos de contenção viral.' },
          { id: 'C', texto: 'O documento foi entregue às autoridades competentes logo no início do expediente.' },
          { id: 'D', texto: 'O projeto visa à atender as solicitações dos moradores do bairro.' },
          { id: 'E', texto: 'O diretor comunicou a decisão à todos os funcionários presentes.' }
        ],
        fundamentacao_correta: 'Conforme a gramática normativa (Cegalla e Bechara), a crase decorre da contração da preposição "a" exigida pela regência de "entregar" (entregar algo a alguém) com o artigo feminino plural "as" de "autoridades".',
        analise_distratores: [
          { letra: 'A', motivo: 'Incorreta: O sinal de crase é proibido antes do pronome pessoal "ela", que repele artigo.' },
          { letra: 'B', motivo: 'Incorreta: Jamais ocorre crase antes de verbos no infinitivo ("pesquisar").' },
          { letra: 'D', motivo: 'Incorreta: Não há crase diante do verbo "atender".' },
          { letra: 'E', motivo: 'Incorreta: Não há crase diante do pronome indefinido masculino "todos".' }
        ]
      }
    };

    const erroDemo2 = {
      id: 'FCC_LP0045',
      banca: 'FCC',
      materia: 'Língua Portuguesa',
      assunto: 'Sintaxe da Oração e do Período',
      cargo: 'Analista Judiciário',
      ano: 2025,
      resposta_escolhida: 'A',
      resposta_correta: 'D',
      data_primeiro_erro: new Date().toISOString(),
      ultimo_erro: new Date().toISOString(),
      status: 'pendente',
      tentativas: 2,
      questao: {
        id: 'FCC_LP0045',
        banca: 'FCC',
        materia: 'Língua Portuguesa',
        assunto: 'Sintaxe da Oração e do Período',
        ano: 2025,
        enunciado: 'A concordância verbal e a correlação sintática atendem plenamente às exigências da norma culta em:',
        resposta_correta: 'D',
        alternativas: [
          { id: 'A', texto: 'Tratam-se de questões complexas que foram amplamente debatidas pelos juristas.' },
          { id: 'B', texto: 'Fazem muitos anos que os critérios de aprovação não eram revistos pelo comitê.' },
          { id: 'C', texto: 'Haviam vários candidatos aguardando o início da avaliação psicológica.' },
          { id: 'D', texto: 'Apuraram-se com rigor todas as irregularidades apontadas no relatório preliminar.' },
          { id: 'E', texto: 'Deve haverem outras medidas mais eficazes para solucionar o entrave administrativo.' }
        ],
        fundamentacao_correta: 'Na alternativa D, o verbo "apurar" é transitivo direto e está acompanhado da partícula apassivadora "se". O sujeito paciente é "todas as irregularidades apontadas", exigindo a flexão na 3ª pessoa do plural ("Apuraram-se").',
        analise_distratores: [
          { letra: 'A', motivo: 'Incorreta: O verbo "tratar" é transitivo indireto (rege preposição "de"). O "se" é índice de indeterminação do sujeito, exigindo o verbo no singular: "Trata-se de questões".' },
          { letra: 'B', motivo: 'Incorreta: O verbo "fazer" indicando tempo decorrido é impessoal e deve ficar no singular: "Faz muitos anos".' },
          { letra: 'C', motivo: 'Incorreta: O verbo "haver" no sentido de existir é impessoal: "Havia vários candidatos".' },
          { letra: 'E', motivo: 'Incorreta: Na locução com verbo haver impessoal, o verbo auxiliar "deve" também fica no singular: "Deve haver outras medidas".' }
        ]
      }
    };

    localStorage.setItem(
      `enfconcursos_caderno_erros_${user?.id || 'visitante_anonimo'}`,
      JSON.stringify([erroDemo1, erroDemo2])
    );
    carregarErros();
  };

  return (
    <div className="caderno-erros-root animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* HERO SECTION / CABEÇALHO DO CADERNO */}
      <section className="caderno-hero-card" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
        border: '1px solid #334155'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <div style={{
                background: 'rgba(13, 148, 136, 0.2)',
                border: '1px solid #0d9488',
                borderRadius: '8px',
                padding: '6px 10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#2dd4bf',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <Sparkles size={14} />
                <span>Mentor IA & Diagnóstico de Banca</span>
              </div>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
              Caderno de Erros Inteligente
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: '650px', lineHeight: 1.6, margin: 0 }}>
              Aqui você entende a causa raiz dos seus erros, descobre em quais pegadinhas da banca você mais cai e treina por repetição espaçada até fixar o conteúdo.
            </p>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {erros.length === 0 ? (
              <button
                type="button"
                className="btn-primary"
                onClick={carregarDemonstracao}
                style={{
                  background: '#0d9488',
                  padding: '0.7rem 1.2rem',
                  fontSize: '0.88rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Sparkles size={16} />
                <span>Ver Demonstração com IA</span>
              </button>
            ) : (
              diagnostico.superados > 0 && (
                <button
                  type="button"
                  onClick={handleLimparSuperados}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#e2e8f0',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '0.6rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Trash2 size={14} />
                  <span>Limpar Superadas ({diagnostico.superados})</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* KPI CARDS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1rem',
          marginTop: '1.75rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '12px', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fca5a5', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>
              <AlertTriangle size={14} />
              <span>Pendentes</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f87171', marginTop: '4px' }}>
              {diagnostico.pendentes}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Precisam de treino</div>
          </div>

          <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '12px', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6ee7b7', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>
              <CheckCircle2 size={14} />
              <span>Superadas</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
              {diagnostico.superados}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Acertos no retorno</div>
          </div>

          <div style={{ background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(37, 99, 235, 0.25)', borderRadius: '12px', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#93c5fd', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>
              <Target size={14} />
              <span>Taxa de Recuperação</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#60a5fa', marginTop: '4px' }}>
              {diagnostico.taxaSuperacao}%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Eficiência de fixação</div>
          </div>

          <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '12px', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fde047', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>
              <TrendingDown size={14} />
              <span>Assunto Mais Crítico</span>
            </div>
            <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#fcd34d', marginTop: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {diagnostico.topAssuntosCriticos[0]?.assunto || 'Nenhum erro'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
              {diagnostico.topAssuntosCriticos[0] ? `${diagnostico.topAssuntosCriticos[0].qtd} erros registrados` : 'Parabéns!'}
            </div>
          </div>
        </div>
      </section>

      {/* PAINEL DE DIAGNÓSTICO INTELIGENTE POR BANCA */}
      <section style={{
        background: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '1.75rem',
        marginBottom: '2rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ background: '#ccfbf1', padding: '8px', borderRadius: '10px', color: '#0d9488' }}>
              <Brain size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Raio-X de Vulnerabilidades da Banca
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Cruzamento dos seus erros com o padrão avaliativo da banca selecionada.
              </p>
            </div>
          </div>

          {/* Seletor de Banca para o Diagnóstico */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-alt)', padding: '4px', borderRadius: '10px' }}>
            {['Todas', 'FCC', 'SELECON'].map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setFiltroBanca(b)}
                style={{
                  background: filtroBanca === b ? '#ffffff' : 'transparent',
                  color: filtroBanca === b ? '#0d9488' : 'var(--text-muted)',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: filtroBanca === b ? 700 : 500,
                  boxShadow: filtroBanca === b ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Insight da Banca */}
        <div style={{
          background: 'var(--bg-main)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1.2rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-start'
        }}>
          <ShieldAlert size={22} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-main)' }}>
            <strong>Perfil de Cobrança da {diagnostico?.padraoBancaInfo?.nome || 'Banca'}: </strong>
            <span style={{ color: 'var(--text-muted)' }}>
              {diagnostico?.padraoBancaInfo?.focoPrincipal || ''}
            </span>
            <div style={{ marginTop: '0.4rem', color: '#b45309', fontWeight: 600 }}>
              ⚠️ Pegadinha Recorrente: {diagnostico?.padraoBancaInfo?.pegadinhaFrequente || 'Atenção aos distratores comuns da banca.'}
            </div>
          </div>
        </div>

        {/* Lista de Recomendações da IA */}
        {diagnostico.recomendacoes.length > 0 ? (
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.85rem' }}>
              🎯 Plano de Ação Personalizado (O que você precisa focar hoje):
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {diagnostico.recomendacoes.map((rec, i) => (
                <div
                  key={i}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '1.1rem',
                    background: rec.gravidade === 'alta' ? '#fff5f5' : '#f8fafc',
                    borderColor: rec.gravidade === 'alta' ? '#fecaca' : 'var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                      {rec.assunto}
                    </span>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: rec.gravidade === 'alta' ? '#fee2e2' : '#e2e8f0',
                      color: rec.gravidade === 'alta' ? '#dc2626' : '#475569'
                    }}>
                      {rec.qtdErros} erro(s)
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 0.6rem 0' }}>
                    {rec.orientacao}
                  </p>
                  <div style={{
                    background: '#ffffff',
                    border: '1px dashed #cbd5e1',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    fontSize: '0.78rem',
                    color: '#0f766e',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px'
                  }}>
                    <Lightbulb size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span><strong>Dica de Ouro:</strong> {rec.dicaPratica}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
            <Award size={36} color="#10b981" style={{ margin: '0 auto 0.75rem auto' }} />
            <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: 700 }}>
              Nenhum erro pendente registrado nesta banca!
            </h4>
            <p style={{ fontSize: '0.85rem', margin: '0.4rem 0 1rem 0' }}>
              Resolva questões na aba "Questões" ou "Simulados" para que seu diagnóstico cognitivo seja traçado.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={aoTrocarParaQuestoes}
              style={{ fontSize: '0.85rem', padding: '0.6rem 1.2rem' }}
            >
              Ir para o Banco de Questões
            </button>
          </div>
        )}
      </section>

      {/* FILTROS E PESQUISA DO CADERNO */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.25rem'
      }}>
        {/* Chips de Status */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'pendente', label: 'Pendentes de Treino', icon: AlertTriangle, count: diagnostico.pendentes },
            { id: 'superada', label: 'Superadas', icon: CheckCircle2, count: diagnostico.superados },
            { id: 'todos', label: 'Todas', icon: BookOpen, count: diagnostico.total }
          ].map((tab) => {
            const Icon = tab.icon;
            const ativo = filtroStatus === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFiltroStatus(tab.id)}
                style={{
                  background: ativo ? '#0d9488' : '#ffffff',
                  color: ativo ? '#ffffff' : 'var(--text-main)',
                  border: `1px solid ${ativo ? '#0d9488' : 'var(--border)'}`,
                  padding: '7px 14px',
                  borderRadius: '20px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                <span style={{
                  background: ativo ? 'rgba(255,255,255,0.25)' : 'var(--bg-alt)',
                  color: ativo ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '10px'
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Campo de Busca */}
        <div style={{ position: 'relative', minWidth: '220px', flex: '1 1 220px', maxWidth: '340px' }}>
          <Search size={16} color="var(--text-light)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Buscar por código, assunto ou texto..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: '20px',
              border: '1px solid var(--border)',
              fontSize: '0.82rem',
              outline: 'none',
              background: '#ffffff'
            }}
          />
        </div>
      </div>

      {/* LISTAGEM DE QUESTÕES DO CADERNO */}
      {errosFiltrados.length === 0 ? (
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '3rem 2rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Nenhum erro encontrado neste filtro!
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
            {erros.length === 0
              ? 'Você ainda não cometeu erros registrados. Resolva questões para que seu diagnóstico cognitivo seja gerado.'
              : 'Você já resolveu e superou todos os erros desta categoria! Altere o filtro acima para revisar questões anteriores.'}
          </p>
          {erros.length === 0 ? (
            <button
              type="button"
              className="btn-primary"
              onClick={carregarDemonstracao}
              style={{ padding: '0.75rem 1.5rem' }}
            >
              Carregar Exemplos Práticos no Caderno
            </button>
          ) : (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => { setFiltroStatus('todos'); setFiltroBanca('Todas'); setTermoBusca(''); }}
            >
              Mostrar Todo o Histórico
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {errosFiltrados.map((erroItem, idx) => {
            const q = erroItem?.questao || {};
            const qid = erroItem?.id || `erro-${idx}`;
            const respTreino = respostasTreino[qid];
            const feedback = feedbackTreino[qid];
            const isRaioXAberto = raioXVisivel[qid];
            const raioXInfo = obterRaioXDoErro(erroItem);

            const isSuperada = erroItem?.status === 'superada';

            return (
              <div
                key={qid}
                className="card-questao animate-fade-in"
                style={{
                  background: '#ffffff',
                  border: isSuperada ? '1px solid #a7f3d0' : '1px solid #fecaca',
                  borderRadius: '16px',
                  boxShadow: 'var(--shadow-sm)',
                  overflow: 'hidden'
                }}
              >
                {/* Cabeçalho do Card */}
                <div style={{
                  padding: '1rem 1.5rem',
                  background: isSuperada ? '#f0fdf4' : '#fef2f2',
                  borderBottom: `1px solid ${isSuperada ? '#dcfce7' : '#fee2e2'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}>
                  {/* Badges de Metadados */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      background: '#0f172a',
                      color: '#ffffff',
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}>
                      {q.id || qid}
                    </span>
                    <span style={{
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      background: '#0d9488',
                      color: '#ffffff',
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}>
                      {q.banca || erroItem?.banca || 'FCC'}
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      {(q.orgao || erroItem?.cargo || 'Concurso')} • {(q.ano || 2024)}
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#0f766e',
                      background: '#ccfbf1',
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      {q.assunto}
                    </span>
                  </div>

                  {/* Status do Erro */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isSuperada ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: '#10b981',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '20px'
                      }}>
                        <CheckCircle2 size={13} />
                        <span>Superada ({erroItem.tentativas}ª tentativa)</span>
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: '#ef4444',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '20px'
                      }}>
                        <AlertTriangle size={13} />
                        <span>Erro Pendente ({erroItem.tentativas}x)</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemoverErro(qid)}
                      title="Remover do Caderno"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-light)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'inline-flex',
                        alignItems: 'center'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Corpo da Questão */}
                <div style={{ padding: '1.5rem' }}>
                  {/* Informação sobre a resposta anterior */}
                  <div style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    marginBottom: '1rem',
                    fontSize: '0.82rem',
                    color: '#92400e',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <HelpCircle size={15} style={{ flexShrink: 0 }} />
                    <span>
                      Seu último registro nesta questão: você marcou a alternativa <strong>[{erroItem.resposta_escolhida}]</strong> e o gabarito oficial é <strong>[{erroItem.resposta_correta}]</strong>.
                    </span>
                  </div>

                  {/* Enunciado Formatado com Imagens e Texto-Base */}
                  <TextoEnunciado
                    enunciado={q.enunciado}
                    questaoId={q.id}
                  />

                  {/* Alternativas Interativas para Treino */}
                  <div className="alternativas-lista" style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {(q.alternativas || []).map((alt) => {
                      const foiSelecionadaTreino = respTreino?.selecionada === alt.id;
                      const foiMarcadaNoHistorico = erroItem.resposta_escolhida === alt.id;
                      const isCorreta = alt.id === q.resposta_correta;
                      const confirmadaTreino = respTreino?.confirmada;

                      let borderEstilo = '1px solid var(--border)';
                      let bgEstilo = '#ffffff';

                      if (confirmadaTreino) {
                        if (isCorreta) {
                          borderEstilo = '2px solid #10b981';
                          bgEstilo = '#ecfdf5';
                        } else if (foiSelecionadaTreino) {
                          borderEstilo = '2px solid #ef4444';
                          bgEstilo = '#fef2f2';
                        }
                      } else if (foiSelecionadaTreino) {
                        borderEstilo = '2px solid #0d9488';
                        bgEstilo = '#f0fdfa';
                      }

                      return (
                        <div
                          key={alt.id}
                          onClick={() => !confirmadaTreino && selecionarOpcaoTreino(qid, alt.id)}
                          style={{
                            border: borderEstilo,
                            background: bgEstilo,
                            borderRadius: '10px',
                            padding: '0.85rem 1rem',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem',
                            cursor: confirmadaTreino ? 'default' : 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            background: foiSelecionadaTreino ? '#0d9488' : 'var(--bg-alt)',
                            color: foiSelecionadaTreino ? '#ffffff' : 'var(--text-main)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            flexShrink: 0
                          }}>
                            {alt.id}
                          </span>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5, flex: 1 }}>
                            {alt.texto}
                          </span>
                          {foiMarcadaNoHistorico && !confirmadaTreino && (
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: '#dc2626',
                              background: '#fee2e2',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              alignSelf: 'center'
                            }}>
                              Você errou aqui
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Feedback da Resolução */}
                  {feedback && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      background: feedback.acertou ? '#ecfdf5' : '#fef2f2',
                      border: `1px solid ${feedback.acertou ? '#a7f3d0' : '#fecaca'}`,
                      color: feedback.acertou ? '#065f46' : '#991b1b',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {feedback.acertou ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                      <span>{feedback.mensagem}</span>
                    </div>
                  )}

                  {/* Ações da Questão no Caderno */}
                  <div style={{
                    marginTop: '1.25rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}>
                    {/* Botão de Responder Novamente */}
                    {!respTreino?.confirmada ? (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => confirmarRespostaTreino(erroItem)}
                        disabled={!respTreino?.selecionada}
                        style={{
                          fontSize: '0.85rem',
                          padding: '0.6rem 1.25rem',
                          opacity: respTreino?.selecionada ? 1 : 0.6
                        }}
                      >
                        <RotateCcw size={15} />
                        <span>Confirmar Nova Resposta</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          setRespostasTreino((prev) => ({ ...prev, [qid]: null }));
                          setFeedbackTreino((prev) => ({ ...prev, [qid]: null }));
                        }}
                        style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
                      >
                        <RotateCcw size={14} />
                        <span>Tentar Outra Vez</span>
                      </button>
                    )}

                    {/* Botão de Raio-X do Erro com IA */}
                    <button
                      type="button"
                      onClick={() => alternarRaioX(qid)}
                      style={{
                        background: isRaioXAberto ? '#0f172a' : '#f1f5f9',
                        color: isRaioXAberto ? '#ffffff' : 'var(--text-main)',
                        border: '1px solid #cbd5e1',
                        padding: '0.55rem 1rem',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Sparkles size={14} color={isRaioXAberto ? '#2dd4bf' : '#0d9488'} />
                      <span>{isRaioXAberto ? 'Ocultar Raio-X do Erro' : 'Raio-X do Erro (IA)'}</span>
                      {isRaioXAberto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  {/* BOX EXPANSÍVEL: RAIO-X DO ERRO (ANÁLISE COGNITIVA) */}
                  {isRaioXAberto && raioXInfo && (
                    <div className="animate-fade-in" style={{
                      marginTop: '1.25rem',
                      background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
                      border: '1px solid #cbd5e1',
                      borderRadius: '12px',
                      padding: '1.25rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: '#0f766e', fontWeight: 800, fontSize: '0.95rem' }}>
                        <Brain size={18} />
                        <span>Diagnóstico Cognitivo da {raioXInfo.bancaNome}</span>
                      </div>

                      {/* Por que você errou */}
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#dc2626', marginBottom: '4px' }}>
                          ❌ O que você marcou: Alternativa [{raioXInfo.letraMarcada}]
                        </div>
                        <div style={{
                          background: '#ffffff',
                          border: '1px solid #fecaca',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          fontSize: '0.85rem',
                          color: '#7f1d1d',
                          lineHeight: 1.5
                        }}>
                          {raioXInfo.motivoErro}
                        </div>
                      </div>

                      {/* Por que o gabarito é o correto */}
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#059669', marginBottom: '4px' }}>
                          ✅ Gabarito Oficial: Alternativa [{raioXInfo.gabarito}]
                        </div>
                        <div style={{
                          background: '#ffffff',
                          border: '1px solid #a7f3d0',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          fontSize: '0.85rem',
                          color: '#065f46',
                          lineHeight: 1.5
                        }}>
                          {raioXInfo.fundamentacao}
                        </div>
                      </div>

                      {/* Dica da Banca para Não Errar Novamente */}
                      <div style={{
                        background: '#ffffff',
                        border: '1px dashed #0d9488',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        fontSize: '0.82rem',
                        color: '#0f766e',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px'
                      }}>
                        <Lightbulb size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <strong>Como blindar seu acerto na prova: </strong>
                          <span>{raioXInfo.dicaBanca}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
