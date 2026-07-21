# 🛒 AI Ecommerce Platform — MERN Stack

A full-stack ecommerce platform with guest & authenticated carts, product catalog with AI-assisted content tools, Stripe checkout, order tracking, ratings & reviews, and an admin dashboard with analytics.

> Built on top of an open-source MERN ecommerce starter, extended and deployed independently.

---

## ✨ Features

- 🔐 JWT (cookie-based) authentication
- 🛒 Guest cart with auto-merge on login
- 🛍️ Full shopping cart & checkout flow
- 📦 Product catalog — categories, search, filtering, sorting, pagination
- 🖼️ Image uploads via AWS S3
- ⭐ Ratings & reviews (verified purchase only)
- 💳 Stripe Checkout + webhook-based payment confirmation
- 📍 Saved shipping addresses
- 📦 Order placement, tracking, and status updates
- 👨‍💼 Admin dashboard — products, orders, analytics
- 🤖 AI-assisted admin tools (product title rewrite & description generation)

## 🏗️ Tech Stack

**Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, Zustand
**Backend:** Node.js, Express 5, MongoDB (Mongoose), JWT, Passport
**Integrations:** Stripe, AWS S3, Vercel AI SDK (Gemini)

---

## 📁 Project Structure

```
AI-Ecom/
├── backend/     # Express API server
└── client/      # React frontend (Vite)
```

---

## 🚀 Local Setup

### 1. Prerequisites
- Node.js 18+
- A MongoDB database (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier)
- A [Stripe](https://dashboard.stripe.com/register) account (test mode is fine)
- An [AWS](https://aws.amazon.com) account with an S3 bucket (free tier)
- A [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) API key (for the AI admin tools)

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# fill in the values in .env — see table below
npm run seed:categories   # optional: seeds initial categories
npm run dev
```

### 3. Frontend

```bash
cd client
npm install
cp .env.example .env
# set VITE_BASE_API_URL to your backend URL
npm run dev
```

The app will be available at `http://localhost:5173`, with the API at `http://localhost:8000`.

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `NODE_ENV` | `development` or `production` |
| `PORT` | Port for the API server (e.g. `8000`) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Any long random string, used to sign auth tokens |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `STRIPE_SECRET_KEY` | From Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | From Stripe Dashboard → Developers → Webhooks (see below) |
| `AWS_REGION` | AWS region your S3 bucket is in, e.g. `us-east-1` |
| `AWS_ACCESS_KEY_ID` | From an IAM user with S3 access |
| `AWS_SECRET_ACCESS_KEY` | From the same IAM user |
| `AWS_S3_BUCKET_NAME` | Name of the S3 bucket used for product images |
| `FRONTEND_ORIGIN` | URL of your deployed frontend (for CORS) |
| `AI_GATEWAY_API_KEY` | From [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) — powers the AI admin tools |

### Frontend (`client/.env`)

| Variable | Description |
|---|---|
| `VITE_BASE_API_URL` | Base URL of the backend API, e.g. `http://localhost:8000/api/` |

---

## ☁️ Deployment

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for full step-by-step deployment instructions (backend on Render, frontend on Vercel, Stripe webhook setup, and post-deploy checklist).

---

## 🧪 Testing

`backend/src/tests/` contains integration test files (auth, cart, products, orders, reviews, admin, etc.) written as plain TypeScript using `fetch` against a running server — likely originally generated with an AI testing tool. They now point at `http://localhost:8000/api` by default (previously hardcoded to the original author's own deployed URL, which has been fixed).

**Note:** there's currently no test runner wired up (no Jest/Vitest installed, no `test` script in `package.json`), so these files can't be run with a single command yet. To make them runnable, you'd add a test runner and a script — ask me if you'd like this set up.
