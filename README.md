<div align="center">

# Campus360

### *Smart Campus Management — Reimagined*

[![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.2-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_9-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/JWT-Auth-D63AFF?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Helmet](https://img.shields.io/badge/Helmet-Security-brightgreen?style=flat-square)](https://helmetjs.github.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](http://makeapullrequest.com)

<br/>

**Campus360** is a full-stack mobile application that transforms traditional campus operations into a seamless, digital-first experience. Built with **Expo React Native** on the frontend and **Express.js + MongoDB** on the backend, it empowers students, wardens, admins, and staff with role-based dashboards, real-time seat booking, event management, and AI-powered assistance — all from a single app.

<br/>

[Getting Started](#getting-started) · [Features](#features) · [Architecture](#system-architecture) · [API Reference](#api-reference) · [Contributing](#contributing)

---

</div>

## Screenshots

> *Coming soon — screenshots of the Student Dashboard, Admin Panel, QR Scanner, and Seat Booking flow.*

| Student Dashboard | Admin Panel | Seat Booking | QR Scanner |
|:-:|:-:|:-:|:-:|
| ![Student Dashboard](docs/screenshots/student-dashboard.png) | ![Admin Panel](docs/screenshots/admin-panel.png) | ![Seat Booking](docs/screenshots/seat-booking.png) | ![QR Scanner](docs/screenshots/qr-scanner.png) |

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Security Features](#security-features)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Future Improvements](#future-improvements)
- [Learning Outcomes](#learning-outcomes)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Authentication & Authorization
- Secure **JWT-based authentication** with token generation
- **Role-based access control** — Admin, Student, Warden, Scanner
- Password hashing with **bcryptjs**
- Auth-specific rate limiting (10 attempts / 15 min)

### Auditorium & Seat Booking
- Real-time **auditorium seat management** with interactive layouts
- **Priority-based booking system** for fair seat allocation
- **Smart waiting list** with automatic queue promotion
- Break/hold system with **automated expiry via cron jobs**

### Event Management
- Full event lifecycle — create, update, publish, and archive
- Admin-controlled event approval workflows
- OD (On-Duty) generation for event participants
- Detailed event analytics and attendance reports

### Hostel Management
- Digital **hostel request submission** and tracking
- Warden dashboard for request review and approval
- Request status pipeline with real-time updates

### Lost & Found
- **Report lost items** with descriptions and images
- Browse found items and claim through the app
- Admin moderation for submitted entries
- Separate dashboards for students and admins

### QR Scanner System
- Built-in **QR code scanner** using the device camera
- QR-based event check-in and seat verification
- Scanner role with dedicated middleware and permissions

### AI / Chatbot Support
- Integrated **AI chatbot** for campus queries
- Context-aware responses for navigation, schedules, and FAQs

### Quiz System
- In-app quiz engine with dynamic question loading
- **Quiz analytics dashboard** for admins — scores, participation rates, and trends
- Student result tracking with attempt history

### Campus Navigation
- Server-side **navigation service** with campus maps
- Static image assets for building and route visualization

### Automated Background Jobs
- **node-cron** powered scheduled tasks
- Automatic break expiry handling for seat bookings
- Waiting list queue processing and seat reallocation

---

## Tech Stack

### Frontend

| Technology | Purpose |
|:--|:--|
| **React Native** `0.81` | Cross-platform mobile framework |
| **Expo** `54` | Development toolchain & managed workflow |
| **Expo Router** `6` | File-based routing and deep linking |
| **TypeScript** `5.9` | Type safety and developer experience |
| **React Navigation** `7` | Tab and stack navigation |
| **Axios** | HTTP client for API communication |
| **Expo Camera** | QR code scanning |
| **Expo Image Picker** | Photo capture for Lost & Found |
| **Expo Linear Gradient** | Premium UI gradients |
| **React Native Reanimated** `4` | Fluid animations |
| **React Native QRCode SVG** | QR code generation |
| **AsyncStorage** | Secure local token persistence |
| **DM Sans (Google Fonts)** | Typography |

### Backend

| Technology | Purpose |
|:--|:--|
| **Node.js** | JavaScript runtime |
| **Express.js** `5.2` | Web framework with middleware pipeline |
| **MongoDB** | NoSQL document database |
| **Mongoose** `9.2` | ODM for data modeling and validation |
| **JWT** (`jsonwebtoken`) | Stateless authentication tokens |
| **bcryptjs** | Password hashing (adaptive cost factor) |
| **Helmet** `8` | Security headers (XSS, HSTS, CSP) |
| **CORS** | Cross-origin resource sharing |
| **express-rate-limit** | API rate limiting & brute-force protection |
| **node-cron** | Scheduled background tasks |
| **dotenv** | Environment variable management |

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                       MOBILE CLIENT                          │
│              Expo React Native + TypeScript                  │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Admin   │  │ Student  │  │  Warden  │  │ Scanner  │    │
│  │Dashboard │  │Dashboard │  │Dashboard │  │   View   │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │              │              │              │          │
│  ┌────┴──────────────┴──────────────┴──────────────┴────┐    │
│  │              Expo Router (File-based)                 │    │
│  │           AuthContext · Axios · AsyncStorage          │    │
│  └──────────────────────┬───────────────────────────────┘    │
└─────────────────────────┼────────────────────────────────────┘
                          │  HTTPS / REST
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                      EXPRESS.js SERVER                        │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                    MIDDLEWARE LAYER                     │  │
│  │  Helmet · CORS · Rate Limiter · NoSQL Sanitization    │  │
│  │          Body Parser · Auth · Role · Scanner           │  │
│  └────────────────────────┬───────────────────────────────┘  │
│                           │                                  │
│  ┌────────────────────────┼───────────────────────────────┐  │
│  │                    ROUTE LAYER                         │  │
│  │  /api/auth · /api/events · /api/auditoriums           │  │
│  │  /api/hostel · /api/admin · /api/chat                 │  │
│  │  /api/lost-found                                      │  │
│  └────────────────────────┬───────────────────────────────┘  │
│                           │                                  │
│  ┌────────────────────────┼───────────────────────────────┐  │
│  │                 CONTROLLER LAYER                       │  │
│  │  auth · event · auditorium · hostel · admin           │  │
│  │  chat · lostFound                                     │  │
│  └────────────────────────┬───────────────────────────────┘  │
│                           │                                  │
│  ┌────────────────────────┼───────────────────────────────┐  │
│  │               SERVICE / UTILS LAYER                   │  │
│  │  navigation · priority · slot · generateToken         │  │
│  └────────────────────────┬───────────────────────────────┘  │
│                           │                                  │
│  ┌────────────────────────┼───────────────────────────────┐  │
│  │          CRON JOBS — breakExpiry scheduler             │  │
│  └────────────────────────┬───────────────────────────────┘  │
└───────────────────────────┼──────────────────────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │      MongoDB Atlas    │
                │                       │
                │  Users · Events       │
                │  Seats · SeatBookings │
                │  Auditoriums          │
                │  WaitingList          │
                │  HostelRequests       │
                │  LostFoundItems       │
                │  QuizAttempts         │
                └───────────────────────┘
```

---

## Project Structure

```
Campus360/
│
├── Campus360/                       # Expo React Native Frontend
│   ├── app/                         # Expo Router file-based routing
│   │   ├── (admin)/                 # Admin-only screens
│   │   │   ├── dashboard.tsx        #   Admin overview & statistics
│   │   │   ├── create-event.tsx     #   Event creation form
│   │   │   ├── manage-event.tsx     #   Event management console
│   │   │   ├── manage-scanners.tsx  #   Scanner role management
│   │   │   ├── priority.tsx         #   Priority booking config
│   │   │   ├── quiz-analytics.tsx   #   Quiz performance analytics
│   │   │   ├── reports.tsx          #   Report generation
│   │   │   ├── waitlist.tsx         #   Waitlist management
│   │   │   ├── lost-found.tsx       #   Lost & Found moderation
│   │   │   └── seat-control/        #   Seat management screens
│   │   ├── (auth)/                  # Authentication screens
│   │   │   ├── login.tsx            #   Login page
│   │   │   └── register.tsx         #   Registration page
│   │   ├── (core)/                  # Student-facing screens
│   │   │   ├── student-dashboard.tsx#   Student home
│   │   │   ├── events.tsx           #   Event browser
│   │   │   ├── chatbot.tsx          #   AI chatbot interface
│   │   │   ├── hostel.tsx           #   Hostel request module
│   │   │   ├── lost-found.tsx       #   Lost & Found browser
│   │   │   ├── profile.tsx          #   User profile
│   │   │   ├── seat-booking/        #   Seat reservation flow
│   │   │   ├── waitlist/            #   Waitlist status
│   │   │   ├── my-od/               #   OD (On-Duty) tracker
│   │   │   └── result/              #   Quiz results
│   │   ├── (lostfound)/             # Lost & Found standalone
│   │   ├── (warden)/                # Warden dashboard
│   │   │   └── dashboard.tsx        #   Warden request management
│   │   ├── quiz/                    # Quiz engine
│   │   │   └── [id].tsx             #   Dynamic quiz page
│   │   ├── qr-scanner.tsx           # QR scanner screen
│   │   ├── _layout.tsx              # Root layout
│   │   └── index.tsx                # App entry point
│   ├── components/                  # Shared UI components
│   │   ├── Button.tsx               #   Custom button
│   │   ├── Card.tsx                 #   Card container
│   │   ├── CustomAlert.tsx          #   Alert dialogs
│   │   ├── Input.tsx                #   Form input
│   │   ├── Loader.tsx               #   Loading spinner
│   │   ├── Toast.tsx                #   Toast notifications
│   │   └── chatbot/                 #   Chatbot UI components
│   ├── context/
│   │   └── AuthContext.tsx          # Authentication context provider
│   ├── hooks/                       # Custom React hooks
│   ├── utils/                       # Helper utilities
│   ├── assets/                      # Images, fonts, icons
│   └── scripts/                     # Build & dev scripts
│
├── backend/                         # Express.js Backend
│   └── src/
│       ├── server.js                # App entry — middleware, routes, cron
│       ├── config/
│       │   └── db.js                # MongoDB connection config
│       ├── controllers/
│       │   ├── auth.controller.js   # Register, login, token refresh
│       │   ├── event.controller.js  # Event CRUD & lifecycle
│       │   ├── auditorium.controller.js # Seat & auditorium management
│       │   ├── hostel.controller.js # Hostel request handling
│       │   ├── admin.controller.js  # Admin operations
│       │   ├── chat.controller.js   # Chatbot API integration
│       │   └── lostFound.controller.js # Lost & Found CRUD
│       ├── models/
│       │   ├── User.js              # User schema (roles, credentials)
│       │   ├── Event.js             # Event schema
│       │   ├── Auditorium.js        # Auditorium schema
│       │   ├── Seat.js              # Individual seat schema
│       │   ├── SeatBooking.js       # Booking records
│       │   ├── WaitingList.js       # Waitlist queue
│       │   ├── HostelRequest.js     # Hostel request schema
│       │   ├── LostFoundItem.js     # Lost & Found item schema
│       │   └── QuizAttempt.js       # Quiz attempt records
│       ├── routes/
│       │   ├── auth.routes.js       # POST /api/auth/*
│       │   ├── event.routes.js      # /api/events/*
│       │   ├── auditorium.routes.js # /api/auditoriums/*
│       │   ├── hostel.routes.js     # /api/hostel/*
│       │   ├── admin.routes.js      # /api/admin/*
│       │   ├── chat.routes.js       # /api/chat/*
│       │   └── lostFound.routes.js  # /api/lost-found/*
│       ├── middlewares/
│       │   ├── auth.middleware.js   # JWT verification
│       │   ├── role.middleware.js   # Role-based access guard
│       │   └── scanner.middleware.js# Scanner-specific auth
│       ├── services/
│       │   ├── navigation.service.js# Campus navigation logic
│       │   ├── priority.service.js  # Priority calculation
│       │   └── slot.service.js      # Time slot management
│       ├── cron/
│       │   └── breakExpiry.js       # Break/hold expiry scheduler
│       ├── utils/
│       │   └── generateToken.js     # JWT token generator
│       ├── data/                    # Static data & seed files
│       └── uploads/                 # Uploaded images & assets
│
└── README.md                        # You are here!
```

---

## Getting Started

### Prerequisites

Ensure you have the following installed:

| Tool | Version | Download |
|:--|:--|:--|
| **Node.js** | >= 18.x | [nodejs.org](https://nodejs.org/) |
| **npm** | >= 9.x | Bundled with Node.js |
| **MongoDB** | >= 6.x | [mongodb.com](https://www.mongodb.com/try/download) or use [Atlas](https://www.mongodb.com/atlas) |
| **Expo CLI** | Latest | `npm install -g expo-cli` |
| **Android Studio / Xcode** | Latest | For emulators (optional) |

---

### 1. Clone the Repository

```bash
git clone https://github.com/Legal-Thief/Campus360.git
cd Campus360
```

### 2. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration (see Environment Variables section)

# Start development server
npm run dev
```

The API server will start at `http://localhost:5000`

### 3. Frontend Setup

```bash
# Navigate to the frontend directory (from project root)
cd Campus360

# Install dependencies
npm install

# Start the Expo development server
npx expo start
```

### 4. Run on Device / Emulator

```bash
# Android Emulator
npx expo run:android

# iOS Simulator (macOS only)
npx expo run:ios

# Scan QR code with Expo Go app on your physical device
npx expo start
```

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# ── Server ─────────────────────────────────────────
PORT=5000

# ── Database ───────────────────────────────────────
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/campus360?retryWrites=true&w=majority

# ── Authentication ─────────────────────────────────
JWT_SECRET=your-super-secret-jwt-key-change-this

# ── CORS ───────────────────────────────────────────
CORS_ORIGIN=*
```

> [!CAUTION]
> **Never commit `.env` to version control.** The `.gitignore` is already configured to exclude it. Always use strong, unique values for `JWT_SECRET` in production.

For the frontend, update the API base URL in your Axios configuration or environment:

```env
# Campus360/.env (if using expo-constants)
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

---

## API Reference

All endpoints are prefixed with `/api`. Authentication is required unless noted otherwise.

### Authentication — `/api/auth`

| Method | Endpoint | Description | Auth | Rate Limit |
|:--|:--|:--|:--|:--|
| `POST` | `/api/auth/register` | Register a new user | No | 10/15min |
| `POST` | `/api/auth/login` | Login & receive JWT | No | 10/15min |

### Events — `/api/events`

| Method | Endpoint | Description | Auth |
|:--|:--|:--|:--|
| `GET` | `/api/events` | List all events | Yes |
| `POST` | `/api/events` | Create new event | Yes (Admin) |
| `PUT` | `/api/events/:id` | Update event | Yes (Admin) |
| `DELETE` | `/api/events/:id` | Delete event | Yes (Admin) |

### Auditoriums — `/api/auditoriums`

| Method | Endpoint | Description | Auth |
|:--|:--|:--|:--|
| `GET` | `/api/auditoriums` | List auditoriums | Yes |
| `POST` | `/api/auditoriums` | Create auditorium | Yes (Admin) |

### Hostel — `/api/hostel`

| Method | Endpoint | Description | Auth |
|:--|:--|:--|:--|
| `GET` | `/api/hostel/requests` | List requests | Yes |
| `POST` | `/api/hostel/requests` | Submit request | Yes (Student) |
| `PATCH` | `/api/hostel/requests/:id` | Update request status | Yes (Warden) |

### Lost & Found — `/api/lost-found`

| Method | Endpoint | Description | Auth |
|:--|:--|:--|:--|
| `GET` | `/api/lost-found` | List all items | Yes |
| `POST` | `/api/lost-found` | Report item | Yes |
| `PATCH` | `/api/lost-found/:id` | Update item status | Yes (Admin) |

### Chat — `/api`

| Method | Endpoint | Description | Auth |
|:--|:--|:--|:--|
| `POST` | `/api/chat` | Send message to chatbot | Yes |

### Admin — `/api/admin`

| Method | Endpoint | Description | Auth |
|:--|:--|:--|:--|
| `GET` | `/api/admin/users` | List all users | Yes (Admin) |
| `PATCH` | `/api/admin/users/:id/role` | Update user role | Yes (Admin) |

### Health Check

| Method | Endpoint | Description |
|:--|:--|:--|
| `GET` | `/` | Returns server status |

---

## Security Features

Campus360 implements **defense-in-depth** security across every layer:

| Feature | Implementation | Detail |
|:--|:--|:--|
| **Security Headers** | `helmet` middleware | XSS Protection, HSTS, Content-Security-Policy, X-Frame-Options |
| **CORS Policy** | `cors` middleware | Configurable origin whitelist, restricted methods & headers |
| **Rate Limiting** | `express-rate-limit` | Global: 200 req/15min — Auth: 10 req/15min |
| **NoSQL Injection Prevention** | Custom sanitizer | Strips `$` operators and dot notation from `req.body` and `req.params` |
| **Password Hashing** | `bcryptjs` | Adaptive cost-factor hashing, never stored in plaintext |
| **JWT Authentication** | `jsonwebtoken` | Stateless, expiring tokens with role claims |
| **Role-Based Access Control** | Custom middleware | Granular route-level permission checks (Admin, Student, Warden, Scanner) |
| **Body Size Limiting** | Express `json()` | 10KB max payload to prevent oversized request attacks |
| **Trust Proxy** | Express config | Proper client IP resolution behind reverse proxies |
| **Environment Isolation** | `dotenv` | Secrets loaded from `.env`, never hardcoded |

---

## Deployment

### Backend Deployment

<details>
<summary><strong>Deploy to Railway / Render</strong></summary>

1. Push your code to a GitHub repository
2. Connect the repo to [Railway](https://railway.app) or [Render](https://render.com)
3. Set the **root directory** to `backend`
4. Configure environment variables in the platform dashboard
5. Set the **start command**:
   ```bash
   npm start
   ```
6. The service will auto-deploy on push to `main`

</details>

<details>
<summary><strong>Deploy with Docker</strong></summary>

```dockerfile
# backend/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
EXPOSE 5000
CMD ["node", "src/server.js"]
```

```bash
docker build -t campus360-backend ./backend
docker run -p 5000:5000 --env-file ./backend/.env campus360-backend
```

</details>

### Frontend Deployment

<details>
<summary><strong>Build with EAS (Expo Application Services)</strong></summary>

```bash
cd Campus360

# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for Android
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

</details>

---

## Troubleshooting

<details>
<summary><strong>MongoDB connection failed</strong></summary>

- Verify your `MONGO_URI` in `.env` is correct
- Ensure MongoDB Atlas IP whitelist includes your IP (or `0.0.0.0/0` for dev)
- Check network connectivity: `ping cluster0.xxxxx.mongodb.net`
- Verify MongoDB Atlas cluster is running (not paused)

</details>

<details>
<summary><strong>"Too many requests" error</strong></summary>

- The API has rate limiting enabled:
  - **Auth endpoints**: 10 requests per 15 minutes
  - **All endpoints**: 200 requests per 15 minutes
- Wait for the window to reset, or increase limits in `server.js` for development

</details>

<details>
<summary><strong>Expo build fails</strong></summary>

- Clear Expo cache: `npx expo start --clear`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Ensure compatible versions: `npx expo doctor`
- Check EAS build logs: `eas build:list`

</details>

<details>
<summary><strong>JWT token errors</strong></summary>

- Verify `JWT_SECRET` is set in your `.env`
- Check token expiry — tokens are time-limited
- Ensure the `Authorization` header format is `Bearer <token>`
- Clear AsyncStorage on the client: the stored token may be expired

</details>

<details>
<summary><strong>Camera / QR Scanner not working</strong></summary>

- Camera permissions must be granted on the device
- QR Scanner requires a **development build** (not Expo Go) for `expo-camera` v17+
- Build a dev client: `npx expo run:android` or `npx expo run:ios`

</details>

---

## Future Improvements

| Priority | Feature | Description |
|:--|:--|:--|
| High | **Push Notifications** | Real-time alerts for booking confirmations, event reminders, and waitlist promotions |
| High | **WebSocket Integration** | Live seat availability updates and real-time chat |
| Medium | **Offline Support** | Cache critical data locally for offline viewing |
| Medium | **Payment Gateway** | Integrate Razorpay/Stripe for event ticket purchases |
| Medium | **Analytics Dashboard** | Admin-facing charts for usage metrics, booking trends, and user engagement |
| Low | **Multi-language Support** | i18n for Hindi, Tamil, and other regional languages |
| Low | **Dark Mode Toggle** | User-controlled theme switching (currently system-auto) |
| Low | **Accessibility (a11y)** | Screen reader support, contrast improvements, keyboard navigation |

---

## Learning Outcomes

Building Campus360 provided deep hands-on experience with:

- **Full-Stack Architecture** — Designing and connecting a RESTful backend with a mobile frontend end-to-end
- **Authentication & Security** — Implementing JWT auth, bcrypt hashing, RBAC, rate limiting, and input sanitization in production
- **Database Design** — Modeling complex relationships (Users, Events, Bookings, Waitlists) with Mongoose schemas and references
- **File-Based Routing** — Leveraging Expo Router for type-safe, nested, role-based navigation patterns
- **State Management** — Building React Context providers for global auth state across deeply nested component trees
- **Background Job Scheduling** — Using `node-cron` for automated tasks like seat hold expiry and waitlist processing
- **Mobile Development** — Working with native APIs (Camera, Image Picker, Haptics) through Expo's managed workflow
- **API Design** — Structuring RESTful endpoints with proper status codes, error handling, and middleware pipelines
- **Security Best Practices** — Applying defense-in-depth with Helmet, CORS, NoSQL sanitization, and rate limiting
- **DevOps Fundamentals** — Configuring EAS builds, environment management, and deployment pipelines

---

## Contributors

| Name | GitHub |
|:--|:--|
| **Tanishq Patel** | [@Legal-Thief](https://github.com/Legal-Thief) |
| **Udita Singh** | [@Udita84](https://github.com/Udita84) |
| **Tanmai Pahwa** | [@pahwatanmai08](https://github.com/pahwatanmai08) |
| **Vidita Sharma** | [@viditae0530-dot](https://github.com/viditae0530-dot) |

---

## Contributing

Contributions are welcome! Here's how to get involved:

```bash
# 1. Fork the repository

# 2. Create a feature branch
git checkout -b feature/amazing-feature

# 3. Make your changes and commit
git commit -m "feat: add amazing feature"

# 4. Push to your fork
git push origin feature/amazing-feature

# 5. Open a Pull Request
```

### Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Usage |
|:--|:--|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation changes |
| `style:` | Code formatting (no logic change) |
| `refactor:` | Code restructuring |
| `test:` | Adding or updating tests |
| `chore:` | Build/config changes |

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 Campus360

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">

### If you found this project useful, consider giving it a star!

<br/>

**Built for smarter campuses**

<br/>

[![GitHub Stars](https://img.shields.io/github/stars/Legal-Thief/Campus360?style=social)](https://github.com/Legal-Thief/Campus360)
[![GitHub Forks](https://img.shields.io/github/forks/Legal-Thief/Campus360?style=social)](https://github.com/Legal-Thief/Campus360/fork)

</div>
