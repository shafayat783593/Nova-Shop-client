<div align="center">

# 🛍️ NovaShop

### Multi-Role E-commerce Platform

[![Live Demo](https://img.shields.io/badge/Live_Demo-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://novashop-bd.vercel.app/)

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-008CDD?style=for-the-badge&logo=stripe&logoColor=white)

</div>

---

## 📖 Overview

NovaShop is a full-featured, multi-role e-commerce platform built from scratch with a **Next.js** frontend and a **Node.js / Express / MongoDB** backend. It supports customers, sellers/admins, and real-time interactions — designed and built as an end-to-end production system, not just a demo.

**🔗 Live:** [novashop-bd.vercel.app](https://novashop-bd.vercel.app/)

---

## ✨ Key Features

- 🔐 **Authentication** — Google OAuth (Passport.js) alongside standard auth, secured with JWT and CSRF tokens
- 💳 **Payments** — Stripe (with webhook-driven order confirmation), SSLCommerz, and bKash gateway integrations
- 💬 **Real-Time Chat** — Customer ↔ Admin live chat powered by Socket.IO
- ⭐ **Review System** — Product reviews gated behind verified delivered-order status
- 🏷️ **Promotions & Discounts** — Dynamic promotion engine reflected live across cart, checkout, and a navbar promo ticker
- 🛒 **Cart & Checkout** — Full shopping cart flow with real-time price/discount calculation
- 🧑‍💼 **Multi-Role Access** — Separate customer and admin experiences with role-based permissions
- ⚡ **Caching** — Redis used for performance-sensitive data
- 🌍 **Cross-Origin Auth** — Secure cookie handling across frontend/backend domains via same-origin proxying

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js, React, Tailwind CSS |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose), Redis |
| **Real-time** | Socket.IO |
| **Auth** | Passport.js (Google OAuth), JWT, CSRF protection |
| **Payments** | Stripe, SSLCommerz, bKash |
| **Email** | Resend (HTTP API) |
| **Deployment** | Vercel (frontend), Render (backend) |

---

## 🏗️ Architecture Notes

- **Cross-origin cookies**: Resolved via Vercel rewrites for same-origin proxying between frontend and backend
- **Real-time chat**: Fixed a dual Socket.IO instance bug that caused messages to not appear without a manual reload
- **Transactional email**: Migrated from SMTP (blocked on Render) to Resend's HTTP API for reliable delivery in production
- **Stripe webhooks**: Handles order metadata and payment confirmation asynchronously

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/shafayat783593/novashop.git
cd novashop

# Install dependencies (frontend & backend)
npm install

# Set up environment variables
cp .env.example .env

# Run the development server
npm run dev
```

### Environment Variables

```env
MONGODB_URI=
REDIS_URL=
JWT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SSLCOMMERZ_STORE_ID=
SSLCOMMERZ_STORE_PASSWORD=
BKASH_APP_KEY=
RESEND_API_KEY=
```

---

## 📸 Screenshots

> _Add screenshots or a demo GIF here to showcase the UI._

---

## 🌐 Connect

[![Portfolio](https://img.shields.io/badge/Portfolio-58A6FF?style=for-the-badge&logo=vercel&logoColor=white)](https://shafayat-hosan.vercel.app)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/md-shafayat-hosan)

</div>
