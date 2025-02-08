require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const { google } = require("googleapis");

const express = require("express");
const app = express();

// Simple keep-alive endpoint
app.get("/", (req, res) => {
  res.send("Bot is running!");
});

// Start the Express server on any available port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Keep-alive server running on port ${PORT}`);
});

// Constants and environment variables
const key = process.env.GOOGLE_PRIVATE_KEY;
const client_email = process.env.GOOGLE_CLIENT_EMAIL;
const token = process.env.TELEGRAM_BOT_TOKEN;
const sheetId = process.env.GOOGLE_SHEET_ID;
const private_key = key;
const budget = 6000;
// Google Sheet ID and Range
const spreadsheetId = sheetId;
const range = "Sheet1!A2:D"; // Adjust the range to include all rows

// Google Sheets API Setup
const sheets = google.sheets("v4");
const authClient = new google.auth.JWT({
  email: client_email,
  key: private_key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// ################ Commands ################

// Initialize the bot
const bot = new TelegramBot(token, { polling: true });

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    'Welcome! Send me the amount and what it was spent on, like this: "100 Groceries".'
  );
});

// Handle /instructions command
bot.onText(/\/instructions/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "To add an entry, send me the amount and what it was spent on, like this: '100 Groceries'.\n\n" +
      "Available commands:\n" +
      "/start - Start the bot\n" +
      "/instructions - Show instructions\n" +
      "/lastentry - View the last entry\n" +
      "/view - View all entries\n" +
      "/removelastentry - Remove the last entry"
  );
});

// Handle invalid commands
bot.onText(
  /\/(?!start|instructions|lastentry|view|removelastentry).*/,
  (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(
      chatId,
      "Sorry, I didn't understand that. Please use one of the following commands: /start, /instructions, /lastentry, /view or /removelastentry."
    );
  }
);

// Handle /lastEntry command
bot.onText(/\/lastentry/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const lastEntry = await getLastEntryFromSheet();

    if (!lastEntry) {
      bot.sendMessage(chatId, "No entries found.");
      return;
    }

    const message = `Last entry: Date - ${lastEntry.date}, Amount - ${lastEntry.amount}, Category - ${lastEntry.category}`;

    bot.sendMessage(chatId, message);
  } catch (error) {
    console.error("Error fetching last entry:", error);
    bot.sendMessage(
      chatId,
      "There was an error fetching your last entry. Please try again."
    );
  }
});

// Handle /removeLastEntry command
bot.onText(/\/removeLastEntry/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    // Delete the last row and get the removed entry details
    const removedEntry = await deleteLastRowFromSheet();

    // Send a confirmation message to the user
    const message = `✅ Last entry removed:\n\nDate: ${removedEntry.date}\nAmount: ${removedEntry.amount}\nCategory: ${removedEntry.category}`;
    bot.sendMessage(chatId, message);
  } catch (error) {
    console.error("Error removing last entry:", error);
    bot.sendMessage(
      chatId,
      "There was an error removing the last entry. Please try again."
    );
  }
});

// Handle /view command
bot.onText(/\/view/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    // Fetch all entries from the Google Sheet
    const entries = await getAllEntriesFromSheet();

    if (entries.length === 0) {
      bot.sendMessage(chatId, "No entries found.");
      return;
    }

    // Format the entries into a readable message
    let message = "📝 **Your Entries to the FinSamBot:**\n\n";
    entries.forEach((entry, index) => {
      message += `**${index + 1}**. Date: ${entry.date}, *Amount:* ${
        entry.amount
      }, *Category:* **${entry.category}**\n\n`;
    });

    // Send the formatted message to the user
    bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("Error fetching entries:", error);
    bot.sendMessage(
      chatId,
      "There was an error fetching your entries. Please try again."
    );
  }
});

