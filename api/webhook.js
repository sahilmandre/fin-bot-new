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

async function getMonthlyRemainingBudget(chatId, year, month) {
  await connectToDatabase();

  // Calculate month date range
  const startDate = new Date(year, month, 1, 0, 0, 0);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59);

  // Get budget
  const budget = await getBudget(chatId);

  // Calculate total spent for the month
  const result = await Transaction.aggregate([
    {
      $match: {
        chatId: chatId,
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
          "/export - Export all expenses as a CSV file\n" +
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
      } else if (text === "/export") {
        const entries = await getAllEntries(chatId);
        if (!entries || entries.length === 0) {
          await bot.sendMessage(chatId, "No entries found to export.");
        } else {
          let csvData = "Date & Time,Amount,Category,Username\n";
          entries.forEach((entry) => {
            csvData += `"${entry.date}","${entry.amount}",${entry.category},${entry.username}\n`;
          });
          const buffer = Buffer.from(csvData, "utf-8");
          await bot.sendDocument(
            chatId,
            buffer,
            {},
            { filename: "expenses.csv", contentType: "text/csv" }
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
          // Get current year and month
          const now = new Date();
          const year = now.getFullYear();
          const month = now.getMonth();

          // Get monthly remaining budget
          const result = await getMonthlyRemainingBudget(chatId, year, month);

          // Calculate percentage
          const percentage =
            result.budget > 0 ? (result.remaining / result.budget) * 100 : 0;

          // Get status emoji
          let emoji = "✅";
          if (result.remaining <= 0) {
            emoji = "🚫";
          } else if (percentage < 20) {
            emoji = "⚠️";
          }

          // Format message
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
