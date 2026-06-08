# Mumkin Platform

**Hackathon Management and Platform Customization through SaaS Architecture**

A unified Arabic SaaS platform that manages the full hackathon lifecycle for organizers, participants, sponsors, and evaluators in one system.

---

## Team Members

| Name | Student ID |
|------|-----------|
| Jawaher Adnan Alsharif | 2206489 |
| Refal Hamad Alsolami | 2205572 |
| Jouri Ibraheem Almutairi | 2112383 |
| Ruba Ahmad Kaabi | 2115164 |

**Supervised by:** Dr. Fatimah Bamashmoos
**Department of Information Technology — King Abdulaziz University**

---

## Tech Stack

**Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
**Backend:** Node.js + Express + TypeScript
**Database:** MySQL
**Testing:** Vitest + Supertest

---

## Prerequisites

Before running the project, make sure you have the following installed:

- Node.js (v18 or higher)
- MySQL (v8 or higher)
- npm

---

## Database Setup

1. Open MySQL and create the database:

```sql
CREATE DATABASE mumkin_db;
```

2. Import the provided SQL file:

```bash
mysql -u root -p mumkin_db < backend/dump/schema.sql
```

---

## Environment Variables

Create a `.env` file inside the `backend/` folder with the following:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=mumkin_db

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password

FRONTEND_URL=http://localhost:5173/Prototype
```

Note: For Gmail, you need to enable 2-Step Verification and generate an App Password.

---

## Installation & Running

### Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on: http://localhost:3000

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: http://localhost:5173/Prototype

---

## Running Tests

```bash
cd backend
npm test
```

To run a specific test file:

```bash
npm test -- tests/organizer/organizer.unit.test.ts
```

---

## Project Structure

```
Prototype-main/
├── frontend/
└── backend/
    ├── src/
    │   ├── controllers/
    │   ├── routes/
    │   ├── lib/
    │   └── config/
    ├── dump/
    │   └── schema.sql
    └── tests/
        ├── organizer/
        ├── sponsor/
        └── participant/
```

---

## Key Features

- **Organizer:** Create and fully customize hackathons with 8 configuration sections, manage registrations, assign evaluators, and handle sponsor contracts
- **Participant:** Register as individual or team, use Smart Matchmaking Algorithm to find teammates, submit projects, and view evaluation results
- **Sponsor:** Browse opportunities, apply to packages, negotiate through platform chat, and sign digital contracts
- **Evaluator:** Review and score assigned projects based on predefined criteria

---

## License

This project was developed as a graduation project (CPIT499) at King Abdulaziz University — 2026.
