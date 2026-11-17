# Boardly Day 4 — First database model and API

Today adds the first real feature to the backend: a `Board` model and two API endpoints.

## What changed

- `server/src/models/Board.js` defines the fields stored for each board.
- `server/src/routes/boardRoutes.js` provides endpoints to list boards and create one.
- `GET /api/boards` reads boards from MongoDB.
- `POST /api/boards` creates a board from a title and optional description.
- The API returns a clear `503` response if MongoDB is not connected, and validates board input before saving it.

Board ownership will be added with the login feature, so the API does not accept an owner ID from an unauthenticated request.

## Try the read-only endpoint

With the backend terminal running, open this address in a browser:

```text
http://localhost:5001/api/boards
```

It should return JSON with a `boards` array. It may be empty until you create your first board.

## Create a board from the terminal

This command writes a sample board into your Atlas database:

```sh
curl -X POST http://localhost:5001/api/boards \
  -H 'Content-Type: application/json' \
  -d '{"title":"Website Redesign","description":"Plan the first Boardly board."}'
```

The response should contain the saved board and its MongoDB `_id`. Run `GET /api/boards` again to see it in the list.

## If you change the backend files

Stop the backend with **Ctrl+C** in the `server` terminal, then restart it:

```sh
npm run dev
```
