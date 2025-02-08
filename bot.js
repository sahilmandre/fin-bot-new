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
// Replace literal "\n" characters if needed:
const private_key = key.includes("\\n") ? key.replace(/\\n/g, "\n") : key;
const client_email = process.env.GOOGLE_CLIENT_EMAIL;
const token = process.env.TELEGRAM_BOT_TOKEN;
const sheetId = process.env.GOOGLE_SHEET_ID;
let budget = 6000; // Default budget is 6000 and can be changed later

// Google Sheet ID and Range
const spreadsheetId = sheetId;
const range = "Sheet1!A2:D"; // Now expecting 4 columns: date, amount, category, username

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
    'Welcome! Send me the amount and what it was spent on, like this: "100 Grocery".'
  );
});

// Handle /instructions command
bot.onText(/\/instructions/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "To add an entry, send me the amount and what it was spent on, like this: '100 Grocery'.\n\n" +
      "Available commands:\n" +
      "/start - Start the bot\n" +
      "/instructions - Show instructions\n" +
      "/lastentry - View the last entry\n" +
      "/view - View all entries\n" +
      "/removelastentry - Remove the last entry\n" +
      "/setbudget <amount> - Set a custom budget (stored in cell I1)\n" +
      "/export - Export all expenses as a CSV file\n" +
      "/category <category> - Filter spending by category. To get result for a specific category, e.g., /category Food  \n"
  );
});

// New: /setbudget command to update the budget dynamically
// /setbudget command: update the budget in cell I1
bot.onText(/\/setbudget (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;

  if (!match || !match[1]) {
    bot.sendMessage(
      chatId,
      "Please provide a valid budget amount, e.g., /setbudget 7000"
    );
    return;
  }

  const newBudget = parseFloat(match[1]);
  if (isNaN(newBudget) || newBudget < 0) {
    bot.sendMessage(chatId, "The budget must be a positive number.");
    return;
  }

  try {
    await updateBudgetInSheet(newBudget);
    bot.sendMessage(chatId, `Budget has been updated to ${newBudget}`);
  } catch (error) {
    console.error("Error updating budget:", error);
    bot.sendMessage(chatId, "Error updating budget. Please try again.");
  }
});

// Handle invalid commands
bot.onText(
  /\/(?!start|instructions|lastentry|view|removelastentry|setbudget|export|category).*/,
  (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(
      chatId,
      "Sorry, I didn't understand that. Please use one of the following commands: /start, /instructions, /lastentry, /view, /removelastentry, or /setbudget."
    );
  }
);

// Handle /lastentry command
bot.onText(/\/lastentry/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const lastEntry = await getLastEntryFromSheet();

    if (!lastEntry) {
      bot.sendMessage(chatId, "No entries found.");
      return;
    }

    const message = `Last entry:\nDate: ${lastEntry.date}\nAmount: ${lastEntry.amount}\nCategory: ${lastEntry.category}\nUsername: ${lastEntry.username}`;

    bot.sendMessage(chatId, message);
  } catch (error) {
    console.error("Error fetching last entry:", error);
    bot.sendMessage(
      chatId,
      "There was an error fetching your last entry. Please try again."
    );
  }
});

