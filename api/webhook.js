const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");

// Initialize bot without polling for serverless
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

// MongoDB Models
const transactionSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now, required: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    username: { type: String, required: true, trim: true },
    chatId: { type: Number, required: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

const budgetSchema = new mongoose.Schema(
  {
    chatId: { type: Number, required: true },
    amount: { type: Number, required: true, min: 0 },
    period: {
      type: String,
      enum: ["monthly", "weekly", "daily"],
      default: "monthly",
    },
    startDate: { type: Date, default: Date.now },
    username: { type: String, required: true },
  },
  { timestamps: true }
);

transactionSchema.index({ chatId: 1, date: -1 });
budgetSchema.index({ chatId: 1 }, { unique: true });

const Transaction =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);
const Budget = mongoose.models.Budget || mongoose.model("Budget", budgetSchema);

// MongoDB connection
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  const db = await mongoose.connect(process.env.MONGODB_URI);
  cachedDb = db;
  return db;
}

// Helper functions
async function addEntry(amount, description, username, chatId) {
  await connectToDatabase();
  const transaction = new Transaction({
    amount: parseFloat(amount),
    category: description,
    username: username,
    chatId: chatId,
    description: description,
  });
  await transaction.save();
}

async function getBudget(chatId) {
  await connectToDatabase();
  const budget = await Budget.findOne({ chatId });
  return budget ? budget.amount : 6000; // Default budget
}

async function setBudget(newBudget, chatId, username) {
  await connectToDatabase();
  await Budget.findOneAndUpdate(
    { chatId },
    { amount: newBudget, username: username, startDate: new Date() },
    { upsert: true, new: true }
  );
}

