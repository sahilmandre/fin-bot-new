const DateUtils = require('../utils/dateUtils');
const MessageFormatter = require('../utils/messageFormatter');

class CompareCommandsHandler {
  constructor(botService, mongoService) {
    this.bot = botService;
    this.mongo = mongoService;
  }

  register() {
    this.bot.onText(/\/compare\s+(\S+)\s+(\S+)/, this.handleCompare.bind(this));
  }

  async handleCompare(msg, match) {
    const chatId = msg.chat.id;

    // Check if both months are provided
    if (!match[1] || !match[2]) {
      this.bot.sendMessage(
        chatId,
        'Usage: /compare <month1> <month2>\n\n' +
        'Example: /compare Oct Nov'
      );
      return;
    }

    const month1Input = match[1].trim();
    const month2Input = match[2].trim();

    try {
      // Parse both month inputs
      const month1 = DateUtils.parseMonth(month1Input);
      const month2 = DateUtils.parseMonth(month2Input);

      // Get statistics for both months
      const stats1 = await this.mongo.getMonthlyStats(chatId, month1.year, month1.month);
      const stats2 = await this.mongo.getMonthlyStats(chatId, month2.year, month2.month);

      // Get month names
      const month1Name = DateUtils.getMonthName(month1.month);
      const month2Name = DateUtils.getMonthName(month2.month);

      // Format and send comparison report
      const message = MessageFormatter.formatMonthComparison(
        month1Name,
        month1.year,
        stats1,
        month2Name,
        month2.year,
        stats2
      );

      this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      if (error.message === 'Invalid month format') {
        this.bot.sendMessage(
          chatId,
          'Invalid month format. Use: /compare Oct Nov\n\n' +
          'Examples:\n' +
          '• /compare Oct Nov\n' +
          '• /compare October November\n' +
          '• /compare 10 11'
        );
      } else {
        console.error('Error in /compare command:', error);
        this.bot.sendMessage(
          chatId,
          'Error generating comparison. Please try again.'
        );
      }
    }
  }
}

module.exports = CompareCommandsHandler;
