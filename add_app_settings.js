const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'quiz_app',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin123',
});

async function addAppSettings() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Criando tabela de configurações do app...');
    
    // Verificar se a tabela já existe
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'app_settings';
    `);
    
    if (tableCheck.rows.length === 0) {
      // Criar a tabela se não existir
      await client.query(`
        CREATE TABLE app_settings (
          id SERIAL PRIMARY KEY,
          app_name VARCHAR(100) NOT NULL DEFAULT 'Quiz App',
          app_icon VARCHAR(10) NOT NULL DEFAULT '🎯',
          app_description TEXT DEFAULT 'Teste seus conhecimentos!',
          primary_color VARCHAR(7) DEFAULT '#FFD700',
          secondary_color VARCHAR(7) DEFAULT '#FFA500',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ Tabela app_settings criada');
    } else {
      console.log('ℹ️ Tabela app_settings já existe');
    }
    
    // Inserir configurações padrão se não existir nenhuma
    const settingsCheck = await client.query('SELECT id FROM app_settings LIMIT 1');
    
    if (settingsCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO app_settings (app_name, app_icon, app_description, primary_color, secondary_color) VALUES 
        ('Quiz Educativo', '🎯', 'Aprenda e ganhe brindes!', '#FFD700', '#FFA500');
      `);
      console.log('✅ Configurações padrão inseridas');
    } else {
      console.log('ℹ️ Configurações já existem');
    }
    
    // Verificar resultado
    const result = await client.query('SELECT * FROM app_settings ORDER BY id DESC LIMIT 1');
    
    if (result.rows.length > 0) {
      const settings = result.rows[0];
      console.log('📊 Configurações atuais:');
      console.log(`   Nome: ${settings.app_name}`);
      console.log(`   Ícone: ${settings.app_icon}`);
      console.log(`   Descrição: ${settings.app_description}`);
      console.log(`   Cor Primária: ${settings.primary_color}`);
      console.log(`   Cor Secundária: ${settings.secondary_color}`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addAppSettings().catch(console.error);