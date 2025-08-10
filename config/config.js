require("dotenv").config();

const key = process.env.GOOGLE_PRIVATE_KEY;
const private_key = key.includes("\\n") ? key.replace(/\\n/g, "\n") : key;

module.exports = {
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN,
  },
  google: {
    privateKey: private_key,
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
    sheetId: process.env.GOOGLE_SHEET_ID,
  },
  server: {
    port: process.env.PORT || 3000,
  },
  app: {
    defaultBudget: 6000,
    sheetRange: "Sheet1!A2:D",
    maxMessageLength: 4096,
    webhookUrl: process.env.WEBHOOK_URL || process.env.VERCEL_URL,
  },
};