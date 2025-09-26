const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('🧪 Testando API de configurações...');
    
    const response = await fetch('http://192.168.18.12:5000/api/app-settings');
    
    console.log('Status:', response.status);
    console.log('Headers:', response.headers.raw());
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Dados recebidos:', data);
    } else {
      console.log('❌ Erro na resposta:', response.statusText);
      const text = await response.text();
      console.log('Corpo da resposta:', text);
    }
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

testAPI();