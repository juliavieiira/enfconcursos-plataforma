import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { AuthContext } from './AuthContextBase';

const LIMITE_GRATUITO_DIARIO = 15;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modais de Autenticação e Upgrade
  const [modalAuthAberto, setModalAuthAberto] = useState(false);
  const [modalAuthModo, setModalAuthModo] = useState('login'); // 'login' | 'cadastro' | 'recuperar'
  const [modalUpgradeAberto, setModalUpgradeAberto] = useState(false);

  // Contador diário de questões respondidas (resetado a cada dia civil)
  const getDailyKey = useCallback(() => {
    const hoje = new Date().toISOString().split('T')[0];
    const uid = user ? user.id : 'visitante_anonimo';
    return `questoes_respondidas_${uid}_${hoje}`;
  }, [user]);

  const [questoesRespondidasHoje, setQuestoesRespondidasHoje] = useState(() => {
    const hoje = new Date().toISOString().split('T')[0];
    return parseInt(localStorage.getItem(`questoes_respondidas_visitante_anonimo_${hoje}`) || '0', 10);
  });

  // Carregar perfil do usuário no Supabase
  const carregarPerfil = useCallback(async (authUser) => {
    if (!authUser) {
      setProfile(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('Erro ao carregar perfil:', error.message);
      }

      if (data) {
        setProfile(data);
      } else {
        // Perfil padrão caso ainda não exista no banco
        const fallbackProfile = {
          id: authUser.id,
          nome: authUser.user_metadata?.nome || authUser.email.split('@')[0],
          email: authUser.email,
          plano: 'gratuito',
          status: 'ativo',
          limite_diario: LIMITE_GRATUITO_DIARIO,
          questoes_respondidas_hoje: 0
        };
        setProfile(fallbackProfile);
      }
    } catch (err) {
      console.error('Falha ao obter perfil do usuário:', err);
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
            const hoje = new Date().toISOString().split('T')[0];
            const count = parseInt(localStorage.getItem(`questoes_respondidas_${session.user.id}_${hoje}`) || '0', 10);
            setQuestoesRespondidasHoje(count);
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        const hoje = new Date().toISOString().split('T')[0];
        const count = parseInt(localStorage.getItem(`questoes_respondidas_${session.user.id}_${hoje}`) || '0', 10);
        setQuestoesRespondidasHoje(count);
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

  // Acesso VIP
  const isVip = Boolean(profile?.plano === 'vip' && profile?.status === 'ativo');

  // Limite e permissão para responder questões
  const limiteDiario = isVip ? Infinity : LIMITE_GRATUITO_DIARIO;
  const questoesRestantesHoje = isVip ? Infinity : Math.max(0, limiteDiario - questoesRespondidasHoje);

  const podeResponderQuestao = () => {
    if (isVip) return true;
    return questoesRespondidasHoje < LIMITE_GRATUITO_DIARIO;
  };

  const registrarResposta = (questaoId, acertou = false) => {
    const key = getDailyKey();
    const novoTotal = questoesRespondidasHoje + 1;
    localStorage.setItem(key, novoTotal.toString());
    setQuestoesRespondidasHoje(novoTotal);

    // Se estiver logado no Supabase, opcionalmente registra resposta no banco
    if (user && isSupabaseConfigured()) {
      supabase.from('user_answers').insert([{
        user_id: user.id,
        questao_id: questaoId,
        acertou
      }]).catch(() => {});
    }
  };

  // Funções de Autenticação
  const cadastrar = async (nome, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome }
      }
    });

    if (error) throw error;
    if (data?.user) {
      setUser(data.user);
      await carregarPerfil(data.user);
    }
    return data;
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    if (data?.user) {
      setUser(data.user);
      await carregarPerfil(data.user);
    }
    return data;
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

  // Função utilitária para testar upgrade/downgrade instantaneamente
  const atualizarPlano = async (novoPlano) => {
    if (!profile) return;
    const atualizado = { ...profile, plano: novoPlano };
    setProfile(atualizado);

    if (user) {
      await supabase.from('profiles').update({ plano: novoPlano }).eq('id', user.id);
    }
  };

  // Controle de Modais
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
