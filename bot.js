require("./server");
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

console.log("Bot is running...");