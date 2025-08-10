class DateUtils {
  static getDailyRange() {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return { startDate, endDate };
  }

  static getWeeklyRange() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
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
}

module.exports = DateUtils;