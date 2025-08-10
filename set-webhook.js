require('dotenv').config();
const https = require('https');

const token = process.env.TELEGRAM_BOT_TOKEN;
const webhookUrl = 'https://fin-bot-new.vercel.app/api/webhook';

const url = `https://api.telegram.org/bot${token}/setWebhook?url=${webhookUrl}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Webhook response:', JSON.parse(data));
  });
}).on('error', (err) => {
  console.error('Error:', err);
});