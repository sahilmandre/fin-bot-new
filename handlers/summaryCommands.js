const DateUtils = require("../utils/dateUtils");
const MessageFormatter = require("../utils/messageFormatter");

class SummaryCommandsHandler {
  constructor(botService, sheetsService) {
    this.bot = botService;
    this.sheets = sheetsService;
  }

  register() {
    this.bot.onText(/\/summary(?:\s+(.*))?$/, this.handleSummary.bind(this));
  }

  async handleSummary(msg, match) {
    const chatId = msg.chat.id;

    if (!match[1] || match[1].trim() === "") {
      this.bot.sendMessage(chatId, "Usage: /summary [daily|weekly|monthly|custom YYYY-MM-DD YYYY-MM-DD]");
      return;
    }

    const args = match[1].trim().split(/\s+/);
    const period = args[0].toLowerCase();

    try {
      let startDate, endDate;

      switch (period) {
        case "daily":
          ({ startDate, endDate } = DateUtils.getDailyRange());
          break;
        case "weekly":
          ({ startDate, endDate } = DateUtils.getWeeklyRange());
          break;
        case "monthly":
          ({ startDate, endDate } = DateUtils.getMonthlyRange());
          break;
        case "custom":
          if (args.length < 3) {
            this.bot.sendMessage(chatId, "Usage for custom period: /summary custom YYYY-MM-DD YYYY-MM-DD");
            return;
          }
          try {
            ({ startDate, endDate } = DateUtils.getCustomRange(args[1], args[2]));
          } catch (error) {
            this.bot.sendMessage(chatId, "Invalid date format. Please use YYYY-MM-DD.");
            return;
          }
          break;
        default:
          this.bot.sendMessage(chatId, "Invalid period specified. Use daily, weekly, monthly, or custom.");
          return;
      }

      const entries = await this.sheets.getAllEntries();
      const filteredEntries = DateUtils.filterEntriesByDateRange(entries, startDate, endDate);

      if (filteredEntries.length === 0) {
        this.bot.sendMessage(chatId, "No expense entries found for the selected period.");
        return;
      }

      let totalExpense = 0;
      const categoryTotals = {};

      filteredEntries.forEach((entry) => {
        const amount = parseFloat(entry.amount) || 0;
        totalExpense += amount;
        const cat = (entry.category || "Uncategorized").toLowerCase();
        categoryTotals[cat] = (categoryTotals[cat] || 0) + amount;
      });

      const message = MessageFormatter.formatSummary(period, startDate, endDate, totalExpense, categoryTotals);
      this.bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    } catch (error) {
      console.error("Error generating summary report:", error);
      this.bot.sendMessage(chatId, "Error generating the summary report. Please try again.");
    }
  }
}

module.exports = SummaryCommandsHandler;