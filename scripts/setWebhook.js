const config = require('../config/config');

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://fin-bot-new.vercel.app';

async function setWebhook() {
  const url = `https://api.telegram.org/bot${config.telegram.token}/setWebhook?url=${WEBHOOK_URL}/api/webhook`;
  
  console.log(`\n🔧 Setting webhook to: ${WEBHOOK_URL}/api/webhook\n`);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.ok) {
      console.log('✅ Webhook set successfully!');
      console.log('Description:', data.description);
      
      // Verify it was set
      console.log('\n📡 Verifying webhook...\n');
      const verifyResponse = await fetch(`https://api.telegram.org/bot${config.telegram.token}/getWebhookInfo`);
      const verifyData = await verifyResponse.json();
      console.log('Current webhook URL:', verifyData.result.url);
    } else {
      console.error('❌ Failed to set webhook:', data.description);
    }
  } catch (error) {
    console.error('❌ Error setting webhook:', error.message);
  }
}

setWebhook();
