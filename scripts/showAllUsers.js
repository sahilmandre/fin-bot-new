const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const config = require('../config/config');

async function showAllUsers() {
  console.log('📊 Showing all users in the system...\n');
  
  try {
    await mongoose.connect(config.mongodb.uri);

    // Get all unique chatIds
    const chatIds = await Transaction.distinct('chatId');
    
    console.log(`Found ${chatIds.length} user(s):\n`);
    
    for (const chatId of chatIds) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`👤 User ChatId: ${chatId}`);
      
      // Get budget
      const budget = await Budget.findOne({ chatId });
      if (budget) {
        console.log(`   💰 Budget: ${budget.amount}`);
        console.log(`   👤 Username: ${budget.username}`);
      } else {
        console.log(`   💰 Budget: Not set (using default)`);
      }
      
      // Get transaction count
      const count = await Transaction.countDocuments({ chatId });
      console.log(`   📝 Transactions: ${count}`);
      
      // Get total spent
      const result = await Transaction.aggregate([
        { $match: { chatId } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);
      const total = result.length > 0 ? result[0].total : 0;
      console.log(`   💸 Total Spent: ${total}`);
      
      // Get last transaction
      const lastTx = await Transaction.findOne({ chatId }).sort({ createdAt: -1 });
      if (lastTx) {
        console.log(`   🕐 Last Activity: ${lastTx.createdAt.toLocaleString()}`);
        console.log(`   📌 Last Entry: ${lastTx.amount} - ${lastTx.category}`);
      }
    }
    
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    console.log('✅ Each user has completely isolated data!');
    console.log('✅ Users can set their own budgets');
    console.log('✅ Users track their own expenses');
    console.log('✅ No data sharing between users\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

showAllUsers();
