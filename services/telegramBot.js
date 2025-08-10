const TelegramBot = require("node-telegram-bot-api");
const config = require("../config/config");

class TelegramBotService {
  constructor() {
    this.bot = new TelegramBot(config.telegram.token, { polling: true });
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
    this.bot.on(event, callback);
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