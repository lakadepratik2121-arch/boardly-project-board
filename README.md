# Boardly

Boardly is a full-stack team task board built with React, Express, and MongoDB.

## Features

- Account registration and sign in with private board ownership
- Board creation, member invitations, and board-level access
- Custom task lists, task assignment, and due dates
- Task editing, comments, and a recent activity feed

## Run locally

1. Copy `server/.env.example` to `server/.env` and set `MONGODB_URI` to your MongoDB connection string. Set `MONGODB_DB` if you want a database name other than `boardly`, and replace `JWT_SECRET` with a long random value.
2. Install server dependencies with `cd server && npm install`.
3. Start the API in one terminal with `cd server && npm run dev`.
4. Install client dependencies with `cd client && npm install`, then start Vite with `npm run dev` in another terminal.
5. Open the Vite URL (usually `http://localhost:5173`) and create an account.

The API listens on port 5001 by default. Its health endpoint is `http://localhost:5001/api/health`.

Invitations are shared as a code from the board’s Members area. The invited person signs in with the invited email, pastes the code into the dashboard, and joins the board. Codes expire after seven days.

For the project milestone sequence and feature notes, see `FEATURES.md` and the `DAY*_SETUP.md` files.
