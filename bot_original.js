const createServer = require("./server");
const TelegramBotService = require("./services/telegramBot");
const GoogleSheetsService = require("./services/googleSheets");

// Command Handlers
const BasicCommandsHandler = require("./handlers/basicCommands");
const EntryCommandsHandler = require("./handlers/entryCommands");
const BudgetCommandsHandler = require("./handlers/budgetCommands");
const ExportCommandsHandler = require("./handlers/exportCommands");
const SummaryCommandsHandler = require("./handlers/summaryCommands");
const SplitCommandsHandler = require("./handlers/splitCommands");

// Initialize services
const botService = new TelegramBotService();
const sheetsService = new GoogleSheetsService();

// Initialize handlers
const basicHandler = new BasicCommandsHandler(botService, sheetsService);
const entryHandler = new EntryCommandsHandler(botService, sheetsService);
const budgetHandler = new BudgetCommandsHandler(botService, sheetsService);
const exportHandler = new ExportCommandsHandler(botService, sheetsService);
const summaryHandler = new SummaryCommandsHandler(botService, sheetsService);
const splitHandler = new SplitCommandsHandler(botService, sheetsService);

// Register all handlers
basicHandler.register();
entryHandler.register();
budgetHandler.register();
exportHandler.register();
summaryHandler.register();
splitHandler.register();

// Start server
createServer();

console.log("Bot is running...");