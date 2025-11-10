const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  chatId: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
transactionSchema.index({ chatId: 1, date: -1 });
transactionSchema.index({ chatId: 1, category: 1 });
transactionSchema.index({ username: 1, date: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);