import express from 'express';
import Stripe from 'stripe';
import logger from '../utils/logger.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create Checkout Session for subscription
router.post('/create-checkout', async (req, res) => {
  const { amount, dogName, userEmail, successUrl, cancelUrl } = req.body;

  // Validate required fields
  if (!amount || !dogName || !userEmail || !successUrl || !cancelUrl) {
    return res.status(400).json({
      error: 'Missing required fields: amount, dogName, userEmail, successUrl, cancelUrl',
    });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'inr',
          product_data: {
            name: `Monthly Virtual Adoption - ${dogName}`,
          },
          unit_amount: amount,
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      },
    ],
    mode: 'subscription',
    customer_email: userEmail,
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  logger.info(`Checkout session created: ${session.id}`);
  res.json({ url: session.url });
});

// Retrieve session details
router.get('/session/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  logger.info(`Session retrieved: ${sessionId}`);
  res.json({
    id: session.id,
    status: session.payment_status,
    amountTotal: session.amount_total,
    customerEmail: session.customer_details?.email,
    subscriptionId: session.subscription,
  });
});

export default router;