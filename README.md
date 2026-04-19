# PropertyHub CRM — Real Estate Customer Relationship Management

A production-ready, full-stack Real Estate CRM application with 9 fully functional modules.

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite, TailwindCSS 3, Recharts, @dnd-kit, React Query v5 |
| **Backend** | Node.js + Express |
| **Database** | MongoDB with Mongoose ODM |
| **Auth** | JWT (access + refresh tokens), bcrypt |
| **File Upload** | Multer (local `/uploads`, swap to S3 later) |
| **Email** | Nodemailer (SMTP via .env or DB settings) |
| **Cron** | node-cron (follow-up reminders every minute) |

## 📋 Prerequisites

- **Node.js** >= 18
- **MongoDB** >= 6.0 (local or Atlas)
- **npm** >= 9

## 🚀 Quick Start

### 1. Clone & Setup Environment

```bash
# Copy the environment file and edit it
cp .env.example .env
# Edit .env with your MongoDB URI and other settings
```

### 2. Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Seed the Database

```bash
cd server
npm run seed
```

This creates:
- **1 Admin**: admin@realestate.com / Admin@123
- **2 Agents**: sarah@realestate.com / Agent@123, mike@realestate.com / Agent@123
- **5 Leads** with various statuses and sources
- **3 Properties** (Residential, Commercial, Plot)
- **2 Clients** (Buyer, Seller)
- **1 Active Deal** in Negotiation stage
- **Company Settings** with defaults

### 4. Start Development Servers

```bash
# Terminal 1 — Backend (port 5000)
cd server
npm run dev

# Terminal 2 — Frontend (port 5173)
cd client
npm run dev
```

Open **http://localhost:5173** in your browser.

## 🔐 Default Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@realestate.com | Admin@123 |
| Agent | sarah@realestate.com | Agent@123 |
| Agent | mike@realestate.com | Agent@123 |

## 📁 Project Structure

```
├── client/                    # React Frontend (Vite)
│   ├── src/
│   │   ├── api/               # Axios API layer
│   │   ├── components/        # Layout + shared components
│   │   ├── contexts/          # Auth context
│   │   ├── lib/               # Utilities
│   │   └── pages/             # All route pages
│   └── ...config files
│
├── server/                    # Express Backend
│   ├── src/
│   │   ├── controllers/       # Route handlers (8 controllers)
│   │   ├── middleware/        # Auth, validation, upload, error handling
│   │   ├── models/            # Mongoose models (11 models)
│   │   ├── routes/            # Express routes (8 route files)
│   │   ├── services/          # Email, cron, reports
│   │   ├── utils/             # JWT, response helpers, CSV parser
│   │   └── index.js           # Entry point
│   ├── uploads/               # File storage
│   └── seed.js                # Database seeder
│
├── .env.example               # Environment variables template
└── README.md
```

## 📦 Modules

1. **Auth & User System** — JWT auth, 3 roles (Admin/Manager/Agent), route protection
2. **Lead Management** — CRUD, CSV import/export, status pipeline, assignment, follow-ups
3. **Property Management** — CRUD, image gallery, map pin, card/list views, filters
4. **Client Management** — CRUD, interaction timeline, linked deals
5. **Deal Pipeline** — Kanban board (drag-and-drop), stage management, documents
6. **Communication** — Activity feed, follow-up scheduler, email reminders (cron)
7. **Agent Management** — Performance stats, monthly charts, bulk reassignment
8. **Reports & Analytics** — 5 chart types, agent leaderboard, CSV export
9. **Settings** — Company profile, SMTP config, commission defaults, notifications

## 🌐 Environment Variables

See `.env.example` for all required variables with documentation.

## 📱 Responsive Design

The application is fully responsive with mobile-optimized layouts for:
- Dashboard with collapsible sidebar
- Leads table with horizontal scroll
- Deal Kanban with horizontal scroll
- All forms and modals

## 🗄️ API Endpoints

All routes under `/api/v1/`:

| Group | Base Path | Auth |
|---|---|---|
| Auth | `/auth` | Partial |
| Leads | `/leads` | Required |
| Properties | `/properties` | Required |
| Clients | `/clients` | Required |
| Deals | `/deals` | Required |
| Users | `/users` | Admin only |
| Reports | `/reports` | Required |
| Settings | `/settings` | Admin only |

Every response follows: `{ success, data, message, errors }`
