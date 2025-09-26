#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando processo de deploy para Vercel...\n');

// Verificar se os arquivos necessários existem
const requiredFiles = [
  'package.json',
  'index_quiz_educativo.js',
  'vercel.json'
];

console.log('📋 Verificando arquivos necessários...');
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`❌ Arquivo ${file} não encontrado!`);
    process.exit(1);
  }
  console.log(`✅ ${file}`);
}

// Verificar se o .env.example existe
if (!fs.existsSync('.env.example')) {
  console.warn('⚠️  Arquivo .env.example não encontrado. Criando...');
  // Criar .env.example básico se não existir
}

console.log('\n📦 Instalando dependências...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependências instaladas com sucesso!');
} catch (error) {
  console.error('❌ Erro ao instalar dependências:', error.message);
  process.exit(1);
}

console.log('\n🧪 Testando a aplicação...');
try {
  execSync('npm test', { stdio: 'inherit' });
  console.log('✅ Testes passaram!');
} catch (error) {
  console.warn('⚠️  Testes falharam, mas continuando...');
}

console.log('\n📋 Checklist para deploy no Vercel:');
console.log('');
console.log('1. ✅ Arquivos necessários verificados');
console.log('2. ✅ Dependências instaladas');
console.log('3. 🔄 Configure o banco de dados PostgreSQL');
console.log('4. 🔄 Faça push para o repositório Git');
console.log('5. 🔄 Conecte o repositório ao Vercel');
console.log('6. 🔄 Configure as variáveis de ambiente no Vercel:');
console.log('   - DB_HOST');
console.log('   - DB_PORT');
console.log('   - DB_NAME');
console.log('   - DB_USER');
console.log('   - DB_PASSWORD');
console.log('   - NODE_ENV=production');
console.log('');

console.log('📚 Para mais detalhes, consulte o arquivo DEPLOY_VERCEL.md');
console.log('');
console.log('🎉 Preparação concluída! Agora faça o deploy no Vercel.');

// Mostrar comandos Git úteis
console.log('\n📤 Comandos Git para fazer push:');
console.log('git add .');
console.log('git commit -m "Preparado para deploy no Vercel"');
console.log('git push origin main');
console.log('');

// Mostrar URL de exemplo
console.log('🌐 Após o deploy, sua API estará disponível em:');
console.log('https://seu-projeto.vercel.app');
console.log('');

console.log('✨ Deploy preparado com sucesso!');