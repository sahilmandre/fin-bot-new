const { google } = require("googleapis");
const config = require("../config/config");

class GoogleSheetsService {
  constructor() {
    this.sheets = google.sheets("v4");
    this.authClient = new google.auth.JWT({
      email: config.google.clientEmail,
      key: config.google.privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    this.spreadsheetId = config.google.sheetId;
  }

  async getBudget() {
    await this.authClient.authorize();
    const response = await this.sheets.spreadsheets.values.get({
      auth: this.authClient,
      spreadsheetId: this.spreadsheetId,
      range: "Sheet1!I1",
    });
    const values = response.data.values;
    return values && values.length > 0 && values[0].length > 0 
      ? parseFloat(values[0][0]) || 0 
      : 0;
  }

  async updateBudget(newBudget) {
    await this.authClient.authorize();
    await this.sheets.spreadsheets.values.update({
      auth: this.authClient,
      spreadsheetId: this.spreadsheetId,
      range: "Sheet1!I1",
      valueInputOption: "USER_ENTERED",
      resource: { values: [[newBudget]] },
    });
  }

  async getLastEntry() {
    await this.authClient.authorize();
    const response = await this.sheets.spreadsheets.values.get({
      auth: this.authClient,
      spreadsheetId: this.spreadsheetId,
      range: config.app.sheetRange,
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) return null;
    
    const lastEntry = rows[rows.length - 1];
    return {
      date: lastEntry[0],
      amount: lastEntry[1],
      category: lastEntry[2],
      username: lastEntry[3],
    };
  }

  async deleteLastEntry() {
    await this.authClient.authorize();
    const response = await this.sheets.spreadsheets.values.get({
      auth: this.authClient,
      spreadsheetId: this.spreadsheetId,
      range: "Sheet1!A2:D",
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) throw new Error("No entries found.");
    
    const lastRowIndex = rows.length + 1;
    await this.sheets.spreadsheets.batchUpdate({
      auth: this.authClient,
      spreadsheetId: this.spreadsheetId,
      resource: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: 0,
              dimension: "ROWS",
              startIndex: lastRowIndex - 1,
              endIndex: lastRowIndex,
            },
          },
        }],
      },
    });
    
    return {
      date: rows[rows.length - 1][0],
      amount: rows[rows.length - 1][1],
      category: rows[rows.length - 1][2],
      username: rows[rows.length - 1][3],
    };
  }

  async addEntry(amount, description, username) {
    await this.authClient.authorize();
    await this.sheets.spreadsheets.values.append({
      auth: this.authClient,
      spreadsheetId: this.spreadsheetId,
      range: "Sheet1!A2:D2",
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [[new Date().toLocaleString(), amount, description, username]],
      },
    });
  }

  async getAllEntries() {
    await this.authClient.authorize();
    const response = await this.sheets.spreadsheets.values.get({
      auth: this.authClient,
      spreadsheetId: this.spreadsheetId,
      range: "Sheet1!A2:D",
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];
    
    return rows.map((row) => ({
      date: row[0],
      amount: row[1],
      category: row[2],
      username: row[3],
    }));
  }

  async calculateTotalSpent() {
    const response = await this.sheets.spreadsheets.values.get({
      auth: this.authClient,
      spreadsheetId: this.spreadsheetId,
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
}

module.exports = GoogleSheetsService;