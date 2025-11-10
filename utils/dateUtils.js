class DateUtils {
  static getDailyRange() {
    const now = new Date();
    const startDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const endDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );
    return { startDate, endDate };
  }

  static getWeeklyRange() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const startDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + mondayOffset
    );
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7);
    return { startDate, endDate };
  }

  static getMonthlyRange() {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { startDate, endDate };
  }

  static getCustomRange(startInput, endInput) {
    const startDate = new Date(startInput);
    const endDate = new Date(endInput);
    endDate.setDate(endDate.getDate() + 1);

    if (isNaN(startDate) || isNaN(endDate)) {
      throw new Error("Invalid date format");
    }

    return { startDate, endDate };
  }

  static filterEntriesByDateRange(entries, startDate, endDate) {
    return entries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate < endDate;
    });
  }

  // Month parsing utilities
  static parseMonth(monthStr) {
    const now = new Date();
    const currentYear = now.getFullYear();

    // If no month string provided, return current month
    if (!monthStr) {
      return {
        month: now.getMonth(),
        year: currentYear,
      };
    }

    const input = monthStr.trim().toLowerCase();

    // Month names mapping
    const monthNames = {
      january: 0,
      jan: 0,
      february: 1,
      feb: 1,
      march: 2,
      mar: 2,
      april: 3,
      apr: 3,
      may: 4,
      june: 5,
      jun: 5,
      july: 6,
      jul: 6,
      august: 7,
      aug: 7,
      september: 8,
      sep: 8,
      sept: 8,
      october: 9,
      oct: 9,
      november: 10,
      nov: 10,
      december: 11,
      dec: 11,
    };

    // Check if it's a month name
    if (monthNames.hasOwnProperty(input)) {
      return {
        month: monthNames[input],
        year: currentYear,
      };
    }

    // Check if it's a numeric month (1-12)
    const monthNum = parseInt(input);
    if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
      return {
        month: monthNum - 1, // Convert to 0-indexed
        year: currentYear,
      };
    }

    // Invalid format
    throw new Error("Invalid month format");
  }

  static getMonthName(monthIndex) {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return monthNames[monthIndex];
  }

  static getMonthDateRange(year, month) {
    const startDate = new Date(year, month, 1, 0, 0, 0);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);
    return { startDate, endDate };
  }
}

module.exports = DateUtils;