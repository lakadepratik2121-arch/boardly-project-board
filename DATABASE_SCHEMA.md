# Boardly database schema

Boardly uses MongoDB through Mongoose. The model names below map to the collections `users`, `boards`, `boardlists`, `boardmembers`, `tasks`, `comments`, and `activities`.

## Users

- `name`, `email` (unique, normalized to lowercase), `passwordHash` (bcrypt hash; never returned by the API), timestamps.

## Boards

- `title`, `description`, `owner` (User reference), timestamps.
- Owners can manage lists and invitations. Active members can view boards and collaborate on tasks.

## Board lists

- `board`, `title`, `position`, and a workflow `status` (`todo`, `in-progress`, or `done`). New boards start with To do, In progress, and Done. Older boards receive those lists the first time their task list is opened.
- Additional lists are supported. Their workflow status defaults to `todo`.

## Board members

- `board`, `user` (empty while the invite is pending), `invitedEmail`, `role`, `status`, `invitedBy`, hashed invite code, expiry, and `joinedAt`.
- Invitations are created by the board owner and shared manually. The invite code expires after seven days and can only be accepted by an account with the invited email.

## Tasks

- `board`, `list`, `title`, `description`, `status`, optional `assignedTo` User, optional `dueDate`, optional `createdBy`, timestamps.
- `status` remains for workflow compatibility; moving a task also updates its list.

## Comments

- `board`, `task`, `authorName`, `text`, and timestamps. The author name comes from the signed-in account.

## Activities

- `board`, `actorName`, `action`, `targetType`, `targetId`, `targetName`, and timestamps. The feed currently records task and comment activity.

Passwords use bcrypt. API sessions use signed bearer tokens configured with `JWT_SECRET` in `server/.env`.
