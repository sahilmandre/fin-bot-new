const MessageFormatter = require("../utils/messageFormatter");

class SplitCommandsHandler {
  constructor(botService, sheetsService) {
    this.bot = botService;
    this.sheets = sheetsService;
  }

  register() {
    this.bot.onText(/\/split\s+(.+)/i, this.handleSplit.bind(this));
  }

  async handleSplit(msg, match) {
    const chatId = msg.chat.id;
    const text = match[1].trim();
    const tokens = text.split(/\s+/);

    if (tokens.length < 3) {
      this.bot.sendMessage(chatId, "Usage: /split <total_amount> <description> @user1:amount @user2:amount ...");
      return;
    }

    const totalAmount = parseFloat(tokens[0]);
    if (isNaN(totalAmount)) {
      this.bot.sendMessage(chatId, "Invalid total amount specified.");
      return;
    }

    let descriptionTokens = [];
    let splitTokens = [];
    
    for (let token of tokens.slice(1)) {
      if (token.startsWith("@")) {
        splitTokens.push(token);
      } else {
        if (splitTokens.length === 0) {
          descriptionTokens.push(token);
        } else {
          descriptionTokens.push(token);
        }
      }
    }

    if (splitTokens.length === 0) {
      this.bot.sendMessage(chatId, "Please specify at least one participant with a custom split amount (e.g., @alice:30).");
      return;
    }

    const description = descriptionTokens.join(" ");
    let splitData = [];
    let sumSplit = 0;

    for (let token of splitTokens) {
      const parts = token.slice(1).split(":");
      if (parts.length !== 2) {
        this.bot.sendMessage(chatId, `Invalid format for participant: ${token}. Use @username:amount`);
        return;
      }
      
      const username = parts[0];
      const share = parseFloat(parts[1]);
      if (isNaN(share)) {
        this.bot.sendMessage(chatId, `Invalid amount for participant: ${token}`);
        return;
      }
      
      sumSplit += share;
      splitData.push({ username, share });
    }

    if (Math.abs(sumSplit - totalAmount) > 0.01) {
      this.bot.sendMessage(
        chatId,
        `The sum of individual amounts (₹${sumSplit.toFixed(2)}) does not match the total amount (₹${totalAmount.toFixed(2)}). Please check your entries.`
      );
      return;
    }

    try {
      const promises = splitData.map(({ username, share }) =>
        this.sheets.addEntry(share, `Split: ${description}`, username)
      );
      
      await Promise.all(promises);
      const message = MessageFormatter.formatSplitSummary(totalAmount, description, splitData);
      this.bot.sendMessage(chatId, message);
    } catch (error) {
      console.error("Error processing custom split expense:", error);
      this.bot.sendMessage(chatId, "Error processing custom split expense. Please try again.");
    }
  }
}

module.exports = SplitCommandsHandler;