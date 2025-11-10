const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const config = require('../config/config');

async function checkChatIds() {
  console.log('Checking chatIds in MongoDB...\n');
  
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('Connected to MongoDB\n');

    // Get all unique chatIds from transactions
    const chatIds = await Transaction.distinct('chatId');
    console.log('ChatIds found in Transactions:', chatIds);
    
    // Count entries per chatId
    for (const chatId of chatIds) {
      const count = await Transaction.countDocuments({ chatId });
      console.log(`  ChatId ${chatId}: ${count} entries`);
    }
    
    console.log('\n---\n');
    
    // Get budgets
    const budgets = await Budget.find({});
    console.log('Budgets found:');
    budgets.forEach(budget => {
      console.log(`  ChatId ${budget.chatId}: Budget ${budget.amount}`);
    });
    
    console.log('\n---\n');
    console.log('💡 Your Telegram chatId is the number you see when you send a message.');
    console.log('💡 If you see chatId: 0, that means migrated data used default chatId.');
    console.log('💡 New entries will use your actual Telegram chatId.');
    
    process.exit(0);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkChatIds();