async function calculateTotalSpent(chatId) {
  await connectToDatabase();
  const result = await Transaction.aggregate([
    { $match: { chatId } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  return result.length > 0 ? result[0].total : 0;
}

async function getAllEntries(chatId) {
  await connectToDatabase();
  const transactions = await Transaction.find({ chatId })
    .sort({ createdAt: -1 })
    .limit(20);

  return transactions.map((t) => ({
    date: t.date.toLocaleString(),
    amount: t.amount.toString(),
    category: t.category,
    username: t.username,
  }));
}

async function getLastEntry(chatId) {
  await connectToDatabase();
  const transaction = await Transaction.findOne({ chatId }).sort({
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

async function deleteLastEntry(chatId) {
  await connectToDatabase();
  const transaction = await Transaction.findOne({ chatId }).sort({
    createdAt: -1,
  });

  if (!transaction) throw new Error("No entries found.");

  const deletedEntry = {
    date: transaction.date.toLocaleString(),
    amount: transaction.amount.toString(),
    category: transaction.category,
    username: transaction.username,
  };

  await Transaction.findByIdAndDelete(transaction._id);
  return deletedEntry;
}

async function getEntriesByCategory(category, chatId) {
  await connectToDatabase();
  const transactions = await Transaction.find({
    chatId,
    category: new RegExp(category, "i"),
  }).sort({ createdAt: -1 });

  return transactions.map((t) => ({
    date: t.date.toLocaleString(),
    amount: t.amount.toString(),
    category: t.category,
    username: t.username,
  }));
}

// Utility functions for date parsing
function parseMonth(monthStr) {
  const now = new Date();
  const currentYear = now.getFullYear();

  if (!monthStr) {
    return { month: now.getMonth(), year: currentYear };
  }

  const input = monthStr.trim().toLowerCase();
  const monthNames = {
    january: 0, jan: 0, february: 1, feb: 1, march: 2, mar: 2,
    april: 3, apr: 3, may: 4, june: 5, jun: 5, july: 6, jul: 6,
    august: 7, aug: 7, september: 8, sep: 8, sept: 8,
    october: 9, oct: 9, november: 10, nov: 10, december: 11, dec: 11,
  };

  if (monthNames.hasOwnProperty(input)) {
    return { month: monthNames[input], year: currentYear };
  }

  const monthNum = parseInt(input);
  if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
    return { month: monthNum - 1, year: currentYear };
  }

  throw new Error("Invalid month format");
}

function getMonthName(monthIndex) {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return monthNames[monthIndex];
}

async function getMonthlyRemainingBudget(chatId, year, month) {
  await connectToDatabase();

  const startDate = new Date(year, month, 1, 0, 0, 0);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59);
  const budget = await getBudget(chatId);

  const result = await Transaction.aggregate([
    {
      $match: {
        chatId: chatId,
        date: { $gte: startDate, $lte: endDate },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const totalSpent = result.length > 0 ? result[0].total : 0;
  const remaining = budget - totalSpent;
  const monthName = getMonthName(month);

  return { budget, totalSpent, remaining, monthName, year };
}

async function getTransactionsByMonth(chatId, year, month) {
  await connectToDatabase();

  const startDate = new Date(year, month, 1, 0, 0, 0);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59);

  const transactions = await Transaction.find({
    chatId: chatId,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: -1 });

  return transactions.map((t) => ({
    date: t.date,
    amount: t.amount,
    category: t.category,
    username: t.username,
  }));
}

async function getMonthlyStats(chatId, year, month) {
  await connectToDatabase();

  const startDate = new Date(year, month, 1, 0, 0, 0);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59);
  const budget = await getBudget(chatId);

  const stats = await Transaction.aggregate([
    {
      $match: {
        chatId: chatId,
        date: { $gte: startDate, $lte: endDate },
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

function generateCSV(transactions) {
  if (!transactions || transactions.length === 0) {
    return "Date,Amount,Category,Username\n";
  }

  let csv = "Date,Amount,Category,Username\n";
  transactions.forEach((t) => {
    const date = new Date(t.date).toLocaleString();
    const category = String(t.category).includes(",")
      ? `"${t.category}"`
      : t.category;
    const username = String(t.username).includes(",")
      ? `"${t.username}"`
      : t.username;
    csv += `${date},${t.amount},${category},${username}\n`;
  });

  return csv;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const update = req.body;

    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const text = msg.text;
      const username = msg.chat.username || msg.chat.first_name || "Unknown";

      console.log(`📱 Message from Chat ID: ${chatId} (${username})`);

      // Handle commands
      if (text === "/start") {
        await bot.sendMessage(
          chatId,
          'Welcome! Send me the amount and what it was spent on, like this: "100 Grocery".'
        );
      } else if (text === "/instructions") {
        const instructions =
          "To add an entry, send me the amount and what it was spent on, like this: '100 Grocery'.\n\n" +
          "Available commands:\n" +
          "/start - Start the bot\n" +
          "/instructions - Show instructions\n" +
          "/lastentry - View the last entry\n" +
          "/view - View all entries\n" +
          "/removelastentry - Remove the last entry\n" +
          "/setbudget <amount> - Set a custom budget\n" +
          "/remaining - Check remaining budget for current month\n" +
          "/export [month] - Export month transactions (e.g., /export Nov or /export for current month)\n" +
          "/compare <month1> <month2> - Compare spending between two months (e.g., /compare Oct Nov)\n" +
          "/category <category> - Filter spending by category\n" +
          "/summary daily/weekly/monthly - Get expense summary\n" +
          "/split <amount> <desc> @user1:amt @user2:amt - Split expenses\n";
        await bot.sendMessage(chatId, instructions);
      } else if (text === "/lastentry") {
        const lastEntry = await getLastEntry(chatId);
        if (!lastEntry) {
          await bot.sendMessage(chatId, "No entries found.");
        } else {
          const message = `Last entry:\nDate: ${lastEntry.date}\nAmount: ${lastEntry.amount}\nCategory: ${lastEntry.category}\nUsername: ${lastEntry.username}`;
          await bot.sendMessage(chatId, message);
        }
      } else if (text === "/view") {
        const entries = await getAllEntries(chatId);
        if (entries.length === 0) {
          await bot.sendMessage(chatId, "No entries found.");
        } else {
          let message = "Your last 20 spends:\n\n";
          entries.forEach((entry, index) => {
            message += `${index + 1}. Date: ${entry.date}, Amount: ${
              entry.amount
            }, Category: ${entry.category}, Username: ${entry.username}\n\n`;
          });
          await bot.sendMessage(chatId, message);
        }
      } else if (text.startsWith("/export")) {
        try {
          const match = text.match(/\/export(?:\s+(.*))?$/);
          const monthInput = match && match[1] ? match[1].trim() : null;

          // Parse month or use current month
          const { month, year } = parseMonth(monthInput);
          const monthName = getMonthName(month);

          // Get transactions for the month
          const transactions = await getTransactionsByMonth(chatId, year, month);

          if (transactions.length === 0) {
            await bot.sendMessage(
              chatId,
              `No transactions found for ${monthName} ${year}`
            );
          } else {
            // Generate CSV
            const csvString = generateCSV(transactions);
            const buffer = Buffer.from(csvString, "utf-8");

            // Get monthly stats
            const stats = await getMonthlyStats(chatId, year, month);

            // Send CSV file
            const filename = `expenses_${monthName}_${year}.csv`;
            await bot.sendDocument(
              chatId,
              buffer,
              {},
              { filename: filename, contentType: "text/csv" }
            );

            // Send overview message
            let message = `📊 *${monthName} ${year} Overview*\n\n`;
            message += `Total Transactions: ${stats.transactionCount}\n`;
            message += `Total Spent: ${stats.totalSpent}\n`;
            message += `Budget: ${stats.budget}\n`;
            message += `Remaining: ${stats.remaining}\n`;

            if (stats.categoryBreakdown && stats.categoryBreakdown.length > 0) {
              message += `\nTop Categories:\n`;
              const topCategories = stats.categoryBreakdown.slice(0, 5);
              topCategories.forEach((cat) => {
                const percentage = ((cat.total / stats.totalSpent) * 100).toFixed(1);
                message += `• ${cat.category}: ${cat.total} (${percentage}%)\n`;
              });
            }

            await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
          }
        } catch (error) {
          console.error("Error in /export command:", error);
          await bot.sendMessage(
            chatId,
            "Invalid month format. Use: /export Nov or /export November or /export 11\n\n" +
              "Examples:\n" +
              "• /export (current month)\n" +
              "• /export Nov\n" +
              "• /export November\n" +
              "• /export 11"
          );
        }
      } else if (text.startsWith("/setbudget ")) {
        const match = text.match(/\/setbudget (\d+)/);
        if (!match || !match[1]) {
          await bot.sendMessage(
            chatId,
            "Please provide a valid budget amount, e.g., /setbudget 7000"
          );
        } else {
          const newBudget = parseFloat(match[1]);
          if (isNaN(newBudget) || newBudget < 0) {
            await bot.sendMessage(
              chatId,
              "The budget must be a positive number."
            );
          } else {
            await setBudget(newBudget, chatId, username);
            await bot.sendMessage(
              chatId,
              `Budget has been updated to ${newBudget}`
            );
          }
        }
      } else if (text.startsWith("/category ")) {
        const category = text.replace("/category ", "").trim();
        if (!category) {
          await bot.sendMessage(
            chatId,
            "Please provide a category, e.g., /category Food"
          );
        } else {
          const entries = await getEntriesByCategory(category, chatId);
          if (entries.length === 0) {
            await bot.sendMessage(
              chatId,
              `No entries found for category "${category}".`
            );
          } else {
            let message = `**Entries for category "${category}":**\n\n`;
            let total = 0;
            entries.forEach((entry, index) => {
              message += `${index + 1}. Date: ${entry.date}, Amount: ${
                entry.amount
              }, Username: ${entry.username}\n`;
              total += parseFloat(entry.amount) || 0;
            });
            message += `\n**Total spent in "${category}": ${total}**`;
            await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
          }
        }
      } else if (text === "/removelastentry") {
        try {
          const removedEntry = await deleteLastEntry(chatId);
          const message = `✅ Last entry removed:\n\nDate: ${removedEntry.date}\nAmount: ${removedEntry.amount}\nCategory: ${removedEntry.category}\nUsername: ${removedEntry.username}`;
          await bot.sendMessage(chatId, message);
        } catch (error) {
          await bot.sendMessage(
            chatId,
            "There was an error removing the last entry. Please try again."
          );
        }
      } else if (text === "/setbudget") {
        await bot.sendMessage(
          chatId,
          "Please provide a budget amount. Usage: /setbudget 5000"
        );
      } else if (text === "/category") {
        await bot.sendMessage(
          chatId,
          "Please provide a category. Usage: /category Food"
        );
      } else if (text === "/remaining") {
        try {
          const now = new Date();
          const year = now.getFullYear();
          const month = now.getMonth();

          const result = await getMonthlyRemainingBudget(chatId, year, month);
          const percentage =
            result.budget > 0 ? (result.remaining / result.budget) * 100 : 0;

          let emoji = "✅";
          if (result.remaining <= 0) {
            emoji = "🚫";
          } else if (percentage < 20) {
            emoji = "⚠️";
          }

          const message =
            `*${emoji} Budget Status - ${result.monthName} ${result.year}*\n\n` +
            `💰 *Budget:* ${result.budget}\n` +
            `💸 *Total Spent:* ${result.totalSpent}\n` +
            `💵 *Remaining:* ${result.remaining}\n` +
            `📊 *Remaining:* ${percentage.toFixed(1)}%`;

          await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
        } catch (error) {
          console.error("Error in /remaining command:", error);
          await bot.sendMessage(
            chatId,
            "Error retrieving budget information. Please try again."
          );
        }
      } else if (text.startsWith("/compare")) {
        try {
          const match = text.match(/\/compare\s+(\S+)\s+(\S+)/);
          
          if (!match || !match[1] || !match[2]) {
            await bot.sendMessage(
              chatId,
              'Usage: /compare <month1> <month2>\n\nExample: /compare Oct Nov'
            );
            return;
          }

          const month1Input = match[1].trim();
          const month2Input = match[2].trim();

          const month1 = parseMonth(month1Input);
          const month2 = parseMonth(month2Input);

          const stats1 = await getMonthlyStats(chatId, month1.year, month1.month);
          const stats2 = await getMonthlyStats(chatId, month2.year, month2.month);

          const month1Name = getMonthName(month1.month);
          const month2Name = getMonthName(month2.month);

          const difference = stats2.totalSpent - stats1.totalSpent;
          const percentChange =
            stats1.totalSpent > 0
              ? ((difference / stats1.totalSpent) * 100).toFixed(1)
              : 0;

          const trendEmoji = difference > 0 ? "📈" : difference < 0 ? "📉" : "➡️";
          const changeText =
            difference > 0 ? "increase" : difference < 0 ? "decrease" : "no change";

          let message = `📊 *Comparison: ${month1Name} ${month1.year} vs ${month2Name} ${month2.year}*\n\n`;

          message += `*${month1Name} ${month1.year}:*\n`;
          message += `• Total Spent: ${stats1.totalSpent}\n`;
          message += `• Transactions: ${stats1.transactionCount}\n`;
          message += `• Avg per transaction: ${stats1.avgTransaction.toFixed(2)}\n\n`;

          message += `*${month2Name} ${month2.year}:*\n`;
          message += `• Total Spent: ${stats2.totalSpent}\n`;
          message += `• Transactions: ${stats2.transactionCount}\n`;
          message += `• Avg per transaction: ${stats2.avgTransaction.toFixed(2)}\n\n`;

          message += `*Difference:* ${trendEmoji}\n`;
          message += `${Math.abs(difference)} (${Math.abs(percentChange)}% ${changeText})`;

          await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        } catch (error) {
          console.error('Error in /compare command:', error);
          await bot.sendMessage(
            chatId,
            'Invalid month format. Use: /compare Oct Nov\n\n' +
              'Examples:\n' +
              '• /compare Oct Nov\n' +
              '• /compare October November\n' +
              '• /compare 10 11'
          );
        }
      } else if (text.startsWith("/summary")) {
        await bot.sendMessage(
          chatId,
          "Summary feature is available! Use:\n/summary daily\n/summary weekly\n/summary monthly\n/summary custom 2024-01-01 2024-01-31"
        );
      } else if (text.startsWith("/")) {
        await bot.sendMessage(
          chatId,
          "Sorry, I didn't understand that command. Use /instructions to see all available commands."
        );
      } else if (!text.startsWith("/")) {
        // Handle expense entry
        const regex = /^(\d+)\s+(.+)$/;
        const match = text.match(regex);

        if (match) {
          const amount = match[1];
          const description = match[2];

          await addEntry(amount, description, username, chatId);
          const currentBudget = await getBudget(chatId);
          const totalSpent = await calculateTotalSpent(chatId);
          const remainingAmount = currentBudget - totalSpent;

          await bot.sendMessage(
            chatId,
            `Entry added for ${description} by ${username}!\nTotal Spent: ${totalSpent}\nLast Amount: ${amount}\nRemaining Amount: ${remainingAmount}`
          );
        } else {
          await bot.sendMessage(
            chatId,
            'Please send the amount and description in the format: "100 Grocery".'
          );
        }
      }
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
