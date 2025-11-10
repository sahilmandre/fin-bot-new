const MessageFormatter = require('../utils/messageFormatter');

class RemainingCommandsHandler {
  constructor(botService, mongoService) {
    this.bot = botService;
    this.mongo = mongoService;
  }

  register() {
    this.bot.onText(/\/remaining/, this.handleRemaining.bind(this));
  }

  async handleRemaining(msg) {
    const chatId = msg.chat.id;

    try {
      // Get current year and month
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();

      // Get monthly remaining budget
      const result = await this.mongo.getMonthlyRemainingBudget(chatId, year, month);

      // Calculate percentage
      const percentage = this.calculatePercentage(result.remaining, result.budget);

      // Get status emoji
      const emoji = this.getStatusEmoji(result.remaining, result.budget);

      // Format and send message
      const message = MessageFormatter.formatRemainingBudget(
        result.monthName,
        result.year,
        result.budget,
        result.totalSpent,
        result.remaining,
        percentage,
        emoji
      );

      this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error in /remaining command:', error);
      this.bot.sendMessage(
        chatId,
        'Error retrieving budget information. Please try again.'
      );
    }
  }

  getStatusEmoji(remaining, budget) {
    if (remaining <= 0) return '🚫';
    
    const percentage = (remaining / budget) * 100;
    if (percentage < 20) return '⚠️';
    
    return '✅';
  }

  calculatePercentage(remaining, budget) {
    if (budget === 0) return 0;
    return (remaining / budget) * 100;
  }
}

module.exports = RemainingCommandsHandler;
