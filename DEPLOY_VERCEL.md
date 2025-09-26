# 🚀 Deploy do Quiz Educativo no Vercel

Este guia te ajudará a fazer o deploy do backend no Vercel.

## 📋 Pré-requisitos

1. Conta no [Vercel](https://vercel.com)
2. Conta no GitHub/GitLab/Bitbucket
3. Banco PostgreSQL (recomendo [Neon](https://neon.tech) ou [Supabase](https://supabase.com))

## 🗄️ Configuração do Banco de Dados

### Opção 1: Neon (Recomendado)
1. Acesse [neon.tech](https://neon.tech)
2. Crie uma conta gratuita
3. Crie um novo projeto
4. Copie a connection string
5. Execute o script `init-db.sql` no console SQL do Neon

### Opção 2: Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Vá em Settings > Database
4. Copie a connection string
5. Execute o script `init-db.sql` no SQL Editor

## 📤 Deploy no Vercel

### Passo 1: Preparar o Repositório
```bash
# Navegue até a pasta do servidor
cd server

# Inicialize o git (se ainda não foi feito)
git init
git add .
git commit -m "Initial commit"

# Conecte ao seu repositório remoto
git remote add origin https://github.com/seu-usuario/quiz-educativo-api.git
git push -u origin main
```

### Passo 2: Conectar ao Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Clique em "New Project"
3. Conecte seu repositório GitHub
4. Selecione a pasta `server` como root directory
5. Clique em "Deploy"

### Passo 3: Configurar Variáveis de Ambiente
No painel do Vercel, vá em Settings > Environment Variables e adicione:

```
DB_HOST=seu-host-postgresql
DB_PORT=5432
DB_NAME=seu-banco
DB_USER=seu-usuario
DB_PASSWORD=sua-senha
NODE_ENV=production
```

**Exemplo com Neon:**
```
DB_HOST=ep-cool-math-123456.us-east-1.aws.neon.tech
DB_PORT=5432
DB_NAME=neondb
DB_USER=seu-usuario
DB_PASSWORD=sua-senha-gerada
NODE_ENV=production
```

### Passo 4: Testar o Deploy
Após o deploy, teste os endpoints:

- `GET https://seu-projeto.vercel.app/` - Informações da API
- `GET https://seu-projeto.vercel.app/api/health` - Health check
- `GET https://seu-projeto.vercel.app/api/quiz` - Listar quizzes

## 📱 Atualizar o Mobile

No arquivo `mobile/src/config.js`, atualize a URL:

```javascript
export const API_CONFIG = {
    BASE_URL: 'https://seu-projeto.vercel.app',
};
```

## 🔧 Comandos Úteis

### Redeploy
```bash
git add .
git commit -m "Update"
git push
```

### Logs do Vercel
```bash
npx vercel logs
```

### Deploy local para teste
```bash
npx vercel dev
```

## 🐛 Troubleshooting

### Erro de CORS
Certifique-se de que o CORS está configurado corretamente no `index_quiz_educativo.js`

### Erro de Banco
1. Verifique se as variáveis de ambiente estão corretas
2. Teste a conexão com o banco
3. Execute o script `init-db.sql`

### Timeout
O Vercel tem limite de 30 segundos para funções. Se necessário, otimize as queries.

## 📊 Monitoramento

- Logs: Painel do Vercel > Functions
- Analytics: Painel do Vercel > Analytics
- Performance: Painel do Vercel > Speed Insights

## 🔒 Segurança

1. Use HTTPS sempre
2. Configure variáveis de ambiente seguras
3. Use SSL para conexão com banco
4. Monitore logs regularmente

---

🎉 **Pronto!** Seu backend está rodando no Vercel!

Para suporte, consulte a [documentação do Vercel](https://vercel.com/docs).