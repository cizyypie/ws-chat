# Real-Time Chat Application 💬

## What is This?

A web app where users can:
- Sign up and log in
- Create and join chat rooms
- Send messages instantly (no refresh needed)
- Edit or delete their messages
- See who joins/leaves

**Think:** Simple Discord or Slack

---

## Tech Used

- **Bun** - Runs the server
- **Elysia** - Web framework
- **WebSockets** - Real-time messages
- **PostgreSQL** - Database
- **Drizzle** - Database helper

---

## Setup (5 Steps)

### Step 1: Install Bun

```bash
curl -fsSL https://bun.sh/install | bash
```

Close and reopen terminal, then check:
```bash
bun --version
```

### Step 2: Get the Project

```bash
git clone <your-repo-link>
cd <project-folder>
bun install
```

### Step 3: Set Up Database

Create `.env` file:
```bash
touch .env
```

Add this line:
```
DATABASE_URL=postgresql://your_connection_string
```

**How to get connection string:**
1. Go to https://neon.tech
2. Sign up (free)
3. Create new project
4. Copy connection string
5. Paste in `.env`

### Step 4: Create Database Tables

```bash
bun run db:generate
bun run db:push
```

### Step 5: Start the App

```bash
bun run dev
```

Go to: `http://localhost:3000` ✅

---

## How to Use

1. Click **Signup**
2. Create a room
3. Send a message
4. Open in another tab - see real-time messaging! 🚀

---

## File Organization

```
src/
  ├── services/        ← Business logic
  ├── routes/          ← API endpoints
  ├── db/              ← Database stuff
  └── views/           ← HTML pages

public/               ← CSS, JavaScript
```

---

## Common Commands

```bash
bun run dev              # Start server
bun run db:generate      # Create migration
bun run db:push          # Update database
Ctrl + C                 # Stop server
```

---

## What You Learn

 Backend development with Node.js
 Real-time communication (WebSockets)
 Database design & queries
 Authentication & sessions
 Code organization (MVC pattern)
 REST APIs

---

## Troubleshooting

**Q: "Cannot connect to database"**
A: Check `.env` has correct `DATABASE_URL`

**Q: "Port 3000 already in use"**
A: Change port in `src/index.ts` or kill existing process

**Q: "Module not found"**
A: Run `bun install` again

---

## Next Steps

- Add user profiles
- Add direct messages
- Add emoji reactions
- Add typing indicators
- Deploy to production

---

**Questions?** Check the code comments or ask your mentor! 🤓
