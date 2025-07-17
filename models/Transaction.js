const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stripePaymentIntentId: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'canceled'],
    required: true
  },
  paymentMethod: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: 'Backend Developer Course - Premium Access'
  },
  metadata: {
    courseId: String,
    userEmail: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);