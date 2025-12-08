-- =====================================================
-- FINANCEFLOW - SCRIPT COMPLETO DE CONFIGURAÇÃO
-- =====================================================
-- Este script cria todas as tabelas, políticas RLS,
-- funções e triggers necessários para o sistema
-- =====================================================

-- =====================================================
-- 1. TABELA DE PERFIS DE USUÁRIO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text,
  email text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_profiles
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON public.user_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- =====================================================
-- 2. TABELA DE ADMINISTRADORES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

COMMENT ON TABLE public.admin_users IS 'Stores administrator user IDs';

-- Habilitar RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para admin_users
CREATE POLICY "admins_can_view_all_admins"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "admins_can_insert_admins"
  ON public.admin_users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "admins_can_delete_admins"
  ON public.admin_users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid()
    )
  );

-- Políticas RLS adicionais para user_profiles (acesso admin)
CREATE POLICY "admins_can_view_all_profiles"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "admins_can_update_all_profiles"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid()
    )
  );

-- =====================================================
-- 3. TABELA DE CLIENTES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  document text,
  address text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para clients
CREATE POLICY "Users can view own clients"
  ON public.clients FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients"
  ON public.clients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON public.clients FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON public.clients FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 4. TABELA DE ORÇAMENTOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  amount numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  valid_until date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_budgets_client_id ON public.budgets(client_id);

-- Habilitar RLS
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para budgets
CREATE POLICY "Users can view own budgets"
  ON public.budgets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets"
  ON public.budgets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
  ON public.budgets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
  ON public.budgets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 5. TABELA DE PROJETOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'planning',
  budget numeric(12,2),
  start_date date,
  end_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para projects
CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 6. TABELA DE TRANSAÇÕES FINANCEIRAS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  amount numeric(12,2) NOT NULL,
  date date NOT NULL,
  payment_method text,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para transactions
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON public.transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON public.transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 7. TABELA DE CARTÕES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  last_digits text NOT NULL,
  brand text NOT NULL DEFAULT 'visa',
  card_limit numeric(12,2) NOT NULL,
  closing_day integer NOT NULL,
  due_day integer NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para cards
CREATE POLICY "Users can view own cards"
  ON public.cards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cards"
  ON public.cards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cards"
  ON public.cards FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cards"
  ON public.cards FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 8. TABELA DE PARCELAMENTOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description text NOT NULL,
  total_amount numeric(12,2) NOT NULL,
  installments integer NOT NULL,
  installment_value numeric(12,2) NOT NULL,
  start_date date NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para installments
CREATE POLICY "Users can view own installments"
  ON public.installments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own installments"
  ON public.installments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own installments"
  ON public.installments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own installments"
  ON public.installments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 9. TABELA DE INVESTIMENTOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'fixed_income',
  initial_amount numeric(12,2) NOT NULL,
  current_amount numeric(12,2) NOT NULL,
  expected_return numeric(5,2) NOT NULL,
  start_date date NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para investments
CREATE POLICY "Users can view own investments"
  ON public.investments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own investments"
  ON public.investments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investments"
  ON public.investments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own investments"
  ON public.investments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 10. TABELA DE RESERVAS/AGENDA
-- =====================================================
CREATE TABLE IF NOT EXISTS public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time,
  status text NOT NULL DEFAULT 'scheduled',
  location text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para reservations
CREATE POLICY "Users can view own reservations"
  ON public.reservations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reservations"
  ON public.reservations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reservations"
  ON public.reservations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reservations"
  ON public.reservations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 11. FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para obter o papel do usuário (admin ou user)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.admin_users WHERE id = user_id) THEN
    RETURN 'admin';
  ELSE
    RETURN 'user';
  END IF;
END;
$$;

COMMENT ON FUNCTION public.get_user_role IS 'Returns user role (admin or user)';

-- Função para criar perfil de usuário automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Trigger para criar perfil automaticamente ao registrar usuário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 12. INSERIR PRIMEIRO USUÁRIO ADMIN (OPCIONAL)
-- =====================================================
-- IMPORTANTE: Execute este bloco APÓS criar seu primeiro usuário
-- no Supabase Auth. Substitua 'SEU_USER_ID_AQUI' pelo ID do usuário
-- que você quer tornar administrador.

-- Para encontrar seu user_id:
-- 1. Crie uma conta no sistema
-- 2. Execute: SELECT id, email FROM auth.users;
-- 3. Copie o ID do usuário que deseja tornar admin
-- 4. Execute o comando abaixo substituindo o UUID

-- INSERT INTO public.admin_users (id, email, created_by)
-- VALUES (
--   'SEU_USER_ID_AQUI'::uuid,
--   'jxcoder.dev@hotmail.com',
--   'SEU_USER_ID_AQUI'::uuid
-- );

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
