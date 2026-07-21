# Deployment Guide

This deploys the backend to **Render** and the frontend to **Vercel**, as two separate services on two separate domains. All the CORS/cookie code has already been adjusted for this split-domain setup.

---

## 0. Push the project to your own GitHub repo

```bash
cd AI-Ecom
git init
git add .
git commit -m "Initial commit"
```

Create a **new, empty** repository under your own GitHub account (don't fork the original — a fresh repo has no history tying it back to anyone else), then:

```bash
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git branch -M main
git push -u origin main
```

---

## 1. Set up your database — MongoDB Atlas

1. Create a free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free (M0) cluster.
3. Under **Database Access**, create a database user + password.
4. Under **Network Access**, add `0.0.0.0/0` (allow access from anywhere — needed since Render's IP isn't static on the free tier).
5. Click **Connect → Drivers**, copy the connection string. It looks like:
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/`
6. Add a database name to the end, e.g. `.../ai-ecom?retryWrites=true&w=majority` — this becomes your `MONGO_URI`.

## 2. Stripe

1. Sign up at [dashboard.stripe.com/register](https://dashboard.stripe.com/register).
2. Stay in **test mode** for now (toggle top-right).
3. Go to **Developers → API keys** → copy the **Secret key** → this is `STRIPE_SECRET_KEY`.
4. You'll create the webhook (`STRIPE_WEBHOOK_SECRET`) **after** the backend is deployed, in step 5 below — Stripe needs your live backend URL first.

## 3. AWS S3 (image uploads)

1. Create a free account at [aws.amazon.com](https://aws.amazon.com) (requires a card on file for identity verification, but this stays within the free tier at this project's scale).
2. Go to **S3 → Create bucket**. Give it a unique name (e.g. `your-name-ai-ecom-images`), pick a region close to you, and leave defaults otherwise **except**: uncheck "Block all public access" (needed so product images are viewable) and acknowledge the warning.
3. Go to **IAM → Users → Create user**. Give it programmatic access only (no console login needed).
4. Attach the policy `AmazonS3FullAccess` (fine for a personal project; for production you'd scope this down to just your bucket).
5. After creating the user, go to **Security credentials → Create access key** → choose "Application running outside AWS" → copy the **Access key ID** and **Secret access key** immediately (the secret is only shown once).
6. These map to: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME` (the bucket name from step 2), and `AWS_REGION` (e.g. `us-east-1` — matches the region you picked for the bucket).

## 4. Vercel AI Gateway (AI admin tools)

1. Go to [vercel.com/docs/ai-gateway](https://vercel.com/docs/ai-gateway) and create an API key from your Vercel account (Settings → AI Gateway).
2. This becomes `AI_GATEWAY_API_KEY`. This is independent of where you deploy the frontend.

---

## 5. Deploy the backend to Render

1. Sign up at [render.com](https://render.com) and connect your GitHub account.
2. **New → Blueprint**, point it at your repo — it will detect `render.yaml` at the project root and pre-fill the service. (Alternatively: **New → Web Service**, root directory `backend`, build command `npm install && npm run build`, start command `npm run start`.)
3. Fill in the environment variables when prompted (or add them under the service's **Environment** tab after creation):
   - `MONGO_URI`, `JWT_SECRET` (any long random string — e.g. run `openssl rand -base64 32`), `JWT_EXPIRES_IN=7d`
   - `STRIPE_SECRET_KEY`
   - `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME`
   - `AI_GATEWAY_API_KEY`
   - `FRONTEND_ORIGIN` — leave a placeholder for now (e.g. `http://localhost:5173`), you'll update it in step 7
   - Leave `STRIPE_WEBHOOK_SECRET` blank for now
4. Deploy. Note your live backend URL, e.g. `https://ai-ecom-backend.onrender.com`.
5. **Set up the Stripe webhook now:**
   - Stripe Dashboard → **Developers → Webhooks → Add endpoint**
   - Endpoint URL: `https://<your-backend-url>/api/webhook/stripe`
   - Select the `checkout.session.completed` event (and any others your checkout flow uses)
   - Copy the **Signing secret** → set it as `STRIPE_WEBHOOK_SECRET` in Render's environment tab → redeploy.

> Free-tier note: Render's free web services spin down after inactivity and take ~30–60s to wake on the next request. Fine for a resume/demo project; upgrade to a paid instance if you want it always-warm.

## 6. Deploy the frontend to Vercel

1. Sign up at [vercel.com](https://vercel.com), **Add New → Project**, import your GitHub repo.
2. Set the **Root Directory** to `client`.
3. Vercel auto-detects Vite; the included `client/vercel.json` handles the SPA routing fallback.
4. Add environment variable: `VITE_BASE_API_URL` = `https://<your-render-backend-url>/api/`
5. Deploy. Note your live frontend URL, e.g. `https://your-project.vercel.app`.

## 7. Connect the two

1. Back in Render, update `FRONTEND_ORIGIN` to your real Vercel URL (`https://your-project.vercel.app`, no trailing slash) → redeploy.
2. Confirm in your browser: sign up, add to cart, check out with a [Stripe test card](https://docs.stripe.com/testing) (`4242 4242 4242 4242`, any future date/CVC), and verify the order appears and stock updates.

## 8. Seed initial data (optional)

Run once, locally, pointed at your production `MONGO_URI` (or via Render's shell):

```bash
cd backend
npm run seed:categories
```

You'll still need to add products yourself through the admin dashboard (or write a seed script if you want sample products for a demo).

---

## Checklist before you share the link

- [ ] Test the full flow end-to-end on the live URLs (not localhost)
- [ ] Switch Stripe from test to live mode only if you intend to take real payments — otherwise leave it in test mode and say so in your resume/portfolio blurb
- [ ] Double check `.env` was never committed (`git log --all --full-history -- '**/.env'` should return nothing)
- [ ] Add a couple of screenshots or a short screen recording to your README/portfolio — recruiters skim, they don't clone repos
