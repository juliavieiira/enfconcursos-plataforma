import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { AuthContext } from './AuthContextBase';
import { registrarTentativaCaderno } from '../services/cadernoErrosService';

const LIMITE_GRATUITO_DIARIO = 5;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modais de Autenticação e Upgrade
  const [modalAuthAberto, setModalAuthAberto] = useState(false);
  const [modalAuthModo, setModalAuthModo] = useState('login'); // 'login' | 'cadastro' | 'recuperar'
  const [modalUpgradeAberto, setModalUpgradeAberto] = useState(false);

  const getDailyKey = useCallback((targetUser = user) => {
    const hoje = new Date().toISOString().split('T')[0];
    const uid = targetUser ? targetUser.id : 'visitante_anonimo';
    return `questoes_respondidas_${uid}_${hoje}`;
  }, [user]);

  const [questoesRespondidasHoje, setQuestoesRespondidasHoje] = useState(() => {
    const hoje = new Date().toISOString().split('T')[0];
    return parseInt(localStorage.getItem(`questoes_respondidas_visitante_anonimo_${hoje}`) || '0', 10);
  });

  // Carregar perfil do usuário no Supabase e sincronizar cota diária
  const carregarPerfil = useCallback(async (authUser) => {
    if (!authUser) {
      setProfile(null);
      return;
    }

    const hoje = new Date().toISOString().split('T')[0];
    const localCount = parseInt(localStorage.getItem(`questoes_respondidas_${authUser.id}_${hoje}`) || '0', 10);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('Erro ao carregar perfil:', error.message);
      }

      const googleName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.user_metadata?.nome;

      if (data) {
        if (googleName && (!data.nome || data.nome === authUser.email.split('@')[0])) {
          data.nome = googleName;
          supabase.from('profiles').update({ nome: googleName }).eq('id', authUser.id).catch(() => {});
        }
        setProfile(data);
        // Sincroniza contador diário se último acesso foi hoje
        const dataUltimo = data.data_ultimo_acesso ? String(data.data_ultimo_acesso).split('T')[0] : null;
        const dbCountHoje = dataUltimo === hoje ? (Number(data.questoes_respondidas_hoje) || 0) : 0;
        const countFinal = Math.max(localCount, dbCountHoje);
        localStorage.setItem(`questoes_respondidas_${authUser.id}_${hoje}`, String(countFinal));
        setQuestoesRespondidasHoje(countFinal);
      } else {
        const fallbackProfile = {
          id: authUser.id,
          nome: googleName || authUser.email.split('@')[0],
          email: authUser.email,
          plano: 'gratuito',
          status: 'ativo',
          limite_diario: LIMITE_GRATUITO_DIARIO,
          questoes_respondidas_hoje: localCount
        };
        setProfile(fallbackProfile);
        setQuestoesRespondidasHoje(localCount);
      }
    } catch (err) {
      console.error('Falha ao obter perfil do usuário:', err);
      setQuestoesRespondidasHoje(localCount);
    }
  }, []);

  // Monitorar estado da sessão do Supabase
  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            await carregarPerfil(session.user);
          } else {
            setUser(null);
            setProfile(null);
          }
        }
      } catch (err) {
        console.error('Erro ao verificar sessão Supabase:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        await carregarPerfil(session.user);
      } else {
        setUser(null);
        setProfile(null);
        const hoje = new Date().toISOString().split('T')[0];
        const count = parseInt(localStorage.getItem(`questoes_respondidas_visitante_anonimo_${hoje}`) || '0', 10);
        setQuestoesRespondidasHoje(count);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [carregarPerfil]);

  const isVip = Boolean(profile?.plano === 'vip' && profile?.status === 'ativo');
  const limiteDiario = isVip ? Infinity : LIMITE_GRATUITO_DIARIO;
  const questoesRestantesHoje = isVip ? Infinity : Math.max(0, limiteDiario - questoesRespondidasHoje);

  const podeResponderQuestao = () => {
    if (isVip) return true;
    return questoesRespondidasHoje < LIMITE_GRATUITO_DIARIO;
  };

  // Registra resposta no localStorage e persiste todos os campos obrigatórios no Supabase
  const registrarResposta = async (questaoOuId, respostaEscolhida, acertou = false) => {
    const key = getDailyKey();
    const novoTotal = questoesRespondidasHoje + 1;
    localStorage.setItem(key, novoTotal.toString());
    setQuestoesRespondidasHoje(novoTotal);

    // Registra automaticamente no Caderno de Erros inteligente
    if (questaoOuId && typeof questaoOuId === 'object') {
      try {
        registrarTentativaCaderno(questaoOuId, respostaEscolhida, acertou, user?.id);
      } catch (err) {
        console.warn('Erro ao atualizar caderno de erros:', err);
      }
    }

    if (user && isSupabaseConfigured()) {
      const isObj = questaoOuId && typeof questaoOuId === 'object';
      const payload = {
        user_id: user.id,
        questao_id: isObj ? questaoOuId.id : String(questaoOuId),
        banca: isObj ? (questaoOuId.banca || 'SELECON') : 'SELECON',
        materia: isObj ? (questaoOuId.materia || 'Enfermagem') : 'Enfermagem',
        assunto: isObj ? (questaoOuId.assunto || 'Geral') : 'Geral',
        resposta_escolhida: String(respostaEscolhida || ''),
        resposta_correta: isObj ? (questaoOuId.resposta_correta || '') : '',
        acertou: Boolean(acertou)
      };

      try {
        await supabase.from('user_answers').insert([payload]);
        await supabase
          .from('profiles')
          .update({
            questoes_respondidas_hoje: novoTotal,
            data_ultimo_acesso: new Date().toISOString()
          })
          .eq('id', user.id);
      } catch (err) {
        console.warn('Não foi possível sincronizar histórico no Supabase:', err);
      }
    }
  };

  const cadastrar = async (nome, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nome } }
    });

    if (error) throw error;
    if (data?.user && data?.session) {
      setUser(data.user);
      await carregarPerfil(data.user);
    }
    return data;
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data?.user) {
      setUser(data.user);
      await carregarPerfil(data.user);
    }
    return data;
  };

  const loginComGoogle = async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nvbmpzpuqbdxlhkdxyri.supabase.co';
    const isIframe = window.self !== window.top;
    const targetUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(window.location.origin)}`;

    if (isIframe) {
      // Abre diretamente a URL de autenticação na ação do usuário (evita página em branco de about:blank no Safari)
      const popup = window.open(targetUrl, 'google_auth_popup', 'width=540,height=680,status=no,toolbar=no,menubar=no');
      if (!popup || popup.closed) {
        window.location.href = targetUrl;
      }
    } else {
      window.location.href = targetUrl;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const recuperarSenha = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return data;
  };

  const atualizarPlano = async (novoPlano) => {
    if (!profile) return;
    const atualizado = { ...profile, plano: novoPlano };
    setProfile(atualizado);

    if (user) {
      await supabase.from('profiles').update({ plano: novoPlano }).eq('id', user.id);
    }
  };

  const abrirModalAuth = (modo = 'login') => {
    setModalAuthModo(modo);
    setModalAuthAberto(true);
  };

  const fecharModalAuth = () => setModalAuthAberto(false);
  const abrirModalUpgrade = () => setModalUpgradeAberto(true);
  const fecharModalUpgrade = () => setModalUpgradeAberto(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isVip,
        isSupabaseConfigured: isSupabaseConfigured(),
        questoesRespondidasHoje,
        limiteDiario,
        questoesRestantesHoje,
        podeResponderQuestao,
        registrarResposta,
        cadastrar,
        login,
        loginComGoogle,
        logout,
        recuperarSenha,
        atualizarPlano,
        modalAuthAberto,
        modalAuthModo,
        abrirModalAuth,
        fecharModalAuth,
        modalUpgradeAberto,
        abrirModalUpgrade,
        fecharModalUpgrade
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
