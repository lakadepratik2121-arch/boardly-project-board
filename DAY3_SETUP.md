# Boardly Day 3 — Local project setup

Today we added a React + Tailwind frontend and an Express API. MongoDB is prepared through Mongoose; the database connects when you add a local `server/.env` file. Your Day 2 documents and images remain in the repository root.

## 1. Install the tools

This Mac uses Apple silicon. Install the Apple silicon build of [Node.js 24 LTS](https://nodejs.org/en/download/) and the Apple silicon build of [Visual Studio Code](https://code.visualstudio.com/download). For VS Code, open the downloaded disk image and drag the app into **Applications**. Open a fresh Terminal window after installing Node.

Check the tools:

```sh
node --version
npm --version
git --version
```

Open this project in VS Code:

```sh
cd ~/Documents/Codex/boardly-project-board
code .
```

If `code` is not recognized, open VS Code, press **Cmd+Shift+P**, choose **Shell Command: Install 'code' command in PATH**, then reopen Terminal.

## 2. Install the frontend packages

In the VS Code terminal, run:

```sh
cd ~/Documents/Codex/boardly-project-board/client
npm install
npm run dev
```

Open the local address Vite prints (usually `http://localhost:5173`). Keep this terminal open while you view the app.

## 3. Install and start the backend

Open a second VS Code terminal with **Terminal → New Terminal**, then run:

```sh
cd ~/Documents/Codex/boardly-project-board/server
npm install
npm run dev
```

The API starts at `http://localhost:5001`. Visit `http://localhost:5001/api/health`; you should see a small JSON response. The frontend requests this same endpoint through Vite. Port `5000` is already occupied on this Mac, so Boardly uses `5001`.

## 4. Connect MongoDB Atlas

1. Create or sign in to a MongoDB Atlas account at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a free deployment. During setup, create a **database user** (separate from your Atlas sign-in) and add your current IP address to the project's IP access list.
3. In Atlas, open the deployment's **Connect** option, select **Drivers → Node.js**, and copy the connection string. Replace its `<db_password>` placeholder with the database user's password. Keep the connection string private.
4. In VS Code, open `server/.env.example` and save a copy in the same folder named `.env`.
5. In `server/.env`, paste your Atlas connection string after `MONGODB_URI=`. Add `/boardly` before any `?` query options, for example `mongodb+srv://USERNAME:PASSWORD@your-cluster.mongodb.net/boardly?retryWrites=true&w=majority`.
6. Stop and restart the backend terminal with `npm run dev`. It should print `Connected to MongoDB` before the API address.

Never paste the connection string or database password into chat or commit `.env` to GitHub. `.env` is ignored by Git; `.env.example` contains no credentials. Atlas requires both a database user and an IP access list entry for the connection to work. See MongoDB's [Atlas connection guide](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/) and [Node.js connection string guide](https://www.mongodb.com/docs/drivers/node/current/connect/connection-targets/).

## Project map

```text
client/                 React + Vite + Tailwind CSS
  src/App.jsx            First Boardly dashboard screen
server/                 Express + Mongoose API
  src/server.js          Health endpoint and optional MongoDB connection
  .env.example           Safe local configuration example
DAY3_SETUP.md            These setup steps
```
