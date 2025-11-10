# Finance Bot - Setup Guide

## 🎯 Prerequisites

- Node.js installed
- MongoDB Atlas account (free tier)
- Telegram Bot Token

## 📦 Installation

1. **Clone and Install:**
   ```bash
   npm install
   ```

2. **Configure Environment:**
   Create `.env` file:
   ```env
   TELEGRAM_BOT_TOKEN="your-bot-token"
   MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/finbot"
   PORT=3000
   ```

3. **Start Bot:**
   ```bash
   npm start
   ```

## 🧪 Testing

Test the bot by sending commands in Telegram:
```
/start
100 Coffee
/view
```

## 📱 Telegram Commands

### Basic Commands:
- `/start` - Initialize bot
- `/instructions` - Show all commands

### Expense Tracking:
- `100 Coffee` - Add expense (format: amount description)
- `/view` - View all entries
- `/lastentry` - Show last entry
- `/removelastentry` - Delete last entry

### Budget Management:
- `/setbudget 5000` - Set monthly budget
- Budget automatically shows remaining amount

### Reports:
- `/export` - Download CSV
- `/summary daily` - Daily summary
- `/summary weekly` - Weekly summary
- `/summary monthly` - Monthly summary

### Advanced:
- `/category Food` - Filter by category
- `/split 200 Dinner @user1:100 @user2:100` - Split expenses

## 👥 Multi-User Support

Each Telegram user/group automatically gets:
- Isolated data
- Personal budget
- Private transaction history

No configuration needed!

## 🔧 Admin Commands

```bash
npm run show:users      # View all users and stats
npm run check:chatids   # Check chatIds in database
npm run test:mongo      # Test MongoDB connection
```

## 🚀 Deployment

### Vercel (Recommended):
1. Connect GitHub repo to Vercel
2. Add environment variables
3. Deploy

### Other Platforms:
- Heroku
- Railway
- DigitalOcean
- AWS

## 📊 Monitoring

Check all users:
```bash
npm run show:users
```

Output shows:
- User chatIds
- Budgets
- Transaction counts
- Total spent
- Last activity

## 🐛 Troubleshooting

**Bot not responding:**
- Check TELEGRAM_BOT_TOKEN in .env
- Verify bot is running
- Check console for errors

**MongoDB connection failed:**
- Verify MONGODB_URI in .env
- Check MongoDB Atlas whitelist
- Check MongoDB Atlas status dashboard
- Verify network connectivity

**No entries found:**
- Each user has isolated data
- Try adding a test entry first
- Check chatId: `npm run check:chatids`

## 🎓 Next Steps

1. Share bot with users
2. Monitor usage with `npm run show:users`
3. Add custom features as needed
4. Scale with MongoDB Atlas

## 📚 More Documentation

- `MULTI_USER.md` - Multi-user architecture
- `ADMIN_COMMANDS.md` - Admin tools
