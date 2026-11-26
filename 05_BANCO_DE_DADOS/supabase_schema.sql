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

-- 3. Tabela Central de Questões (Projetada para suportar +20.000 questões com alta velocidade)
CREATE TABLE IF NOT EXISTS public.questoes (
  id VARCHAR(50) PRIMARY KEY, -- Ex: 'EF0001', 'PT0120', 'FCC_LP0045'
  codigo_origem VARCHAR(100),
  banca VARCHAR(50) NOT NULL, -- 'SELECON', 'FCC', 'FGV', 'CEBRASPE', etc.
  materia VARCHAR(50) NOT NULL, -- 'Enfermagem', 'Língua Portuguesa', etc.
  assunto VARCHAR(120) NOT NULL,
  cargo VARCHAR(150),
  orgao VARCHAR(150),
  ano INT,
  prova TEXT,
  enunciado TEXT NOT NULL,
  alternativas JSONB NOT NULL, -- Array: [{"id": "A", "texto": "..."}, ...]
  resposta_correta VARCHAR(5) NOT NULL, -- 'A', 'B', 'C', 'D', 'E'
  fundamentacao_correta TEXT NOT NULL,
  analise_distratores JSONB, -- Array: [{"letra": "B", "motivo": "..."}, ...]
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de consulta ultra-rápidos para filtros e paginação em larga escala (+20.000 questões)
CREATE INDEX IF NOT EXISTS idx_questoes_banca_materia ON public.questoes(banca, materia);
CREATE INDEX IF NOT EXISTS idx_questoes_materia_assunto ON public.questoes(materia, assunto);
CREATE INDEX IF NOT EXISTS idx_questoes_assunto ON public.questoes(assunto);
CREATE INDEX IF NOT EXISTS idx_questoes_banca ON public.questoes(banca);
CREATE INDEX IF NOT EXISTS idx_questoes_ano ON public.questoes(ano);

-- Índice GIN de Busca Textual Completa (Full-Text Search em Português)
CREATE INDEX IF NOT EXISTS idx_questoes_busca_enunciado 
  ON public.questoes USING GIN (to_tsvector('portuguese', enunciado));

-- 4. Habilitação de RLS (Row Level Security - Segurança por Linha)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questoes ENABLE ROW LEVEL SECURITY;

-- Política de RLS para questoes (Leitura liberada para visualização das questões ativas)
CREATE POLICY "Permitir leitura pública de questões ativas"
  ON public.questoes FOR SELECT
  USING (ativo = TRUE);

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

-- 6. Função RPC para sorteio rápido de simulados no banco (+20.000 questões)
-- Permite sortear X questões de Português e Y de Enfermagem diretamente no servidor PostgreSQL
CREATE OR REPLACE FUNCTION public.sortear_simulado(
  p_banca TEXT,
  p_qtd_portugues INT DEFAULT 20,
  p_qtd_enfermagem INT DEFAULT 40
)
RETURNS SETOF public.questoes AS $$
BEGIN
  RETURN QUERY
  (
    SELECT * FROM public.questoes
    WHERE (p_banca = 'TODAS' OR banca = p_banca) AND materia = 'Língua Portuguesa' AND ativo = TRUE
    ORDER BY random()
    LIMIT p_qtd_portugues
  )
  UNION ALL
  (
    SELECT * FROM public.questoes
    WHERE (p_banca = 'TODAS' OR banca = p_banca) AND materia = 'Enfermagem' AND ativo = TRUE
    ORDER BY random()
    LIMIT p_qtd_enfermagem
  );
END;
$$ LANGUAGE plpgsql STABLE;

