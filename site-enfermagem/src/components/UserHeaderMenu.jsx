import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { User, LogIn, LogOut, Crown, ChevronDown, Sparkles, CheckCircle2, Shield } from 'lucide-react';

export const UserHeaderMenu = ({ totalQuestoes = 0 }) => {
  const {
    user,
    profile,
    isVip,
    questoesRespondidasHoje,
    limiteDiario,
    abrirModalAuth,
    abrirModalUpgrade,
    logout
  } = useAuth();

  const [dropdownAberto, setDropdownAberto] = useState(false);
  const dropdownRef = useRef(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownAberto(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Iniciais do nome para o Avatar
  const getIniciais = (nome) => {
    if (!nome) return 'AL';
    const partes = nome.trim().split(' ');
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  };

  const nomeExibicao = profile?.nome || user?.user_metadata?.nome || user?.email?.split('@')[0] || 'Aluno';
  const iniciais = getIniciais(nomeExibicao);

  // 1. Caso o usuário NÃO esteja autenticado
  if (!user) {
    return (
      <div className="auth-header-unauthenticated">
        <button
          type="button"
          className="btn-header-login"
          onClick={() => abrirModalAuth('login')}
        >
          <LogIn size={15} />
          <span>Entrar</span>
        </button>

        <button
          type="button"
          className="btn-header-signup"
          onClick={() => abrirModalAuth('cadastro')}
        >
          <User size={15} />
          <span>Criar Conta</span>
        </button>

        <button
          type="button"
          className="btn-header-vip-cta"
          onClick={abrirModalUpgrade}
        >
          <Crown size={15} color="#f59e0b" />
          <span>Acesso VIP</span>
        </button>
      </div>
    );
  }

  // 2. Caso o usuário ESTEJA autenticado
  return (
    <div className="auth-header-authenticated" ref={dropdownRef}>
      {/* Pílula de Status do Plano */}
      <button
        type="button"
        className={`plan-status-pill ${isVip ? 'vip' : 'free'}`}
        onClick={abrirModalUpgrade}
        title={isVip ? 'Você possui Acesso VIP Ilimitado!' : 'Clique para ver as vantagens do VIP PRO'}
      >
        {isVip ? (
          <>
            <Crown size={14} color="#f59e0b" />
            <span className="pill-text">VIP PRO</span>
          </>
        ) : (
          <>
            <span className="pill-dot"></span>
            <span className="pill-text">
              Gratuito ({questoesRespondidasHoje}/{limiteDiario})
            </span>
          </>
        )}
      </button>

      {/* Botão de Perfil com Avatar */}
      <button
        type="button"
        className="user-profile-button"
        onClick={() => setDropdownAberto(!dropdownAberto)}
        title="Abrir menu de opções da conta"
      >
        <div className={`user-avatar ${isVip ? 'avatar-vip' : ''}`}>
          <span>{iniciais}</span>
          {isVip && <span className="crown-badge">👑</span>}
        </div>
        <span className="user-short-name">{nomeExibicao.split(' ')[0]}</span>
        <ChevronDown size={14} className={`dropdown-caret ${dropdownAberto ? 'open' : ''}`} />
      </button>

      {/* Menu Dropdown do Aluno */}
      {dropdownAberto && (
        <div className="user-dropdown-panel animate-fade-in">
          <div className="user-dropdown-header">
            <p className="user-dropdown-name">{nomeExibicao}</p>
            <p className="user-dropdown-email">{user.email}</p>
            <div className="user-dropdown-plan-tag">
              {isVip ? (
                <span className="tag-vip">
                  <Crown size={13} color="#f59e0b" />
                  Plano VIP PRO • Ilimitado
                </span>
              ) : (
                <span className="tag-free">
                  Plano Gratuito • {Math.max(0, limiteDiario - questoesRespondidasHoje)} questões restantes hoje
                </span>
              )}
            </div>
          </div>

          <div className="user-dropdown-body">
            {!isVip && (
              <button
                type="button"
                className="user-dropdown-action-btn upgrade"
                onClick={() => {
                  setDropdownAberto(false);
                  abrirModalUpgrade();
                }}
              >
                <Sparkles size={16} color="#f59e0b" />
                <div className="action-texts">
                  <strong>Assinar Plano VIP PRO</strong>
                  <span>
                    {totalQuestoes > 0
                      ? `Desbloqueie todas as ${totalQuestoes.toLocaleString('pt-BR')} questões`
                      : 'Desbloqueie acesso ilimitado ao banco'}
                  </span>
                </div>
              </button>
            )}

            <div className="user-dropdown-info-item">
              <Shield size={15} color="#0d9488" />
              <span>Conta verificada e segura</span>
            </div>

            <div className="user-dropdown-info-item">
              <CheckCircle2 size={15} color="#0d9488" />
              <span>Gabaritos e distratores auditados</span>
            </div>
          </div>

          <div className="user-dropdown-footer">
            <button
              type="button"
              className="user-dropdown-logout-btn"
              onClick={() => {
                setDropdownAberto(false);
                logout();
              }}
            >
              <LogOut size={16} />
              <span>Sair da Conta</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserHeaderMenu;
