const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get payment intent for subscription
router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    // Check if user already has premium subscription
    if (user.subscription === 'premium') {
      return res.status(400).json({ message: 'User already has premium subscription' });
    }

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 500, // $5.00 in cents
      currency: 'usd',
      metadata: {
        userId: user._id.toString(),
        userEmail: user.email,
        type: 'course_subscription'
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ message: 'Error creating payment intent' });
  }
});

// Confirm subscription after successful payment
router.post('/confirm-subscription', auth, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    
    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not successful' });
    }
    
    // Update user subscription
    const user = await User.findById(req.userId);
    user.subscription = 'premium';
    user.subscriptionDate = new Date();
    user.stripeCustomerId = paymentIntent.customer || null;
    await user.save();
    
    // Record transaction
    const transaction = new Transaction({
      userId: user._id,
      stripePaymentIntentId: paymentIntentId,
      amount: paymentIntent.amount / 100, // Convert from cents to dollars
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      paymentMethod: paymentIntent.payment_method_types[0],
      metadata: {
        courseId: 'premium_subscription',
        userEmail: user.email
      }
    });
    
    await transaction.save();
    
    res.json({
      success: true,
      subscription: user.subscription,
      message: 'Premium subscription activated'
    });
  } catch (error) {
    console.error('Subscription confirmation error:', error);
    res.status(500).json({ message: 'Error confirming subscription' });
  }
});

// Get user's transaction history
router.get('/transactions', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId })
      .sort({ createdAt: -1 });
    
    res.json(transactions);
  } catch (error) {
    console.error('Transaction history error:', error);
    res.status(500).json({ message: 'Error fetching transaction history' });
  }
});

// Webhook for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      // Update transaction status if needed
      await Transaction.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntent.id },
        { status: 'succeeded' }
      );
      break;
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      // Update transaction status
      await Transaction.findOneAndUpdate(
        { stripePaymentIntentId: failedPayment.id },
        { status: 'failed' }
      );
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

module.exports = router;