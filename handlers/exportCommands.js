const DateUtils = require("../utils/dateUtils");
const CSVGenerator = require("../utils/csvGenerator");
const MessageFormatter = require("../utils/messageFormatter");

class ExportCommandsHandler {
  constructor(botService, mongoService) {
    this.bot = botService;
    this.mongo = mongoService;
  }

  register() {
    this.bot.onText(/\/export(?:\s+(.*))?$/, this.handleExport.bind(this));
  }

  async handleExport(msg, match) {
    const chatId = msg.chat.id;
    const monthInput = match[1] ? match[1].trim() : null;

    try {
      // Parse month input or default to current month
      const { month, year } = this.parseMonthInput(monthInput);

      // Generate month export
      await this.generateMonthExport(chatId, year, month);
    } catch (error) {
      if (error.message === "Invalid month format") {
        this.bot.sendMessage(
          chatId,
          "Invalid month format. Use: /export Jun or /export June or /export 6\n\n" +
            "Examples:\n" +
            "• /export (current month)\n" +
            "• /export Nov\n" +
            "• /export November\n" +
            "• /export 11"
        );
      } else {
        console.error("Error in /export command:", error);
        this.bot.sendMessage(
          chatId,
          "Error generating export. Please try again."
        );
      }
    }
  }

  parseMonthInput(monthStr) {
    try {
      return DateUtils.parseMonth(monthStr);
    } catch (error) {
      throw new Error("Invalid month format");
    }
  }

  async generateMonthExport(chatId, year, month) {
    // Get transactions for the month
    const transactions = await this.mongo.getTransactionsByMonth(
      chatId,
      year,
      month
    );

    // Get month name
    const monthName = DateUtils.getMonthName(month);

    // Handle empty transaction list
    if (transactions.length === 0) {
      this.bot.sendMessage(
        chatId,
        `No transactions found for ${monthName} ${year}`
      );
      return;
    }

    // Generate CSV
    const csvString = CSVGenerator.generateCSV(transactions);
    const csvBuffer = CSVGenerator.createBuffer(csvString);

    // Get monthly stats for overview
    const stats = await this.mongo.getMonthlyStats(chatId, year, month);

    // Format overview message
    const overviewMessage = MessageFormatter.formatMonthOverview(
      monthName,
      year,
      stats
    );

    // Send CSV file
    const filename = `expenses_${monthName}_${year}.csv`;
    await this.bot.sendDocument(
      chatId,
      csvBuffer,
      {},
      {
        filename: filename,
        contentType: "text/csv",
      }
    );

    // Send overview message
    this.bot.sendMessage(chatId, overviewMessage, { parse_mode: "Markdown" });
  }
}

module.exports = ExportCommandsHandler;
