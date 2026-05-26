# Stripe webhook server (port 3000)

Sends the activation code by email when Stripe fires `checkout.session.completed`.

## 1. Configure environment

Copy `.env.example` to `.env` in the project root and fill in values:

```bash
cp .env.example .env
```

Required:

- `STRIPE_SECRET_KEY` — Stripe secret API key
- `STRIPE_WEBHOOK_SECRET` — webhook signing secret (`whsec_...`)
- `SMTP_*` — mail server for nodemailer
- `ACTIVATION_CODE` — defaults to `ABCD-1234PINGSH002`

## 2. Start the server

```bash
npm run server
```

Open http://localhost:3000/ — you should see: **Server is running**

## 3. Local webhook testing (Stripe CLI)

```bash
stripe listen --forward-to localhost:3000/stripe/webhook
```

Copy the **webhook signing secret** (`whsec_...`) from the CLI output into `.env` as `STRIPE_WEBHOOK_SECRET`, then restart the server.

Trigger a test event:

```bash
stripe trigger checkout.session.completed
```

## 4. Public URL with ngrok

Install ngrok: https://ngrok.com/download

```bash
npm run server
ngrok http 3000
```

ngrok shows a URL like `https://abc123.ngrok.io`.

Your webhook endpoint is:

```text
https://abc123.ngrok.io/stripe/webhook
```

In **Stripe Dashboard → Developers → Webhooks → Add endpoint**:

1. URL: `https://abc123.ngrok.io/stripe/webhook`
2. Events: `checkout.session.completed`
3. Copy the endpoint **Signing secret** (`whsec_...`) into `.env` as `STRIPE_WEBHOOK_SECRET`

## Endpoints

| Method | Path              | Description                    |
|--------|-------------------|--------------------------------|
| GET    | `/`               | Returns `Server is running`    |
| POST   | `/stripe/webhook` | Stripe signed webhook handler  |

## Flow

1. Customer completes Stripe Checkout.
2. Stripe sends `checkout.session.completed` to `/stripe/webhook`.
3. Server reads `session.customer_details.email`.
4. Server emails the activation code via nodemailer.
