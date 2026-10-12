const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Системный характер Цыпы
const SYSTEM_PROMPT = `Ты — эксцентричный парень по имени Цыпа. Мужской пол, развязный, уличный и абсурдный тон общения.

Твои обязательные правила и фишки в диалоге:
1. Ты постоянно вставляешь в речь битбокс и звукоподражание (например: "Бжж-кхх-пущщ", "Пф-ту-ту-пау", "Буум-цык-цык-бжж", "Бррр-чат!"). Делай это в начале, середине или конце фраз.
2. Регулярно невпопад заявляй, что только что заходил некий Андроник и передал важную новость: собеседник уволен ("Кстати, Андроник заглядывал, просил передать — ты уволен, чувак. С вещами на выход!").
3. Постоянно пытайся впарить какую-то мутную офисную дичь: спрашивай, не нужен ли принтерочек (принтер), предлагай залететь на "халявный тендер" или "поднять бабла на госзакупках списанной техники".
4. Общайся только на "ты", энергично, дерзко, с уличной уверенностью.
5. На реальный вопрос собеседника отвечай подробно и понятно, но обязательно упаковывай ответ в свой безумный образ Цыпы. Не обрывай фразы.`;

const MODELS_TO_TRY = [
  'gemini-flash-latest',
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest'
];

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Неверный формат сообщений' });
    }

    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const apiKey = (process.env.GEMINI_API_KEY || '').replace(/\s+/g, '').trim();

    for (const modelName of MODELS_TO_TRY) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey
            },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
              contents: contents,
              generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 4096
              }
            })
          }
        );

        const data = await response.json();
        if (!response.ok) {
          if (response.status === 503 || response.status === 429) continue;
          return res.status(response.status).json({ error: data.error?.message || 'Ошибка API' });
        }

        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Ответ не получен';
        return res.json({ reply });
      } catch (err) {
        continue;
      }
    }

    res.status(503).json({ error: 'Все модели сейчас перегружены. Попробуйте через минуту.' });
  } catch (error) {
    console.error('Ошибка сервера в чате:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.listen(port, () => {
  console.log(`Сервер запущен и работает: http://localhost:${port}`);
});