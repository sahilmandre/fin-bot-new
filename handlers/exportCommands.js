const MessageFormatter = require("../utils/messageFormatter");

class ExportCommandsHandler {
  constructor(botService, sheetsService) {
    this.bot = botService;
    this.sheets = sheetsService;
  }

  register() {
    this.bot.onText(/\/export/, this.handleExport.bind(this));
    this.bot.onText(/^\/category(?:\s+(.+))?$/, this.handleCategory.bind(this));
  }

  async handleExport(msg) {
    const chatId = msg.chat.id;
    try {
      const entries = await this.sheets.getAllEntries();
      if (!entries || entries.length === 0) {
        this.bot.sendMessage(chatId, "No entries found to export.");
        return;
      }

      const csvData = MessageFormatter.formatCSV(entries);
      const buffer = Buffer.from(csvData, "utf-8");
      this.bot.sendDocument(
        chatId,
        buffer,
        {},
        { filename: "expenses.csv", contentType: "text/csv" }
      );
    } catch (error) {
      console.error("Error exporting data:", error);
      this.bot.sendMessage(chatId, "There was an error exporting the data. Please try again later.");
    }
  }

  async handleCategory(msg, match) {
    const chatId = msg.chat.id;

    if (!match[1]) {
      this.bot.sendMessage(chatId, "Please provide a category in the proper format, e.g., /category Food");
      return;
    }

    const categoryToFilter = match[1].trim();

    try {
      const entries = await this.sheets.getAllEntries();
      const filteredEntries = entries.filter(
        (entry) => entry.category.toLowerCase() === categoryToFilter.toLowerCase()
      );

      if (filteredEntries.length === 0) {
        this.bot.sendMessage(chatId, `No entries found for category "${categoryToFilter}".`);
        return;
      }

      const message = MessageFormatter.formatCategoryEntries(filteredEntries, categoryToFilter);
      this.bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    } catch (error) {
      console.error("Error filtering by category:", error);
      this.bot.sendMessage(chatId, "There was an error fetching category data. Please try again later.");
    }
  }
}

module.exports = ExportCommandsHandler;