import React from 'react';
import { useAuth } from '../context/useAuth';
import { X, CheckCircle2, Crown, Zap, Sparkles, ShieldCheck, ArrowRight, Lock } from 'lucide-react';

export const UpgradeModal = ({ totalQuestoes = 0 }) => {
  const {
    modalUpgradeAberto,
    fecharModalUpgrade,
    isVip,
    atualizarPlano,
    abrirModalAuth,
    user
  } = useAuth();

  if (!modalUpgradeAberto) return null;

  const totalLabel = totalQuestoes > 0
    ? `${totalQuestoes.toLocaleString('pt-BR')} q. auditadas`
    : 'acervo completo auditado';

  const handleCheckout = () => {
    if (!user) {
      fecharModalUpgrade();
      abrirModalAuth('cadastro');
      return;
    }
    // Integração futura com Gateway de Pagamento (Asaas / Mercado Pago / Stripe)
    alert('Integração de pagamento em preparação! Você pode clicar em "Ativar VIP Instantâneo para Teste" abaixo para experimentar todos os recursos VIP agora mesmo.');
  };

  const handleToggleVipTeste = async () => {
    if (!user) {
      fecharModalUpgrade();
      abrirModalAuth('cadastro');
      return;
    }
    const novo = isVip ? 'gratuito' : 'vip';
    await atualizarPlano(novo);
    fecharModalUpgrade();
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={fecharModalUpgrade}>
      <div className="modal-content upgrade-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Botão de Fechar */}
        <button className="btn-close-modal" onClick={fecharModalUpgrade} title="Fechar">
          <X size={20} />
        </button>

        {/* Header de Impacto */}
        <div className="upgrade-header">
          <div className="upgrade-badge">
            <Crown size={18} color="#f59e0b" />
            <span>Plano VIP EnfConcursos</span>
          </div>
          <h2 className="upgrade-title">
            Eleve sua Preparação para o Nível dos 1ºs Colocados
          </h2>
          <p className="upgrade-subtitle">
            Estude com foco cirúrgico nas bancas de prefeituras e grandes concursos. Questões comentadas alternativa por alternativa, sem limites diários.
          </p>
        </div>

        {/* Tabela Comparativa de Planos */}
        <div className="plans-comparison-grid">
          {/* Card Gratuito */}
          <div className={`plan-card free-plan ${!isVip ? 'active-user-plan' : ''}`}>
            <div className="plan-header">
              <h3>Plano Gratuito</h3>
              <p className="plan-desc">Degustação diária para conhecer o método</p>
              <div className="plan-price">
                <span className="price-val">R$ 0</span>
                <span className="price-period">/ para sempre</span>
              </div>
            </div>
            <ul className="plan-features">
              <li>
                <CheckCircle2 size={16} className="feat-icon check" />
                <span>5 questões comentadas por dia</span>
              </li>
              <li>
                <CheckCircle2 size={16} className="feat-icon check" />
                <span>Acesso ao Simulado Básico #01</span>
              </li>
              <li>
                <CheckCircle2 size={16} className="feat-icon check" />
                <span>Raio-X estatístico do Padrão da Banca</span>
              </li>
              <li className="disabled-feat">
                <Lock size={16} className="feat-icon lock" />
                <span>Sem resolução ilimitada de questões</span>
              </li>
            </ul>
            <div className="plan-action">
              {!isVip ? (
                <span className="current-plan-badge">Seu Plano Atual</span>
              ) : (
                <button
                  type="button"
                  className="btn-plan-secondary"
                  onClick={handleToggleVipTeste}
                >
                  Voltar para Gratuito (Teste)
                </button>
              )}
            </div>
          </div>

          {/* Card VIP PRO (Destaque) */}
          <div className={`plan-card vip-plan highlighted ${isVip ? 'active-user-plan' : ''}`}>
            <div className="popular-ribbon">RECOMENDADO</div>
            <div className="plan-header">
              <div className="vip-icon-wrapper">
                <Crown size={22} color="#f59e0b" />
              </div>
              <h3>Plano VIP PRO</h3>
              <p className="plan-desc">Acesso total e irrestrito até a sua aprovação</p>
              <div className="plan-price">
                <span className="price-currency">R$</span>
                <span className="price-val">29</span>
                <span className="price-cents">,90</span>
                <span className="price-period">/ mês</span>
              </div>
            </div>

            <ul className="plan-features">
              <li>
                <Zap size={16} className="feat-icon gold" />
                <strong>Resolução ILIMITADA de questões ({totalLabel})</strong>
              </li>
              <li>
                <CheckCircle2 size={16} className="feat-icon gold" />
                <span>Dissecação alternativa por alternativa com erros explicados</span>
              </li>
              <li>
                <CheckCircle2 size={16} className="feat-icon gold" />
                <span>Todos os Simulados Oficiais FCC e SELECON cronometrados</span>
              </li>
              <li>
                <CheckCircle2 size={16} className="feat-icon gold" />
                <span>Acesso a todas as novas bancas (IBAM, VUNESP, Consulpam, AOCP)</span>
              </li>
              <li>
                <CheckCircle2 size={16} className="feat-icon gold" />
                <span>Ranking comparativo e histórico completo de acertos</span>
              </li>
            </ul>

            <div className="plan-action">
              {isVip ? (
                <div className="current-plan-badge vip">
                  <Sparkles size={16} />
                  <span>Você já é VIP PRO!</span>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-upgrade-cta"
                  onClick={handleCheckout}
                >
                  <span>Garantir Acesso VIP Agora</span>
                  <ArrowRight size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Rodapé do Modal com Garantia e Botão de Teste Rápido */}
        <div className="upgrade-modal-footer">
          <div className="security-guarantee">
            <ShieldCheck size={18} color="#0d9488" />
            <span>Garantia incondicional de 7 dias • Cancele quando quiser sem burocracia</span>
          </div>

          <div className="dev-test-action" style={{ marginTop: '0.75rem' }}>
            <button
              type="button"
              className="btn-toggle-test-vip"
              onClick={handleToggleVipTeste}
              title="Ativa ou desativa o plano VIP instantaneamente para demonstração"
            >
              {isVip ? '↺ Alternar para Modo Gratuito (5 q./dia)' : '⚡ Ativar VIP Instantâneo para Teste'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
