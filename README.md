# Fin-Bot: Telegram Expense Tracker Bot

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Fin-Bot is a Telegram bot designed to help you track your daily expenses effortlessly. With Fin-Bot, you can quickly add expense entries, view and filter your expenses by category, set and update a custom budget, export your data to CSV, and more—all powered by MongoDB for scalability and multi-user support.

This project is open-source and is built using Node.js, Express, MongoDB, and the Telegram Bot API.

## 🌟 Features

- **Multi-User Support** - Each user gets isolated data automatically
- **Expense Tracking** - Add expenses with simple messages like `"100 Coffee"`
- **Monthly Budget Tracking** - Track budget on a monthly basis (day 1 to last day)
- **Budget Status** - Check remaining budget with visual indicators (✅ ⚠️ 🚫)
- **Month-Specific Exports** - Export any month's transactions with overview statistics
- **Month Comparison** - Compare spending between two months
- **Category Filtering** - Filter expenses by category
- **Summary Reports** - Daily, weekly, and monthly summaries
- **Group Support** - Use in personal chats or Telegram groups for shared expenses
- **Scalable** - MongoDB backend handles unlimited users and transactions

## 🚀 Technologies Used

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - Database for scalable storage
- **Mongoose** - MongoDB ODM
- **node-telegram-bot-api** - Telegram Bot API wrapper
- **dotenv** - Environment variable management

## 📋 Prerequisites

- Node.js (v14+ recommended)
- MongoDB Atlas account (free tier) or local MongoDB
- Telegram Bot Token from [BotFather](https://t.me/BotFather)

## 🔧 Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/sahilmandre/fin-bot.git
   cd fin-bot
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create a `.env` file:
   ```env
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/finbot
   PORT=3000
   ```

4. **Start the Bot:**
   ```bash
   npm start
   ```

## 📱 Bot Commands

### Basic Commands
- `/start` - Initialize the bot
- `/instructions` - Show all available commands

### Expense Tracking
- `100 Coffee` - Add expense (format: amount description)
- `/view` - View all your entries
- `/lastentry` - Show last entry
- `/removelastentry` - Delete last entry

### Budget Management
- `/setbudget 5000` - Set your monthly budget
- `/remaining` - Check remaining budget for current month with status indicators

### Reports & Export
- `/export` - Export current month's transactions with overview
- `/export Nov` - Export specific month (Nov, November, or 11)
- `/compare Oct Nov` - Compare spending between two months
- `/summary daily` - Daily summary
- `/summary weekly` - Weekly summary
- `/summary monthly` - Monthly summary

### Advanced Features
- `/category Food` - Filter by category
- `/summary daily` - Get daily/weekly/monthly summaries
- `/compare Oct Nov` - Compare spending between months

## 👥 Multi-User Support

Each user automatically gets:
- ✅ Isolated data (complete privacy)
- ✅ Personal budget settings
- ✅ Individual transaction history
- ✅ Private reports and exports

Works in:
- Personal chats (private tracking)
- Group chats (shared expenses)

No configuration needed - just start using!

## 📊 Admin Commands

Monitor your bot:
```bash
npm run show:users      # View all users and stats
npm run check:chatids   # Check chatIds in database
```

## 📚 Documentation

Detailed documentation available in the `docs/` folder:
- [Setup Guide](docs/SETUP_GUIDE.md) - Complete setup instructions
- [Multi-User Guide](docs/MULTI_USER.md) - How multi-user works
- [Admin Commands](docs/ADMIN_COMMANDS.md) - Monitoring and maintenance

## 🏗️ Project Structure

```
fin-bot/
├── config/          # Configuration files
├── handlers/        # Command handlers
├── models/          # MongoDB models
├── services/        # Business logic services
├── scripts/         # Utility scripts
├── utils/           # Helper functions
├── docs/            # Documentation
├── bot.js           # Main entry point
└── server.js        # Express server
```

## 🔐 Security

- Environment variables for sensitive data
- MongoDB authentication
- User data isolation
- No data sharing between users

## 🚀 Deployment

### Vercel (Recommended)
1. Connect GitHub repo to Vercel
2. Add environment variables
3. Deploy

### Other Platforms
- Heroku
- Railway
- DigitalOcean
- AWS

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 👨‍💻 Author

**Sahil Mandre**
- GitHub: [@sahilmandre](https://github.com/sahilmandre)
- Portfolio: [sahilmandre.vercel.app](https://portfolio-sahilmandre.vercel.app/)

## 🙏 Acknowledgments

- Telegram Bot API
- MongoDB Atlas
- Node.js community

---

**Happy Expense Tracking with Fin-Bot!** 🎉

For detailed setup and usage instructions, check the [documentation](docs/).
