const config = require('../config/config');

async function checkWebhook() {
  const url = `https://api.telegram.org/bot${config.telegram.token}/getWebhookInfo`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('\n📡 Webhook Status:');
    console.log('=====================================');
    console.log('URL:', data.result.url || '❌ Not set');
    console.log('Pending updates:', data.result.pending_update_count);
    console.log('Last error:', data.result.last_error_message || '✅ None');
    console.log('Last error date:', data.result.last_error_date ? new Date(data.result.last_error_date * 1000).toLocaleString() : 'N/A');
    console.log('=====================================\n');
    
    if (!data.result.url) {
      console.log('⚠️  Webhook is NOT set!\n');
      console.log('To set webhook, run:');
      console.log(`curl "https://api.telegram.org/bot${config.telegram.token}/setWebhook?url=https://fin-bot-new.vercel.app/api/webhook"`);
    } else if (data.result.url !== 'https://fin-bot-new.vercel.app/api/webhook') {
      console.log('⚠️  Webhook is set to a different URL!\n');
      console.log('Expected: https://fin-bot-new.vercel.app/api/webhook');
      console.log('Current:', data.result.url);
    } else {
      console.log('✅ Webhook is correctly configured!');
    }
  } catch (error) {
    console.error('❌ Error checking webhook:', error.message);
  }
}

checkWebhook();
