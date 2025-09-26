-- Criação das tabelas para o Quiz Educativo

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    avatar VARCHAR(10) DEFAULT '🦊',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de quizzes
CREATE TABLE IF NOT EXISTS quizzes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    reward_message TEXT,
    created_by INTEGER REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de perguntas dos quizzes
CREATE TABLE IF NOT EXISTS quiz_questions (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    question_type VARCHAR(20) DEFAULT 'multiple_choice',
    question_icon VARCHAR(10) DEFAULT '🧠',
    correct_answer_index INTEGER,
    correct_answer_boolean BOOLEAN,
    correct_explanation TEXT,
    incorrect_explanation TEXT,
    question_order INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de alternativas das perguntas
CREATE TABLE IF NOT EXISTS question_alternatives (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES quiz_questions(id) ON DELETE CASCADE,
    alternative_text TEXT NOT NULL,
    alternative_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de resultados dos quizzes
CREATE TABLE IF NOT EXISTS quiz_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    quiz_id INTEGER REFERENCES quizzes(id),
    score DECIMAL(5,2),
    correct_answers INTEGER,
    total_questions INTEGER,
    answers JSONB,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de configurações do app
CREATE TABLE IF NOT EXISTS app_settings (
    id SERIAL PRIMARY KEY,
    app_name VARCHAR(255) DEFAULT 'Quiz App',
    app_icon VARCHAR(10) DEFAULT '🎯',
    app_description TEXT DEFAULT 'Teste seus conhecimentos!',
    primary_color VARCHAR(7) DEFAULT '#FFD700',
    secondary_color VARCHAR(7) DEFAULT '#FFA500',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir configurações padrão se não existirem
INSERT INTO app_settings (app_name, app_icon, app_description, primary_color, secondary_color)
SELECT 'Quiz App', '🎯', 'Teste seus conhecimentos!', '#FFD700', '#FFA500'
WHERE NOT EXISTS (SELECT 1 FROM app_settings);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_quizzes_active ON quizzes(is_active);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_question_alternatives_question_id ON question_alternatives(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_quiz_id ON quiz_results(quiz_id);