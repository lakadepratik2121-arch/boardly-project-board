# Boardly Day 5 — Board tasks

The dashboard now opens a board into a task view connected to MongoDB.

## What you can do

- Select a board to see its tasks grouped into **To do**, **In progress**, and **Done**.
- Add a task with a title and optional description.
- Change a task's status from its card. The change is saved to MongoDB.
- Return to **All boards** with the button above the board title.

## Start Boardly

Keep MongoDB/Atlas connected and run the backend and frontend in separate terminals:

```sh
cd server
npm run dev
```

```sh
cd client
npm run dev
```

Open the Vite address, usually `http://localhost:5173`.

The task API is available under `/api/boards/:boardId/tasks`. It supports listing and creating tasks, plus updating a task's status with `PATCH /api/boards/:boardId/tasks/:taskId`.
