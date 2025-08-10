const TelegramBotService = require("./services/telegramBot");
const GoogleSheetsService = require("./services/googleSheets");
const BasicCommandsHandler = require("./handlers/basicCommands");
const EntryCommandsHandler = require("./handlers/entryCommands");
const BudgetCommandsHandler = require("./handlers/budgetCommands");
const ExportCommandsHandler = require("./handlers/exportCommands");
const SummaryCommandsHandler = require("./handlers/summaryCommands");
const SplitCommandsHandler = require("./handlers/splitCommands");

// Initialize services and handlers
const botService = new TelegramBotService();
const sheetsService = new GoogleSheetsService();

[BasicCommandsHandler, EntryCommandsHandler, BudgetCommandsHandler, ExportCommandsHandler, SummaryCommandsHandler, SplitCommandsHandler]
  .forEach(Handler => new Handler(botService, sheetsService).register());

// Set webhook for production
if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  const webhookUrl = process.env.WEBHOOK_URL || 'https://fin-bot-new.vercel.app';
  botService.setWebhook(webhookUrl).catch(console.error);
}

module.exports = { botService, sheetsService };