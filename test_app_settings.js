const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'quiz_app',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin123',
});

async function testAppSettings() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testando configurações do app...');
    
    // Testar busca de configurações
    console.log('\n1. Buscando configurações atuais:');
    const result = await client.query('SELECT * FROM app_settings ORDER BY id DESC LIMIT 1');
    
    if (result.rows.length > 0) {
      const settings = result.rows[0];
      console.log('✅ Configurações encontradas:');
      console.log(`   ID: ${settings.id}`);
      console.log(`   Nome: ${settings.app_name}`);
      console.log(`   Ícone: ${settings.app_icon}`);
      console.log(`   Descrição: ${settings.app_description}`);
      console.log(`   Cor Primária: ${settings.primary_color}`);
      console.log(`   Cor Secundária: ${settings.secondary_color}`);
    } else {
      console.log('❌ Nenhuma configuração encontrada');
    }
    
    // Testar atualização
    console.log('\n2. Testando atualização de configurações:');
    const updateResult = await client.query(`
      UPDATE app_settings 
      SET app_name = 'Quiz Personalizado', 
          app_icon = '🚀', 
          app_description = 'Seu app de quiz personalizado!',
          primary_color = '#4CAF50',
          secondary_color = '#45a049',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = (SELECT id FROM app_settings ORDER BY id DESC LIMIT 1)
      RETURNING *;
    `);
    
    if (updateResult.rows.length > 0) {
      const updatedSettings = updateResult.rows[0];
      console.log('✅ Configurações atualizadas:');
      console.log(`   Nome: ${updatedSettings.app_name}`);
      console.log(`   Ícone: ${updatedSettings.app_icon}`);
      console.log(`   Descrição: ${updatedSettings.app_description}`);
      console.log(`   Cor Primária: ${updatedSettings.primary_color}`);
      console.log(`   Cor Secundária: ${updatedSettings.secondary_color}`);
    }
    
    // Restaurar configurações originais
    console.log('\n3. Restaurando configurações originais:');
    await client.query(`
      UPDATE app_settings 
      SET app_name = 'Quiz Educativo', 
          app_icon = '🎯', 
          app_description = 'Aprenda e ganhe brindes!',
          primary_color = '#FFD700',
          secondary_color = '#FFA500',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = (SELECT id FROM app_settings ORDER BY id DESC LIMIT 1);
    `);
    
    console.log('✅ Configurações restauradas');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

testAppSettings().catch(console.error);