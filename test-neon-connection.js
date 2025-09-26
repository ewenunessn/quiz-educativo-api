require('dotenv').config();
const { Pool } = require('pg');

console.log('🔌 Testando conexão com Neon PostgreSQL...\n');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function testConnection() {
  try {
    console.log('📡 Conectando ao banco...');
    const client = await pool.connect();
    
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Testar uma query simples
    console.log('🧪 Testando query...');
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    
    console.log('✅ Query executada com sucesso!');
    console.log('⏰ Hora atual do banco:', result.rows[0].current_time);
    console.log('🗄️ Versão PostgreSQL:', result.rows[0].pg_version.split(' ')[0]);
    
    // Verificar se as tabelas existem
    console.log('\n📋 Verificando tabelas existentes...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tables.rows.length > 0) {
      console.log('✅ Tabelas encontradas:');
      tables.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('⚠️  Nenhuma tabela encontrada. Execute o script init-db.sql');
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('\n💡 Dicas:');
      console.log('   - Verifique se o host está correto');
      console.log('   - Verifique sua conexão com a internet');
    } else if (error.code === '28P01') {
      console.log('\n💡 Dicas:');
      console.log('   - Verifique o usuário e senha');
      console.log('   - Verifique se o banco de dados existe');
    }
  } finally {
    await pool.end();
    console.log('\n🔚 Teste finalizado.');
  }
}

testConnection();