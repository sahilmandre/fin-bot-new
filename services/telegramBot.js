const TelegramBot = require("node-telegram-bot-api");
const config = require("../config/config");

class TelegramBotService {
  constructor() {
    // Use webhook for serverless, polling for local
    const useWebhook = process.env.VERCEL || process.env.NODE_ENV === 'production';
    this.bot = new TelegramBot(config.telegram.token, { polling: !useWebhook });
    this.useWebhook = useWebhook;
  }

  async setWebhook(url) {
    if (this.useWebhook) {
      await this.bot.setWebHook(`${url}/webhook`);
      console.log('Webhook set successfully');
    }
  }

  processUpdate(update) {
    if (this.useWebhook) {
      this.bot.processUpdate(update);
    }
  }

  sendMessage(chatId, message, options = {}) {
    return this.bot.sendMessage(chatId, message, options);
  }

  sendDocument(chatId, buffer, options = {}, fileOptions = {}) {
    return this.bot.sendDocument(chatId, buffer, options, fileOptions);
  }

  onText(regex, callback) {
    this.bot.onText(regex, callback);
  }

  on(event, callback) {
    this.bot.on(event, (msg) => {
      // Log chatId for debugging
      if (msg.chat && msg.chat.id) {
        console.log(
          `📱 Message from Chat ID: ${msg.chat.id} (${
            msg.chat.first_name || "Unknown"
          })`
        );
      }
      callback(msg);
    });
  }

  splitMessage(message) {
    const maxLength = config.app.maxMessageLength;
    const parts = [];
    let currentPart = "";

    message.split("\n\n").forEach((part) => {
      if (currentPart.length + part.length > maxLength) {
        parts.push(currentPart);
        currentPart = part + "\n\n";
      } else {
        currentPart += part + "\n\n";
      }
    });

    if (currentPart.length > 0) {
      parts.push(currentPart);
    }

    return parts;
  }
}

module.exports = TelegramBotService;