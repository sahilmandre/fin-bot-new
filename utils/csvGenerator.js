class CSVGenerator {
  static generateCSV(transactions) {
    if (!transactions || transactions.length === 0) {
      return 'Date,Amount,Category,Username\n';
    }

    // CSV Header
    let csv = 'Date,Amount,Category,Username\n';

    // Add each transaction as a row
    transactions.forEach(transaction => {
      const date = this.formatDate(transaction.date);
      const amount = transaction.amount;
      const category = this.escapeCSV(transaction.category);
      const username = this.escapeCSV(transaction.username);

      csv += `${date},${amount},${category},${username}\n`;
    });

    return csv;
  }

  static formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  static escapeCSV(value) {
    if (!value) return '';
    
    const stringValue = String(value);
    
    // If the value contains comma, quote, or newline, wrap it in quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      // Escape quotes by doubling them
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
  }

  static createBuffer(csvString) {
    return Buffer.from(csvString, 'utf-8');
  }
}

module.exports = CSVGenerator;
