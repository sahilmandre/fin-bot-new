# Finance Bot Documentation

## 📚 Documentation Files

- **SETUP_GUIDE.md** - Complete setup and usage guide
- **MULTI_USER.md** - How multi-user support works
- **ADMIN_COMMANDS.md** - Admin commands and monitoring

## 🚀 Quick Start

1. **Setup MongoDB:**
   - Get MongoDB Atlas connection string
   - Add to `.env`: `MONGODB_URI="your-connection-string"`

2. **Start Bot:**
   ```bash
   npm start
   ```

3. **Test in Telegram:**
   ```
   /start
   100 Coffee
   /view
   ```

## 📊 Admin Commands

```bash
npm run show:users      # See all users and stats
npm run check:chatids   # Check chatIds in database
```

## 🎯 Features

- ✅ Multi-user support (isolated data per user)
- ✅ Budget tracking per user
- ✅ Expense categorization
- ✅ Export to CSV
- ✅ Summary reports
- ✅ Split expenses
- ✅ MongoDB for scalability

## 📞 Support

Check individual documentation files for detailed information.
