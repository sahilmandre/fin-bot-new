class BudgetCommandsHandler {
  constructor(botService, sheetsService) {
    this.bot = botService;
    this.sheets = sheetsService;
  }

  register() {
    this.bot.onText(/\/setbudget (\d+)/, this.handleSetBudget.bind(this));
  }

  async handleSetBudget(msg, match) {
    const chatId = msg.chat.id;
    const username = msg.chat.username || msg.chat.first_name || "Unknown";

    if (!match || !match[1]) {
      this.bot.sendMessage(
        chatId,
        "Please provide a valid budget amount, e.g., /setbudget 7000"
      );
      return;
    }

    const newBudget = parseFloat(match[1]);
    if (isNaN(newBudget) || newBudget < 0) {
      this.bot.sendMessage(chatId, "The budget must be a positive number.");
      return;
    }

    try {
      await this.sheets.updateBudget(newBudget, chatId, username);
      this.bot.sendMessage(chatId, `Budget has been updated to ${newBudget}`);
    } catch (error) {
      console.error("Error updating budget:", error);
      this.bot.sendMessage(chatId, "Error updating budget. Please try again.");
    }
  }
}

module.exports = BudgetCommandsHandler;