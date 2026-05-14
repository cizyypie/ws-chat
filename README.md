# Real-Time Chat Application 💬

## What is This?

A web app where users can:
- Sign up and log in
- Create and join chat rooms
- Send messages instantly
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
### Login View
<img width="506" height="366" alt="image" src="https://github.com/user-attachments/assets/30a21a10-b79e-4247-8ee4-1447aefbd296" />

### home view
<img width="732" height="530" alt="image" src="https://github.com/user-attachments/assets/1197be69-8faa-47f8-b5f8-4f69065e6be4" />

### chat room view
<img width="492" height="673" alt="image" src="https://github.com/user-attachments/assets/e58ce0ab-fcd2-41be-8635-a64df49c15c4" />
