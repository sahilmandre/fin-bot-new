const MongoService = require('../services/mongoService');

async function testRemaining() {
  const mongoService = new MongoService();
  
  try {
    console.log('\n🧪 Testing /remaining command logic...\n');
    
    // Test with a sample chatId (use your actual chatId)
    const testChatId = 7426071488; // Replace with your actual chatId
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    console.log(`Testing for Chat ID: ${testChatId}`);
    console.log(`Month: ${month + 1}/${year}\n`);
    
    const result = await mongoService.getMonthlyRemainingBudget(testChatId, year, month);
    
    console.log('📊 Results:');
    console.log('=====================================');
    console.log('Month:', result.monthName, result.year);
    console.log('Budget:', result.budget);
    console.log('Total Spent:', result.totalSpent);
    console.log('Remaining:', result.remaining);
    console.log('=====================================\n');
    
    if (result.budget === 0) {
      console.log('⚠️  No budget set! Use /setbudget command first.');
    } else {
      console.log('✅ Command logic is working correctly!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testRemaining();
