const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'quiz_app',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin123',
});

async function insertSampleData() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Inserindo dados de exemplo...');
    
    // Limpar dados existentes (se as tabelas existirem)
    try {
      await client.query('DELETE FROM quiz_results');
    } catch (e) { console.log('Tabela quiz_results não existe ainda'); }
    
    try {
      await client.query('DELETE FROM question_alternatives');
    } catch (e) { console.log('Tabela question_alternatives não existe ainda'); }
    
    try {
      await client.query('DELETE FROM quiz_questions');
    } catch (e) { console.log('Tabela quiz_questions não existe ainda'); }
    
    try {
      await client.query('DELETE FROM quizzes');
    } catch (e) { console.log('Tabela quizzes não existe ainda'); }
    
    try {
      await client.query('DELETE FROM users WHERE id > 0');
    } catch (e) { console.log('Tabela users não existe ainda'); }
    
    // Inserir usuários
    const userResult = await client.query(`
      INSERT INTO users (name, avatar) VALUES 
      ('Admin Quiz', '🎯'),
      ('Professor Silva', '👨‍🏫'),
      ('Maria Educadora', '👩‍🎓')
      ON CONFLICT DO NOTHING
      RETURNING id
    `);
    
    // Pegar o ID do primeiro usuário ou usar um existente
    let userId = 1;
    if (userResult.rows.length > 0) {
      userId = userResult.rows[0].id;
    } else {
      // Se não inseriu, buscar um usuário existente
      const existingUser = await client.query('SELECT id FROM users LIMIT 1');
      if (existingUser.rows.length > 0) {
        userId = existingUser.rows[0].id;
      }
    }
    
    // Inserir quiz
    const quizResult = await client.query(`
      INSERT INTO quizzes (title, description, reward_message, created_by) VALUES 
      (
        'Quiz de Sustentabilidade e Tecnologia',
        'Teste seus conhecimentos sobre práticas sustentáveis, meio ambiente e tecnologia.',
        'Parabéns! Você ganhou 10% de desconto em nossos produtos sustentáveis!',
        $1
      ) RETURNING id;
    `, [userId]);
    
    const quizId = quizResult.rows[0].id;
    
    // Pergunta 1 - Verdadeiro/Falso
    await client.query(`
      INSERT INTO quiz_questions (quiz_id, question, question_type, question_icon, correct_answer_boolean, correct_explanation, incorrect_explanation, question_order) VALUES 
      ($1, 'A reciclagem é uma das principais formas de reduzir o impacto ambiental?', 'true_false', '♻️', true, 'Correto! A reciclagem reduz significativamente o impacto ambiental ao reutilizar materiais.', 'Na verdade, a reciclagem É uma das principais formas de reduzir o impacto ambiental.', 1);
    `, [quizId]);
    
    // Pergunta 2 - Múltipla escolha sobre energia
    const q2Result = await client.query(`
      INSERT INTO quiz_questions (quiz_id, question, question_type, question_icon, correct_answer_index, correct_explanation, incorrect_explanation, question_order) VALUES 
      ($1, 'Qual é a principal fonte de energia renovável no Brasil?', 'multiple_choice', '⚡', 1, 'Correto! A energia hidrelétrica é a principal fonte renovável do Brasil, representando cerca de 60% da matriz energética.', 'A energia hidrelétrica é a principal fonte renovável do Brasil.', 2)
      RETURNING id;
    `, [quizId]);
    
    const q2Id = q2Result.rows[0].id;
    
    // Alternativas para pergunta 2
    await client.query(`
      INSERT INTO question_alternatives (question_id, alternative_text, alternative_order) VALUES 
      ($1, 'Energia solar', 0),
      ($1, 'Energia hidrelétrica', 1),
      ($1, 'Energia eólica', 2),
      ($1, 'Energia nuclear', 3);
    `, [q2Id]);
    
    // Pergunta 3 - Verdadeiro/Falso
    await client.query(`
      INSERT INTO quiz_questions (quiz_id, question, question_type, question_icon, correct_answer_boolean, correct_explanation, incorrect_explanation, question_order) VALUES 
      ($1, 'Usar sacolas plásticas é melhor para o meio ambiente?', 'true_false', '🛍️', false, 'Correto! As sacolas plásticas são prejudiciais ao meio ambiente e demoram centenas de anos para se degradar.', 'Incorreto. As sacolas plásticas são muito prejudiciais ao meio ambiente.', 3);
    `, [quizId]);
    
    // Pergunta 4 - Múltipla escolha sobre tecnologia
    const q4Result = await client.query(`
      INSERT INTO quiz_questions (quiz_id, question, question_type, question_icon, correct_answer_index, correct_explanation, incorrect_explanation, question_order) VALUES 
      ($1, 'Qual linguagem de programação é conhecida como "a linguagem da web"?', 'multiple_choice', '💻', 0, 'Correto! JavaScript é amplamente conhecida como a linguagem da web, sendo executada em navegadores e servidores.', 'JavaScript é a linguagem mais associada ao desenvolvimento web.', 4)
      RETURNING id;
    `, [quizId]);
    
    const q4Id = q4Result.rows[0].id;
    
    // Alternativas para pergunta 4
    await client.query(`
      INSERT INTO question_alternatives (question_id, alternative_text, alternative_order) VALUES 
      ($1, 'JavaScript', 0),
      ($1, 'Python', 1),
      ($1, 'Java', 2),
      ($1, 'C++', 3);
    `, [q4Id]);
    
    // Pergunta 5 - Múltipla escolha sobre meio ambiente
    const q5Result = await client.query(`
      INSERT INTO quiz_questions (quiz_id, question, question_type, question_icon, correct_answer_index, correct_explanation, incorrect_explanation, question_order) VALUES 
      ($1, 'Qual é o principal gás responsável pelo efeito estufa?', 'multiple_choice', '🌍', 1, 'Correto! O dióxido de carbono (CO2) é o principal gás do efeito estufa, representando cerca de 76% das emissões globais.', 'O dióxido de carbono é o principal responsável pelo aquecimento global.', 5)
      RETURNING id;
    `, [quizId]);
    
    const q5Id = q5Result.rows[0].id;
    
    // Alternativas para pergunta 5
    await client.query(`
      INSERT INTO question_alternatives (question_id, alternative_text, alternative_order) VALUES 
      ($1, 'Oxigênio (O2)', 0),
      ($1, 'Dióxido de Carbono (CO2)', 1),
      ($1, 'Metano (CH4)', 2),
      ($1, 'Nitrogênio (N2)', 3);
    `, [q5Id]);
    
    // Pergunta 6 - Verdadeiro/Falso
    await client.query(`
      INSERT INTO quiz_questions (quiz_id, question, question_type, question_icon, correct_answer_boolean, correct_explanation, incorrect_explanation, question_order) VALUES 
      ($1, 'O Brasil é o país com a maior biodiversidade do mundo?', 'true_false', '🌱', true, 'Correto! O Brasil possui a maior biodiversidade do planeta, com milhões de espécies de plantas, animais e microorganismos.', 'Na verdade, o Brasil É o país com maior biodiversidade do mundo.', 6);
    `, [quizId]);
    
    console.log('✅ Dados de exemplo inseridos com sucesso!');
    
    // Verificar resultado
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM quizzes) as quizzes,
        (SELECT COUNT(*) FROM quiz_questions) as questions,
        (SELECT COUNT(*) FROM question_alternatives) as alternatives;
    `);
    
    const { users, quizzes, questions, alternatives } = stats.rows[0];
    console.log(`📊 Usuários: ${users}, Quizzes: ${quizzes}, Perguntas: ${questions}, Alternativas: ${alternatives}`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

insertSampleData().catch(console.error);