# Boardly Day 12 — Board activity

Each board now includes a recent activity timeline.

## What changed

- The timeline records task creation, edits, status changes, deletion, and comments.
- Activity is stored in MongoDB and scoped to its board.
- The board shows the latest 100 events, newest first.
- If an activity record cannot be saved, the task or comment action still completes.
- The display name is currently **Pratik**, until user accounts are added.

## Try it

Open a board and look below the task columns for **Recent activity**. Add a task, move it, edit it, or post a comment; the timeline refreshes after each change.

The read endpoint is `GET /api/boards/:boardId/activities`.
