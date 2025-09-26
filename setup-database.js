require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

console.log('🗄️ Configurando banco de dados...\n');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function setupDatabase() {
  try {
    console.log('📡 Conectando ao banco...');
    const client = await pool.connect();
    
    console.log('✅ Conexão estabelecida!');
    
    // Ler o script SQL
    console.log('📄 Lendo script init-db.sql...');
    const sqlScript = fs.readFileSync('./init-db.sql', 'utf8');
    
    console.log('🚀 Executando script de inicialização...');
    await client.query(sqlScript);
    
    console.log('✅ Script executado com sucesso!');
    
    // Verificar tabelas criadas
    console.log('\n📋 Verificando tabelas criadas...');
    const tables = await client.query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('✅ Tabelas criadas:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name} (${row.column_count} colunas)`);
    });
    
    // Verificar dados iniciais
    console.log('\n📊 Verificando dados iniciais...');
    const appSettings = await client.query('SELECT * FROM app_settings');
    console.log(`✅ Configurações do app: ${appSettings.rows.length} registro(s)`);
    
    if (appSettings.rows.length > 0) {
      const settings = appSettings.rows[0];
      console.log(`   - Nome: ${settings.app_name}`);
      console.log(`   - Ícone: ${settings.app_icon}`);
      console.log(`   - Descrição: ${settings.app_description}`);
    }
    
    client.release();
    
    console.log('\n🎉 Banco de dados configurado com sucesso!');
    console.log('🚀 Agora você pode iniciar o servidor com: npm start');
    
  } catch (error) {
    console.error('❌ Erro ao configurar banco:', error.message);
  } finally {
    await pool.end();
  }
}

setupDatabase();