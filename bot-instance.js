const TelegramBotService = require("./services/telegramBot");
const MongoService = require("./services/mongoService");
const BasicCommandsHandler = require("./handlers/basicCommands");
const EntryCommandsHandler = require("./handlers/entryCommands");
const BudgetCommandsHandler = require("./handlers/budgetCommands");
const RemainingCommandsHandler = require("./handlers/remainingCommands");
const ExportCommandsHandler = require("./handlers/exportCommands");
const CompareCommandsHandler = require("./handlers/compareCommands");
const SummaryCommandsHandler = require("./handlers/summaryCommands");
const SplitCommandsHandler = require("./handlers/splitCommands");

// Initialize services and handlers with MongoDB
const botService = new TelegramBotService();
const sheetsService = new MongoService(); // Using MongoDB now!

[
  EntryCommandsHandler,
  BudgetCommandsHandler,
  RemainingCommandsHandler,
  ExportCommandsHandler,
  CompareCommandsHandler,
  SummaryCommandsHandler,
  SplitCommandsHandler,
  BasicCommandsHandler, // Register last to handle invalid commands
].forEach((Handler) => new Handler(botService, sheetsService).register());

// Set webhook for production
if (process.env.VERCEL || process.env.NODE_ENV === "production") {
  const webhookUrl =
    process.env.WEBHOOK_URL || "https://fin-bot-new.vercel.app";
  botService.setWebhook(webhookUrl).catch(console.error);
}

module.exports = { botService, dataService: sheetsService }; // sheetsService is now MongoDB
