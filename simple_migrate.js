const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'quiz_app',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin123',
  // Neon sempre exige SSL
  ssl: process.env.DB_HOST && process.env.DB_HOST.includes('neon.tech') 
    ? { rejectUnauthorized: false } 
    : false,
});

async function simpleMigrate() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Executando migração simples...');
    
    // Remover tabelas antigas se existirem
    await client.query(`
      DROP TABLE IF EXISTS user_answers CASCADE;
      DROP TABLE IF EXISTS room_participants CASCADE;
      DROP TABLE IF EXISTS alternatives CASCADE;
      DROP TABLE IF EXISTS questions CASCADE;
      DROP TABLE IF EXISTS quiz_rooms CASCADE;
      DROP TABLE IF EXISTS quiz_results CASCADE;
      DROP TABLE IF EXISTS quiz_questions CASCADE;
      DROP TABLE IF EXISTS quizzes CASCADE;
    `);
    
    // Criar tabela users se não existir
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE,
        avatar VARCHAR(10) DEFAULT '🦊',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Criar tabela app_settings
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id SERIAL PRIMARY KEY,
        app_name VARCHAR(100) NOT NULL DEFAULT 'Quiz App',
        app_icon VARCHAR(10) NOT NULL DEFAULT '🎯',
        app_description TEXT DEFAULT 'Teste seus conhecimentos!',
        primary_color VARCHAR(7) DEFAULT '#FFD700',
        secondary_color VARCHAR(7) DEFAULT '#FFA500',
        main_quiz_id INTEGER REFERENCES quizzes(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Criar tabela quizzes
    await client.query(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        reward_message TEXT NOT NULL,
        created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT true,
        is_main_quiz BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Criar tabela quiz_questions
    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz_questions (
        id SERIAL PRIMARY KEY,
        quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        question_type VARCHAR(20) NOT NULL DEFAULT 'true_false', -- 'true_false' ou 'multiple_choice'
        question_icon VARCHAR(10) DEFAULT '🧠', -- Ícone da pergunta
        correct_answer_index INTEGER, -- Para múltipla escolha (0-3)
        correct_answer_boolean BOOLEAN, -- Para verdadeiro/falso
        correct_explanation TEXT NOT NULL,
        incorrect_explanation TEXT NOT NULL,
        question_order INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Criar tabela alternatives para múltipla escolha
    await client.query(`
      CREATE TABLE IF NOT EXISTS question_alternatives (
        id SERIAL PRIMARY KEY,
        question_id INTEGER REFERENCES quiz_questions(id) ON DELETE CASCADE,
        alternative_text TEXT NOT NULL,
        alternative_order INTEGER NOT NULL, -- 0, 1, 2, 3
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Criar tabela quiz_results
    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz_results (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
        score INTEGER NOT NULL,
        correct_answers INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        answers JSONB NOT NULL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Tabelas criadas');
    
    // Inserir configurações padrão do app
    await client.query(`
      INSERT INTO app_settings (app_name, app_icon, app_description, primary_color, secondary_color) VALUES 
      ('Quiz Educativo', '🎯', 'Aprenda e ganhe brindes!', '#FFD700', '#FFA500')
      ON CONFLICT DO NOTHING;
    `);
    
    // Inserir usuários de exemplo
    await client.query(`
      INSERT INTO users (name, avatar) VALUES 
      ('Admin Quiz', '🎯'),
      ('Professor Silva', '👨‍🏫'),
      ('Maria Educadora', '👩‍🎓')
      ON CONFLICT DO NOTHING;
    `);
    
    // Inserir quiz de exemplo
    const quizResult = await client.query(`
      INSERT INTO quizzes (title, description, reward_message, created_by) VALUES 
      (
        'Quiz de Sustentabilidade',
        'Teste seus conhecimentos sobre práticas sustentáveis e meio ambiente.',
        'Parabéns! Você ganhou 10% de desconto em nossos produtos sustentáveis!',
        1
      ) RETURNING id;
    `);
    
    const quizId = quizResult.rows[0].id;
    
    // Inserir perguntas de exemplo
    
    // Pergunta verdadeiro/falso
    const q1Result = await client.query(`
      INSERT INTO quiz_questions (quiz_id, question, question_type, question_icon, correct_answer_boolean, correct_explanation, incorrect_explanation, question_order) VALUES 
      ($1, 'A reciclagem é uma das principais formas de reduzir o impacto ambiental?', 'true_false', '♻️', true, 'Correto! A reciclagem reduz significativamente o impacto ambiental.', 'Na verdade, a reciclagem É uma das principais formas de reduzir o impacto ambiental.', 1)
      RETURNING id;
    `, [quizId]);
    
    // Pergunta múltipla escolha
    const q2Result = await client.query(`
      INSERT INTO quiz_questions (quiz_id, question, question_type, question_icon, correct_answer_index, correct_explanation, incorrect_explanation, question_order) VALUES 
      ($1, 'Qual é a principal fonte de energia renovável no Brasil?', 'multiple_choice', '⚡', 1, 'Correto! A energia hidrelétrica é a principal fonte renovável do Brasil, representando cerca de 60% da matriz energética.', 'A energia hidrelétrica é a principal fonte renovável do Brasil.', 2)
      RETURNING id;
    `, [quizId]);
    
    const q2Id = q2Result.rows[0].id;
    
    // Inserir alternativas para a pergunta múltipla escolha
    await client.query(`
      INSERT INTO question_alternatives (question_id, alternative_text, alternative_order) VALUES 
      ($1, 'Energia solar', 0),
      ($1, 'Energia hidrelétrica', 1),
      ($1, 'Energia eólica', 2),
      ($1, 'Energia nuclear', 3);
    `, [q2Id]);
    
    // Outra pergunta verdadeiro/falso
    await client.query(`
      INSERT INTO quiz_questions (quiz_id, question, question_type, question_icon, correct_answer_boolean, correct_explanation, incorrect_explanation, question_order) VALUES 
      ($1, 'Usar sacolas plásticas é melhor para o meio ambiente?', 'true_false', '🛍️', false, 'Correto! As sacolas plásticas são prejudiciais ao meio ambiente.', 'Incorreto. As sacolas plásticas são muito prejudiciais ao meio ambiente.', 3);
    `, [quizId]);
    
    console.log('✅ Dados de exemplo inseridos');
    
    // Verificar resultado
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM quizzes) as quizzes,
        (SELECT COUNT(*) FROM quiz_questions) as questions;
    `);
    
    const { users, quizzes, questions } = stats.rows[0];
    console.log(`📊 Usuários: ${users}, Quizzes: ${quizzes}, Perguntas: ${questions}`);
    
    console.log('🎉 Migração concluída!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

simpleMigrate().catch(console.error);