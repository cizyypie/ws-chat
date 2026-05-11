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

## Tech Stack

- **Bun** - Runs the server
- **Elysia** - Web framework
- **WebSockets** - Real-time messages
- **PostgreSQL** - Database
- **Drizzle** - Database helper

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

