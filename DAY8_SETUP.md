# Boardly Day 8 — Delete tasks

Task cards now support deletion.

## What changed

- Each task card has a **Delete** action.
- Boardly asks for confirmation before deleting a task.
- The API deletes only the task ID within the selected board and reports when it cannot find the task.
- Comments attached to a task are removed when that task is deleted.
- The board updates immediately after a successful deletion.

## Try it

Open a board and choose **Delete** on a task card. Confirm the prompt to remove it from MongoDB.

The endpoint is `DELETE /api/boards/:boardId/tasks/:taskId`.
