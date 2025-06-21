# 🎬 MovieTicketBooking

A full-stack movie ticket booking web application that allows users to browse movies, view showtimes, book tickets, and receive notifications. The app features secure authentication, real-time event handling, email notifications, and online payments.

## 🌐 Live Demo

Deployed on [Vercel](https://movie-ticket-booking-blond.vercel.app/)

---

## 📌 Features

- 👤 User authentication and session management (via [Clerk](https://clerk.dev))
- 🎬 Dynamic movie data fetched from TMDB
- 🎟️ Movie and show browsing
- 🪑 Seat selection and booking
- 💳 Secure online payments via [Stripe](https://stripe.com)
- 📩 Email notifications for:
  - Ticket booking confirmation
  - New show/movie announcements
  - Showtime reminders
- ⚡ Event-driven architecture using [Inngest](https://www.inngest.com)
- 📧 Email delivery via [Brevo (formerly Sendinblue)](https://www.brevo.com)
- 🎨 Beautiful responsive UI with **React** and **Tailwind CSS**
- 🚀 Fully deployed on **Vercel**

---

## 🛠 Tech Stack

### Frontend
- [React](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Vite](https://vitejs.dev)
- [Clerk](https://clerk.dev) for user auth

### Backend
- [Node.js](https://nodejs.org)
- [Express](https://expressjs.com)
- [MongoDB](https://www.mongodb.com) via [Mongoose](https://mongoosejs.com)
- [Inngest](https://www.inngest.com) for background jobs/event triggers
- [Brevo](https://www.brevo.com) for sending transactional emails
- [Stripe](https://stripe.com) for payment integration
- [TMDB](https://www.themoviedb.org/) for movie data

### Deployment
- Frontend + Server: [Vercel](https://vercel.com)
- Database: MongoDB Atlas or local MongoDB

---

## 📷 Screenshots
<p align="center">
  <img src="screenshots/homepage.png" alt="Homepage"/>
</p>
<p align="center"><em>Homepage showing movie listings</em></p>

<p align="center">
  <img src="screenshots/nowshowing.png" alt="NowShoing"/>
</p>
<p align="center"><em>Now Showing movie listings</em></p>

<p align="center">
  <img src="screenshots/moviedetails.png" alt="MovieDetails"/>
</p>
<p align="center"><em>Movie Details Page</em></p>

<p align="center">
  <img src="screenshots/seatselection.png" alt="SeatSelection"/>
</p>
<p align="center"><em>Seat Selection Page</em></p>

<p align="center">
  <img src="screenshots/admindashboard.png" alt="AdminDashboard"/>
</p>
<p align="center"><em>Admin Dashboard Page</em></p>

<p align="center">
  <img src="screenshots/addshow.png" alt="AddShow"/>
</p>
<p align="center"><em>Add Show Page</em></p>

## 📦 Installation

### 📦 Prerequisites

Before you begin, make sure you have the following installed:

* [Node.js](https://nodejs.org/) (v18 or above)
* [MongoDB](https://www.mongodb.com/) (local or hosted via MongoDB Atlas)
* [Git](https://git-scm.com/)
* Accounts and API keys from:

  * [Clerk](https://clerk.dev) – for authentication
  * [Stripe](https://stripe.com) – for payments
  * [Inngest](https://www.inngest.com) – for background jobs
  * [Brevo](https://www.brevo.com) – for sending emails
  * [TMDB](https://www.themoviedb.org/) - for movie data

---

### 🔽 1. Clone the Repository

```bash
git clone https://github.com/your-username/movieticketbooking.git
cd movieticketbooking
```

---

### 🔐 2. Set Up Environment Variables

Create `.env` files in both the `server` and `client` directories.

#### 📁 server/.env

```env
MONGO_URI=your_mongodb_connection_string
HOST_URL=you_frontend_url
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
INGGEST_EVENT_KEY=your_inngest_event_key
INGGEST_SIGNING_KEY=your_inngest_signing_key
TMDB_API_KEY=your_tmdb_api_key
TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p/original
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
SENDER_EMAIL=your_brevo_sender_email
SMTP_HOST=your_smtp_host_address
SMTP_PORT=your_smtp_port brevo=587
SMTP_USER=your_smtp_user
SMTP_PASSWORD=your_smtp_password
```

#### 📁 client/.env

```env
VITE_CURRENCY=currency_symbol
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_BASE_URL=your_server_url
VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p/original
```

Replace all placeholder values (`your_*`) with your actual API keys and URLs.

---

### 📥 3. Install Dependencies

#### Backend (Express server)

```bash
cd server
npm install
```

#### Frontend (React + Vite)

```bash
cd ../client
npm install
```

---

### ▶️ 4. Start Development Servers

#### Start the Backend

```bash
cd server
npm run dev
```

#### Start the Frontend

```bash
cd ../client
npm run dev
```

---

### 🌐 5. Open the App

Once both servers are running, open your browser and go to:

```
http://localhost:5173
```

---

✅ You're all set! You can now browse movies, book tickets, and test the full functionality of your MovieTicketBooking web app locally.
