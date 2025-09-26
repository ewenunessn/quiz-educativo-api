require('dotenv').config();

console.log('🔍 Debug das Variáveis de Ambiente:');
console.log('');
console.log('DB_HOST:', process.env.DB_HOST ? '✅ Definido' : '❌ Não definido');
console.log('DB_PORT:', process.env.DB_PORT ? '✅ Definido' : '❌ Não definido');
console.log('DB_NAME:', process.env.DB_NAME ? '✅ Definido' : '❌ Não definido');
console.log('DB_USER:', process.env.DB_USER ? '✅ Definido' : '❌ Não definido');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '✅ Definido' : '❌ Não definido');
console.log('NODE_ENV:', process.env.NODE_ENV || 'não definido');
console.log('');

if (process.env.DB_HOST) {
  console.log('🔗 Tentando conexão com o banco...');
  
  const { Pool } = require('pg');
  
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
  });
  
  pool.connect()
    .then(() => {
      console.log('✅ Conexão com banco OK!');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Erro na conexão:', err.message);
      process.exit(1);
    });
} else {
  console.log('❌ Variáveis de ambiente não configuradas!');
  process.exit(1);
}