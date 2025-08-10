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
          "/view - View all entries\n" +
          "/export - Export all expenses as a CSV file\n";
        await bot.sendMessage(chatId, instructions);
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