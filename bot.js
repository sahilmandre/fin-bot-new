require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const { google } = require("googleapis");

const express = require("express");
const app = express();

// Simple keep-alive endpoint
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <meta charset="utf-8">
        <title>Bot is Running</title>
      </head>
      <body>
        <p>Bot is running! Created with ❤️ by Sahil Mandre.</p>
        <p>To visit the code, click <a href="https://github.com/sahilmandre/fin-bot-new" target="_blank">here</a>.</p>
      </body>
    </html>
  `);
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
      "/category <category> - Filter spending by category. To get result for a specific category, e.g., /category Food  \n" +
      "/summary - Get a summary of your expenses. To get a specific summary, e.g., /summary daily/weekly/monthly or /summary custom 2023-07-01 2023-07-31 \n"
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
  /\/(?!start|instructions|lastentry|view|removelastentry|setbudget|export|category|summary).*/,
  (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(
      chatId,
      "Sorry, I didn't understand that. Please use one of the following commands: /start, /instructions, /lastentry, /view, /removelastentry, /setbudget or /summary."
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
// bot.onText(/\/view/, async (msg) => {
//   const chatId = msg.chat.id;

//   try {
//     // Fetch all entries from the Google Sheet
//     const entries = await getAllEntriesFromSheet();

//     if (entries.length === 0) {
//       bot.sendMessage(chatId, "No entries found.");
//       return;
//     }

//     // Format the entries into a readable message
//     let message = "📝 **Your Entries to the FinSamBot:**\n\n";
//     entries.forEach((entry, index) => {
//       message += `**${index + 1}**. Date: ${entry.date}, *Amount:* ${
//         entry.amount
//       }, *Category:* **${entry.category}**, *Username:* ${entry.username}\n\n`;
//     });

//     // Send the formatted message to the user
//     bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
//   } catch (error) {
//     console.error("Error fetching entries:", error);
//     bot.sendMessage(
//       chatId,
//       "There was an error fetching your entries. Please try again."
//     );
//   }
// });

// Function to handle the /view command
bot.onText(/\/view/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    // Fetch all entries from the Google Sheet
    const entries = await getAllEntriesFromSheet();

    if (entries.length === 0) {
      bot.sendMessage(chatId, "No entries found.");
      return;
    }

    // Sort the entries by date in descending order (newest first)
    entries.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Get the last 20 entries
    const last20Entries = entries.slice(0, 20);

    // Generate the message with the heading and the last 20 entries
    let message = "Your last 20 spends:\n\n";
    last20Entries.forEach((entry, index) => {
      message += `${index + 1}. Date: ${entry.date}, Amount: ${
        entry.amount
      }, Category: ${entry.category}, Username: ${entry.username}\n\n`;
    });

    // Split the message into multiple parts if necessary
    const maxLength = 4096; // Maximum length allowed by Telegram
    const parts = [];
    let currentPart = "";

    message.split("\n\n").forEach((part) => {
      if (currentPart.length + part.length > maxLength) {
        parts.push(currentPart);
        currentPart = part + "\n\n";
      } else {
        currentPart += part + "\n\n";
      }
    });

    if (currentPart.length > 0) {
      parts.push(currentPart);
    }

    // Send the formatted message to the user
    for (const part of parts) {
      bot.sendMessage(chatId, part, { parse_mode: "Markdown" });
    }
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

// NEW FEATURE: /summary
// Usage examples:
//   /summary daily
//   /summary weekly
//   /summary monthly
//   /summary custom 2023-07-01 2023-07-31
bot.onText(/\/summary(?:\s+(.*))?$/, async (msg, match) => {
  const chatId = msg.chat.id;

  // Check if any arguments were provided.
  if (!match[1] || match[1].trim() === "") {
    bot.sendMessage(
      chatId,
      "Usage: /summary [daily|weekly|monthly|custom YYYY-MM-DD YYYY-MM-DD]"
    );
    return;
  }

  const args = match[1].trim().split(/\s+/);
  let startDate, endDate;
  const period = args[0].toLowerCase();
  const now = new Date();

  if (period === "daily") {
    // Today's start and end (next day)
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  } else if (period === "weekly") {
    // Assume week starts on Monday
    const dayOfWeek = now.getDay(); // Sunday=0, Monday=1, ..., Saturday=6
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + mondayOffset
    );
    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7);
  } else if (period === "monthly") {
    // Current month
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  } else if (period === "custom") {
    if (args.length < 3) {
      bot.sendMessage(
        chatId,
        "Usage for custom period: /summary custom YYYY-MM-DD YYYY-MM-DD"
      );
      return;
    }
    const startInput = args[1];
    const endInput = args[2];
    startDate = new Date(startInput);
    endDate = new Date(endInput);
    // Include the full end date by setting endDate to the next day
    endDate.setDate(endDate.getDate() + 1);
    if (isNaN(startDate) || isNaN(endDate)) {
      bot.sendMessage(chatId, "Invalid date format. Please use YYYY-MM-DD.");
      return;
    }
  } else {
    bot.sendMessage(
      chatId,
      "Invalid period specified. Use daily, weekly, monthly, or custom."
    );
    return;
  }

  try {
    // Retrieve all entries from Google Sheets
    const entries = await getAllEntriesFromSheet();
    // Filter entries within the specified date range.
    // Note: The date stored is assumed to be parseable by the Date() constructor.
    const filteredEntries = entries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate < endDate;
    });
    if (filteredEntries.length === 0) {
      bot.sendMessage(
        chatId,
        "No expense entries found for the selected period."
      );
      return;
    }
    // Calculate total expense and category breakdown
    let totalExpense = 0;
    const categoryTotals = {};
    filteredEntries.forEach((entry) => {
      const amount = parseFloat(entry.amount) || 0;
      totalExpense += amount;
      const cat = (entry.category || "Uncategorized").toLowerCase();
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = 0;
      }
      categoryTotals[cat] += amount;
    });
    // Build summary message
    let message = `*Expense Summary (${period.toUpperCase()})*\n`;
    message += `Period: ${startDate.toLocaleDateString()} to ${new Date(
      endDate - 1
    ).toLocaleDateString()}\n`;
    message += `Total Expense: ₹${totalExpense.toFixed(2)}\n\n`;
    message += "*Category Breakdown:*\n";
    for (const cat in categoryTotals) {
      const catTotal = categoryTotals[cat];
      const percentage = ((catTotal / totalExpense) * 100).toFixed(2);
      message += `- ${cat}: ₹${catTotal.toFixed(2)}  (${percentage}%)\n`;
    }
    bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("Error generating summary report:", error);
    bot.sendMessage(
      chatId,
      "Error generating the summary report. Please try again."
    );
  }
});

