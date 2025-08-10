const TelegramBot = require("node-telegram-bot-api");
const { google } = require("googleapis");

// Initialize bot without polling for serverless
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

// Google Sheets setup
const key = process.env.GOOGLE_PRIVATE_KEY;
const private_key = key.includes("\\n") ? key.replace(/\\n/g, "\n") : key;
const sheets = google.sheets("v4");
const authClient = new google.auth.JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: private_key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// Helper functions
async function addEntry(amount, description, username) {
  await authClient.authorize();
  await sheets.spreadsheets.values.append({
    auth: authClient,
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Sheet1!A2:D2",
    valueInputOption: "USER_ENTERED",
    resource: {
      values: [[new Date().toLocaleString(), amount, description, username]],
    },
  });
}

async function getBudget() {
  await authClient.authorize();
  const response = await sheets.spreadsheets.values.get({
    auth: authClient,
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Sheet1!I1",
  });
  const values = response.data.values;
  return values && values.length > 0 && values[0].length > 0 
    ? parseFloat(values[0][0]) || 0 
    : 0;
}

async function setBudget(newBudget) {
  await authClient.authorize();
  await sheets.spreadsheets.values.update({
    auth: authClient,
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Sheet1!I1",
    valueInputOption: "USER_ENTERED",
    resource: { values: [[newBudget]] },
  });
}

