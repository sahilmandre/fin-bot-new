class MessageFormatter {
  static formatLastEntry(entry) {
    return `Last entry:\nDate: ${entry.date}\nAmount: ${entry.amount}\nCategory: ${entry.category}\nUsername: ${entry.username}`;
  }

  static formatRemovedEntry(entry) {
    return `✅ Last entry removed:\n\nDate: ${entry.date}\nAmount: ${entry.amount}\nCategory: ${entry.category}\nUsername: ${entry.username}`;
  }

  static formatViewEntries(entries) {
    const sortedEntries = entries.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    const last20Entries = sortedEntries.slice(0, 20);

    let message = "Your last 20 spends:\n\n";
    last20Entries.forEach((entry, index) => {
      message += `${index + 1}. Date: ${entry.date}, Amount: ${
        entry.amount
      }, Category: ${entry.category}, Username: ${entry.username}\n\n`;
    });

    return message;
  }

  static formatCategoryEntries(entries, category) {
    let message = `**Entries for category "${category}":**\n\n`;
    let total = 0;

    entries.forEach((entry, index) => {
      message += `${index + 1}. Date: ${entry.date}, Amount: ${
        entry.amount
      }, Username: ${entry.username}\n`;
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

  static formatSummary(
    period,
    startDate,
    endDate,
    totalExpense,
    categoryTotals
  ) {
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

    return message;
  }



  static formatEntryConfirmation(
    description,
    username,
    totalSpent,
    amount,
    remainingAmount
  ) {
    return `Entry added for ${description} by ${username}!\nTotal Spent: ${totalSpent}\nLast Amount: ${amount}\nRemaining Amount: ${remainingAmount}`;
  }

  // Monthly budget tracking formatting methods
  static formatRemainingBudget(
    monthName,
    year,
    budget,
    totalSpent,
    remaining,
    percentage,
    emoji
  ) {
    let statusMessage = "";

    if (remaining <= 0) {
      statusMessage = "⚠️ Budget exceeded! Consider reviewing your expenses.";
    } else if (percentage < 20) {
      statusMessage = "⚠️ Warning: You're approaching your budget limit.";
    } else {
      statusMessage = "✅ You're doing great! Keep tracking your expenses.";
    }

    return (
      `💰 *Budget Status - ${monthName} ${year}* ${emoji}\n\n` +
      `Budget: ${budget}\n` +
      `Spent: ${totalSpent}\n` +
      `Remaining: ${remaining} (${percentage.toFixed(1)}%)\n\n` +
      `${statusMessage}`
    );
  }

  static formatMonthOverview(monthName, year, stats) {
    let message = `📊 *${monthName} ${year} Overview*\n\n`;
    message += `Total Transactions: ${stats.transactionCount}\n`;
    message += `Total Spent: ${stats.totalSpent}\n`;
    message += `Budget: ${stats.budget}\n`;
    message += `Remaining: ${stats.remaining}\n`;

    if (stats.categoryBreakdown && stats.categoryBreakdown.length > 0) {
      message += `\nTop Categories:\n`;
      const topCategories = stats.categoryBreakdown.slice(0, 5);
      topCategories.forEach((cat) => {
        const percentage = ((cat.total / stats.totalSpent) * 100).toFixed(1);
        message += `• ${cat.category}: ${cat.total} (${percentage}%)\n`;
      });
    }

    return message;
  }

  static formatMonthComparison(
    month1Name,
    year1,
    stats1,
    month2Name,
    year2,
    stats2
  ) {
    const difference = stats2.totalSpent - stats1.totalSpent;
    const percentChange =
      stats1.totalSpent > 0
        ? ((difference / stats1.totalSpent) * 100).toFixed(1)
        : 0;

    const trendEmoji = difference > 0 ? "📈" : difference < 0 ? "📉" : "➡️";
    const changeText =
      difference > 0 ? "increase" : difference < 0 ? "decrease" : "no change";

    let message = `📊 *Comparison: ${month1Name} ${year1} vs ${month2Name} ${year2}*\n\n`;

    message += `*${month1Name} ${year1}:*\n`;
    message += `• Total Spent: ${stats1.totalSpent}\n`;
    message += `• Transactions: ${stats1.transactionCount}\n`;
    message += `• Avg per transaction: ${stats1.avgTransaction.toFixed(2)}\n\n`;

    message += `*${month2Name} ${year2}:*\n`;
    message += `• Total Spent: ${stats2.totalSpent}\n`;
    message += `• Transactions: ${stats2.transactionCount}\n`;
    message += `• Avg per transaction: ${stats2.avgTransaction.toFixed(2)}\n\n`;

    message += `*Difference:* ${trendEmoji}\n`;
    message += `${Math.abs(difference)} (${Math.abs(
      percentChange
    )}% ${changeText})`;

    return message;
  }
}

module.exports = MessageFormatter;