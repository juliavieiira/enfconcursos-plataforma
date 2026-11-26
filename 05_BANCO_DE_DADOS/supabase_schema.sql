-- ==============================================================================
-- SCHEMA OFICIAL SUPABASE - PLATAFORMA ENFCONCURSOS
-- ==============================================================================
-- Execute este script no SQL Editor do seu projeto Supabase (https://app.supabase.com)
-- para criar as tabelas de perfis, controle de planos (Gratuito / VIP) e histórico.

-- 1. Criação da tabela de perfis de usuários vinculada ao auth.users do Supabase
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  plano TEXT NOT NULL DEFAULT 'gratuito' CHECK (plano IN ('gratuito', 'vip')),
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'cancelado', 'pendente', 'bloqueado')),
  limite_diario INT NOT NULL DEFAULT 5,
  questoes_respondidas_hoje INT NOT NULL DEFAULT 0,
  data_ultimo_acesso TIMESTAMPTZ DEFAULT NOW(),
  data_expiracao_vip TIMESTAMPTZ,
  gateway_customer_id TEXT, -- ID do cliente no Asaas / Stripe / Mercado Pago
  gateway_subscription_id TEXT, -- ID da assinatura ativa
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de histórico de respostas dos alunos (para estatísticas de desempenho)
CREATE TABLE IF NOT EXISTS public.user_answers (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  questao_id TEXT NOT NULL,
  banca TEXT NOT NULL,
  materia TEXT NOT NULL,
  assunto TEXT NOT NULL,
  resposta_escolhida TEXT NOT NULL,
  resposta_correta TEXT NOT NULL,
  acertou BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_user_answers_user ON public.user_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_banca ON public.user_answers(banca);
CREATE INDEX IF NOT EXISTS idx_user_answers_assunto ON public.user_answers(assunto);
CREATE INDEX IF NOT EXISTS idx_user_answers_created_at ON public.user_answers(created_at);

-- 3. Habilitação de RLS (Row Level Security - Segurança por Linha)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para profiles
CREATE POLICY "Usuário pode visualizar seu próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuário pode atualizar seu próprio perfil básico"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Políticas de RLS para user_answers
CREATE POLICY "Usuário pode visualizar seu próprio histórico de respostas"
  ON public.user_answers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário pode registrar suas respostas"
  ON public.user_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Função e Trigger para criar o perfil automaticamente ao cadastrar novo usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, plano, status, limite_diario)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    'gratuito',
    'ativo',
    5
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger disparado após inserção na tabela nativa auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Função de atualização automática do campo updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
