# Boardly Day 11 — Task comments

You can now discuss work directly on a task card.

## What changed

- Expand **Comments** on a task card to load its discussion.
- Post a comment with a 1,000-character limit.
- Comments are saved in MongoDB and shown in time order.
- Comments are scoped to both the board and task they belong to.
- Comments currently use the workspace display name **Pratik**; user accounts are not part of the app yet.

## Try it

Open a board, expand **Comments** under a task, write a message, and select **Post comment**.

The API uses `GET` and `POST /api/boards/:boardId/tasks/:taskId/comments`.
