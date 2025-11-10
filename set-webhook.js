require('dotenv').config();
const https = require('https');

const token = process.env.TELEGRAM_BOT_TOKEN;
const webhookUrl = process.env.WEBHOOK_URL || process.env.VERCEL_URL;

if (!token) {
  console.error("❌ Error: TELEGRAM_BOT_TOKEN not found in .env file");
  process.exit(1);
}

if (!webhookUrl) {
  console.error("❌ Error: WEBHOOK_URL not found in .env file");
  console.log("\n💡 Add this to your .env file:");
  console.log("   WEBHOOK_URL=https://your-vercel-url.vercel.app");
  process.exit(1);
}

const fullWebhookUrl = `${webhookUrl}/api/webhook`;
const url = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(
  fullWebhookUrl
)}`;

console.log(`🔧 Setting webhook to: ${fullWebhookUrl}\n`);

https
  .get(url, (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      const response = JSON.parse(data);
      if (response.ok) {
        console.log("✅ Webhook set successfully!");
        console.log("\n📊 Response:", JSON.stringify(response, null, 2));
        console.log("\n🎉 Your bot is now ready to receive messages!");
        console.log("\n💡 Test it:");
        console.log("   1. Open Telegram");
        console.log("   2. Send /start to your bot");
        console.log("   3. Try: 100 Coffee");
      } else {
        console.log("❌ Failed to set webhook");
        console.log("Response:", JSON.stringify(response, null, 2));
      }
    });
  })
  .on("error", (err) => {
    console.error("❌ Error:", err.message);
  });
