# Quiz Educativo - Backend API

Backend do sistema de Quiz Educativo desenvolvido em Node.js com Express e PostgreSQL.

## Deploy no Vercel

Este projeto está configurado para deploy automático no Vercel.

### Variáveis de Ambiente Necessárias

Configure as seguintes variáveis no painel do Vercel:

```
DB_HOST=seu-host-postgresql
DB_PORT=5432
DB_USER=seu-usuario
DB_PASSWORD=sua-senha
NODE_ENV=production
```

### Endpoints da API

- `GET /` - Informações da API
- `GET /api/health` - Health check
- `GET /api/quiz` - Listar quizzes
- `POST /api/quiz` - Criar novo quiz
- `GET /api/quiz/:id` - Obter quiz específico
- `GET /api/quiz/:id/questions` - Obter perguntas do quiz
- `POST /api/quiz/:id/result` - Salvar resultado do quiz
- `GET /api/app-settings` - Obter configurações do app
- `PUT /api/app-settings` - Atualizar configurações do app
- `POST /api/users` - Criar usuário
- `GET /api/users/:id` - Obter usuário

### Banco de Dados

O sistema utiliza PostgreSQL. Certifique-se de ter as seguintes tabelas:

- `users` - Usuários do sistema
- `quizzes` - Quizzes criados
- `quiz_questions` - Perguntas dos quizzes
- `question_alternatives` - Alternativas das perguntas
- `quiz_results` - Resultados dos quizzes
- `app_settings` - Configurações do aplicativo

### CORS

O servidor está configurado para aceitar requisições de:
- Localhost (desenvolvimento)
- Redes locais (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
- Qualquer origem em modo desenvolvimento

### Estrutura do Projeto

```
server/
├── index_quiz_educativo.js  # Arquivo principal da API
├── package.json             # Dependências e scripts
├── vercel.json             # Configuração do Vercel
├── .env.example            # Exemplo de variáveis de ambiente
└── README.md               # Este arquivo
```

### Como fazer deploy

1. Faça push do código para um repositório Git (GitHub, GitLab, etc.)
2. Conecte o repositório ao Vercel
3. Configure as variáveis de ambiente
4. O deploy será feito automaticamente

### Desenvolvimento Local

```bash
npm install
cp .env.example .env
# Configure as variáveis no .env
npm run dev
```