const dotenv = require('dotenv');
dotenv.config();

const apiKey = (process.env.GEMINI_API_KEY || '').replace(/\s+/g, '').trim();

async function check() {
  try {
    // Проверяем через v1beta
    let res = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      headers: { 'x-goog-api-key': apiKey }
    });
    let data = await res.json();

    // Если в v1beta пусто, пробуем v1
    if (!data.models) {
      res = await fetch('https://generativelanguage.googleapis.com/v1/models', {
        headers: { 'x-goog-api-key': apiKey }
      });
      data = await res.json();
    }

    if (data.models) {
      console.log('\n--- ДОСТУПНЫЕ ДЛЯ ВАС МОДЕЛИ ---');
      data.models
        .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
        .forEach(m => console.log(m.name));
      console.log('--------------------------------\n');
    } else {
      console.log('Ответ API:', data);
    }
  } catch (err) {
    console.error('Ошибка проверки:', err);
  }
}

check();