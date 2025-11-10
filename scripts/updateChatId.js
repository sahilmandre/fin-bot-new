const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const config = require('../config/config');

async function updateChatId() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('❌ Please provide your Telegram chatId');
    console.log('\nUsage: node scripts/updateChatId.js <your-chat-id>');
    console.log('\nExample: node scripts/updateChatId.js 123456789');
    console.log('\n💡 To find your chatId:');
    console.log('   1. Send any message to your bot');
    console.log('   2. Check the bot console logs');
    console.log('   3. Look for "Chat ID: <number>"');
    process.exit(1);
  }
  
  const newChatId = parseInt(args[0]);
  
  if (isNaN(newChatId)) {
    console.log('❌ Invalid chatId. Must be a number.');
    process.exit(1);
  }
  
  console.log(`Updating all entries from chatId: 0 to chatId: ${newChatId}...\n`);
  
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('Connected to MongoDB\n');

    // Update transactions
    const transactionResult = await Transaction.updateMany(
      { chatId: 0 },
      { $set: { chatId: newChatId } }
    );
    console.log(`✅ Updated ${transactionResult.modifiedCount} transactions`);

    // Update budget
    const budgetResult = await Budget.updateMany(
      { chatId: 0 },
      { $set: { chatId: newChatId } }
    );
    console.log(`✅ Updated ${budgetResult.modifiedCount} budgets`);
    
    console.log('\n🎉 ChatId update complete!');
    console.log(`\nAll your data is now associated with chatId: ${newChatId}`);
    console.log('\nTry /view command in Telegram now!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateChatId();
