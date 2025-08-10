class MessageFormatter {
  static formatLastEntry(entry) {
    return `Last entry:\nDate: ${entry.date}\nAmount: ${entry.amount}\nCategory: ${entry.category}\nUsername: ${entry.username}`;
  }

  static formatRemovedEntry(entry) {
    return `✅ Last entry removed:\n\nDate: ${entry.date}\nAmount: ${entry.amount}\nCategory: ${entry.category}\nUsername: ${entry.username}`;
  }

  static formatViewEntries(entries) {
    const sortedEntries = entries.sort((a, b) => new Date(b.date) - new Date(a.date));
    const last20Entries = sortedEntries.slice(0, 20);
    
    let message = "Your last 20 spends:\n\n";
    last20Entries.forEach((entry, index) => {
      message += `${index + 1}. Date: ${entry.date}, Amount: ${entry.amount}, Category: ${entry.category}, Username: ${entry.username}\n\n`;
    });
    
    return message;
  }

  static formatCategoryEntries(entries, category) {
    let message = `**Entries for category "${category}":**\n\n`;
    let total = 0;

    entries.forEach((entry, index) => {
      message += `${index + 1}. Date: ${entry.date}, Amount: ${entry.amount}, Username: ${entry.username}\n`;
      total += parseFloat(entry.amount) || 0;
    });

    message += `\n**Total spent in "${category}": ${total}**`;
    return message;
  }

  static formatCSV(entries) {
    let csvData = "Date & Time,Amount,Category,Username\n";
    entries.forEach((entry) => {
      csvData += `"${entry.date}","${entry.amount}",${entry.category},${entry.username}\n`;
    });
    return csvData;
  }

  static formatSummary(period, startDate, endDate, totalExpense, categoryTotals) {
    let message = `*Expense Summary (${period.toUpperCase()})*\n`;
    message += `Period: ${startDate.toLocaleDateString()} to ${new Date(endDate - 1).toLocaleDateString()}\n`;
    message += `Total Expense: ₹${totalExpense.toFixed(2)}\n\n`;
    message += "*Category Breakdown:*\n";
    
    for (const cat in categoryTotals) {
      const catTotal = categoryTotals[cat];
      const percentage = ((catTotal / totalExpense) * 100).toFixed(2);
      message += `- ${cat}: ₹${catTotal.toFixed(2)}  (${percentage}%)\n`;
    }
    
    return message;
  }

  static formatSplitSummary(totalAmount, description, splitData) {
    let message = `Expense split of ₹${totalAmount.toFixed(2)} for "${description}" has been recorded.\nCustom shares:\n`;
    splitData.forEach(({ username, share }) => {
      message += `@${username}: ₹${share.toFixed(2)}\n`;
    });
    return message;
  }

  static formatEntryConfirmation(description, username, totalSpent, amount, remainingAmount) {
    return `Entry added for ${description} by ${username}!\nTotal Spent: ${totalSpent}\nLast Amount: ${amount}\nRemaining Amount: ${remainingAmount}`;
  }
}

module.exports = MessageFormatter;