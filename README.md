# She Can Foundation — Full Stack Web Application

A modern, full-stack web application built for the **She Can Foundation**, an NGO dedicated to empowering women and girls through education, healthcare, and technology.

## 🌟 Features

- **Beautiful Landing Page** — Modern dark theme with glassmorphism design, animated gradients, and responsive layout
- **Contact Form** — Name, Email, Phone, Subject, and Message fields with real-time client-side validation
- **Form Submission** — Displays "Form Submitted Successfully!" with animated modal on successful submission
- **Database Integration** — MongoDB Atlas for storing all contact form submissions
- **Authentication** — JWT-based admin authentication with secure password hashing (bcrypt)
- **Admin Dashboard** — View, manage, and delete submissions with real-time statistics
- **REST APIs** — 6 RESTful endpoints for contact submission and admin operations
- **Server-Side Validation** — Input sanitization and validation using express-validator
- **Rate Limiting** — Protection against spam submissions
- **Responsive Design** — Fully responsive across desktop, tablet, and mobile devices

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Authentication | JWT + bcrypt.js |
| Validation | express-validator |
| Security | CORS, Rate Limiting, Input Sanitization |

## 📁 Project Structure

```
├── server.js              # Express server + API routes
├── package.json           # Dependencies
├── .env                   # Environment variables
├── public/
│   ├── index.html         # Landing page + contact form
│   ├── admin.html         # Admin dashboard
│   ├── css/style.css      # Complete stylesheet
│   ├── js/
│   │   ├── main.js        # Form validation & handling
│   │   └── admin.js       # Admin panel logic
│   └── assets/logo.png    # She Can Foundation logo
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB Atlas account (free tier)

### Installation

```bash
# Clone the repository
git clone <repo-url>

# Install dependencies
npm install

# Set up environment variables
# Edit .env file with your MongoDB connection string

# Start the server
node server.js
```

### Environment Variables (.env)
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=SheCan@2026
PORT=3000
```

## 📡 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/contact` | Submit contact form | Public |
| POST | `/api/admin/login` | Admin login | Public |
| GET | `/api/admin/submissions` | Get all submissions | JWT |
| GET | `/api/admin/stats` | Dashboard statistics | JWT |
| PATCH | `/api/admin/submissions/:id/read` | Mark as read | JWT |
| DELETE | `/api/admin/submissions/:id` | Delete submission | JWT |

## 🔐 Admin Access

- **URL:** `http://localhost:3000/admin`
- **Username:** admin
- **Password:** SheCan@2026

## 📱 Responsive Design

The application is fully responsive with breakpoints at:
- **Desktop:** > 1024px
- **Tablet:** 768px - 1024px
- **Mobile:** < 768px

## 👩‍💻 Built By

Built with ❤️ as part of the She Can Foundation Full Stack Development Internship Task.

---

*© 2026 She Can Foundation. All rights reserved.*
