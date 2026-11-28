import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { X, Lock, Mail, User, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, KeyRound, Sparkles, Send } from 'lucide-react';

const traduzirErroSupabase = (msg = '') => {
  const m = String(msg).toLowerCase();
  if (m.includes('invalid login credentials') || m.includes('invalid grant') || m.includes('invalid_credentials')) {
    return 'E-mail ou senha incorretos. Verifique seus dados de acesso.';
  }
  if (m.includes('token has expired') || m.includes('otp expired') || m.includes('token is expired')) {
    return 'O código ou link de acesso expirou. Solicite um novo link mágico.';
  }
  if (m.includes('invalid token') || m.includes('token is invalid') || m.includes('invalid otp')) {
    return 'Código de verificação incorreto. Verifique os 6 dígitos recebidos no e-mail.';
  }
  if (m.includes('user already registered') || m.includes('already registered')) {
    return 'Este e-mail já está cadastrado. Faça login ou solicite recuperação de senha.';
  }
  if (m.includes('password should be at least')) {
    return 'A senha deve conter no mínimo 6 caracteres.';
  }
  if (m.includes('email not confirmed')) {
    return 'E-mail ainda não confirmado. Verifique sua caixa de entrada e spam.';
  }
  if (m.includes('provider is not enabled') || m.includes('unsupported provider')) {
    return 'O login com Google ainda não foi ativado no painel do Supabase. Enquanto isso, entre com e-mail ou link mágico!';
  }
  if (m.includes('rate limit') || m.includes('too many requests') || m.includes('over_email_send_rate_limit')) {
    return 'Muitas tentativas em pouco tempo por segurança. Aguarde alguns minutos e tente novamente.';
  }
  if (m.includes('network') || m.includes('fetch')) {
    return 'Falha na conexão com o servidor. Verifique sua internet e tente novamente.';
  }
  return msg || 'Ocorreu um erro ao processar sua solicitação.';
};

