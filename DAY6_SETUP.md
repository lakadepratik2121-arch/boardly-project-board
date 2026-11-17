# Boardly Day 6 — Task due dates

Tasks can now have an optional due date.

## What changed

- The task form includes a date picker.
- Due dates are validated by the API and saved with the task in MongoDB.
- A task card displays its due date when one is set.
- Existing tasks without a due date continue to display normally.

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

Open the Vite address, usually `http://localhost:5173`. Open a board, choose **Add task**, and optionally select a due date before saving.