// Handle /removelastentry command
bot.onText(/\/removelastentry/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    // Delete the last row and get the removed entry details
    const removedEntry = await deleteLastRowFromSheet();

    // Send a confirmation message to the user
    const message = `✅ Last entry removed:\n\nDate: ${removedEntry.date}\nAmount: ${removedEntry.amount}\nCategory: ${removedEntry.category}\nUsername: ${removedEntry.username}`;
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
      }, *Category:* **${entry.category}**, *Username:* ${entry.username}\n\n`;
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
  // Ignore commands in this handler
  if (!msg.text || msg.text.startsWith("/")) return;

  const chatId = msg.chat.id;
  const text = msg.text.trim();
  // Extract the username from the chat. Fallback to first name if username is not available.
  const username = msg.chat.username || msg.chat.first_name || "Unknown";

  // Check if the message is in the correct format: "100 Grocery"
  const regex = /^(\d+)\s+(.+)$/;
  const match = text.match(regex);

  if (match) {
    const amount = match[1];
    const description = match[2];

    // Add the entry to Google Sheets along with the username
    addEntryToSheet(chatId, amount, description, username);
  } else {
    bot.sendMessage(
      chatId,
      'Please send the amount and description in the format: "100 Grocery".'
    );
  }
});

// /export command: Export expense data as a CSV file
bot.onText(/\/export/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    // Retrieve all entries from the Google Sheet (using your existing function)
    const entries = await getAllEntriesFromSheet();

    if (!entries || entries.length === 0) {
      bot.sendMessage(chatId, "No entries found to export.");
      return;
    }

    // Build the CSV string
    // CSV header
    let csvData = "Date & Time,Amount,Category,Username\n";
    // Add each entry as a new row
    entries.forEach((entry) => {
      // If any value might contain a comma, you can wrap it in double quotes.
      // For example: `"${entry.date}","${entry.amount}","${entry.category}","${entry.username}"`
      csvData += `"${entry.date}","${entry.amount}",${entry.category},${entry.username}\n`;
    });

    // Option 1: Send the CSV as a document from a buffer without saving to disk.
    const buffer = Buffer.from(csvData, "utf-8");
    bot.sendDocument(
      chatId,
      buffer,
      {},
      { filename: "expenses.csv", contentType: "text/csv" }
    );

    // Option 2: Alternatively, if you prefer writing to a temporary file, you can use fs:
    //
    // const filePath = "./expenses.csv";
    // fs.writeFileSync(filePath, csvData);
    // bot.sendDocument(chatId, filePath).then(() => {
    //   // Optionally delete the file after sending it
    //   fs.unlinkSync(filePath);
    // });
  } catch (error) {
    console.error("Error exporting data:", error);
    bot.sendMessage(
      chatId,
      "There was an error exporting the data. Please try again later."
    );
  }
});

// /category command: Filter spending by category
bot.onText(/^\/category(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;

  // If no category is provided, match[1] will be undefined
  if (!match[1]) {
    bot.sendMessage(
      chatId,
      "Please provide a category in the proper format, e.g., /category Food"
    );
    return;
  }

  const categoryToFilter = match[1].trim();

  try {
    // Fetch all entries (assumes you have a getAllEntriesFromSheet function)
    const entries = await getAllEntriesFromSheet();

    // Filter entries by category (case-insensitive comparison)
    const filteredEntries = entries.filter(
      (entry) => entry.category.toLowerCase() === categoryToFilter.toLowerCase()
    );

    if (filteredEntries.length === 0) {
      bot.sendMessage(
        chatId,
        `No entries found for category "${categoryToFilter}".`
      );
      return;
    }

    // Build a message listing each entry and summing the amounts
    let message = `**Entries for category "${categoryToFilter}":**\n\n`;
    let total = 0;

    filteredEntries.forEach((entry, index) => {
      message += `${index + 1}. Date: ${entry.date}, Amount: ${
        entry.amount
      }, Username: ${entry.username}\n`;
      total += parseFloat(entry.amount) || 0;
    });

    message += `\n**Total spent in "${categoryToFilter}":** ${total}`;
    bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("Error filtering by category:", error);
    bot.sendMessage(
      chatId,
      "There was an error fetching category data. Please try again later."
    );
  }
});

// ################ Functions ################

// Get the budget from cell I1
async function getBudgetFromSheet() {
  await authClient.authorize();
  const response = await sheets.spreadsheets.values.get({
    auth: authClient,
    spreadsheetId,
    range: "Sheet1!I1",
  });
  const values = response.data.values;
  if (values && values.length > 0 && values[0].length > 0) {
    return parseFloat(values[0][0]) || 0;
  }
  return 0; // default if not set
}

// Update the budget in cell I1
async function updateBudgetInSheet(newBudget) {
  await authClient.authorize();
  await sheets.spreadsheets.values.update({
    auth: authClient,
    spreadsheetId,
    range: "Sheet1!I1",
    valueInputOption: "USER_ENTERED",
    resource: {
      values: [[newBudget]],
    },
  });
}

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
    username: lastEntry[3], // New field
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

  // Delete the last row (assuming sheetId is 0; update if needed)
  await sheets.spreadsheets.batchUpdate({
    auth: authClient,
    spreadsheetId,
    resource: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: 0, // Replace with the actual sheet ID if necessary
              dimension: "ROWS",
              startIndex: lastRowIndex - 1, // Correct 0-based index
              endIndex: lastRowIndex, // Delete only one row
            },
          },
        },
      ],
    },
  });

  // Return the last entry details (including username)
  return {
    date: rows[rows.length - 1][0],
    amount: rows[rows.length - 1][1],
    category: rows[rows.length - 1][2],
    username: rows[rows.length - 1][3],
  };
}

// Function to add entry to Google Sheets (now with username)
async function addEntryToSheet(chatId, amount, description, username) {
  try {
    await authClient.authorize();

    await sheets.spreadsheets.values.append({
      auth: authClient,
      spreadsheetId,
      range: "Sheet1!A2:D2", // Append to the next available row (4 columns)
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [[new Date().toLocaleString(), amount, description, username]],
      },
    });

    // After adding an entry, fetch the current budget from cell I1
    const currentBudget = await getBudgetFromSheet();
    const totalSpent = await calculateTotalSpent();
    const remainingAmount = currentBudget - totalSpent;

    // Send the response back to the user
    bot.sendMessage(
      chatId,
      `Entry added for ${description} by ${username}!\nTotal Spent: ${totalSpent}\nLast Amount: ${amount}\nRemaining Amount: ${remainingAmount}`
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
    range: "Sheet1!A2:D", // Now expecting 4 columns
  });

  const rows = response.data.values;

  if (!rows || rows.length === 0) {
    return [];
  }

  // Map rows to entries including username
  const entries = rows.map((row) => ({
    date: row[0], // Column A: Date and Time
    amount: row[1], // Column B: Amount
    category: row[2], // Column C: Category/Description
    username: row[3], // Column D: Username
  }));

  return entries;
}

// Function to calculate total spent (remains unchanged)
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
