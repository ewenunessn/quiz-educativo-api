require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 5000;

// Configuração do banco de dados
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'quiz_app',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin123',
  // Neon sempre exige SSL, mesmo em desenvolvimento
  ssl: process.env.DB_HOST && process.env.DB_HOST.includes('neon.tech') 
    ? { rejectUnauthorized: false } 
    : process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Middleware - Configuração CORS
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://192.168.18.12:3000',
      'http://192.168.18.12:3001',
      /^http:\/\/192\.168\./,
      /^http:\/\/10\./,
      /^http:\/\/172\.(1[6-9]|2[0-9]|3[01])\./
    ];
    
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    if (isAllowed || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Testar conexão com banco de dados
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Erro ao conectar ao banco de dados:', err);
  }
  console.log('Conectado ao banco de dados PostgreSQL - Quiz Educativo');
  release();
});

// ==================== ROTAS DE USUÁRIOS ====================

// Criar novo usuário
app.post('/api/users', async (req, res) => {
  try {
    const { name, email, avatar } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const result = await pool.query(
      'INSERT INTO users (name, email, avatar) VALUES ($1, $2, $3) RETURNING *',
      [name, email || null, avatar || '🦊']
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// Obter usuário por ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

// ==================== ROTAS DE QUIZ ====================

// Criar novo quiz
app.post('/api/quiz', async (req, res) => {
  try {
    const { title, description, rewardMessage, questions, createdBy } = req.body;
    
    if (!title || !description || !rewardMessage || !questions || questions.length === 0) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    // Iniciar transação
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Criar o quiz
      const quizResult = await client.query(
        'INSERT INTO quizzes (title, description, reward_message, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
        [title, description, rewardMessage, createdBy]
      );

      const quiz = quizResult.rows[0];

      // Criar as perguntas
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        
        let questionResult;
        if (q.questionType === 'multiple_choice') {
          // Pergunta de múltipla escolha
          questionResult = await client.query(
            'INSERT INTO quiz_questions (quiz_id, question, question_type, question_icon, correct_answer_index, correct_explanation, incorrect_explanation, question_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
            [quiz.id, q.question, q.questionType, q.questionIcon || '🧠', q.correctAnswerIndex, q.correctExplanation, q.incorrectExplanation, i + 1]
          );
          
          const questionId = questionResult.rows[0].id;
          
          // Inserir alternativas
          for (let j = 0; j < q.alternatives.length; j++) {
            await client.query(
              'INSERT INTO question_alternatives (question_id, alternative_text, alternative_order) VALUES ($1, $2, $3)',
              [questionId, q.alternatives[j], j]
            );
          }
        } else {
          // Pergunta verdadeiro/falso
          questionResult = await client.query(
            'INSERT INTO quiz_questions (quiz_id, question, question_type, question_icon, correct_answer_boolean, correct_explanation, incorrect_explanation, question_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
            [quiz.id, q.question, q.questionType || 'true_false', q.questionIcon || '🧠', q.correctAnswer, q.correctExplanation, q.incorrectExplanation, i + 1]
          );
        }
      }

      await client.query('COMMIT');
      
      // Buscar o quiz completo com contagem de perguntas
      const completeQuizResult = await client.query(`
        SELECT q.*, COUNT(qq.id) as question_count
        FROM quizzes q
        LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
        WHERE q.id = $1
        GROUP BY q.id
      `, [quiz.id]);

      res.json(completeQuizResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao criar quiz:', error);
    res.status(500).json({ error: 'Erro ao criar quiz' });
  }
});

// Listar todos os quizzes
app.get('/api/quiz', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        q.*,
        u.name as created_by_name,
        COUNT(qq.id) as question_count
      FROM quizzes q
      LEFT JOIN users u ON q.created_by = u.id
      LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
      WHERE q.is_active = true
      GROUP BY q.id, u.name
      ORDER BY q.created_at DESC
    `);

    // Adicionar campo questionCount para compatibilidade com o mobile
    const quizzes = result.rows.map(quiz => ({
      ...quiz,
      questionCount: parseInt(quiz.question_count) || 0
    }));

    res.json(quizzes);
  } catch (error) {
    console.error('Erro ao listar quizzes:', error);
    res.status(500).json({ error: 'Erro ao listar quizzes' });
  }
});

// Obter quiz específico
app.get('/api/quiz/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        q.*,
        u.name as created_by_name,
        COUNT(qq.id) as question_count
      FROM quizzes q
      LEFT JOIN users u ON q.created_by = u.id
      LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
      WHERE q.id = $1 AND q.is_active = true
      GROUP BY q.id, u.name
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz não encontrado' });
    }

    const quiz = result.rows[0];
    quiz.questionCount = parseInt(quiz.question_count) || 0;

    res.json(quiz);
  } catch (error) {
    console.error('Erro ao buscar quiz:', error);
    res.status(500).json({ error: 'Erro ao buscar quiz' });
  }
});

// Obter perguntas de um quiz
app.get('/api/quiz/:id/questions', async (req, res) => {
  try {
    const questionsResult = await pool.query(`
      SELECT id, question, question_type, question_icon, correct_answer_index, correct_answer_boolean, 
             correct_explanation, incorrect_explanation, question_order
      FROM quiz_questions
      WHERE quiz_id = $1
      ORDER BY question_order
    `, [req.params.id]);

    const questions = [];
    
    for (const question of questionsResult.rows) {
      const questionData = {
        id: question.id,
        question: question.question,
        question_type: question.question_type,
        question_icon: question.question_icon,
        correct_explanation: question.correct_explanation,
        incorrect_explanation: question.incorrect_explanation,
        question_order: question.question_order
      };

      if (question.question_type === 'multiple_choice') {
        // Buscar alternativas para perguntas de múltipla escolha
        const alternativesResult = await pool.query(`
          SELECT alternative_text, alternative_order
          FROM question_alternatives
          WHERE question_id = $1
          ORDER BY alternative_order
        `, [question.id]);
        
        questionData.alternatives = alternativesResult.rows.map(alt => alt.alternative_text);
        questionData.correct_answer_index = question.correct_answer_index;
      } else {
        // Para perguntas verdadeiro/falso
        questionData.correct_answer = question.correct_answer_boolean;
      }

      questions.push(questionData);
    }

    res.json(questions);
  } catch (error) {
    console.error('Erro ao buscar perguntas:', error);
    res.status(500).json({ error: 'Erro ao buscar perguntas' });
  }
});

// Salvar resultado do quiz
app.post('/api/quiz/:id/result', async (req, res) => {
  try {
    const { userId, answers, score, completedAt } = req.body;
    const quizId = req.params.id;

    if (!userId || !answers || score === undefined) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const totalQuestions = answers.length;

    const result = await pool.query(
      'INSERT INTO quiz_results (user_id, quiz_id, score, correct_answers, total_questions, answers, completed_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [userId, quizId, score, correctAnswers, totalQuestions, JSON.stringify(answers), completedAt || new Date()]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao salvar resultado:', error);
    res.status(500).json({ error: 'Erro ao salvar resultado' });
  }
});

// Obter resultados de um usuário
app.get('/api/users/:userId/results', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        qr.*,
        q.title as quiz_title,
        q.description as quiz_description
      FROM quiz_results qr
      JOIN quizzes q ON qr.quiz_id = q.id
      WHERE qr.user_id = $1
      ORDER BY qr.completed_at DESC
    `, [req.params.userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar resultados:', error);
    res.status(500).json({ error: 'Erro ao buscar resultados' });
  }
});

// Obter estatísticas de um quiz
app.get('/api/quiz/:id/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_attempts,
        AVG(score) as average_score,
        MAX(score) as highest_score,
        MIN(score) as lowest_score,
        COUNT(DISTINCT user_id) as unique_users
      FROM quiz_results
      WHERE quiz_id = $1
    `, [req.params.id]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// ==================== ROTAS DE CONFIGURAÇÃO DO APP ====================

// Obter nome do app
app.get('/api/app-settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT app_name FROM app_settings ORDER BY id DESC LIMIT 1');
    
    if (result.rows.length === 0) {
      // Retornar nome padrão se não houver nenhuma configuração
      return res.json({
        app_name: 'Quiz Educativo'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar nome do app:', error);
    res.status(500).json({ error: 'Erro ao buscar nome do app' });
  }
});

// Atualizar nome do app (apenas para administração direta no banco)
app.put('/api/app-settings', async (req, res) => {
  try {
    const { appName } = req.body;
    
    if (!appName) {
      return res.status(400).json({ error: 'Nome do app é obrigatório' });
    }

    // Verificar se já existe uma configuração
    const existingResult = await pool.query('SELECT id FROM app_settings LIMIT 1');
    
    let result;
    if (existingResult.rows.length > 0) {
      // Atualizar nome existente
      result = await pool.query(
        'UPDATE app_settings SET app_name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING app_name',
        [appName, existingResult.rows[0].id]
      );
    } else {
      // Criar nova configuração com nome
      result = await pool.query(
        'INSERT INTO app_settings (app_name) VALUES ($1) RETURNING app_name',
        [appName]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar nome do app:', error);
    res.status(500).json({ error: 'Erro ao atualizar nome do app' });
  }
});

// ==================== ROTAS DE QUIZ PRINCIPAL ====================

// Obter quiz principal
app.get('/api/main-quiz', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT q.*, u.name as creator_name 
      FROM quizzes q
      LEFT JOIN users u ON q.created_by = u.id
      WHERE q.is_main_quiz = true AND q.is_active = true
      ORDER BY q.updated_at DESC
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      return res.json(null);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar quiz principal:', error);
    res.status(500).json({ error: 'Erro ao buscar quiz principal' });
  }
});

// Definir quiz principal
app.put('/api/quiz/:id/set-main', async (req, res) => {
  try {
    const quizId = req.params.id;
    
    // Verificar se o quiz existe e está ativo
    const quizCheck = await pool.query(
      'SELECT id FROM quizzes WHERE id = $1 AND is_active = true',
      [quizId]
    );
    
    if (quizCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz não encontrado ou inativo' });
    }
    
    // Remover flag de principal de todos os outros quizzes
    await pool.query('UPDATE quizzes SET is_main_quiz = false');
    
    // Definir este quiz como principal
    const result = await pool.query(
      'UPDATE quizzes SET is_main_quiz = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [quizId]
    );
    
    res.json({ 
      message: 'Quiz definido como principal com sucesso',
      quiz: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao definir quiz principal:', error);
    res.status(500).json({ error: 'Erro ao definir quiz principal' });
  }
});

// Remover quiz principal (nenhum quiz será principal)
app.delete('/api/main-quiz', async (req, res) => {
  try {
    await pool.query('UPDATE quizzes SET is_main_quiz = false');
    
    res.json({ message: 'Quiz principal removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover quiz principal:', error);
    res.status(500).json({ error: 'Erro ao remover quiz principal' });
  }
});

// ==================== ROTAS DE ADMINISTRAÇÃO ====================

// Desativar quiz
app.put('/api/quiz/:id/deactivate', async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE quizzes SET is_active = false WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao desativar quiz:', error);
    res.status(500).json({ error: 'Erro ao desativar quiz' });
  }
});

// Reativar quiz
app.put('/api/quiz/:id/activate', async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE quizzes SET is_active = true WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao reativar quiz:', error);
    res.status(500).json({ error: 'Erro ao reativar quiz' });
  }
});

// ==================== ROTA DE SAÚDE ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor de Quiz Educativo funcionando',
    timestamp: new Date().toISOString()
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({ 
    message: 'API do Sistema de Quiz Educativo',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      quiz: '/api/quiz',
      health: '/api/health'
    }
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Iniciar servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Servidor de Quiz Educativo rodando na porta ${port}`);
  console.log(`📍 Acesse: http://192.168.18.12:${port}`);
  console.log(`🏥 Health check: http://192.168.18.12:${port}/api/health`);
  console.log(`📚 Documentação: http://192.168.18.12:${port}/`);
});