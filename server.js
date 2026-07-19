import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import { GameRoom, randomId } from "./game.js";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.static(path.join(__dirname, "public")));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const rooms = new Map();

function getRoom(id) {
  return rooms.get(id);
}
function createRoom() {
  const id = randomId();
  const room = new GameRoom(id);
  rooms.set(id, room);
  return room;
}

function broadcast(room) {
  for (const ws of room.players.keys()) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: "state", state: room.publicState(ws) }));
    }
  }
}

wss.on("connection", (ws) => {
  let room = null;

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (msg.type === "create") {
      room = createRoom();
      room.addPlayer(ws, msg.name);
      ws.send(JSON.stringify({ type: "room", id: room.id }));
      broadcast(room);
      return;
    }

    if (msg.type === "join") {
      room = getRoom(msg.room);
      if (!room) {
        ws.send(JSON.stringify({ type: "error", message: "الغرفة غير موجودة" }));
        return;
      }
      room.addPlayer(ws, msg.name);
      ws.send(JSON.stringify({ type: "room", id: room.id }));
      broadcast(room);
      return;
    }

    if (!room) return;

    switch (msg.type) {
      case "setCustomWords":
        if (room.host === ws && room.state === "lobby") {
          room.customWords = Array.isArray(msg.words) ? msg.words.filter(Boolean).slice(0, 50) : [];
        }
        break;

      case "assignRoles":
        if (room.host === ws && room.state === "lobby") {
          room.setRoles(msg.assignments || {});
        }
        break;

      case "start":
        if (room.host === ws && room.state === "lobby") {
          room.startGame();
        }
        break;

      case "reveal":
        if (room.state === "playing") {
          const p = room.players.get(ws);
          // فقط الضابط (spymaster) يكشف
          if (p && p.role === "spymaster") room.reveal(msg.index);
        }
        break;

      case "reset":
        if (room.host === ws) {
          room.state = "lobby";
          room.board = null;
          room.winner = null;
        }
        break;
    }
    broadcast(room);
  });

  ws.on("close", () => {
    if (room) {
      room.removePlayer(ws);
      if (room.players.size === 0) rooms.delete(room.id);
      else broadcast(room);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Codenames server running on http://localhost:${PORT}`);
});
