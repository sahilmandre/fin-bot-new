class BasicCommandsHandler {
  constructor(botService, sheetsService) {
    this.bot = botService;
    this.sheets = sheetsService;
  }

  register() {
    this.bot.onText(/\/start/, this.handleStart.bind(this));
    this.bot.onText(/\/instructions/, this.handleInstructions.bind(this));
    this.bot.onText(/\/(?!start|instructions|lastentry|view|removelastentry|setbudget|export|category|summary|split).*/, this.handleInvalidCommand.bind(this));
  }

  handleStart(msg) {
    const chatId = msg.chat.id;
    this.bot.sendMessage(
      chatId,
      'Welcome! Send me the amount and what it was spent on, like this: "100 Grocery".'
    );
  }

  handleInstructions(msg) {
    const chatId = msg.chat.id;
    const instructions = 
      "To add an entry, send me the amount and what it was spent on, like this: '100 Grocery'.\n\n" +
      "Available commands:\n" +
      "/start - Start the bot\n" +
      "/instructions - Show instructions\n" +
      "/lastentry - View the last entry\n" +
      "/view - View all entries\n" +
      "/removelastentry - Remove the last entry\n" +
      "/setbudget <amount> - Set a custom budget (stored in cell I1)\n" +
      "/export - Export all expenses as a CSV file\n" +
      "/category <category> - Filter spending by category. To get result for a specific category, e.g., /category Food\n" +
      "/summary - Get a summary of your expenses. To get a specific summary, e.g., /summary daily/weekly/monthly or /summary custom 2023-07-01 2023-07-31\n";
    
    this.bot.sendMessage(chatId, instructions);
  }

  handleInvalidCommand(msg) {
    const chatId = msg.chat.id;
    this.bot.sendMessage(
      chatId,
      "Sorry, I didn't understand that. Please use one of the following commands: /start, /instructions, /lastentry, /view, /removelastentry, /setbudget or /summary."
    );
  }
}

module.exports = BasicCommandsHandler;