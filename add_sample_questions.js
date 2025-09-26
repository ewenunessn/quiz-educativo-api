const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'quiz_app',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin123',
});

async function addSampleQuestions() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Adicionando perguntas de exemplo...');
    
    // Buscar o quiz existente
    const quizResult = await client.query('SELECT id FROM quizzes LIMIT 1');
    if (quizResult.rows.length === 0) {
      console.log('❌ Nenhum quiz encontrado');
      return;
    }
    
    const quizId = quizResult.rows[0].id;
    
    // Pergunta múltipla escolha sobre tecnologia
    const q1Result = await client.query(`
      INSERT INTO quiz_questions (quiz_id, question, question_type, question_icon, correct_answer_index, correct_explanation, incorrect_explanation, question_order) VALUES 
      ($1, 'Qual linguagem de programação é conhecida como "a linguagem da web"?', 'multiple_choice', '💻', 0, 'Correto! JavaScript é amplamente conhecida como a linguagem da web, sendo executada em navegadores e servidores.', 'JavaScript é a linguagem mais associada ao desenvolvimento web.', 4)
      RETURNING id;
    `, [quizId]);
    
    const q1Id = q1Result.rows[0].id;
    
    // Alternativas para a pergunta de tecnologia
    await client.query(`
      INSERT INTO question_alternatives (question_id, alternative_text, alternative_order) VALUES 
      ($1, 'JavaScript', 0),
      ($1, 'Python', 1),
      ($1, 'Java', 2),
      ($1, 'C++', 3);
    `, [q1Id]);
    
    // Pergunta múltipla escolha sobre meio ambiente
    const q2Result = await client.query(`
      INSERT INTO quiz_questions (quiz_id, question, question_type, question_icon, correct_answer_index, correct_explanation, incorrect_explanation, question_order) VALUES 
      ($1, 'Qual é o principal gás responsável pelo efeito estufa?', 'multiple_choice', '🌍', 1, 'Correto! O dióxido de carbono (CO2) é o principal gás do efeito estufa, representando cerca de 76% das emissões globais.', 'O dióxido de carbono é o principal responsável pelo aquecimento global.', 5)
      RETURNING id;
    `, [quizId]);
    
    const q2Id = q2Result.rows[0].id;
    
    // Alternativas para a pergunta de meio ambiente
    await client.query(`
      INSERT INTO question_alternatives (question_id, alternative_text, alternative_order) VALUES 
      ($1, 'Oxigênio (O2)', 0),
      ($1, 'Dióxido de Carbono (CO2)', 1),
      ($1, 'Metano (CH4)', 2),
      ($1, 'Nitrogênio (N2)', 3);
    `, [q2Id]);
    
    // Pergunta verdadeiro/falso adicional
    await client.query(`
      INSERT INTO quiz_questions (quiz_id, question, question_type, question_icon, correct_answer_boolean, correct_explanation, incorrect_explanation, question_order) VALUES 
      ($1, 'O Brasil é o país com a maior biodiversidade do mundo?', 'true_false', '🌱', true, 'Correto! O Brasil possui a maior biodiversidade do planeta, com milhões de espécies de plantas, animais e microorganismos.', 'Na verdade, o Brasil É o país com maior biodiversidade do mundo.', 6);
    `, [quizId]);
    
    console.log('✅ Perguntas de exemplo adicionadas');
    
    // Verificar resultado
    const stats = await client.query(`
      SELECT COUNT(*) as total_questions FROM quiz_questions WHERE quiz_id = $1;
    `, [quizId]);
    
    console.log(`📊 Total de perguntas no quiz: ${stats.rows[0].total_questions}`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addSampleQuestions().catch(console.error);