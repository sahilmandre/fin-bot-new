# Admin Commands & Monitoring

## 📊 User Monitoring

### Show All Users
```bash
npm run show:users
```

Displays:
- All chatIds
- Budgets per user
- Transaction counts
- Total spent
- Last activity

### Check ChatIds
```bash
npm run check:chatids
```

Shows unique chatIds in database.

## 🔧 Maintenance

### Update User ChatId
```bash
node scripts/updateChatId.js <new-chat-id>
```

Updates chatId for migrated data (if needed).

## 📈 Monitoring Best Practices

1. **Regular Checks:**
   - Run `npm run show:users` weekly
   - Monitor user growth
   - Check for issues

2. **Performance:**
   - MongoDB Atlas dashboard
   - Query performance
   - Storage usage

3. **User Support:**
   - Help users with chatId issues
   - Verify data isolation
   - Troubleshoot problems

## 🔍 Debugging

### Check Logs
Bot logs show:
```
📱 Message from Chat ID: 819796876 (Sam)
Connected to MongoDB successfully
```

### Common Issues

**User can't see data:**
- Check their chatId in logs
- Verify data exists: `npm run check:chatids`
- Update if needed: `node scripts/updateChatId.js <id>`

**MongoDB connection failed:**
- Check MONGODB_URI in .env
- Verify MongoDB Atlas whitelist
- Check MongoDB Atlas status dashboard

## 📊 Database Stats

MongoDB Atlas Dashboard shows:
- Storage used
- Number of documents
- Query performance
- Connection stats

## 🚀 Scaling

When to upgrade:
- Storage > 400MB (free tier: 512MB)
- Many concurrent users
- Need better performance

Upgrade path:
- M2: $9/month (2GB)
- M5: $25/month (5GB)
- Higher tiers available

## 🔐 Security

1. **Environment Variables:**
   - Never commit .env
   - Rotate tokens regularly
   - Use strong passwords

2. **MongoDB:**
   - Whitelist IPs only
   - Use strong passwords
   - Enable 2FA on Atlas

3. **Bot Token:**
   - Keep secret
   - Regenerate if compromised
   - Don't share publicly

## 📝 Backup

### Manual Backup
MongoDB Atlas:
- Automated backups (paid tiers)
- Manual export via Atlas UI

### Export Data
Users can export their own data:
```
/export
```

## 🎯 Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run show:users` | View all users and stats |
| `npm run check:chatids` | Check chatIds in database |
| `node scripts/updateChatId.js <id>` | Update chatId (if needed) |

## 📞 Support

For issues:
1. Check logs
2. Run test commands
3. Verify environment variables
4. Check MongoDB Atlas status
