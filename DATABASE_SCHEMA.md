# Boardly – Database Schema

This document explains the database collections used in Boardly.

## 1. Users Collection

Stores information about registered users.

- _id: Unique user ID
- name: User's full name
- email: User's email address
- password: Encrypted password
- avatar: User profile image
- createdAt: Account creation date

## 2. Boards Collection

Stores project boards created by users.

- _id: Unique board ID
- title: Board name
- description: Board description
- owner: ID of the board owner
- createdAt: Board creation date

## 3. BoardMembers Collection

Stores information about users who are members of a board.

- _id: Unique membership ID
- board: ID of the board
- user: ID of the user
- invitedEmail: Email of the invited person
- role: Owner or Member
- status: Pending or Active
- invitedBy: ID of the person who sent the invitation
- joinedAt: Date the member joined

## 4. Lists Collection

Stores task lists inside a board.

- _id: Unique list ID
- board: ID of the board
- title: List name (To Do, In Progress, Done)
- position: Order of the list
- createdAt: List creation date

## 5. Cards Collection

Stores individual tasks inside lists.

- _id: Unique card ID
- board: ID of the board
- list: ID of the list
- title: Task title
- description: Task details
- assignedTo: IDs of assigned users
- dueDate: Task deadline
- position: Order of the card
- createdBy: ID of the creator
- createdAt: Card creation date

## 6. Comments Collection

Stores comments written on task cards.

- _id: Unique comment ID
- card: ID of the card
- author: ID of the user who commented
- text: Comment message
- createdAt: Comment date

## 7. Activities Collection

Stores the activity history of a board.

- _id: Unique activity ID
- board: ID of the board
- actor: ID of the user who performed the action
- action: Description of the activity
- targetType: Type of item (Card, List, or Board)
- targetId: ID of the affected item
- createdAt: Activity date
