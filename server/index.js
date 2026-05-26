/**
 * Stripe webhook server (port 3000)
 *
 * Local test:
 *   npm run server
 *   stripe listen --forward-to localhost:3000/stripe/webhook
 *
 * Public URL (ngrok):
 *   ngrok http 3000
 *   → https://YOUR-ID.ngrok.io/stripe/webhook
 */
require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');
const Stripe = require('stripe');

const PORT = Number(process.env.PORT || 3000);
const ACTIVATION_CODE = process.env.ACTIVATION_CODE || 'ABCD-1234PINGSH002';

// From Stripe Dashboard → Developers → Webhooks, or `stripe listen` CLI output
const endpointSecret =
  process.env.STRIPE_WEBHOOK_SECRET || 'whsec_xxxxxx';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

const app = express();

app.get('/', (_req, res) => {
  res.send('Server is running');
});

app.post(
  '/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    if (!stripe) {
      console.error('STRIPE_SECRET_KEY is not set');
      return res.status(500).send('Stripe is not configured');
    }

    const signature = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        endpointSecret
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Webhook signature verification failed:', message);
      return res.status(400).send(`Webhook Error: ${message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const email = session.customer_details?.email;

      console.log('checkout.session.completed', {
        sessionId: session.id,
        email: email || '(no email)',
      });

      if (email) {
        try {
          await sendActivationEmail(email);
          console.log('Activation email sent to', email);
        } catch (mailErr) {
          console.error('Failed to send activation email:', mailErr);
          return res.status(500).json({ received: false, error: 'email_failed' });
        }
      } else {
        console.warn('No customer_details.email on checkout session', session.id);
      }
    }

    res.json({ received: true });
  }
);

async function sendActivationEmail(to) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const from =
    process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@example.com';

  await transporter.sendMail({
    from,
    to,
    subject: 'Your Ping Shuai activation code',
    text: [
      'Thank you for your purchase!',
      '',
      `Your activation code is: ${ACTIVATION_CODE}`,
      '',
      'Open the app, go to the unlock screen, and enter this code to unlock full access.',
    ].join('\n'),
    html: `
      <p>Thank you for your purchase!</p>
      <p>Your activation code is:</p>
      <p style="font-size:20px;font-weight:bold;letter-spacing:1px;">${ACTIVATION_CODE}</p>
      <p>Open the app, go to the unlock screen, and enter this code to unlock full access.</p>
    `,
  });
}

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/`);
  console.log(`Webhook:      http://localhost:${PORT}/stripe/webhook`);
  if (endpointSecret === 'whsec_xxxxxx') {
    console.warn(
      'Warning: set STRIPE_WEBHOOK_SECRET in .env (from Stripe CLI or Dashboard)'
    );
  }
});