export const AuthModal = () => {
  const {
    modalAuthAberto,
    modalAuthModo,
    fecharModalAuth,
    login,
    loginComGoogle,
    enviarLinkMagico,
    verificarCodigoOtp,
    cadastrar,
    recuperarSenha,
    isSupabaseConfigured
  } = useAuth();

  const [modoOverride, setModoOverride] = useState(null);
  const modo = modoOverride !== null ? modoOverride : (modalAuthModo || 'login');

  const [metodoLogin, setMetodoLogin] = useState('senha'); // 'senha' | 'magic'
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [codigoOtp, setCodigoOtp] = useState('');
  const [otpEnviado, setOtpEnviado] = useState(false);
  const [timerReenvio, setTimerReenvio] = useState(0);

  const [carregando, setCarregando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState('');
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  // Contador de cooldown para reenvio de e-mail seguro
  useEffect(() => {
    if (timerReenvio <= 0) return;
    const interval = setInterval(() => {
      setTimerReenvio((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerReenvio]);

  if (!modalAuthAberto) return null;

  const fechar = () => {
    setModoOverride(null);
    setMensagemErro('');
    setMensagemSucesso('');
    setOtpEnviado(false);
    setCodigoOtp('');
    setTimerReenvio(0);
    fecharModalAuth();
  };

  const mudarModo = (novoModo) => {
    setModoOverride(novoModo);
    setMensagemErro('');
    setMensagemSucesso('');
    setOtpEnviado(false);
    setCodigoOtp('');
    setTimerReenvio(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagemErro('');
    setMensagemSucesso('');
    setCarregando(true);

    try {
      if (modo === 'cadastro') {
        if (!nome.trim()) throw new Error('Por favor, informe seu nome completo.');
        if (senha.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.');
        if (senha !== confirmarSenha) throw new Error('As senhas digitadas não coincidem.');

        const res = await cadastrar(nome.trim(), email.trim(), senha);
        if (res?.session) {
          setMensagemSucesso('Conta criada com sucesso! Bem-vindo(a) ao EnfConcursos.');
          setTimeout(() => fechar(), 1200);
        } else {
          setMensagemSucesso(
            `Cadastro realizado com sucesso! Enviamos um link de confirmação para ${email.trim()}. Acesse seu e-mail para ativar sua conta e depois faça login.`
          );
        }
      } else if (modo === 'login') {
        if (metodoLogin === 'magic') {
          if (!email.trim()) throw new Error('Por favor, informe seu e-mail.');
          if (otpEnviado) {
            if (!codigoOtp.trim() || codigoOtp.trim().length < 6) {
              throw new Error('Por favor, informe o código de 6 dígitos recebido no seu e-mail.');
            }
            await verificarCodigoOtp(email.trim(), codigoOtp.trim());
            setMensagemSucesso('Autenticação concluída com sucesso! Bem-vindo(a) ao EnfConcursos.');
            setTimeout(() => fechar(), 900);
          } else {
            await enviarLinkMagico(email.trim());
            setOtpEnviado(true);
            setTimerReenvio(60);
            setMensagemSucesso(`Link de acesso enviado para ${email.trim()}! Acesse seu e-mail e clique no link, ou digite o código de 6 dígitos logo abaixo.`);
          }
        } else {
          await login(email.trim(), senha);
          setMensagemSucesso('Login efetuado com sucesso!');
          setTimeout(() => fechar(), 900);
        }
      } else if (modo === 'recuperar') {
        await recuperarSenha(email.trim());
        setMensagemSucesso('Instruções de recuperação enviadas para o seu e-mail!');
      }
    } catch (err) {
      setMensagemErro(traduzirErroSupabase(err?.message));
    } finally {
      setCarregando(false);
    }
  };

  const handleGoogleLogin = async () => {
    setMensagemErro('');
    setMensagemSucesso('');
    setCarregando(true);
    try {
      await loginComGoogle();
      if (window.self !== window.top) {
        setMensagemSucesso('Janela de login aberta! Escolha sua conta do Google na janela que se abriu.');
        setCarregando(false);
      }
    } catch (err) {
      setMensagemErro(traduzirErroSupabase(err?.message));
      setCarregando(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={fechar}>
      <div className="modal-content auth-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho do Modal */}
        <div className="auth-modal-header">
          <div className="auth-brand-badge">
            <ShieldCheck size={18} color="#0d9488" />
            <span>EnfConcursos • Área do Aluno</span>
          </div>
          <button className="btn-close-modal" onClick={fechar} title="Fechar">
            <X size={20} />
          </button>
        </div>

        {/* Abas Alternadoras: Entrar / Criar Conta */}
        {modo !== 'recuperar' && (
          <div className="auth-tab-switch">
            <button
              type="button"
              className={`auth-tab-btn ${modo === 'login' ? 'active' : ''}`}
              onClick={() => mudarModo('login')}
            >
              Já tenho conta (Entrar)
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${modo === 'cadastro' ? 'active' : ''}`}
              onClick={() => mudarModo('cadastro')}
            >
              Criar Conta Gratuita
            </button>
          </div>
        )}

        {/* Título Principal */}
        <div className="auth-title-area">
          <h2 className="auth-main-title">
            {modo === 'login' && 'Acesse sua Conta de Estudos'}
            {modo === 'cadastro' && 'Comece a Estudar Gratuitamente'}
            {modo === 'recuperar' && 'Recuperação de Acesso'}
          </h2>
          <p className="auth-subtitle">
            {modo === 'login' && 'Acompanhe seu histórico, resolva simulados e audite seu rendimento.'}
            {modo === 'cadastro' && 'Cadastre-se para liberar 5 questões diárias e simulados oficiais.'}
            {modo === 'recuperar' && 'Digite seu e-mail para receber as instruções de redefinição de senha.'}
          </p>
        </div>

        {/* Banners de Sucesso ou Erro */}
        {mensagemErro && (
          <div className="auth-alert error animate-fade-in">
            <AlertCircle size={18} className="alert-icon" />
            <span>{mensagemErro}</span>
          </div>
        )}
        {mensagemSucesso && (
          <div className="auth-alert success animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} className="alert-icon" style={{ flexShrink: 0 }} />
              <span>{mensagemSucesso}</span>
            </div>
            {modo === 'cadastro' && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setMensagemSucesso('');
                  mudarModo('login');
                }}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem', marginTop: '0.2rem', alignSelf: 'flex-start' }}
              >
                Ir para o Login →
              </button>
            )}
          </div>
        )}

        {/* Botão de Autenticação Social com Google */}
        {modo !== 'recuperar' && (
          <div className="auth-social-area" style={{ marginBottom: '1.25rem' }}>
            <button
              type="button"
              className="btn-google-auth"
              onClick={handleGoogleLogin}
              disabled={carregando}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#1e293b',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                transition: 'all 0.15s ease'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{modo === 'login' ? 'Entrar com o Google' : 'Cadastrar com o Google'}</span>
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              margin: '1.15rem 0',
              color: '#94a3b8',
              fontSize: '0.78rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              <span style={{ padding: '0 0.75rem' }}>ou continue com e-mail</span>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            </div>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="auth-form">
          {/* Seletor de Método de Acesso no Login: Senha Tradicional vs Link Mágico */}
          {modo === 'login' && (
            <div className="auth-method-switcher">
              <button
                type="button"
                className={`method-switch-pill ${metodoLogin === 'senha' ? 'active' : ''}`}
                onClick={() => {
                  setMetodoLogin('senha');
                  setMensagemErro('');
                  setMensagemSucesso('');
                }}
              >
                <Lock size={14} />
                <span>Entrar com Senha</span>
              </button>
              <button
                type="button"
                className={`method-switch-pill ${metodoLogin === 'magic' ? 'active' : ''}`}
                onClick={() => {
                  setMetodoLogin('magic');
                  setMensagemErro('');
                  setMensagemSucesso('');
                }}
              >
                <Sparkles size={14} />
                <span>Link Mágico (Sem Senha)</span>
              </button>
            </div>
          )}

          {/* FLUXO 1: LOGIN COM LINK MÁGICO / OTP */}
          {modo === 'login' && metodoLogin === 'magic' ? (
            <>
              {!otpEnviado ? (
                <div className="magic-info-banner">
                  <Sparkles size={18} color="#0d9488" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: '#0f766e', display: 'block', marginBottom: '2px' }}>Acesso Rápido sem Senha</strong>
                    <span style={{ fontSize: '0.8rem', color: '#115e59' }}>
                      Digite seu e-mail para receber um link de acesso com 1 clique e um código de 6 dígitos. Perfeito para estudar sem decorar senhas!
                    </span>
                  </div>
                </div>
              ) : (
                <div className="magic-info-banner" style={{ background: '#ecfdf5', borderColor: '#a7f3d0' }}>
                  <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: '#065f46', display: 'block', marginBottom: '2px' }}>E-mail de acesso enviado!</strong>
                    <span style={{ fontSize: '0.8rem', color: '#047857' }}>
                      Enviamos para <strong>{email}</strong>. Você pode <strong>clicar no link do e-mail</strong> ou <strong>digitar o código de 6 dígitos</strong> recebido:
                    </span>
                  </div>
                </div>
              )}

              <div className="auth-input-group">
                <label>Seu E-mail Cadastrado</label>
                <div className="auth-input-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    placeholder="seu.email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={otpEnviado}
                    required
                  />
                </div>
              </div>

              {otpEnviado && (
                <div className="auth-input-group animate-fade-in">
                  <div className="label-with-action">
                    <label>Código de 6 dígitos (recebido no e-mail)</label>
                    <button
                      type="button"
                      className="link-forgot-password"
                      onClick={() => {
                        setOtpEnviado(false);
                        setCodigoOtp('');
                        setMensagemSucesso('');
                      }}
                    >
                      Trocar e-mail
                    </button>
                  </div>
                  <div className="auth-input-wrapper">
                    <KeyRound size={18} className="input-icon" />
                    <input
                      type="text"
                      className="otp-digit-input"
                      placeholder="000000"
                      maxLength={6}
                      value={codigoOtp}
                      onChange={(e) => setCodigoOtp(e.target.value.replace(/\D/g, ''))}
                      autoFocus
                      required
                    />
                  </div>
                  <div className="auth-resend-area">
                    <span style={{ color: '#64748b' }}>Não recebeu o e-mail?</span>
                    <button
                      type="button"
                      className="btn-auth-resend"
                      disabled={timerReenvio > 0 || carregando}
                      onClick={async () => {
                        setCarregando(true);
                        setMensagemErro('');
                        try {
                          await enviarLinkMagico(email.trim());
                          setTimerReenvio(60);
                          setMensagemSucesso('Novo e-mail com link e código reenviado!');
                        } catch (err) {
                          setMensagemErro(traduzirErroSupabase(err?.message));
                        } finally {
                          setCarregando(false);
                        }
                      }}
                    >
                      {timerReenvio > 0 ? `Reenviar em ${timerReenvio}s` : 'Reenviar código'}
                    </button>
                  </div>
                </div>
              )}

              <button type="submit" className="btn-auth-submit" disabled={carregando || (otpEnviado && codigoOtp.length < 6)}>
                {carregando ? (
                  <span>Processando...</span>
                ) : otpEnviado ? (
                  <>
                    <span>Confirmar Código e Entrar</span>
                    <ArrowRight size={18} />
                  </>
                ) : (
                  <>
                    <span>Enviar Link de Acesso sem Senha</span>
                    <Send size={16} />
                  </>
                )}
              </button>
            </>
          ) : (
            /* FLUXO 2: LOGIN TRADICIONAL / CADASTRO / RECUPERAÇÃO */
            <>
              {modo === 'cadastro' && (
                <div className="auth-input-group">
                  <label>Nome Completo</label>
                  <div className="auth-input-wrapper">
                    <User size={18} className="input-icon" />
                    <input
                      type="text"
                      placeholder="Ex: Dra. Mariana Costa"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="auth-input-group">
                <label>E-mail</label>
                <div className="auth-input-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    placeholder="seu.email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {modo !== 'recuperar' && (
                <div className="auth-input-group">
                  <div className="label-with-action">
                    <label>Senha</label>
                    {modo === 'login' && (
                      <button
                        type="button"
                        className="link-forgot-password"
                        onClick={() => mudarModo('recuperar')}
                      >
                        Esqueceu a senha?
                      </button>
                    )}
                  </div>
                  <div className="auth-input-wrapper">
                    <Lock size={18} className="input-icon" />
                    <input
                      type="password"
                      placeholder="Mínimo de 6 caracteres"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {modo === 'cadastro' && (
                <div className="auth-input-group">
                  <label>Confirmar Senha</label>
                  <div className="auth-input-wrapper">
                    <KeyRound size={18} className="input-icon" />
                    <input
                      type="password"
                      placeholder="Repita sua senha"
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Vantagens no Cadastro */}
              {modo === 'cadastro' && (
                <div className="auth-perks-box">
                  <div className="perk-item">
                    <CheckCircle2 size={16} color="#0d9488" />
                    <span>5 questões comentadas por dia (Gratuito)</span>
                  </div>
                  <div className="perk-item">
                    <CheckCircle2 size={16} color="#0d9488" />
                    <span>Simulados Oficiais SELECON e FCC</span>
                  </div>
                  <div className="perk-item">
                    <CheckCircle2 size={16} color="#0d9488" />
                    <span>Raio-X estatístico do Padrão da Banca</span>
                  </div>
                </div>
              )}

              <button type="submit" className="btn-auth-submit" disabled={carregando}>
                {carregando ? (
                  <span>Processando...</span>
                ) : modo === 'login' ? (
                  <>
                    <span>Entrar na Minha Conta</span>
                    <ArrowRight size={18} />
                  </>
                ) : modo === 'cadastro' ? (
                  <>
                    <span>Criar Minha Conta Grátis</span>
                    <Sparkles size={18} />
                  </>
                ) : (
                  <span>Enviar Link de Recuperação</span>
                )}
              </button>
            </>
          )}
        </form>

        {/* Rodapé Alternador */}
        <div className="auth-modal-footer">
          {modo === 'recuperar' ? (
            <button
              type="button"
              className="btn-link-switch"
              onClick={() => mudarModo('login')}
            >
              ← Voltar para o Login
            </button>
          ) : modo === 'login' ? (
            <p>
              Ainda não tem conta?{' '}
              <button
                type="button"
                className="btn-link-switch"
                onClick={() => mudarModo('cadastro')}
              >
                Cadastre-se gratuitamente
              </button>
            </p>
          ) : (
            <p>
              Já possui conta cadastrada?{' '}
              <button
                type="button"
                className="btn-link-switch"
                onClick={() => mudarModo('login')}
              >
                Fazer Login
              </button>
            </p>
          )}

          {!isSupabaseConfigured && (
            <div className="mock-environment-notice" title="Conecte seu projeto Supabase no arquivo .env.local">
              <span>⚡ Modo Demonstração com Persistência Local Ativo</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