// New Command: /split (with custom uneven splits)
// Usage: /split <total_amount> <description> @user1:amount @user2:amount ...
bot.onText(/\/split\s+(.+)/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1].trim(); // Everything after "/split"
  const tokens = text.split(/\s+/);

  // There should be at least a total amount, a description, and one participant entry.
  if (tokens.length < 3) {
    bot.sendMessage(
      chatId,
      "Usage: /split <total_amount> <description> @user1:amount @user2:amount ..."
    );
    return;
  }

  // First token: total amount.
  const totalAmount = parseFloat(tokens[0]);
  if (isNaN(totalAmount)) {
    bot.sendMessage(chatId, "Invalid total amount specified.");
    return;
  }

  // Process the tokens after the amount.
  // All tokens until the first token starting with '@' form the description.
  let descriptionTokens = [];
  let splitTokens = [];
  for (let token of tokens.slice(1)) {
    if (token.startsWith("@")) {
      splitTokens.push(token);
    } else {
      if (splitTokens.length === 0) {
        descriptionTokens.push(token);
      } else {
        // If mentions have already started, treat additional tokens as part of description.
        descriptionTokens.push(token);
      }
    }
  }

  if (splitTokens.length === 0) {
    bot.sendMessage(
      chatId,
      "Please specify at least one participant with a custom split amount (e.g., @alice:30)."
    );
    return;
  }

  const description = descriptionTokens.join(" ");

  // Parse each participant token, expecting the format: @username:amount
  let splitData = [];
  let sumSplit = 0;
  for (let token of splitTokens) {
    // Remove the "@" sign and split on the colon.
    const parts = token.slice(1).split(":");
    if (parts.length !== 2) {
      bot.sendMessage(
        chatId,
        `Invalid format for participant: ${token}. Use @username:amount`
      );
      return;
    }
    const username = parts[0];
    const share = parseFloat(parts[1]);
    if (isNaN(share)) {
      bot.sendMessage(chatId, `Invalid amount for participant: ${token}`);
      return;
    }
    sumSplit += share;
    splitData.push({ username, share });
  }

  // Validate that the sum of individual amounts matches the total expense.
  if (Math.abs(sumSplit - totalAmount) > 0.01) {
    bot.sendMessage(
      chatId,
      `The sum of individual amounts (₹${sumSplit.toFixed(
        2
      )}) does not match the total amount (₹${totalAmount.toFixed(
        2
      )}). Please check your entries.`
    );
    return;
  }

  // Record an expense entry for each participant.
  // Here we use addEntryToSheetSilent() so that each entry is added without a separate confirmation.
  const promises = splitData.map(({ username, share }) =>
    addEntryToSheetSilent(share, `Split: ${description}`, username)
  );

  try {
    await Promise.all(promises);
    let summaryMsg = `Expense split of ₹${totalAmount.toFixed(
      2
    )} for "${description}" has been recorded.\nCustom shares:\n`;
    splitData.forEach(({ username, share }) => {
      summaryMsg += `@${username}: ₹${share.toFixed(2)}\n`;
    });
    bot.sendMessage(chatId, summaryMsg);
  } catch (error) {
    console.error("Error processing custom split expense:", error);
    bot.sendMessage(
      chatId,
      "Error processing custom split expense. Please try again."
    );
  }
});

// Helper function to silently add an entry to Google Sheets (without sending confirmation)
async function addEntryToSheetSilent(amount, category, username) {
  try {
    await authClient.authorize();
    await sheets.spreadsheets.values.append({
      auth: authClient,
      spreadsheetId,
      range: "Sheet1!A2:D2", // Appending to the next available row
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [[new Date().toLocaleString(), amount, category, username]],
      },
    });
  } catch (error) {
    console.error("Error adding split entry to sheet:", error);
    throw error;
  }
}

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
