const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  chatId: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  period: {
    type: String,
    enum: ['monthly', 'weekly', 'daily'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  username: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

budgetSchema.index({ chatId: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);