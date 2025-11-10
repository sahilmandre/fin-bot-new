require("dotenv").config();

module.exports = {
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN,
  },
  mongodb: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/finbot",
  },
  server: {
    port: process.env.PORT || 3000,
  },
  app: {
    defaultBudget: 6000,
    maxMessageLength: 4096,
    webhookUrl: process.env.WEBHOOK_URL || process.env.VERCEL_URL,
  },
};