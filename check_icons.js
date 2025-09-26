const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'quiz_app',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin123',
});

async function checkIcons() {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT question, question_icon, question_type 
      FROM quiz_questions 
      ORDER BY question_order
    `);
    
    console.log('📋 Perguntas e seus ícones:');
    result.rows.forEach((row, i) => {
      console.log(`${i+1}. ${row.question_icon} [${row.question_type}] - ${row.question.substring(0, 60)}...`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkIcons().catch(console.error);