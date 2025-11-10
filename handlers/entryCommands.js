const MessageFormatter = require("../utils/messageFormatter");

class EntryCommandsHandler {
  constructor(botService, sheetsService) {
    this.bot = botService;
    this.sheets = sheetsService;
  }

  register() {
    this.bot.onText(/\/lastentry/, this.handleLastEntry.bind(this));
    this.bot.onText(/\/removelastentry/, this.handleRemoveLastEntry.bind(this));
    this.bot.onText(/\/view/, this.handleView.bind(this));
    this.bot.on("message", this.handleAddEntry.bind(this));
  }

  async handleLastEntry(msg) {
    const chatId = msg.chat.id;
    try {
      const lastEntry = await this.sheets.getLastEntry(chatId);
      if (!lastEntry) {
        this.bot.sendMessage(chatId, "No entries found.");
        return;
      }
      const message = MessageFormatter.formatLastEntry(lastEntry);
      this.bot.sendMessage(chatId, message);
    } catch (error) {
      console.error("Error fetching last entry:", error);
      this.bot.sendMessage(chatId, "There was an error fetching your last entry. Please try again.");
    }
  }

  async handleRemoveLastEntry(msg) {
    const chatId = msg.chat.id;
    try {
      const removedEntry = await this.sheets.deleteLastEntry(chatId);
      const message = MessageFormatter.formatRemovedEntry(removedEntry);
      this.bot.sendMessage(chatId, message);
    } catch (error) {
      console.error("Error removing last entry:", error);
      this.bot.sendMessage(chatId, "There was an error removing the last entry. Please try again.");
    }
  }

  async handleView(msg) {
    const chatId = msg.chat.id;
    try {
      const entries = await this.sheets.getAllEntries(chatId);
      if (entries.length === 0) {
        this.bot.sendMessage(chatId, "No entries found.");
        return;
      }

      const message = MessageFormatter.formatViewEntries(entries);
      const parts = this.bot.splitMessage(message);
      
      for (const part of parts) {
        this.bot.sendMessage(chatId, part, { parse_mode: "Markdown" });
      }
    } catch (error) {
      console.error("Error fetching entries:", error);
      this.bot.sendMessage(chatId, "There was an error fetching your entries. Please try again.");
    }
  }

  async handleAddEntry(msg) {
    if (!msg.text || msg.text.startsWith("/")) return;

    const chatId = msg.chat.id;
    const text = msg.text.trim();
    const username = msg.chat.username || msg.chat.first_name || "Unknown";
    const regex = /^(\d+)\s+(.+)$/;
    const match = text.match(regex);

    if (match) {
      const amount = match[1];
      const description = match[2];
      await this.addEntryToSheet(chatId, amount, description, username);
    } else {
      this.bot.sendMessage(chatId, 'Please send the amount and description in the format: "100 Grocery".');
    }
  }

  async addEntryToSheet(chatId, amount, description, username) {
    try {
      await this.sheets.addEntry(amount, description, username, chatId);
      const currentBudget = await this.sheets.getBudget(chatId);
      const totalSpent = await this.sheets.calculateTotalSpent(chatId);
      const remainingAmount = currentBudget - totalSpent;

      const message = MessageFormatter.formatEntryConfirmation(
        description, username, totalSpent, amount, remainingAmount
      );
      this.bot.sendMessage(chatId, message);
    } catch (error) {
      console.error("Error adding entry to sheet:", error);
      this.bot.sendMessage(chatId, "There was an error adding your entry. Please try again.");
    }
  }
}

module.exports = EntryCommandsHandler;