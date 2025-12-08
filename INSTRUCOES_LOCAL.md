# 🚀 Instruções para Rodar Localmente

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase (jxcoder.dev@hotmail.com)
- Git instalado

## 1️⃣ Configurar Projeto no Supabase

### Criar Projeto
1. Acesse https://supabase.com e faça login
2. Clique em **"New Project"**
3. Preencha:
   - **Name**: financeflow (ou outro nome de sua escolha)
   - **Database Password**: Crie uma senha forte e anote
   - **Region**: Escolha a mais próxima (ex: South America - São Paulo)
4. Clique em **"Create new project"**
5. Aguarde 2-3 minutos até o projeto ser criado

### Executar Script SQL
1. No painel do Supabase, vá em **SQL Editor** (menu lateral)
2. Clique em **"New Query"**
3. Abra o arquivo `supabase-setup.sql` e copie todo o conteúdo
4. Cole no editor SQL
5. Clique em **"Run"** (ou pressione Ctrl/Cmd + Enter)
6. Aguarde a execução (deve aparecer "Success")

### Obter Credenciais do Projeto
1. No painel do Supabase, vá em **Project Settings** (ícone de engrenagem)
2. Clique em **API** no menu lateral
3. Anote as seguintes informações:
   - **Project URL** (exemplo: `https://xxxxx.supabase.co`)
   - **anon public** key (chave pública)

## 2️⃣ Configurar Projeto Localmente

### Baixar/Clonar o Projeto
Se você ainda não tem o código localmente, você pode:

**Opção A: Copiar da interface atual**
1. Use a ferramenta de download no canto superior direito da interface OnSpace
2. Extraia o arquivo ZIP em uma pasta de sua escolha

**Opção B: Se tiver em um repositório Git**
```bash
git clone [URL_DO_REPOSITORIO]
cd financeflow
```

### Instalar Dependências
Abra o terminal na pasta do projeto e execute:

```bash
npm install
```

### Configurar Variáveis de Ambiente
1. Crie um arquivo `.env` na raiz do projeto
2. Adicione as seguintes variáveis (substituindo pelos valores do seu projeto Supabase):

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_publica_anon_aqui
```

**⚠️ IMPORTANTE**: Substitua os valores acima pelas credenciais que você anotou no passo anterior.

## 3️⃣ Configurar Autenticação no Supabase

### Habilitar Email/Password
1. No painel do Supabase, vá em **Authentication** > **Providers**
2. Encontre **Email** na lista
3. Certifique-se de que está **habilitado**
4. Em **Email Auth** configure:
   - **Enable email confirmations**: OFF (desabilitado para facilitar testes)
   - Salve as alterações

### Configurar Site URL
1. No painel do Supabase, vá em **Authentication** > **URL Configuration**
2. Em **Site URL**, adicione: `http://localhost:5173`
3. Em **Redirect URLs**, adicione: `http://localhost:5173/**`
4. Salve as alterações

## 4️⃣ Rodar o Projeto

No terminal, na pasta do projeto, execute:

```bash
npm run dev
```

O projeto deve iniciar em: **http://localhost:5173**

## 5️⃣ Criar Primeiro Usuário e Torná-lo Admin

### Criar Conta
1. Abra http://localhost:5173 no navegador
2. Clique em criar conta
3. Preencha os dados e crie sua conta
4. Faça login

### Tornar Usuário Administrador
1. Volte ao painel do Supabase
2. Vá em **SQL Editor** > **New Query**
3. Execute este comando para encontrar seu user_id:
```sql
SELECT id, email FROM auth.users;
```
4. Copie o **id** do seu usuário
5. Execute este comando (substituindo pelo seu ID):
```sql
INSERT INTO public.admin_users (id, email, created_by)
VALUES (
  'SEU_USER_ID_AQUI',
  'jxcoder.dev@hotmail.com',
  'SEU_USER_ID_AQUI'
);
```
6. Faça logout e login novamente no sistema
7. Agora você terá acesso à seção de Administração no menu lateral

## 📦 Estrutura do Projeto

```
financeflow/
├── src/
│   ├── components/       # Componentes React reutilizáveis
│   ├── pages/           # Páginas da aplicação
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utilitários e configurações
│   ├── types/           # Definições TypeScript
│   └── index.css        # Estilos globais
├── .env                 # Variáveis de ambiente (CRIAR ESTE ARQUIVO)
├── package.json         # Dependências do projeto
└── vite.config.ts       # Configuração do Vite

```

## 🔧 Comandos Úteis

```bash
# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build de produção
npm run preview

# Verificar erros de TypeScript
npm run type-check
```

## ⚠️ Solução de Problemas

### Erro de CORS
Se aparecer erro de CORS:
1. Verifique se a **Site URL** está correta no Supabase
2. Limpe o cache do navegador
3. Tente usar modo anônimo/privado

### Erro ao fazer login
1. Verifique se as credenciais do `.env` estão corretas
2. Verifique se o projeto Supabase está ativo
3. Verifique se o Email Auth está habilitado no Supabase

### Tabelas não aparecem
1. Verifique se o script SQL foi executado completamente
2. No Supabase, vá em **Table Editor** e veja se as tabelas foram criadas
3. Se necessário, execute o script novamente

## 📞 Próximos Passos

1. ✅ Configure o projeto no Supabase
2. ✅ Execute o script SQL
3. ✅ Configure as variáveis de ambiente
4. ✅ Rode o projeto localmente
5. ✅ Crie sua conta e torne-se admin
6. 🎉 Comece a usar o sistema!

## 🔐 Segurança

- **Nunca compartilhe** seu arquivo `.env`
- **Nunca commite** o `.env` no Git
- Use senhas fortes para sua conta Supabase
- Para produção, habilite confirmação de email no Supabase

## 📚 Recursos Adicionais

- [Documentação do Supabase](https://supabase.com/docs)
- [Documentação do React](https://react.dev)
- [Documentação do Vite](https://vitejs.dev)
- [Documentação do Tailwind CSS](https://tailwindcss.com)
