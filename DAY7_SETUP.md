# Boardly Day 7 — Edit task details

You can now update a task after creating it.

## What changed

- Each task card has an **Edit** action.
- Edit the title, description, or due date, then save the changes to MongoDB.
- Clear the due date field to remove a deadline.
- Task status updates continue to work through the same API endpoint.
- The API validates each field and only updates the selected task on the selected board.

## Try it

Open Boardly, open a board, and select **Edit** on a task card. Make a change and choose **Save changes**.

The backend API accepts partial task updates at `PATCH /api/boards/:boardId/tasks/:taskId`.
