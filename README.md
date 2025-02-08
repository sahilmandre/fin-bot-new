# Fin-Bot: Telegram Expense Tracker Bot

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Uptime Robot status](https://img.shields.io/uptimerobot/ratio/m788221149-7dba8df26b99d1e3a1833f0d.svg)](https://dashboard.uptimerobot.com/monitors/798540552)

Fin-Bot is a Telegram bot designed to help you track your daily expenses effortlessly. With Fin-Bot, you can quickly add expense entries, view and filter your expenses by category, set and update a custom budget, export your data to CSV, and more—all while using Google Sheets as your storage backend.

This project is open-source and is built using Node.js, Express, and the Google Sheets API. It is hosted on [Render](https://fin-bot-new.onrender.com/) and monitored via [UptimeRobot](https://dashboard.uptimerobot.com/monitors/798540552) to ensure maximum availability.

## Table of Contents
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Bot Commands](#bot-commands)
- [How It Works](#how-it-works)
- [SEO & Accessibility](#seo--accessibility)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)
- [Demo & Uptime](#demo--uptime)

## Features
- **Expense Entry:** Add expense entries simply by sending a message in the format `"100 Grocery"`.
- **User Identification:** Each entry logs the Telegram username of the person who made the entry.
- **View Entries:** Quickly view all entries or just the latest entry.
- **Category Filtering:** Filter expenses by category using the `/category <category>` command.
- **Budget Management:** Set and update a custom budget stored in Google Sheets (cell I1), with automatic remaining amount calculations.
- **Data Export:** Export your expense data as a CSV file.
- **Uptime Monitoring:** The bot is hosted on Render and monitored by UptimeRobot for maximum reliability.

## Technologies Used
- **Node.js** – JavaScript runtime environment.
- **Express.js** – Web framework for Node.js.
- **node-telegram-bot-api** – Library for interacting with the Telegram Bot API.
- **Google Sheets API** – Used for data storage and retrieval.
- **dotenv** – For environment variable management.
- **Render** – Cloud platform used for deploying and running the bot.
- **UptimeRobot** – Service used to monitor the uptime and performance of the bot.

## Getting Started

### Prerequisites
- **Node.js** (v14+ recommended)
- A **Telegram Bot Token** from [BotFather](https://t.me/BotFather)
- A **Google Cloud Project** with Google Sheets API enabled
- A **Google Sheet** with:
  - Columns A–D for expense entries: Date & Time, Amount, Category, Username.
  - Cell I1 to store your custom budget (e.g., `6000`).
  - Cell H1 as a label for the budget (e.g., `"Budget"`).
- An account on **Render** (or any other preferred hosting platform).

### Installation
1. **Clone the Repository:**
    ```bash
    git clone https://github.com/sahilmandre/fin-bot.git
    cd fin-bot
    ```

2. **Install Dependencies:**
    ```bash
    npm install
    ```

3. **Set Up Environment Variables:**
   Create a `.env` file in the root directory with the following variables:
    ```env
    TELEGRAM_BOT_TOKEN=your_telegram_bot_token
    GOOGLE_PRIVATE_KEY="your_google_private_key"
    GOOGLE_CLIENT_EMAIL=your_google_client_email
    GOOGLE_SHEET_ID=your_google_sheet_id
    PORT=3000  # or your preferred port
    ```
    > **Note:** For the `GOOGLE_PRIVATE_KEY`, ensure that newline characters are preserved. You may need to replace `\n` with actual newlines or handle it in your code.

4. **Run Locally or Deploy:**
   - **Locally:**  
     ```bash
     npm start
     ```
   - **Deploy on Render:**  
     Connect your repository to Render and set the environment variables via the Render dashboard.

## Bot Commands
Below is the list of available commands (ordered by usage priority):

- **/start** – Start the bot.
- **/instructions** – Display instructions and list all available commands.
- **/view** – View all expense entries.
- **/lastentry** – View the most recent expense entry.
- **/category `<category>`** – Filter expenses by category (e.g., `/category Food`).
- **/export** – Export all expense data as a CSV file.
- **/setbudget `<amount>`** – Set a custom budget (updates cell I1 in your Google Sheet).
- **/removelastentry** – Remove the last expense entry.

## How It Works
- **Expense Entry:**  
  Users send messages like `"100 Grocery"`, where `100` is the amount and `Grocery` is the expense category. The bot captures the current date, time, and the user’s Telegram username before appending the entry to a Google Sheet.

- **Google Sheets Integration:**  
  The bot uses the Google Sheets API to manage data. Expense entries are stored starting from row 2, while the budget is maintained in cell I1.

- **Dynamic Budget Management:**  
  Users can update the budget with the `/setbudget` command. The bot then calculates the remaining amount by subtracting the total expenses from the current budget.

- **Data Export and Filtering:**  
  With the `/export` command, users can receive a CSV file containing all expense entries. The `/category` command filters entries based on the specified category, making data analysis easy.

## SEO & Accessibility
- **SEO Optimized:**  
  This README contains well-structured headings and relevant keywords such as “Telegram Expense Tracker Bot”, “Google Sheets API”, “Budget Management”, and “Node.js” to enhance search engine visibility.
  
- **Accessibility:**  
  The documentation is designed to be clear and accessible for users and developers, with detailed instructions on setting up and deploying the project.

## Contributing
Contributions are welcome! If you have suggestions, bug fixes, or new features, please open an issue or submit a pull request.

## License
This project is licensed under the [MIT License](LICENSE).

## Contact
Created by **Sahil Mandre**  
[GitHub Profile](https://github.com/sahilmandre)

For any questions or feedback, please open an issue or reach out via GitHub.

## Demo & Uptime
- **Live Bot:** [https://fin-bot-new.onrender.com/](https://fin-bot-new.onrender.com/)
- **Uptime Monitoring:** [UptimeRobot Dashboard](https://dashboard.uptimerobot.com/monitors/798540552)

---

*Happy Expense Tracking with Fin-Bot!*
