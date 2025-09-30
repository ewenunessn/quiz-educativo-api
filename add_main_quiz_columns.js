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

async function addMainQuizColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Adicionando colunas para quiz principal...');
    
    // Verificar se a coluna is_main_quiz já existe na tabela quizzes
    const quizColumnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'quizzes' AND column_name = 'is_main_quiz';
    `);
    
    if (quizColumnCheck.rows.length === 0) {
      await client.query(`
        ALTER TABLE quizzes 
        ADD COLUMN is_main_quiz BOOLEAN DEFAULT false;
      `);
      console.log('✅ Coluna is_main_quiz adicionada à tabela quizzes');
    } else {
      console.log('ℹ️ Coluna is_main_quiz já existe na tabela quizzes');
    }
    
    // Verificar se a coluna main_quiz_id já existe na tabela app_settings
    const settingsColumnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'app_settings' AND column_name = 'main_quiz_id';
    `);
    
    if (settingsColumnCheck.rows.length === 0) {
      await client.query(`
        ALTER TABLE app_settings 
        ADD COLUMN main_quiz_id INTEGER REFERENCES quizzes(id) ON DELETE SET NULL;
      `);
      console.log('✅ Coluna main_quiz_id adicionada à tabela app_settings');
    } else {
      console.log('ℹ️ Coluna main_quiz_id já existe na tabela app_settings');
    }
    
    console.log('🎉 Migração de quiz principal concluída!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addMainQuizColumns().catch(console.error);