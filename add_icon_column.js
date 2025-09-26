const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'quiz_app',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin123',
});

async function addIconColumn() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Adicionando coluna question_icon...');
    
    // Verificar se a coluna já existe
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'quiz_questions' AND column_name = 'question_icon';
    `);
    
    if (columnCheck.rows.length === 0) {
      // Adicionar a coluna se não existir
      await client.query(`
        ALTER TABLE quiz_questions 
        ADD COLUMN question_icon VARCHAR(10) DEFAULT '🧠';
      `);
      console.log('✅ Coluna question_icon adicionada');
    } else {
      console.log('ℹ️ Coluna question_icon já existe');
    }
    
    // Atualizar perguntas existentes com ícones padrão
    await client.query(`
      UPDATE quiz_questions 
      SET question_icon = CASE 
        WHEN question LIKE '%reciclagem%' THEN '♻️'
        WHEN question LIKE '%energia%' THEN '⚡'
        WHEN question LIKE '%sacolas%' THEN '🛍️'
        WHEN question LIKE '%JavaScript%' OR question LIKE '%programação%' THEN '💻'
        WHEN question LIKE '%gás%' OR question LIKE '%estufa%' THEN '🌍'
        WHEN question LIKE '%biodiversidade%' OR question LIKE '%Brasil%' THEN '🌱'
        ELSE '🧠'
      END
      WHERE question_icon IS NULL OR question_icon = '';
    `);
    
    console.log('✅ Ícones atualizados nas perguntas existentes');
    
    // Verificar resultado
    const stats = await client.query(`
      SELECT question_icon, COUNT(*) as count
      FROM quiz_questions 
      GROUP BY question_icon
      ORDER BY count DESC;
    `);
    
    console.log('📊 Distribuição de ícones:');
    stats.rows.forEach(row => {
      console.log(`   ${row.question_icon}: ${row.count} pergunta(s)`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addIconColumn().catch(console.error);