// Handle messages for adding entries
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Check if the message is in the correct format
  const regex = /^(\d+)\s+(.+)$/;
  const match = text.match(regex);

  if (match) {
    const amount = match[1];
    const description = match[2];

    // Add the entry to Google Sheets
    addEntryToSheet(chatId, amount, description);
  } else if (!msg.text.startsWith("/")) {
    bot.sendMessage(
      chatId,
      'Please send the amount and description in the format: "100 Groceries".'
    );
  }
});

// ################ Functions ################
// Function to get last entry

async function getLastEntryFromSheet() {
  await authClient.authorize();

  const response = await sheets.spreadsheets.values.get({
    auth: authClient,
    spreadsheetId,
    range,
  });

  const rows = response.data.values;

  if (!rows || rows.length === 0) {
    return null;
  }

  const lastEntry = rows[rows.length - 1];

  return {
    date: lastEntry[0],
    amount: lastEntry[1],
    category: lastEntry[2],
  };
}

async function deleteLastRowFromSheet() {
  await authClient.authorize();

  // Fetch the last row index
  const response = await sheets.spreadsheets.values.get({
    auth: authClient,
    spreadsheetId,
    range: "Sheet1!A2:D",
  });

  const rows = response.data.values;

  if (!rows || rows.length === 0) {
    throw new Error("No entries found.");
  }

  // Calculate the correct last row index (accounting for header row)
  const lastRowIndex = rows.length + 1; // Data starts at row 2, so +1

  // Delete the last row
  await sheets.spreadsheets.batchUpdate({
    auth: authClient,
    spreadsheetId,
    resource: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: 0, // Replace with actual sheet ID if needed
              dimension: "ROWS",
              startIndex: lastRowIndex - 1, // Correct 0-based index
              endIndex: lastRowIndex, // Delete only one row
            },
          },
        },
      ],
    },
  });

  // Return the last entry details
  return {
    date: rows[rows.length - 1][0],
    amount: rows[rows.length - 1][1],
    category: rows[rows.length - 1][2],
  };
}

// Function to add entry to Google Sheets
async function addEntryToSheet(chatId, amount, description) {
  try {
    await authClient.authorize();

    const response = await sheets.spreadsheets.values.append({
      auth: authClient,
      spreadsheetId,
      range: "Sheet1!A2:D2", // Append to the next available row
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [[new Date().toLocaleString(), amount, description]],
      },
    });

    // Calculate the remaining amount
    const totalSpent = await calculateTotalSpent();
    const remainingAmount = budget - totalSpent;

    // Send the response back to the user
    bot.sendMessage(
      chatId,
      `Entry added for ${description}!\nTotal Spent: ${totalSpent}\nLast Amount: ${amount} \nRemaining Amount: ${remainingAmount}`
    );
  } catch (error) {
    console.error("Error adding entry to sheet:", error);
    bot.sendMessage(
      chatId,
      "There was an error adding your entry. Please try again."
    );
  }
}

// Function to fetch all entries from Google Sheets
async function getAllEntriesFromSheet() {
  await authClient.authorize();

  const response = await sheets.spreadsheets.values.get({
    auth: authClient,
    spreadsheetId,
    range: "Sheet1!A2:D", // Fetch all rows starting from row 2
  });

  const rows = response.data.values;

  if (!rows || rows.length === 0) {
    return [];
  }

  // Map rows to entries
  const entries = rows.map((row) => ({
    date: row[0], // Column A: Date and Time
    amount: row[1], // Column B: Amount
    category: row[2], // Column C: Category
  }));

  return entries;
}

// Function to calculate total spent
async function calculateTotalSpent() {
  const response = await sheets.spreadsheets.values.get({
    auth: authClient,
    spreadsheetId,
    range: "Sheet1!B:B", // Fetch only the Amount column
  });

  const values = response.data.values;
  let total = 0;

  if (values) {
    values.forEach((row) => {
      total += parseFloat(row[0]) || 0;
    });
  }

  return total;
}

// Start the bot
console.log("Bot is running...");
