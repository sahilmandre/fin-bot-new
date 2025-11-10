const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const config = require('../config/config');

class MongoService {
  constructor() {
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) return;

    try {
      await mongoose.connect(config.mongodb.uri);
      this.isConnected = true;
      console.log("Connected to MongoDB successfully");
    } catch (error) {
      console.error("MongoDB connection error:", error);
      throw error;
    }
  }

  async getBudget(chatId = null) {
    await this.connect();

    // For backward compatibility, use default chatId if not provided
    const targetChatId = chatId || config.app.defaultChatId || 0;

    const budget = await Budget.findOne({ chatId: targetChatId });
    return budget ? budget.amount : config.app.defaultBudget;
  }

  async updateBudget(newBudget, chatId = null, username = "Unknown") {
    await this.connect();

    const targetChatId = chatId || config.app.defaultChatId || 0;

    await Budget.findOneAndUpdate(
      { chatId: targetChatId },
      {
        amount: newBudget,
        username: username,
        startDate: new Date(),
      },
      {
        upsert: true,
        new: true,
      }
    );
  }

  async getLastEntry(chatId = null) {
    await this.connect();

    const query = chatId ? { chatId } : {};
    const transaction = await Transaction.findOne(query).sort({
      createdAt: -1,
    });

    if (!transaction) return null;

    return {
      date: transaction.date.toLocaleString(),
      amount: transaction.amount.toString(),
      category: transaction.category,
      username: transaction.username,
    };
  }

  async deleteLastEntry(chatId = null) {
    await this.connect();

    const query = chatId ? { chatId } : {};
    const transaction = await Transaction.findOne(query).sort({
      createdAt: -1,
    });

    if (!transaction) {
      throw new Error("No entries found.");
    }

    const deletedEntry = {
      date: transaction.date.toLocaleString(),
      amount: transaction.amount.toString(),
      category: transaction.category,
      username: transaction.username,
    };

    await Transaction.findByIdAndDelete(transaction._id);
    return deletedEntry;
  }

  async addEntry(amount, description, username, chatId = null) {
    await this.connect();

    const targetChatId = chatId || config.app.defaultChatId || 0;

    const transaction = new Transaction({
      amount: parseFloat(amount),
      category: description,
      username: username,
      chatId: targetChatId,
      description: description,
    });

    await transaction.save();
  }

  async getAllEntries(chatId = null) {
    await this.connect();

    const query = chatId ? { chatId } : {};
    const transactions = await Transaction.find(query).sort({ createdAt: -1 });

    return transactions.map((transaction) => ({
      date: transaction.date.toLocaleString(),
      amount: transaction.amount.toString(),
      category: transaction.category,
      username: transaction.username,
    }));
  }

  async calculateTotalSpent(chatId = null) {
    await this.connect();

    const query = chatId ? { chatId } : {};
    const result = await Transaction.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    return result.length > 0 ? result[0].total : 0;
  }

  // Additional MongoDB-specific methods for enhanced functionality
  async getEntriesByCategory(category, chatId = null) {
    await this.connect();

    const query = { category: new RegExp(category, "i") };
    if (chatId) query.chatId = chatId;

    const transactions = await Transaction.find(query).sort({ createdAt: -1 });

    return transactions.map((transaction) => ({
      date: transaction.date.toLocaleString(),
      amount: transaction.amount.toString(),
      category: transaction.category,
      username: transaction.username,
    }));
  }

  async getEntriesByDateRange(startDate, endDate, chatId = null) {
    await this.connect();

    const query = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };
    if (chatId) query.chatId = chatId;

    const transactions = await Transaction.find(query).sort({ date: -1 });

    return transactions.map((transaction) => ({
      date: transaction.date.toLocaleString(),
      amount: transaction.amount.toString(),
      category: transaction.category,
      username: transaction.username,
    }));
  }

  async getCategoryStats(chatId = null) {
    await this.connect();

    const query = chatId ? { chatId } : {};
    const stats = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
          avgAmount: { $avg: "$amount" },
        },
      },
      { $sort: { total: -1 } },
    ]);

    return stats;
  }

  // Monthly tracking methods
  async getMonthlyRemainingBudget(chatId, year, month) {
    await this.connect();

    const targetChatId = chatId || config.app.defaultChatId || 0;

    // Calculate month date range
    const startDate = new Date(year, month, 1, 0, 0, 0);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    // Get budget
    const budget = await this.getBudget(targetChatId);

    // Calculate total spent for the month
    const result = await Transaction.aggregate([
      {
        $match: {
          chatId: targetChatId,
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalSpent = result.length > 0 ? result[0].total : 0;
    const remaining = budget - totalSpent;

    // Get month name
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthName = monthNames[month];

    return {
      budget,
      totalSpent,
      remaining,
      monthName,
      year,
    };
  }

  async getTransactionsByMonth(chatId, year, month) {
    await this.connect();

    const targetChatId = chatId || config.app.defaultChatId || 0;

    // Calculate month date range
    const startDate = new Date(year, month, 1, 0, 0, 0);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    const transactions = await Transaction.find({
      chatId: targetChatId,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({ date: -1 });

    return transactions.map((transaction) => ({
      date: transaction.date,
      amount: transaction.amount,
      category: transaction.category,
      username: transaction.username,
    }));
  }

  async getMonthlyStats(chatId, year, month) {
    await this.connect();

    const targetChatId = chatId || config.app.defaultChatId || 0;

    // Calculate month date range
    const startDate = new Date(year, month, 1, 0, 0, 0);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    // Get budget
    const budget = await this.getBudget(targetChatId);

    // Get category breakdown and totals
    const stats = await Transaction.aggregate([
      {
        $match: {
          chatId: targetChatId,
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $facet: {
          categoryBreakdown: [
            {
              $group: {
                _id: "$category",
                total: { $sum: "$amount" },
                count: { $sum: 1 },
              },
            },
            { $sort: { total: -1 } },
          ],
          overall: [
            {
              $group: {
                _id: null,
                totalSpent: { $sum: "$amount" },
                transactionCount: { $sum: 1 },
                avgTransaction: { $avg: "$amount" },
              },
            },
          ],
        },
      },
    ]);

    const categoryBreakdown = stats[0].categoryBreakdown.map((cat) => ({
      category: cat._id,
      total: cat.total,
      count: cat.count,
    }));

    const overall = stats[0].overall[0] || {
      totalSpent: 0,
      transactionCount: 0,
      avgTransaction: 0,
    };

    return {
      totalSpent: overall.totalSpent,
      transactionCount: overall.transactionCount,
      avgTransaction: overall.avgTransaction,
      categoryBreakdown,
      budget,
      remaining: budget - overall.totalSpent,
    };
  }
}

module.exports = MongoService;