async function calculateTotalSpent() {
  const response = await sheets.spreadsheets.values.get({
    auth: authClient,
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Sheet1!B:B",
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

async function getAllEntries() {
  await authClient.authorize();
  const response = await sheets.spreadsheets.values.get({
    auth: authClient,
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Sheet1!A2:D",
  });
  const rows = response.data.values;
  if (!rows || rows.length === 0) return [];
  return rows.map((row) => ({
    date: row[0],
    amount: row[1],
    category: row[2],
    username: row[3],
  }));
}

async function getLastEntry() {
  await authClient.authorize();
  const response = await sheets.spreadsheets.values.get({
    auth: authClient,
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Sheet1!A2:D",
  });
  const rows = response.data.values;
  if (!rows || rows.length === 0) return null;
  const lastEntry = rows[rows.length - 1];
  return {
    date: lastEntry[0],
    amount: lastEntry[1],
    category: lastEntry[2],
    username: lastEntry[3],
  };
}

async function deleteLastEntry() {
  await authClient.authorize();
  const response = await sheets.spreadsheets.values.get({
    auth: authClient,
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Sheet1!A2:D",
  });
  const rows = response.data.values;
  if (!rows || rows.length === 0) throw new Error("No entries found.");
  
  const lastRowIndex = rows.length + 1;
  await sheets.spreadsheets.batchUpdate({
    auth: authClient,
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    resource: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: 0,
            dimension: "ROWS",
            startIndex: lastRowIndex - 1,
            endIndex: lastRowIndex,
          },
        },
      }],
    },
  });
  
  return {
    date: rows[rows.length - 1][0],
    amount: rows[rows.length - 1][1],
    category: rows[rows.length - 1][2],
    username: rows[rows.length - 1][3],
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const update = req.body;
    
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const text = msg.text;
      const username = msg.chat.username || msg.chat.first_name || "Unknown";

      // Handle commands
      if (text === '/start') {
        await bot.sendMessage(chatId, 'Welcome! Send me the amount and what it was spent on, like this: "100 Grocery".');
      }
      else if (text === '/instructions') {
        const instructions = 
          "To add an entry, send me the amount and what it was spent on, like this: '100 Grocery'.\n\n" +
          "Available commands:\n" +
          "/start - Start the bot\n" +
          "/instructions - Show instructions\n" +
          "/lastentry - View the last entry\n" +
          "/view - View all entries\n" +
          "/removelastentry - Remove the last entry\n" +
          "/setbudget <amount> - Set a custom budget\n" +
          "/export - Export all expenses as a CSV file\n" +
          "/category <category> - Filter spending by category\n" +
          "/summary daily/weekly/monthly - Get expense summary\n" +
          "/split <amount> <desc> @user1:amt @user2:amt - Split expenses\n";
        await bot.sendMessage(chatId, instructions);
      }
      else if (text === '/lastentry') {
        const lastEntry = await getLastEntry();
        if (!lastEntry) {
          await bot.sendMessage(chatId, "No entries found.");
        } else {
          const message = `Last entry:\nDate: ${lastEntry.date}\nAmount: ${lastEntry.amount}\nCategory: ${lastEntry.category}\nUsername: ${lastEntry.username}`;
          await bot.sendMessage(chatId, message);
        }
      }
      else if (text === '/view') {
        const entries = await getAllEntries();
        if (entries.length === 0) {
          await bot.sendMessage(chatId, "No entries found.");
        } else {
          const sortedEntries = entries.sort((a, b) => new Date(b.date) - new Date(a.date));
          const last20Entries = sortedEntries.slice(0, 20);
          let message = "Your last 20 spends:\n\n";
          last20Entries.forEach((entry, index) => {
            message += `${index + 1}. Date: ${entry.date}, Amount: ${entry.amount}, Category: ${entry.category}, Username: ${entry.username}\n\n`;
          });
          await bot.sendMessage(chatId, message);
        }
      }
      else if (text === '/export') {
        const entries = await getAllEntries();
        if (!entries || entries.length === 0) {
          await bot.sendMessage(chatId, "No entries found to export.");
        } else {
          let csvData = "Date & Time,Amount,Category,Username\n";
          entries.forEach((entry) => {
            csvData += `"${entry.date}","${entry.amount}",${entry.category},${entry.username}\n`;
          });
          const buffer = Buffer.from(csvData, "utf-8");
          await bot.sendDocument(chatId, buffer, {}, { filename: "expenses.csv", contentType: "text/csv" });
        }
      }
      else if (text.startsWith('/setbudget ')) {
        const match = text.match(/\/setbudget (\d+)/);
        if (!match || !match[1]) {
          await bot.sendMessage(chatId, "Please provide a valid budget amount, e.g., /setbudget 7000");
        } else {
          const newBudget = parseFloat(match[1]);
          if (isNaN(newBudget) || newBudget < 0) {
            await bot.sendMessage(chatId, "The budget must be a positive number.");
          } else {
            await setBudget(newBudget);
            await bot.sendMessage(chatId, `Budget has been updated to ${newBudget}`);
          }
        }
      }
      else if (text.startsWith('/category ')) {
        const category = text.replace('/category ', '').trim();
        if (!category) {
          await bot.sendMessage(chatId, "Please provide a category, e.g., /category Food");
        } else {
          const entries = await getAllEntries();
          const filteredEntries = entries.filter(
            (entry) => entry.category.toLowerCase() === category.toLowerCase()
          );
          if (filteredEntries.length === 0) {
            await bot.sendMessage(chatId, `No entries found for category "${category}".`);
          } else {
            let message = `**Entries for category "${category}":**\n\n`;
            let total = 0;
            filteredEntries.forEach((entry, index) => {
              message += `${index + 1}. Date: ${entry.date}, Amount: ${entry.amount}, Username: ${entry.username}\n`;
              total += parseFloat(entry.amount) || 0;
            });
            message += `\n**Total spent in "${category}": ${total}**`;
            await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
          }
        }
      }
      else if (text === '/removelastentry') {
        try {
          const removedEntry = await deleteLastEntry();
          const message = `✅ Last entry removed:\n\nDate: ${removedEntry.date}\nAmount: ${removedEntry.amount}\nCategory: ${removedEntry.category}\nUsername: ${removedEntry.username}`;
          await bot.sendMessage(chatId, message);
        } catch (error) {
          await bot.sendMessage(chatId, "There was an error removing the last entry. Please try again.");
        }
      }
      else if (text === '/setbudget') {
        await bot.sendMessage(chatId, "Please provide a budget amount. Usage: /setbudget 5000");
      }
      else if (text === '/category') {
        await bot.sendMessage(chatId, "Please provide a category. Usage: /category Food");
      }
      else if (text.startsWith('/summary')) {
        await bot.sendMessage(chatId, "Summary feature is available! Use:\n/summary daily\n/summary weekly\n/summary monthly\n/summary custom 2024-01-01 2024-01-31");
      }
      else if (text.startsWith('/')) {
        await bot.sendMessage(chatId, "Sorry, I didn't understand that command. Use /instructions to see all available commands.");
      }
      else if (!text.startsWith('/')) {
        // Handle expense entry
        const regex = /^(\d+)\s+(.+)$/;
        const match = text.match(regex);
        
        if (match) {
          const amount = match[1];
          const description = match[2];
          
          await addEntry(amount, description, username);
          const currentBudget = await getBudget();
          const totalSpent = await calculateTotalSpent();
          const remainingAmount = currentBudget - totalSpent;
          
          await bot.sendMessage(chatId, 
            `Entry added for ${description} by ${username}!\nTotal Spent: ${totalSpent}\nLast Amount: ${amount}\nRemaining Amount: ${remainingAmount}`
          );
        } else {
          await bot.sendMessage(chatId, 'Please send the amount and description in the format: "100 Grocery".');
        }
      }
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}